import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Screen Wake Lock integration for the Focus Timer.
 *
 * The `active` flag is driven by the timer's own `isRunning` state — the
 * timer remains the single source of truth. When active:
 *  - a wake lock is requested (screen stays on)
 *  - if the browser auto-releases the lock (e.g. page hidden), it is
 *    re-acquired when the page becomes visible again while still running
 * When inactive, the lock is released.
 *
 * Never throws, never controls the timer, and no-ops entirely on browsers
 * without `navigator.wakeLock` (or non-secure contexts).
 */

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener?: (type: 'release', listener: () => void) => void;
};

type WakeLockAPI = {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>;
};

export function useWakeLock(active: boolean) {
  const [isHeld, setIsHeld] = useState(false);

  // Refs avoid re-registering listeners when `active` flips and prevent
  // stale closures inside async callbacks.
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  const acquire = useCallback(async () => {
    // Unsupported browser / non-secure context: silently do nothing.
    if (!('wakeLock' in navigator)) return;
    // Only hold a lock while the timer is actually running.
    if (!activeRef.current) return;
    // Never request a duplicate lock.
    if (sentinelRef.current && !sentinelRef.current.released) return;

    try {
      const sentinel = await (navigator as Navigator & { wakeLock: WakeLockAPI })
        .wakeLock.request('screen');
      // A release may already have happened while awaiting the request.
      if (!activeRef.current || sentinel.released) {
        try { await sentinel.release(); } catch { /* already released */ }
        return;
      }
      sentinelRef.current = sentinel;
      setIsHeld(true);
      // The browser can auto-release (page hidden, OS policy); keep our
      // reference in sync so the next acquire isn't blocked.
      sentinel.addEventListener?.('release', () => {
        if (sentinelRef.current === sentinel) {
          sentinelRef.current = null;
          setIsHeld(false);
        }
      });
    } catch {
      // Request denied or failed — timer continues unaffected.
    }
  }, []);

  const release = useCallback(async () => {
    const sentinel = sentinelRef.current;
    sentinelRef.current = null;
    setIsHeld(false);
    if (sentinel && !sentinel.released) {
      try { await sentinel.release(); } catch { /* already released */ }
    }
  }, []);

  // Acquire / release as the timer starts / stops (single source of truth).
  useEffect(() => {
    if (active) {
      acquire();
    } else {
      release();
    }
  }, [active, acquire, release]);

  // The browser may auto-release the lock when the page is hidden.
  // Re-acquire on return IF — and only if — the timer is still running.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeRef.current) {
        acquire();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [acquire]);

  // Component unmount: always drop the lock, even if still "running".
  useEffect(() => {
    return () => { release(); };
  }, [release]);

  return { isHeld };
}

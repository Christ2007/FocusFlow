import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Dashboard } from '@/components/Dashboard';
import { Homepage } from '@/components/Homepage';
import { Toaster } from '@/components/ui/sonner';

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Homepage />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}

export default App;

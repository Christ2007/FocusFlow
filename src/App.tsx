import { ThemeProvider } from '@/contexts/ThemeContext';
import { Dashboard } from '@/components/Dashboard';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <ThemeProvider>
      <Dashboard />
      {/* Radix toaster — renders notifications triggered via useToast() */}
      <Toaster />
      <SonnerToaster />
    </ThemeProvider>
  );
}

export default App;

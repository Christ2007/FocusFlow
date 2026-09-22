import { ThemeProvider } from '@/contexts/ThemeContext';
import { Dashboard } from '@/components/Dashboard';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <ThemeProvider>
      <Dashboard />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;

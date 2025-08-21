import { AuthPage } from '@/components/auth/AuthPage';
import { Dashboard } from '@/components/Dashboard';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl">🧠</div>
          <div className="text-lg font-medium">Loading ADHD Focus Hub...</div>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthPage />;
}

const App = () => (
  <AuthProvider>
    <AppContent />
    <Toaster />
  </AuthProvider>
);

export default App;

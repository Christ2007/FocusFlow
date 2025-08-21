import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

interface AuthPageProps {
  onBackToHome?: () => void;
}

export function AuthPage({ onBackToHome }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🧠</div>
              <div>
                <h1 className="text-xl font-bold text-foreground">FocusFlow</h1>
                <p className="text-xs text-muted-foreground">ADHD Productivity Hub</p>
              </div>
            </div>
            
            {onBackToHome && (
              <Button 
                variant="outline" 
                onClick={onBackToHome}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Forms */}
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}

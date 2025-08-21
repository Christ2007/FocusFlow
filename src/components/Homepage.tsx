import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Brain, Clock, Target, Trophy, Zap, CheckCircle, Timer, Calendar, Sparkles, Users, BarChart3, LogIn } from "lucide-react";
import { AuthPage } from './auth/AuthPage';
import { AboutPage } from './AboutPage';
import { PrivacyPolicy } from './PrivacyPolicy';
import { TermsOfService } from './TermsOfService';
import { SupportPage } from './SupportPage';
import { useAuth } from '@/contexts/AuthContext';

export function Homepage() {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  if (showAuth) {
    return <AuthPage onBackToHome={() => setShowAuth(false)} />;
  }

  if (showAbout) {
    return <AboutPage onBackToHome={() => setShowAbout(false)} />;
  }

  if (showPrivacy) {
    return <PrivacyPolicy onBackToHome={() => setShowPrivacy(false)} />;
  }

  if (showTerms) {
    return <TermsOfService onBackToHome={() => setShowTerms(false)} />;
  }

  if (showSupport) {
    return <SupportPage onBackToHome={() => setShowSupport(false)} />;
  }

  const features = [
    {
      icon: <Target className="h-8 w-8 text-focus" />,
      title: "Smart Task Management",
      description: "Break down complex tasks into manageable steps with intelligent prioritization and scheduling."
    },
    {
      icon: <Timer className="h-8 w-8 text-energy" />,
      title: "Focus Timer",
      description: "Built-in Pomodoro timer to maintain concentration and track your productive sessions."
    },
    {
      icon: <Trophy className="h-8 w-8 text-yellow-500" />,
      title: "Achievement System",
      description: "Earn badges and track your progress with gamified productivity rewards."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-blue-500" />,
      title: "Progress Analytics",
      description: "Visual insights into your productivity patterns and daily achievements."
    },
    {
      icon: <Sparkles className="h-8 w-8 text-purple-500" />,
      title: "Streak Tracking",
      description: "Build momentum with daily streak counters that motivate consistent progress."
    },
    {
      icon: <Brain className="h-8 w-8 text-focus" />,
      title: "ADHD-Optimized",
      description: "Designed specifically for ADHD minds with clear visuals and minimal distractions."
    }
  ];

  const benefits = [
    "Reduce overwhelm with clear task breakdown",
    "Build consistent daily habits",
    "Track your productivity journey",
    "Celebrate every achievement",
    "Stay focused with time management",
    "Connect with like-minded individuals"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🧠</div>
              <div>
                <h1 className="text-xl font-bold text-foreground">FocusFlow</h1>
                <p className="text-xs text-muted-foreground">ADHD Productivity Hub</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {user ? (
                <Button 
                  onClick={() => window.location.reload()} 
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Button>
              ) : (
                <Button 
                  onClick={() => setShowAuth(true)}
                  className="flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Login / Register
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="text-6xl mb-6">🚀</div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-focus to-energy bg-clip-text text-transparent">
              Transform Your Day Into An Adventure
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              FocusFlow is the productivity app designed specifically for ADHD minds. 
              Turn overwhelming tasks into manageable victories with gamified progress tracking, 
              focus timers, and achievement systems that celebrate every step forward.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => setShowAuth(true)}
                className="text-lg px-8 py-6 flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setShowAbout(true)}
                className="text-lg px-8 py-6"
              >
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Built for ADHD Success
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Every feature is carefully designed to work with your ADHD brain, not against it.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Why ADHD Minds Love FocusFlow
                </h2>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                      <span className="text-lg">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-focus/10 to-energy/10 p-8 rounded-2xl">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-2xl font-bold mb-4">Real Progress, Real Results</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-focus">89%</div>
                      <div className="text-sm text-muted-foreground">Task Completion Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-energy">7.2</div>
                      <div className="text-sm text-muted-foreground">Average Daily Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-500">45min</div>
                      <div className="text-sm text-muted-foreground">Daily Focus Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-500">12</div>
                      <div className="text-sm text-muted-foreground">Badges Earned</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-focus to-energy">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Productivity?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of ADHD individuals who have discovered their productivity superpowers.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => setShowAuth(true)}
              className="text-lg px-8 py-6 flex items-center gap-2 mx-auto"
            >
              Start Your Journey Today
              <Sparkles className="h-5 w-5" />
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="text-2xl">🧠</div>
            <span className="text-xl font-bold">FocusFlow</span>
          </div>
          <p className="text-muted-foreground mb-4">
            Empowering ADHD minds to achieve their full potential.
          </p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <span>© 2025 FocusFlow</span>
            <span>•</span>
            <button onClick={() => setShowPrivacy(true)} className="hover:underline">Privacy Policy</button>
            <span>•</span>
            <button onClick={() => setShowTerms(true)} className="hover:underline">Terms of Service</button>
            <span>•</span>
            <button onClick={() => setShowSupport(true)} className="hover:underline">Support</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Heart, Lightbulb, Users, Zap, Brain } from "lucide-react";

interface AboutPageProps {
  onBackToHome: () => void;
}

export function AboutPage({ onBackToHome }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🧠</div>
            <span className="text-xl font-bold">FocusFlow</span>
          </div>
          <Button 
            variant="outline" 
            onClick={onBackToHome}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Mission Hero */}
        <section className="text-center mb-16">
          <div className="text-5xl mb-6">🚀</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-focus to-energy bg-clip-text text-transparent">
            Our Mission
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            To empower every ADHD mind to unlock their unique potential and transform daily challenges into meaningful achievements.
          </p>
        </section>

        {/* Core Values */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">What We Believe</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="h-8 w-8 text-focus" />
                <h3 className="text-xl font-semibold">ADHD is a Superpower</h3>
              </div>
              <p className="text-muted-foreground">
                We believe ADHD brains are wired for creativity, innovation, and unique problem-solving. 
                Our tools are designed to amplify these strengths, not mask them.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="h-8 w-8 text-energy" />
                <h3 className="text-xl font-semibold">Progress Over Perfection</h3>
              </div>
              <p className="text-muted-foreground">
                Every small step forward matters. We celebrate progress in all its forms, 
                understanding that the ADHD journey is unique for everyone.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center gap-3 mb-4">
                <Lightbulb className="h-8 w-8 text-focus" />
                <h3 className="text-xl font-semibold">Intuitive by Design</h3>
              </div>
              <p className="text-muted-foreground">
                Complex systems overwhelm ADHD minds. We create simple, intuitive interfaces 
                that feel natural and reduce cognitive load.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-8 w-8 text-energy" />
                <h3 className="text-xl font-semibold">Community Matters</h3>
              </div>
              <p className="text-muted-foreground">
                ADHD can feel isolating. We're building a supportive community where 
                everyone understands the unique challenges and celebrates the victories.
              </p>
            </div>
          </div>
        </section>

        {/* The Problem We Solve */}
        <section className="mb-16">
          <div className="bg-muted/30 p-8 rounded-lg">
            <h2 className="text-3xl font-bold mb-6 text-center">The Challenge</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-lg text-muted-foreground mb-4">
                  Traditional productivity apps are built for neurotypical brains. They assume:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Linear thinking and planning</li>
                  <li>• Consistent motivation levels</li>
                  <li>• Ability to focus on demand</li>
                  <li>• One-size-fits-all approaches</li>
                </ul>
              </div>
              <div className="text-center">
                <div className="text-6xl mb-4">😤</div>
                <p className="text-lg font-semibold">This leaves ADHD minds feeling frustrated and inadequate</p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Solution */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center">Our Approach</h2>
          <div className="bg-gradient-to-r from-focus/10 to-energy/10 p-8 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="text-center">
                <div className="text-6xl mb-4">✨</div>
                <p className="text-lg font-semibold">FocusFlow works WITH your ADHD brain</p>
              </div>
              <div>
                <p className="text-lg text-muted-foreground mb-4">
                  We've designed every feature specifically for ADHD minds:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <strong>Gamification</strong> - Turn tasks into achievements</li>
                  <li>• <strong>Flexible Timers</strong> - Work with your natural rhythms</li>
                  <li>• <strong>Visual Progress</strong> - See your wins clearly</li>
                  <li>• <strong>Quick Capture</strong> - Catch thoughts before they escape</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="bg-card p-8 rounded-lg border">
            <Target className="h-12 w-12 text-focus mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Productivity?</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of ADHD individuals who have discovered their productivity superpowers with FocusFlow.
            </p>
            <Button 
              size="lg" 
              onClick={onBackToHome}
              className="text-lg px-8 py-6 flex items-center gap-2 mx-auto"
            >
              Start Your Journey
              <Zap className="h-5 w-5" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

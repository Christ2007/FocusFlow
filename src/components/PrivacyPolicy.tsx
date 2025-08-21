import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

interface PrivacyPolicyProps {
  onBackToHome: () => void;
}

export function PrivacyPolicy({ onBackToHome }: PrivacyPolicyProps) {
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
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-6 w-6 text-focus" />
          <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
        </div>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. What We Collect</h2>
            <p className="text-muted-foreground">
              We collect account information (name, email), authentication data, and task-related content you add
              to FocusFlow. We do not sell your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. How We Use Your Data</h2>
            <p className="text-muted-foreground">
              We use your data to provide core features: authentication, task syncing, progress tracking, and
              personalized experiences like achievements and reminders.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Data Storage & Security</h2>
            <p className="text-muted-foreground">
              Your data is stored securely in our database. Passwords are hashed, and connections are encrypted.
              We follow industry best practices to protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Your Rights</h2>
            <p className="text-muted-foreground">
              You can request to export or delete your account data at any time. Contact support for assistance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Cookies</h2>
            <p className="text-muted-foreground">
              We use essential cookies for authentication and session management.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Contact</h2>
            <p className="text-muted-foreground">
              Questions about this policy? Reach out to our support team.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

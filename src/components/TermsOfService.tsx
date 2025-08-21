import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

interface TermsOfServiceProps {
  onBackToHome: () => void;
}

export function TermsOfService({ onBackToHome }: TermsOfServiceProps) {
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
          <FileText className="h-6 w-6 text-focus" />
          <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
        </div>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By using FocusFlow, you agree to these Terms. If you do not agree, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Accounts</h2>
            <p className="text-muted-foreground">
              You are responsible for maintaining the confidentiality of your account and for all activities under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Acceptable Use</h2>
            <p className="text-muted-foreground">
              You agree not to misuse the service, attempt to disrupt it, or use it to store illegal or harmful content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Intellectual Property</h2>
            <p className="text-muted-foreground">
              FocusFlow and its content are protected by copyright and other laws. You may not copy, modify, or distribute our content without permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Termination</h2>
            <p className="text-muted-foreground">
              We may suspend or terminate your access if you violate these Terms or misuse the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Disclaimer</h2>
            <p className="text-muted-foreground">
              The service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free operation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the extent permitted by law, FocusFlow is not liable for any damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may update these Terms from time to time. Continued use of the service constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Contact</h2>
            <p className="text-muted-foreground">
              If you have questions about these Terms, please contact support.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

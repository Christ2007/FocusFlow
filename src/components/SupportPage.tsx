import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Mail, MessageSquare, Send } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface SupportPageProps {
  onBackToHome: () => void;
}

export function SupportPage({ onBackToHome }: SupportPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Using EmailJS to send emails directly from frontend
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: 'service_urrqljv',
          template_id: 'template_t8v2cfe',
          user_id: 'SdBqo-EORyrSh7rxT', // You'll need to replace this
          template_params: {
            from_name: formData.name,
            from_email: formData.email,
            subject: formData.subject,
            message: formData.message,
            to_email: 'christianluongo942@gmail.com'
          }
        })
      });

      if (response.ok) {
        // Show success animation
        setShowSuccessAnimation(true);
        
        toast({
          title: "Message sent successfully! ✅",
          description: "We'll get back to you within 24 hours."
        });
        
        // Reset form after animation
        setTimeout(() => {
          setFormData({
            name: '',
            email: '',
            subject: '',
            message: ''
          });
          setShowSuccessAnimation(false);
        }, 2000);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: "Failed to send message ❌",
        description: "Please try again or contact us directly at christianluongo942@gmail.com",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name.trim() && formData.email.trim() && formData.subject.trim() && formData.message.trim();

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
          <MessageSquare className="h-6 w-6 text-focus" />
          <h1 className="text-3xl md:text-4xl font-bold">Support</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Need help with FocusFlow? We're here to support you on your productivity journey.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Mail className="h-5 w-5 text-focus" />
              <h2 className="text-xl font-semibold">Send us a message</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-focus"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-focus"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-focus"
                >
                  <option value="">Select a topic</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Account Issues">Account Issues</option>
                  <option value="General Question">General Question</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-focus resize-vertical"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Support Info */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Common Questions</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm">How do I reset my password?</h4>
                  <p className="text-sm text-muted-foreground">Use the "Forgot Password" link on the login page.</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Can I sync across devices?</h4>
                  <p className="text-sm text-muted-foreground">Yes! Your tasks sync automatically when you're logged in.</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">How do I delete my account?</h4>
                  <p className="text-sm text-muted-foreground">Contact us and we'll help you delete your account and data.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Response Times</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Bug Reports</span>
                  <span className="text-sm text-muted-foreground">Within 24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">General Questions</span>
                  <span className="text-sm text-muted-foreground">1-2 business days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Feature Requests</span>
                  <span className="text-sm text-muted-foreground">2-3 business days</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-r from-focus/10 to-energy/10">
              <h3 className="text-lg font-semibold mb-2">Direct Email</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Prefer email? You can reach us directly at:
              </p>
              <a 
                href="mailto:christianluongo942@gmail.com"
                className="text-focus hover:underline font-medium"
              >
                christianluongo942@gmail.com
              </a>
            </Card>
          </div>
        </div>
      </main>

      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-8 text-center shadow-2xl">
            <div className="relative mb-4">
              {/* Animated Check Circle */}
              <div className="w-20 h-20 mx-auto rounded-full border-4 border-green-500 flex items-center justify-center animate-pulse">
                <svg 
                  className="w-12 h-12 text-green-500 animate-bounce" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={3} 
                    d="M5 13l4 4L19 7"
                    className="animate-[draw_0.5s_ease-in-out_forwards]"
                    style={{
                      strokeDasharray: '20',
                      strokeDashoffset: '20',
                      animation: 'draw 0.8s ease-in-out forwards'
                    }}
                  />
                </svg>
              </div>
              
              {/* Ripple Effect */}
              <div className="absolute inset-0 rounded-full border-4 border-green-500/30 animate-ping"></div>
            </div>
            
            <h3 className="text-xl font-semibold text-green-600 mb-2">Message Sent!</h3>
            <p className="text-muted-foreground">We'll get back to you soon.</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}

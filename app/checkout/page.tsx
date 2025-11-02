'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSubscriptionStore } from '@/lib/stores/subscriptionStore';
import { Check, CreditCard, Lock } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tier = searchParams.get('tier') as 'pro' | 'enterprise' || 'pro';
  const { setTier } = useSubscriptionStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');

  const tierDetails = {
    pro: {
      name: 'Pro',
      price: 20,
      features: [
        'Save & deploy changes',
        'Unlimited sites',
        'FTP/SFTP/WordPress/Wix',
        'Auto-backups & rollback',
        'Priority email support',
      ],
    },
    enterprise: {
      name: 'Enterprise',
      price: 499,
      features: [
        'Everything in Pro',
        'Unlimited team members',
        'AI-powered updates',
        'White-label solution',
        '24/7 priority support',
      ],
    },
  };

  const selectedTier = tierDetails[tier];

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Activate subscription
    setTier(tier);
    setIsProcessing(false);
    
    // Redirect to success
    router.push('/checkout/success?tier=' + tier);
  };

  return (
    <div className=\"min-h-screen bg-gradient-to-b from-background to-muted/20 py-12\">
      <div className=\"container mx-auto px-4 max-w-4xl\">
        {/* Header */}
        <div className=\"text-center mb-12\">
          <h1 className=\"text-4xl font-bold mb-4\">Complete Your Purchase</h1>
          <p className=\"text-muted-foreground\">Start using {selectedTier.name} features instantly</p>
        </div>

        <div className=\"grid md:grid-cols-2 gap-8\">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your subscription</CardDescription>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              <div className=\"flex justify-between items-center py-4 border-b\">
                <div>
                  <div className=\"font-semibold\">{selectedTier.name} Plan</div>
                  <div className=\"text-sm text-muted-foreground\">Billed monthly</div>
                </div>
                <div className=\"text-2xl font-bold\">${selectedTier.price}</div>
              </div>

              <div className=\"space-y-2\">
                <div className=\"text-sm font-semibold\">Included features:</div>
                {selectedTier.features.map((feature, index) => (
                  <div key={index} className=\"flex items-center gap-2 text-sm\">
                    <Check className=\"h-4 w-4 text-primary\" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className=\"pt-4 border-t space-y-2\">
                <div className=\"flex justify-between text-sm\">
                  <span>Subtotal</span>
                  <span>${selectedTier.price}</span>
                </div>
                <div className=\"flex justify-between font-bold text-lg\">
                  <span>Total</span>
                  <span>${selectedTier.price}/mo</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Enter your payment information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheckout} className=\"space-y-4\">
                <div>
                  <label className=\"text-sm font-medium\">Email</label>
                  <Input
                    type=\"email\"
                    placeholder=\"you@example.com\"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className=\"text-sm font-medium\">Card Number</label>
                  <div className=\"relative\">
                    <Input
                      type=\"text\"
                      placeholder=\"4242 4242 4242 4242\"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      maxLength={19}
                      required
                    />
                    <CreditCard className=\"absolute right-3 top-3 h-4 w-4 text-muted-foreground\" />
                  </div>
                </div>

                <div className=\"grid grid-cols-2 gap-4\">
                  <div>
                    <label className=\"text-sm font-medium\">Expiry</label>
                    <Input type=\"text\" placeholder=\"MM/YY\" required />
                  </div>
                  <div>
                    <label className=\"text-sm font-medium\">CVC</label>
                    <Input type=\"text\" placeholder=\"123\" maxLength={3} required />
                  </div>
                </div>

                <Button
                  type=\"submit\"
                  className=\"w-full\"
                  size=\"lg\"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : `Pay $${selectedTier.price}/month`}
                </Button>

                <div className=\"flex items-center justify-center gap-2 text-xs text-muted-foreground\">
                  <Lock className=\"h-3 w-3\" />
                  <span>Secured by Stripe • Cancel anytime</span>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Trust Badges */}
        <div className=\"mt-12 text-center space-y-4\">
          <div className=\"flex justify-center gap-8 text-sm text-muted-foreground\">
            <div className=\"flex items-center gap-2\">
              <Check className=\"h-4 w-4 text-green-500\" />
              <span>30-day money-back guarantee</span>
            </div>
            <div className=\"flex items-center gap-2\">
              <Check className=\"h-4 w-4 text-green-500\" />
              <span>Cancel anytime</span>
            </div>
            <div className=\"flex items-center gap-2\">
              <Check className=\"h-4 w-4 text-green-500\" />
              <span>Instant access</span>
            </div>
          </div>

          <div className=\"text-xs text-muted-foreground\">
            <Link href=\"/pricing\" className=\"hover:underline\">
              Change plan
            </Link>
            {' • '}
            <Link href=\"/#contact\" className=\"hover:underline\">
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

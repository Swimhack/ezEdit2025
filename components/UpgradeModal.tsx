'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  requiredTier: 'pro' | 'enterprise';
}

export function UpgradeModal({ isOpen, onClose, feature, requiredTier }: UpgradeModalProps) {
  const tierInfo = {
    pro: {
      name: 'Pro',
      price: '$20',
      period: '/month',
      features: [
        'Save & deploy changes',
        'Unlimited sites',
        'FTP/SFTP/WordPress/Wix',
        'Auto-backups & rollback',
        'Priority email support',
      ],
      cta: 'Upgrade to Pro',
      color: 'from-blue-500 to-cyan-500',
    },
    enterprise: {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      features: [
        'Everything in Pro',
        'Unlimited team members',
        'AI-powered updates',
        'White-label solution',
        '24/7 priority support',
      ],
      cta: 'Contact Sales',
      color: 'from-purple-500 to-pink-500',
    },
  };

  const tier = tierInfo[requiredTier];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
            {requiredTier === 'enterprise' ? (
              <Sparkles className="h-8 w-8 text-primary" />
            ) : (
              <Zap className="h-8 w-8 text-primary" />
            )}
          </div>
          <DialogTitle className="text-center text-2xl">
            Upgrade to {tier.name}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            <span className="font-semibold text-foreground">{feature}</span> requires a {tier.name} subscription
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Price */}
          <div className="text-center">
            <div className="text-4xl font-bold">
              {tier.price}
              <span className="text-lg font-normal text-muted-foreground">{tier.period}</span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {tier.features.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Link href={requiredTier === 'enterprise' ? '/#contact' : '/pricing'}>
              <Button className="w-full" size="lg">
                {tier.cta}
              </Button>
            </Link>
            <Button variant="ghost" className="w-full" onClick={onClose}>
              Continue with Free
            </Button>
          </div>
        </div>

        {/* Trust badge */}
        <div className="border-t pt-4 text-center text-xs text-muted-foreground">
          <p>✓ Cancel anytime • ✓ 30-day money-back guarantee</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const tiers = [
  {
    name: 'Starter',
    price: '$0',
    description: 'For quick edits and evaluation',
    features: ['Monaco Editor', 'Local files', 'Community support'],
    cta: 'Get Started',
  },
  {
    name: 'Pro',
    price: '$19/mo',
    description: 'For freelancers and small teams',
    features: ['FTP/S3 connections', 'AI explain/refactor', 'Auto-backups & rollback'],
    cta: 'Start Pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Contact us',
    description: 'For organizations with compliance needs',
    features: ['SSO & RBAC', 'Audit logs', 'Priority support'],
    cta: 'Contact Sales',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold">Simple, transparent pricing</h1>
          <p className="mt-3 text-muted-foreground">Choose a plan that fits your workflow.</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <Card key={tier.name} className={tier.highlighted ? 'border-primary shadow-md' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {tier.name}
                  <span className="text-xl font-semibold">{tier.price}</span>
                </CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Button asChild className="w-full" variant={tier.highlighted ? 'default' : 'outline'}>
                    <Link href={tier.name === 'Enterprise' ? '/#contact' : '/editor'}>{tier.cta}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

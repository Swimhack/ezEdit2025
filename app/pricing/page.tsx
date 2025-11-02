import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for trying out the platform',
    features: [
      'View & edit files',
      'Monaco code editor',
      'Try all features',
      'Community support',
      '❌ No saving or deploying'
    ],
    cta: 'Try Free',
  },
  {
    name: 'Pro',
    price: '$20/mo',
    description: 'For freelancers, agencies & small businesses',
    features: [
      '✅ Save & deploy changes',
      'Unlimited sites',
      'FTP/SFTP/WordPress/Wix',
      'Auto-backups & rollback',
      'SEO optimization tools',
      'Priority email support'
    ],
    cta: 'Start Pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Contact Us',
    description: 'For teams with advanced needs',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'White-label solution',
      'Custom integrations',
      'SSO & advanced security',
      'Dedicated account manager',
      '24/7 priority support'
    ],
    cta: 'Contact Sales',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold">Design, Host, Update & Optimize</h1>
          <p className="mt-3 text-xl text-muted-foreground">Start free, upgrade when you're ready to save and deploy.</p>
          <p className="mt-2 text-sm text-muted-foreground">Join the premier platform for web management.</p>
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

        {/* AI Add-on Section */}
        <div className="mt-16 mx-auto max-w-3xl">
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="text-center">
              <div className="mx-auto w-fit rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary mb-2">
                Coming Soon
              </div>
              <CardTitle className="text-3xl">AI-Powered Features</CardTitle>
              <CardDescription className="text-base">
                Next-generation AI assistance for automated updates and optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                <div className="space-y-2">
                  <h4 className="font-semibold">AI Content Updates</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Natural language editing</li>
                    <li>• Automated content generation</li>
                    <li>• Smart code refactoring</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">AI SEO Optimization</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Automated meta tags</li>
                    <li>• Content optimization</li>
                    <li>• Performance suggestions</li>
                  </ul>
                </div>
              </div>
              <div className="text-center space-y-4">
                <p className="text-2xl font-bold">+$30/mo <span className="text-sm font-normal text-muted-foreground">add-on to Pro or Enterprise</span></p>
                <Button size="lg" disabled className="cursor-not-allowed">
                  Join Waitlist (Coming 2025)
                </Button>
                <p className="text-xs text-muted-foreground">Early adopters get 50% off for life</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

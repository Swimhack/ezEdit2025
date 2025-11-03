import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const tiers = [
  {
    name: 'Basic Support',
    price: '$49/mo',
    description: 'Ideal for small clients needing minor tweaks or updates.',
    features: [
      'Up to 2 requests per month',
      'Turnaround within 3 business days',
      'Email & ticket-based support',
    ],
    cta: 'Get Started',
  },
  {
    name: 'Growth',
    price: '$149/mo',
    description: 'For teams or clients with more frequent updates.',
    features: [
      'Up to 5 requests per month',
      'Priority turnaround (2 business days)',
      'Occasional strategy calls or check-ins',
    ],
    cta: 'Choose Growth',
  },
  {
    name: 'Pro / Partner',
    price: '$499/mo',
    description: 'For ongoing, high-touch relationships.',
    features: [
      'Unlimited requests (within fair use)',
      'Priority support & same-day response',
      'Optional feature roadmap discussions',
    ],
    cta: 'Become a Partner',
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
                  <Button asChild className="w-full">
                    <Link href={tier.name === 'Pro / Partner' ? '/#contact' : '/editor'}>{tier.cta}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Custom / One-Off Requests Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold">Custom / One-Off Requests</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            Have a special request or larger project that falls outside your subscription?
            <br />
            We offer custom quotes for one-time updates, new features, integrations, or major redesigns.
          </p>
          <p className="mt-4 font-semibold">Pricing starts at $100 and is based on scope and complexity.</p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/#contact">Submit a Custom Request →</Link>
          </Button>
        </div>

        {/* What’s Included vs. What’s Not Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center">What’s Included vs. What’s Not</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Included (with subscription)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✔ Minor text/image updates</li>
                  <li>✔ Small layout tweaks</li>
                  <li>✔ Performance or security checks</li>
                  <li>✔ Bug fixes</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Not Included (custom quote required)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>❌ Major feature additions</li>
                  <li>❌ Full redesigns</li>
                  <li>❌ API integrations or backend changes</li>
                  <li>❌ New page creation</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Optional Add-Ons Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold">Flexible Add-Ons</h2>
          <p className="mt-2 text-lg text-muted-foreground">Customize your plan with powerful extras.</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Rush Turnaround</CardTitle>
                <p className="text-2xl font-bold pt-2">+$50</p>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">per request</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Weekend Support</CardTitle>
                <p className="text-2xl font-bold pt-2">+$100</p>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">per month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Extra Request</CardTitle>
                <p className="text-2xl font-bold pt-2">+$20</p>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">per request</p>
              </CardContent>
            </Card>
          </div>
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

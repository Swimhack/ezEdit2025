import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Zap, TrendingUp, Code, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ContactForm } from '@/components/marketing/ContactForm';

const services = [
  {
    icon: Code,
    name: 'Website Updates',
    tagline: 'Small tweaks, big impact',
    price: 'Starting at $49',
    description: 'Quick fixes and updates to keep your website fresh and functional.',
    features: [
      'Text & image updates',
      'Bug fixes',
      'Layout adjustments',
      'Form updates',
      'Contact info changes',
      '24-48hr turnaround',
    ],
    popular: true,
  },
  {
    icon: TrendingUp,
    name: 'SEO Optimization',
    tagline: 'Get found on Google',
    price: 'Starting at $199',
    description: 'Boost your search rankings and drive more organic traffic to your site.',
    features: [
      'Keyword research',
      'Meta tags optimization',
      'Page speed improvements',
      'Mobile optimization',
      'Schema markup',
      'Monthly reports',
    ],
    popular: false,
  },
  {
    icon: Sparkles,
    name: 'Managed Updates',
    tagline: 'Hands-off updates',
    price: '$299/month',
    description: 'Unlimited small updates. We handle everything so you can focus on your business.',
    features: [
      'Unlimited small updates',
      'Priority support',
      'Monthly site audit',
      'Performance monitoring',
      'Security updates',
      'AI-powered (coming soon)',
    ],
    popular: false,
  },
];

const packages = [
  {
    name: 'Quick Fix',
    price: 49,
    updates: 1,
    turnaround: '24-48 hours',
    description: 'Perfect for urgent small changes',
  },
  {
    name: 'Standard Pack',
    price: 129,
    updates: 3,
    turnaround: '3-5 days',
    description: 'Multiple updates bundled',
    savings: 'Save $18',
  },
  {
    name: 'Monthly Plan',
    price: 299,
    updates: 'Unlimited',
    turnaround: 'Same day',
    description: 'Best for ongoing needs',
    savings: 'Best Value',
    popular: true,
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Zap className="h-4 w-4" />
                Professional Website Services
              </div>
              <h1 className="text-5xl md:text-6xl font-bold">
                Small Updates,
                <br />
                <span className="text-primary">Done Right</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Professional website updates and SEO services. Fast turnaround, affordable pricing.
                <span className="block mt-2 text-base">Soon powered by AI for instant updates.</span>
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Link href="#packages">
                  <Button size="lg">
                    View Packages
                  </Button>
                </Link>
                <Link href="#contact">
                  <Button size="lg" variant="outline">
                    Get a Quote
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Our Services</h2>
              <p className="text-muted-foreground text-lg">Choose what your website needs</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {services.map((service) => (
                <Card key={service.name} className={service.popular ? 'border-primary shadow-lg' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10`}>
                        <service.icon className="h-6 w-6 text-primary" />
                      </div>
                      {service.popular && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                          Most Popular
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-2xl mt-4">{service.name}</CardTitle>
                    <CardDescription className="text-base">{service.tagline}</CardDescription>
                    <div className="text-3xl font-bold mt-4">{service.price}</div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="#contact">
                      <Button className="w-full mt-4" variant={service.popular ? 'default' : 'outline'}>
                        Get Started
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Packages */}
        <section id="packages" className="py-20 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Simple Pricing</h2>
              <p className="text-muted-foreground text-lg">Pay per update or subscribe for unlimited</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {packages.map((pkg) => (
                <Card key={pkg.name} className={pkg.popular ? 'border-primary shadow-xl scale-105' : ''}>
                  <CardHeader>
                    {pkg.savings && (
                      <div className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full w-fit mb-2">
                        {pkg.savings}
                      </div>
                    )}
                    <CardTitle>{pkg.name}</CardTitle>
                    <div className="text-4xl font-bold mt-2">
                      ${pkg.price}
                      {pkg.name === 'Monthly Plan' && <span className="text-lg font-normal text-muted-foreground">/mo</span>}
                    </div>
                    <CardDescription className="text-base mt-2">{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 py-4 border-y">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Updates included</span>
                        <span className="font-semibold">{pkg.updates}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Turnaround</span>
                        <span className="font-semibold">{pkg.turnaround}</span>
                      </div>
                    </div>
                    <Link href={`/checkout?service=${pkg.name.toLowerCase().replace(' ', '-')}&price=${pkg.price}`}>
                      <Button className="w-full" variant={pkg.popular ? 'default' : 'outline'}>
                        {pkg.name === 'Monthly Plan' ? 'Subscribe Now' : 'Purchase'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8 text-sm text-muted-foreground">
              <p>All packages include: ✓ Satisfaction guarantee ✓ Revisions included ✓ Professional support</p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground text-lg">Simple 3-step process</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  1
                </div>
                <h3 className="text-xl font-semibold">Tell Us What You Need</h3>
                <p className="text-muted-foreground">
                  Fill out a simple form describing the changes you want
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  2
                </div>
                <h3 className="text-xl font-semibold">We Make It Happen</h3>
                <p className="text-muted-foreground">
                  Our team implements your changes professionally
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  3
                </div>
                <h3 className="text-xl font-semibold">Review & Approve</h3>
                <p className="text-muted-foreground">
                  Check the updates and request any revisions
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950 px-6 py-3 text-sm">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium">Coming Soon: AI-Powered instant updates - no waiting!</span>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="contact" className="py-20 bg-primary/5">
          <div className="container mx-auto px-4">
            <ContactForm 
              title="Ready to Get Started?"
              description="Not sure which package is right for you? Contact us for a free consultation and custom quote."
              showServiceType={true}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

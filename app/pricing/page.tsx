import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold">Need a Website Update?</h1>
          <p className="mt-3 text-xl text-muted-foreground">
            From minor content tweaks to new features, I handle all your website update requests.
            <br />
            No subscription needed. Just send an inquiry to get a custom quote.
          </p>
        </div>

        <div className="mt-12 max-w-xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl">One-Off Updates & Custom Solutions</CardTitle>
              <CardDescription>
                Tell me what you need, and I'll provide a custom quote based on the scope and complexity of the work.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">Pricing starts at $100</p>
              <Button asChild size="lg" className="mt-6 w-full">
                <Link href="/#contact">Send an Inquiry →</Link>
              </Button>
            </CardContent>
          </Card>
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

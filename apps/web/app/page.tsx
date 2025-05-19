import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powerful Features for Legacy Website Management
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              EzEdit provides all the tools you need to maintain and update your legacy websites with modern AI technology.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Comprehensive Tools for Web Management
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="Smart Editing"
              description="Powerful tools that make editing your website a breeze"
            />
            <FeatureCard
              title="AI-Powered Edits"
              description="Describe changes in plain English and let our AI implement them without breaking your site."
            />
            <FeatureCard
              title="Code Analysis"
              description="Our system understands your code structure and makes appropriate changes while preserving functionality."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Ready to Modernize Your Website Management?
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard
              title="Free Trial"
              price="$0/month"
              features={[
                "50 AI-powered edits per month",
                "1 FTP connection",
                "Basic version history (7 days)",
                "Community support",
                "1 GB storage"
              ]}
              isPopular={false}
            />
            <PricingCard
              title="Business Pro"
              price="$50/month"
              features={[
                "Unlimited AI-powered edits",
                "5 FTP connections",
                "Extended version history (90 days)",
                "Priority support",
                "10 GB storage",
                "Custom domain support",
                "Team collaboration (2 seats)",
                "Security scanning"
              ]}
              isPopular={true}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <FAQItem
              question="What happens when I reach my monthly edit limit?"
              answer="When you reach your monthly edit limit, you can either upgrade to a higher plan or wait until your allotment resets at the start of the next billing cycle. You'll always be able to view your websites and make manual edits, even if you've reached your AI edit limit."
            />
            <FAQItem
              question="Can I cancel my subscription at any time?"
              answer="Yes, you can cancel your subscription at any time. Your service will continue until the end of your current billing period. We do not offer refunds for partial months."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards including Visa, Mastercard, American Express, and Discover. For Enterprise plans, we also accept bank transfers and purchase orders."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8">
            Try EzEdit risk-free with our free trial or subscribe to our Business Pro plan.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" variant="secondary">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
              Read the Docs
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">EzEdit.co</h3>
              <p className="text-gray-400">Secure, AI-powered web editor for legacy websites.</p>
            </div>
            <div className="flex gap-4">
              <Link href="https://twitter.com" className="text-gray-400 hover:text-white">
                Twitter
              </Link>
              <Link href="https://github.com" className="text-gray-400 hover:text-white">
                GitHub
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-400">
            <p>© 2025 Strickland Technology. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function PricingCard({ title, price, features, isPopular }: { 
  title: string; 
  price: string; 
  features: string[];
  isPopular: boolean;
}) {
  return (
    <div className={`bg-white p-8 rounded-lg shadow-sm border ${isPopular ? 'border-blue-500' : 'border-gray-100'}`}>
      {isPopular && (
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
          Most Popular
        </span>
      )}
      <h3 className="text-2xl font-bold mt-4 mb-2">{title}</h3>
      <p className="text-3xl font-bold mb-6">{price}</p>
      <ul className="space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button className="w-full mt-8" variant={isPopular ? "default" : "outline"}>
        Subscribe
      </Button>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-gray-200 pb-6">
      <h3 className="text-xl font-semibold mb-2">{question}</h3>
      <p className="text-gray-600">{answer}</p>
    </div>
  );
} 
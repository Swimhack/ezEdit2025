import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { IntakeForm } from '@/components/marketing/IntakeForm';

export default function ServicesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold">Submit a Request</h1>
          <p className="mt-3 text-xl text-muted-foreground">
            Tell us what you need, and we'll get back to you with a quote.
          </p>
        </div>

        <div className="mt-12">
          <IntakeForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}

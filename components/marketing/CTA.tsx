import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CTA() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="rounded-xl border bg-card p-10 text-center">
        <h3 className="text-2xl font-semibold">Ready to move faster?</h3>
        <p className="mt-2 text-muted-foreground">Launch the editor and connect your site to start editing with AI.</p>
        <div className="mt-6 flex justify-center">
          <Button asChild size="lg">
            <Link href="/editor">Launch EzEdit</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

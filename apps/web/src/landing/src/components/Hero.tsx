
import { useState } from 'react';
import { Play } from 'lucide-react';
import InviteForm from './InviteForm';
import VideoModal from './VideoModal';

const Hero = () => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const handleWatchDemo = () => {
    setIsVideoModalOpen(true);
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible('cta_click', { props: { label: 'watch_demo' } });
    }
  };

  const handleGetStarted = () => {
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible('cta_click', { props: { label: 'get_started' } });
    }
  };

  return (
    <section className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0A0E18] leading-tight animate-fade-in">
          Edit Legacy Websites with{' '}
          <span className="text-[#1597FF]">AI-Powered</span>{' '}
          Simplicity
        </h1>
        
        <p className="mt-6 text-lg sm:text-xl text-[#3B4656] max-w-3xl mx-auto leading-relaxed animate-fade-in">
          Connect to any website via FTP/SFTP and update your code using natural language prompts. 
          Secure, fast, and incredibly simple.
        </p>

        <div className="mt-14 animate-fade-in">
          <p className="text-[#0A0E18] font-medium mb-6">
            Get early access to EzEdit
          </p>
          <InviteForm />
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
          <a 
            href="/signup" 
            className="btn-primary w-full sm:w-auto"
            onClick={handleGetStarted}
          >
            Get Started for Free
          </a>
          <button 
            onClick={handleWatchDemo}
            className="btn-ghost w-full sm:w-auto"
          >
            <Play size={16} className="mr-2" />
            Watch Demo
          </button>
        </div>
      </div>

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoId="J5v9FjrBMmM"
      />
    </section>
  );
};

export default Hero;

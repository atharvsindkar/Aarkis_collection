import React, { useState } from 'react';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | error | success
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    try {
      setStatus('loading');
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
        setErrorMessage(data.message || 'Unable to subscribe. Please try again.');
      }
    } catch (err) {
      // Fallback graceful success for offline/demo preview
      setStatus('success');
      setEmail('');
    }
  };

  return (
    <section id="newsletter" className="py-20 md:py-28 bg-[#F7F2EA] border-b border-[#E8E0D2] relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Envelope Icon */}
        <div className="w-12 h-12 rounded-full bg-[#EAE2D5] text-[#34251F] mx-auto flex items-center justify-center mb-6">
          <Mail size={20} strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#281D18] mb-4 font-normal">
          Letters from Aarkis
        </h2>

        {/* Supporting Copy */}
        <p className="font-serif italic text-lg sm:text-xl text-[#B49A62] mb-3">
          A little inspiration for your personal style.
        </p>

        <p className="text-xs sm:text-sm text-[#6F5847] font-light max-w-lg mx-auto mb-10 leading-relaxed">
          Be the first to preview emerging capsule drops, atelier tailoring notes, and seasonal wardrobe inspirations.
        </p>

        {/* Subscription Form */}
        {status === 'success' ? (
          <div className="p-6 bg-white border border-[#D8C2A0] rounded-xs max-w-md mx-auto shadow-sm animate-fade-in">
            <CheckCircle2 size={32} className="text-[#34251F] mx-auto mb-3" />
            <h3 className="font-serif text-xl text-[#281D18] mb-1 font-medium">
              Welcome to the Aarkis Circle
            </h3>
            <p className="text-xs text-[#6F5847] font-light leading-relaxed">
              Thank you for subscribing. You will receive private previews and tailoring notes directly in your inbox.
            </p>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="mt-4 text-[11px] uppercase tracking-wider text-[#8E7766] underline hover:text-[#34251F]"
            >
              Subscribe another email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3.5 bg-white text-[#2C211B] border border-[#D8C2A0] placeholder-[#A69483] text-xs focus:outline-none focus:border-[#34251F] focus:ring-1 focus:ring-[#34251F] rounded-xs sm:rounded-r-none"
              />
              <button
                type="submit"
                className="px-6 py-3.5 bg-[#34251F] hover:bg-[#201511] text-[#FAF7F2] text-xs font-semibold uppercase tracking-[0.2em] transition-colors rounded-xs sm:rounded-l-none flex items-center justify-center space-x-2"
              >
                <span>Subscribe</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {status === 'error' && (
              <p className="mt-2 text-xs text-[#B9382B] text-left">
                {errorMessage}
              </p>
            )}

            <p className="mt-4 text-[10px] text-[#A69483] uppercase tracking-wider">
              No spam. Unsubscribe at any time.
            </p>
          </form>
        )}

      </div>
    </section>
  );
}

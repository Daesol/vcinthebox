'use client';

import { useAuth } from '@clerk/nextjs';
import { SignInButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { STAGES } from '@/lib/stages';

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleCTA = () => {
    if (isSignedIn) {
      router.push('/app');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32 max-w-6xl mx-auto">
        {/* Subtle background accents */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-yc-orange/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-yc-orange/5 rounded-full blur-3xl" />
        </div>

        <div className="stagger-children">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yc-orange/10 rounded-full mb-8">
            <span className="w-2 h-2 bg-yc-orange rounded-full animate-pulse" />
            <span className="text-sm font-medium text-yc-orange">YC-Style Pitch Training</span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight max-w-4xl mb-6">
            Practice your pitch with
            <span className="text-yc-orange"> AI investors</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
            5 stages. Real-time voice conversations. Instant feedback. 
            Train like you&apos;re pitching at YC Demo Day.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            {isSignedIn ? (
              <button
                onClick={handleCTA}
                className="inline-flex items-center justify-center gap-2 bg-yc-orange text-white font-semibold text-lg h-14 px-8 rounded-xl hover:bg-[#e55c00] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yc-orange/25"
              >
                Go to Dashboard
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="inline-flex items-center justify-center gap-2 bg-yc-orange text-white font-semibold text-lg h-14 px-8 rounded-xl hover:bg-[#e55c00] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yc-orange/25 cursor-pointer">
                  Start a Run
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </SignInButton>
            )}
            <a
              href="#stages"
              className="inline-flex items-center justify-center gap-2 text-gray-900 font-medium text-lg h-14 px-8 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              See the Stages
            </a>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 border-2 border-white"
                />
              ))}
            </div>
            <span>Trusted by 500+ founders practicing their pitch</span>
          </div>
        </div>
      </section>

      {/* Stages Section */}
      <section id="stages" className="px-6 py-24 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              5 Stages to Funding
            </h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Each stage simulates a real investor conversation. Nail them all and you might just raise your virtual round.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((stage, index) => (
              <div
                key={stage.id}
                className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:border-yc-orange/50"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="inline-flex items-center justify-center w-10 h-10 bg-yc-orange/20 text-yc-orange font-bold rounded-lg">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-400">
                    {Math.floor(stage.timeLimitSec / 60)}:{(stage.timeLimitSec % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-yc-orange transition-colors">
                  {stage.name}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {stage.objective}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-24 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
            How it works
          </h2>

          <div className="space-y-12">
            {[
              {
                step: '01',
                title: 'Start a Run',
                description: 'Use your credits to begin a pitch session. Each run takes you through all 5 investor stages.',
              },
              {
                step: '02',
                title: 'Pitch in Real-Time',
                description: 'Talk to an AI investor avatar using voice. It responds naturally, asks follow-up questions, and challenges your assumptions.',
              },
              {
                step: '03',
                title: 'Get Instant Feedback',
                description: 'After each stage, receive star ratings, feedback bullets, and see how much you "raised". Beat the stages to complete your run.',
              },
              {
                step: '04',
                title: 'Climb the Leaderboard',
                description: 'Compare your total raised with other founders. The best pitchers rise to the top.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <span className="text-5xl font-bold text-orange-200">{item.step}</span>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 bg-yc-orange">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to nail your next pitch?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join hundreds of founders who practice with VC in the Box.
          </p>
          {isSignedIn ? (
            <button
              onClick={handleCTA}
              className="inline-flex items-center justify-center gap-2 bg-white text-yc-orange font-semibold text-lg h-14 px-10 rounded-xl hover:bg-gray-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Practicing Now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          ) : (
            <SignInButton mode="modal">
              <button className="inline-flex items-center justify-center gap-2 bg-white text-yc-orange font-semibold text-lg h-14 px-10 rounded-xl hover:bg-gray-50 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                Start Practicing Now
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </SignInButton>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 bg-gray-900 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-gray-400 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yc-orange rounded-sm flex items-center justify-center text-white font-bold text-xs">
              VC
            </div>
            <span>VC in the Box</span>
          </div>
          <span>© 2025 VC in the Box. Built for founders, by founders.</span>
        </div>
      </footer>
    </div>
  );
}

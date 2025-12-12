'use client';

import { useAuth } from '@clerk/nextjs';
import { SignInButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { STAGES } from '@/lib/stages';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCTA = () => {
    if (isSignedIn) {
      router.push('/app');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* HERO SECTION - Full screen immersive */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[120px] transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
          <div className={`absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/15 rounded-full blur-[120px] transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <span className="text-sm font-medium text-white/80">AI-Powered Pitch Training</span>
          </div>

          {/* Main headline with gradient */}
          <h1 className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="block text-white">Pitch to</span>
            <span className="block bg-gradient-to-r from-orange-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
              AI Investors
            </span>
          </h1>

          {/* Subheadline */}
          <p className={`text-lg sm:text-xl md:text-2xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Practice your startup pitch through <span className="text-white/90">5 realistic stages</span>.
            Real-time voice. Instant feedback. Zero judgment.
          </p>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {isSignedIn ? (
              <button
                onClick={handleCTA}
                className="group relative inline-flex items-center justify-center gap-3 h-14 px-8 text-lg font-semibold rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105"
              >
                <span>Launch Dashboard</span>
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl" />
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="group relative inline-flex items-center justify-center gap-3 h-14 px-8 text-lg font-semibold rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105 cursor-pointer">
                  <span>Start Free Run</span>
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl" />
                </button>
              </SignInButton>
            )}
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 h-14 px-8 text-lg font-medium rounded-2xl bg-white/5 backdrop-blur border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              See How It Works
            </a>
          </div>

          {/* Stats */}
          <div className={`flex flex-wrap items-center justify-center gap-8 sm:gap-12 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">5</div>
              <div className="text-sm text-white/40 mt-1">Investor Stages</div>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block" />
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Real-time</div>
              <div className="text-sm text-white/40 mt-1">Voice AI</div>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block" />
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">$10M+</div>
              <div className="text-sm text-white/40 mt-1">Virtual $ Raised</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-700 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex flex-col items-center gap-2 text-white/30">
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <div className="w-5 h-8 rounded-full border border-white/20 flex justify-center pt-2">
              <div className="w-1 h-2 bg-white/40 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* DEMO PREVIEW SECTION */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                Experience the Future of
              </span>
              <br />
              <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                Pitch Practice
              </span>
            </h2>
          </div>

          {/* Demo video/image mock */}
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/30 via-purple-500/30 to-pink-500/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-60" />
            
            {/* Browser mockup */}
            <div className="relative bg-slate-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-slate-700/50 rounded-lg text-xs text-white/40">
                    vcinthebox.com/app/run/live
                  </div>
                </div>
              </div>
              
              {/* App preview */}
              <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
                {/* Fake UI elements */}
                <div className="absolute inset-4 flex">
                  {/* Avatar area */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-gradient-to-br from-orange-500/20 to-purple-500/20 flex items-center justify-center animate-pulse">
                        <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
                          <svg className="w-16 h-16 sm:w-20 sm:h-20 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      {/* Speaking indicator */}
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur rounded-full flex items-center gap-2">
                        <div className="flex gap-0.5">
                          <div className="w-1 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1 h-4 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-white text-xs">Speaking</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Timer */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/5 backdrop-blur rounded-xl border border-white/10">
                    <span className="text-2xl font-mono font-bold text-white">1:45</span>
                  </div>
                </div>
                
                {/* Mic button */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STAGES SECTION */}
      <section id="stages" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-medium mb-4">
              <span>🎯</span> The Journey
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              5 Stages to Victory
            </h2>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              Each stage gets progressively harder. Can you raise from all 5 investors?
            </p>
          </div>

          {/* Stages grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((stage, index) => (
              <div
                key={stage.id}
                className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Stage number badge */}
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
                  {index + 1}
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    {index === 0 && <span className="text-2xl">👩</span>}
                    {index === 1 && <span className="text-2xl">👼</span>}
                    {index === 2 && <span className="text-2xl">💼</span>}
                    {index === 3 && <span className="text-2xl">🚀</span>}
                    {index === 4 && <span className="text-2xl">🦈</span>}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors">
                      {stage.name}
                    </h3>
                    <span className="text-sm text-white/40">
                      {Math.floor(stage.timeLimitSec / 60)}:{(stage.timeLimitSec % 60).toString().padStart(2, '0')} min
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-white/50 leading-relaxed">
                  {stage.objective}
                </p>
                
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/0 to-purple-500/0 group-hover:from-orange-500/5 group-hover:to-purple-500/5 transition-all duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative py-24 px-6 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/60 text-sm font-medium mb-4">
              <span>⚡</span> Simple Process
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              How it works
            </h2>
          </div>

          <div className="space-y-8">
            {[
              {
                step: '01',
                title: 'Start a Run',
                description: 'One click to begin. No complex setup required.',
                icon: '🎬',
              },
              {
                step: '02',
                title: 'Pitch in Real-Time',
                description: 'Talk naturally to AI investors. They respond, ask questions, and challenge you.',
                icon: '🎤',
              },
              {
                step: '03',
                title: 'Get Instant Feedback',
                description: 'Star ratings, detailed feedback, and see how much you raised.',
                icon: '⭐',
              },
              {
                step: '04',
                title: 'Level Up',
                description: 'Track your progress and climb the leaderboard.',
                icon: '📈',
              },
            ].map((item, index) => (
              <div 
                key={item.step} 
                className="group flex gap-6 items-start p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-orange-500/30 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-orange-400/60 font-mono text-sm">{item.step}</span>
                    <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  </div>
                  <p className="text-white/50 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-24 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-[150px]" />
          </div>
          
          <div className="relative text-center">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Ready to{' '}
              <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                nail your pitch?
              </span>
            </h2>
            <p className="text-xl text-white/50 mb-10">
              Join founders who are leveling up their pitch game.
            </p>
            
            {isSignedIn ? (
              <button
                onClick={handleCTA}
                className="group relative inline-flex items-center justify-center gap-3 h-16 px-10 text-xl font-semibold rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105"
              >
                <span>Start Pitching Now</span>
                <svg className="w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="group relative inline-flex items-center justify-center gap-3 h-16 px-10 text-xl font-semibold rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105 cursor-pointer">
                  <span>Start Pitching Now</span>
                  <svg className="w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <img 
            src="/logo.png" 
            alt="VC in the Box" 
            className="h-8 w-auto opacity-60 hover:opacity-100 transition-opacity"
          />
          <span className="text-white/40 text-sm">© 2025 Built for founders, by founders.</span>
        </div>
      </footer>

      {/* Global styles for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.5; }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

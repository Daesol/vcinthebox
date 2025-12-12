'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { STAGES } from '@/lib/stages';
import { api, MeResponse, LeaderboardEntry } from '@/lib/api';
import { useRunStore } from '@/lib/runStore';

export default function DashboardPage() {
  const router = useRouter();
  const { resetRun, startRun } = useRunStore();
  
  const [userData, setUserData] = useState<MeResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    // Reset any previous run state
    resetRun();
    
    // Fetch user data and leaderboard
    const fetchData = async () => {
      try {
        const [me, lb] = await Promise.all([
          api.getMe(),
          api.getLeaderboard(),
        ]);
        setUserData(me);
        setLeaderboard(lb.slice(0, 5)); // Top 5
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [resetRun]);

  const handleStartRun = async () => {
    if (!userData || userData.credits <= 0) return;
    
    setIsStarting(true);
    try {
      const session = await api.startSession(STAGES[0].id);
      startRun(session.runId);
      router.push('/app/run');
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start session. Please try again.');
      setIsStarting(false);
    }
  };

  const handleBuyCredits = async () => {
    try {
      const { checkoutUrl } = await api.createCheckout();
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Failed to create checkout:', error);
      alert('Checkout not available yet. Backend integration pending.');
    }
  };

  const formatMoney = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
            <p className="text-white/50">Ready to practice your pitch?</p>
          </div>
          
          {/* Credits Badge */}
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Credits</p>
              <p className="text-2xl font-bold text-white">{userData?.credits ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Action Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Start Run Card */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2">Start a New Run</h2>
                    <p className="text-white/50">
                      Each run costs 1 credit and takes you through all 5 investor stages.
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleStartRun}
                    disabled={!userData || userData.credits <= 0 || isStarting}
                    className="group/btn relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold h-12 px-6 rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isStarting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        Start a Run
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleBuyCredits}
                    className="inline-flex items-center justify-center gap-2 text-white/70 hover:text-white font-medium h-12 px-6 rounded-xl border border-white/10 hover:bg-white/5 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Buy Credits
                  </button>
                </div>

                {userData && userData.credits <= 0 && (
                  <p className="mt-4 text-sm text-red-400">
                    ⚠️ You need credits to start a run. Buy credits above to continue.
                  </p>
                )}
              </div>
            </div>

            {/* Stages Preview */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">The 5 Stages</h2>
              <div className="space-y-3">
                {STAGES.map((stage, index) => (
                  <div
                    key={stage.id}
                    className="flex items-start gap-4 p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-xl flex items-center justify-center">
                      {index === 0 && <span className="text-lg">👩</span>}
                      {index === 1 && <span className="text-lg">👼</span>}
                      {index === 2 && <span className="text-lg">💼</span>}
                      {index === 3 && <span className="text-lg">🚀</span>}
                      {index === 4 && <span className="text-lg">🦈</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium text-white">{stage.name}</h3>
                        <span className="text-sm text-white/40 whitespace-nowrap">
                          {Math.floor(stage.timeLimitSec / 60)}:{(stage.timeLimitSec % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <p className="text-sm text-white/50 mt-1 line-clamp-1">{stage.objective}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leaderboard */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">🏆 Top Founders</h2>
              </div>
              
              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <p className="text-white/40 text-sm">No runs completed yet.</p>
                  <p className="text-white/40 text-sm">Be the first!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.userId}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900' :
                        entry.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700' :
                        entry.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {entry.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white/90 truncate text-sm">{entry.userName}</p>
                      </div>
                      <span className="text-sm font-semibold text-orange-400">
                        {formatMoney(entry.totalRaised)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pro Tips */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/30 to-purple-500/30 rounded-2xl blur opacity-50" />
              <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <span>💡</span> Pro Tips
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-white/50">•</span>
                    <span className="text-white/90">Speak clearly and confidently</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/50">•</span>
                    <span className="text-white/90">Keep your answers concise</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/50">•</span>
                    <span className="text-white/90">Know your numbers cold</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/50">•</span>
                    <span className="text-white/90">Show passion for your mission</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

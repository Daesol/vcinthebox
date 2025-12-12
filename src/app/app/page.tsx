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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yc-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-gray-600">Ready to practice your pitch?</p>
        </div>
        
        {/* Credits Badge */}
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-yc-orange" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Credits</p>
            <p className="text-2xl font-bold text-gray-900">{userData?.credits ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Action Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Start Run Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Start a New Run</h2>
            <p className="text-gray-600 mb-6">
              Each run costs 1 credit and takes you through all 5 investor stages.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleStartRun}
                disabled={!userData || userData.credits <= 0 || isStarting}
                className="inline-flex items-center justify-center gap-2 bg-yc-orange text-white font-semibold h-12 px-6 rounded-xl hover:bg-[#e55c00] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isStarting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Start a Run
                  </>
                )}
              </button>
              
              <button
                onClick={handleBuyCredits}
                className="inline-flex items-center justify-center gap-2 text-gray-900 font-medium h-12 px-6 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Buy Credits
              </button>
            </div>

            {userData && userData.credits <= 0 && (
              <p className="mt-4 text-sm text-red-600">
                You need credits to start a run. Buy credits above to continue.
              </p>
            )}
          </div>

          {/* Stages Preview */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">The 5 Stages</h2>
            <div className="space-y-4">
              {STAGES.map((stage, index) => (
                <div
                  key={stage.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
                >
                  <span className="flex-shrink-0 w-8 h-8 bg-orange-100 text-yc-orange font-bold rounded-lg flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-gray-900">{stage.name}</h3>
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {Math.floor(stage.timeLimitSec / 60)}:{(stage.timeLimitSec % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{stage.objective}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Top Founders</h2>
              <span className="text-sm text-yc-orange font-medium cursor-pointer hover:underline">View All →</span>
            </div>
            
            {leaderboard.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No runs completed yet. Be the first!
              </p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.userId}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                      entry.rank === 2 ? 'bg-gray-300 text-gray-700' :
                      entry.rank === 3 ? 'bg-amber-600 text-white' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {entry.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{entry.userName}</p>
                    </div>
                    <span className="text-sm font-semibold text-yc-orange">
                      {formatMoney(entry.totalRaised)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-yc-orange rounded-2xl p-6 text-white">
            <h3 className="font-semibold mb-4">Pro Tips</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-white/70">•</span>
                <span className="text-white/90">Speak clearly and confidently</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/70">•</span>
                <span className="text-white/90">Keep your answers concise</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/70">•</span>
                <span className="text-white/90">Know your numbers cold</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/70">•</span>
                <span className="text-white/90">Show passion for your mission</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

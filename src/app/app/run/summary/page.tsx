'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRunStore } from '@/lib/runStore';
import { api, LeaderboardEntry } from '@/lib/api';
import { STAGES } from '@/lib/stages';

export default function SummaryPage() {
  const router = useRouter();
  const { state, stageResults, totalRaised, runId, resetRun } = useRunStore();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    if (state !== 'SUMMARY') {
      router.push('/app');
      return;
    }

    // Fetch leaderboard
    const fetchLeaderboard = async () => {
      try {
        const lb = await api.getLeaderboard();
        setLeaderboard(lb);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      }
    };

    fetchLeaderboard();
  }, [state, router]);

  const handleSubmitToLeaderboard = async () => {
    if (!runId || hasSubmitted) return;
    
    setIsSubmitting(true);
    try {
      await api.submitToLeaderboard(runId);
      
      // Refresh leaderboard and find user rank
      const lb = await api.getLeaderboard();
      setLeaderboard(lb);
      
      // Find user's position
      const userEntry = lb.find((entry) => entry.totalRaised === totalRaised);
      if (userEntry) {
        setUserRank(userEntry.rank);
      }
      
      setHasSubmitted(true);
    } catch (error) {
      console.error('Failed to submit to leaderboard:', error);
      // Still mark as submitted to avoid re-submit attempts
      setHasSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartNewRun = () => {
    resetRun();
    router.push('/app');
  };

  const formatMoney = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  const totalStars = stageResults.reduce((sum, r) => sum + r.stars, 0);
  const maxStars = stageResults.length * 5;
  const passedStages = stageResults.filter((r) => r.passFail === 'pass').length;

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-3xl mb-6">
            <svg className="w-10 h-10 text-yc-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Run Complete!</h1>
          <p className="text-xl text-gray-600">
            You raised <span className="text-yc-orange font-bold">{formatMoney(totalRaised)}</span> in virtual funding
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Stats Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm animate-slide-up">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Run Summary</h2>
            
            {/* Big number */}
            <div className="text-center p-8 bg-yc-orange rounded-2xl mb-6">
              <p className="text-white/80 text-sm mb-2">Total Raised</p>
              <p className="text-5xl font-bold text-white">{formatMoney(totalRaised)}</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-gray-500 text-sm mb-1">Stars Earned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalStars}/{maxStars} ⭐
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-gray-500 text-sm mb-1">Stages Passed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {passedStages}/{stageResults.length}
                </p>
              </div>
            </div>

            {/* Stage breakdown */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 mb-2">Stage Breakdown</h3>
              {stageResults.map((result, index) => {
                const stage = STAGES.find((s) => s.id === result.stageId);
                return (
                  <div
                    key={result.stageId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        result.passFail === 'pass' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-900">{stage?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {result.stars}⭐
                      </span>
                      <span className="text-sm font-medium text-yc-orange">
                        {formatMoney(result.moneyRaised)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leaderboard Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Leaderboard</h2>
              {userRank && (
                <span className="px-3 py-1 bg-orange-100 text-yc-orange text-sm font-medium rounded-full">
                  Your Rank: #{userRank}
                </span>
              )}
            </div>

            {/* Submit button */}
            {!hasSubmitted && (
              <button
                onClick={handleSubmitToLeaderboard}
                disabled={isSubmitting}
                className="w-full mb-6 inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-medium h-12 px-6 rounded-xl hover:bg-black transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Submit to Leaderboard
                  </>
                )}
              </button>
            )}

            {hasSubmitted && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                ✓ Your score has been submitted to the leaderboard!
              </div>
            )}

            {/* Leaderboard list */}
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    hasSubmitted && entry.totalRaised === totalRaised
                      ? 'bg-orange-50 border border-orange-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
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
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <button
            onClick={handleStartNewRun}
            className="inline-flex items-center justify-center gap-2 bg-yc-orange text-white font-semibold h-14 px-8 rounded-xl hover:bg-[#e55c00] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Start New Run
          </button>
          <button
            onClick={() => router.push('/app')}
            className="inline-flex items-center justify-center gap-2 text-gray-900 font-medium h-14 px-8 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

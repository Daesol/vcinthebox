'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRunStore } from '@/lib/runStore';
import { api } from '@/lib/api';
import { STAGES, getStageIndex } from '@/lib/stages';

export default function StageIntroPage() {
  const router = useRouter();
  const { state, currentStageId, runId, setSessionData, goToLive, resetRun, startRun } = useRunStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStage = currentStageId 
    ? STAGES.find((s) => s.id === currentStageId) 
    : STAGES[0];
  
  const stageIndex = currentStageId ? getStageIndex(currentStageId) : 0;

  useEffect(() => {
    // If no run is active, redirect to dashboard
    if (state === 'IDLE' && !runId) {
      router.push('/app');
    }
  }, [state, runId, router]);

  const handleBegin = async () => {
    if (!currentStage || !runId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get session data from backend
      const session = await api.startSession(currentStage.id);
      setSessionData(session.agentId, session.anamSessionToken);
      goToLive();
      router.push('/app/run/live');
    } catch (err) {
      console.error('Failed to start session:', err);
      setError('Failed to connect to AI investor. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    resetRun();
    router.push('/app');
  };

  if (!currentStage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yc-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-2xl w-full">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STAGES.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index < stageIndex
                  ? 'w-8 bg-yc-orange'
                  : index === stageIndex
                  ? 'w-12 bg-yc-orange'
                  : 'w-8 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Stage card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 shadow-lg animate-fade-in">
          {/* Stage number */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full mb-6">
            <span className="text-sm font-semibold text-yc-orange">
              Stage {stageIndex + 1} of {STAGES.length}
            </span>
          </div>

          {/* Stage name */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {currentStage.name}
          </h1>

          {/* Objective */}
          <p className="text-lg text-gray-600 leading-relaxed mb-8">
            {currentStage.objective}
          </p>

          {/* Timer info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-8">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-yc-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Time Limit</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor(currentStage.timeLimitSec / 60)}:{(currentStage.timeLimitSec % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="mb-8 space-y-2 text-sm text-gray-600">
            <p className="font-medium text-gray-900">Tips for this stage:</p>
            <ul className="list-disc list-inside space-y-1">
              {stageIndex === 0 && (
                <>
                  <li>Be yourself - this is your biggest supporter</li>
                  <li>Explain what you&apos;re building simply</li>
                  <li>Share why this matters to you personally</li>
                </>
              )}
              {stageIndex === 1 && (
                <>
                  <li>Angels invest in people first</li>
                  <li>Share your story and passion</li>
                  <li>Be genuine about where you need help</li>
                </>
              )}
              {stageIndex === 2 && (
                <>
                  <li>Be concise and professional</li>
                  <li>Know your key metrics cold</li>
                  <li>Have a clear ask ready</li>
                </>
              )}
              {stageIndex === 3 && (
                <>
                  <li>Lead with traction and growth</li>
                  <li>Show week-over-week momentum</li>
                  <li>Be specific with numbers</li>
                </>
              )}
              {stageIndex === 4 && (
                <>
                  <li>Think big on marketing potential</li>
                  <li>Show you understand your customers</li>
                  <li>Be confident and entertaining</li>
                </>
              )}
            </ul>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleBegin}
              disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-yc-orange text-white font-semibold h-14 px-8 rounded-xl hover:bg-[#e55c00] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Begin Stage
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="inline-flex items-center justify-center text-gray-600 font-medium h-14 px-6 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel Run
            </button>
          </div>
        </div>

        {/* Mic permission reminder */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Make sure your microphone is enabled. You&apos;ll be speaking with an AI investor.
        </p>
      </div>
    </div>
  );
}

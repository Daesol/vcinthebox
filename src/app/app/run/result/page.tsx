'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRunStore, useIsLastStage } from '@/lib/runStore';
import { STAGES, getStageIndex } from '@/lib/stages';

export default function ResultPage() {
  const router = useRouter();
  const {
    state,
    currentStageId,
    currentStageResult,
    totalRaised,
    transcript,
    goToNextStage,
    goToSummary,
    goToStageIntro,
  } = useRunStore();

  const isLastStage = useIsLastStage();
  const currentStage = currentStageId 
    ? STAGES.find((s) => s.id === currentStageId) 
    : null;
  const stageIndex = currentStageId ? getStageIndex(currentStageId) : 0;

  useEffect(() => {
    if (state !== 'RESULT' || !currentStageResult) {
      router.push('/app/run');
    }
  }, [state, currentStageResult, router]);

  if (!currentStageResult || !currentStage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yc-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleNextStage = () => {
    goToNextStage();
    router.push('/app/run');
  };

  const handleFinishRun = () => {
    goToSummary();
    router.push('/app/run/summary');
  };

  const handleTryAgain = () => {
    goToStageIntro(currentStageId!);
    router.push('/app/run');
  };

  const formatMoney = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  const isPassed = currentStageResult.passFail === 'pass';

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl w-full animate-fade-in">
        {/* Progress */}
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

        {/* Result card */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-lg">
          {/* Header */}
          <div className={`px-8 py-6 ${isPassed ? 'bg-green-500' : 'bg-red-500'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm mb-1">Stage {stageIndex + 1} Complete</p>
                <h1 className="text-2xl font-bold text-white">{currentStage.name}</h1>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/20">
                {isPassed ? (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Stars and Money */}
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              {/* Stars */}
              <div className="bg-gray-50 rounded-2xl p-6 text-center">
                <p className="text-gray-500 text-sm mb-2">Rating</p>
                <div className="flex items-center justify-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-8 h-8 ${
                        star <= currentStageResult.stars ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-900 font-semibold">
                  {currentStageResult.stars} out of 5 stars
                </p>
              </div>

              {/* Money Raised */}
              <div className="bg-gray-50 rounded-2xl p-6 text-center">
                <p className="text-gray-500 text-sm mb-2">Money Raised</p>
                <p className="text-3xl font-bold text-yc-orange mb-1">
                  💰 {formatMoney(currentStageResult.moneyRaised)}
                </p>
                <p className="text-gray-500 text-sm">
                  Total so far: {formatMoney(totalRaised)}
                </p>
              </div>
            </div>

            {/* Feedback */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Investor Feedback</h3>
              <ul className="space-y-3">
                {currentStageResult.feedback.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-600">
                    <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-yc-orange" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Transcript */}
            {transcript.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Conversation Transcript</h3>
                <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto space-y-3">
                  {transcript.map((turn, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${turn.speaker === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                        turn.speaker === 'user' ? 'bg-yc-orange text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {turn.speaker === 'user' ? 'You' : 'VC'}
                      </div>
                      <div className={`flex-1 p-3 rounded-xl text-sm ${
                        turn.speaker === 'user' 
                          ? 'bg-orange-100 text-gray-800' 
                          : 'bg-white border border-gray-200 text-gray-700'
                      }`}>
                        {turn.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {isPassed ? (
                isLastStage ? (
                  <button
                    onClick={handleFinishRun}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-yc-orange text-white font-semibold h-14 px-8 rounded-xl hover:bg-[#e55c00] transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Finish Run
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleNextStage}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-yc-orange text-white font-semibold h-14 px-8 rounded-xl hover:bg-[#e55c00] transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Next Stage
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                )
              ) : (
                <>
                  <button
                    onClick={handleTryAgain}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-yc-orange text-white font-semibold h-14 px-8 rounded-xl hover:bg-[#e55c00] transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </button>
                  <button
                    onClick={handleFinishRun}
                    className="inline-flex items-center justify-center text-gray-600 font-medium h-14 px-6 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    End Run
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

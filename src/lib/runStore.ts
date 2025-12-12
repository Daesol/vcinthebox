import { create } from 'zustand';
import { Stage, STAGES, getNextStage, isLastStage } from './stages';
import { Turn, StageCompleteResponse } from './api';

export type RunState = 
  | 'IDLE'
  | 'STAGE_INTRO'
  | 'LIVE'
  | 'RESULT'
  | 'SUMMARY';

export interface StageResult {
  stageId: string;
  stars: number;
  moneyRaised: number;
  feedback: string[];
  passFail: 'pass' | 'fail';
}

export interface RunStore {
  // Run state
  state: RunState;
  runId: string | null;
  currentStageId: string | null;
  
  // Session data
  agentId: string | null;
  anamSessionToken: string | null;
  
  // Transcript for current stage
  transcript: Turn[];
  
  // Results
  currentStageResult: StageCompleteResponse | null;
  stageResults: StageResult[];
  totalRaised: number;
  
  // Actions
  startRun: (runId: string) => void;
  setSessionData: (agentId: string, anamSessionToken: string) => void;
  goToStageIntro: (stageId: string) => void;
  goToLive: () => void;
  addTranscriptTurn: (turn: Turn) => void;
  completeStage: (result: StageCompleteResponse) => void;
  goToNextStage: () => void;
  goToSummary: () => void;
  resetRun: () => void;
  
  // Computed helpers
  getCurrentStage: () => Stage | null;
}

const initialState = {
  state: 'IDLE' as RunState,
  runId: null,
  currentStageId: null,
  agentId: null,
  anamSessionToken: null,
  transcript: [],
  currentStageResult: null,
  stageResults: [],
  totalRaised: 0,
};

export const useRunStore = create<RunStore>((set, get) => ({
  ...initialState,

  startRun: (runId: string) => {
    set({
      ...initialState,
      state: 'STAGE_INTRO',
      runId,
      currentStageId: STAGES[0].id,
    });
  },

  setSessionData: (agentId: string, anamSessionToken: string) => {
    set({ agentId, anamSessionToken });
  },

  goToStageIntro: (stageId: string) => {
    set({
      state: 'STAGE_INTRO',
      currentStageId: stageId,
      transcript: [],
      currentStageResult: null,
      agentId: null,
      anamSessionToken: null,
    });
  },

  goToLive: () => {
    set({ state: 'LIVE' });
  },

  addTranscriptTurn: (turn: Turn) => {
    set((state) => ({
      transcript: [...state.transcript, turn],
    }));
  },

  completeStage: (result: StageCompleteResponse) => {
    const { currentStageId, stageResults } = get();
    
    const stageResult: StageResult = {
      stageId: currentStageId!,
      stars: result.stars,
      moneyRaised: result.moneyRaised,
      feedback: result.feedback,
      passFail: result.passFail,
    };

    set({
      state: 'RESULT',
      currentStageResult: result,
      stageResults: [...stageResults, stageResult],
      totalRaised: result.totalRaised,
    });
  },

  goToNextStage: () => {
    const { currentStageId } = get();
    if (!currentStageId) return;

    const nextStage = getNextStage(currentStageId);
    if (nextStage) {
      set({
        state: 'STAGE_INTRO',
        currentStageId: nextStage.id,
        transcript: [],
        currentStageResult: null,
        agentId: null,
        anamSessionToken: null,
      });
    }
  },

  goToSummary: () => {
    set({ state: 'SUMMARY' });
  },

  resetRun: () => {
    set(initialState);
  },

  getCurrentStage: () => {
    const { currentStageId } = get();
    if (!currentStageId) return null;
    return STAGES.find((s) => s.id === currentStageId) || null;
  },
}));

// Helper to check if current stage is last
export const useIsLastStage = () => {
  const currentStageId = useRunStore((state) => state.currentStageId);
  return currentStageId ? isLastStage(currentStageId) : false;
};


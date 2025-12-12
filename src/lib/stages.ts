export interface Stage {
  id: string;
  name: string;
  objective: string;
  timeLimitSec: number;
  avatarId: string;
}

export const STAGES: Stage[] = [
  {
    id: 'mom',
    name: 'Mom',
    objective: "You're not an idiot. Your mom believes in you. Just tell her what you're building and why it matters.",
    timeLimitSec: 45,
    avatarId: '6dbc1e47-7768-403e-878a-94d7fcc3677b',
  },
  {
    id: 'local-angel',
    name: 'Local Angel',
    objective: "A warm, supportive angel investor. They want to help founders succeed. Show them your passion and potential.",
    timeLimitSec: 120,
    avatarId: '19d18eb0-5346-4d50-a77f-26b3723ed79d',
  },
  {
    id: 'vc-single',
    name: 'VC Single',
    objective: "A professional VC evaluating your deal. Be concise, know your numbers, and make your case compelling.",
    timeLimitSec: 90,
    avatarId: '6cc28442-cccd-42a8-b6e4-24b7210a09c5',
  },
  {
    id: 'yc-traction',
    name: 'YC Partner',
    objective: "YC partners care about traction above all. Show them your growth, metrics, and momentum.",
    timeLimitSec: 90,
    avatarId: '81b70170-2e80-4e4b-a6fb-e04ac110dc4b',
  },
  {
    id: 'shark-tank',
    name: 'Shark Tank',
    objective: "The sharks are tough and focused on marketing potential. Convince them your product can scale.",
    timeLimitSec: 120,
    avatarId: 'e36f16d8-7ad1-423b-b9c9-70d49f5eaac6',
  },
];

export const getStageById = (id: string): Stage | undefined => {
  return STAGES.find((stage) => stage.id === id);
};

export const getStageIndex = (id: string): number => {
  return STAGES.findIndex((stage) => stage.id === id);
};

export const getNextStage = (currentId: string): Stage | null => {
  const currentIndex = getStageIndex(currentId);
  if (currentIndex === -1 || currentIndex >= STAGES.length - 1) {
    return null;
  }
  return STAGES[currentIndex + 1];
};

export const isLastStage = (id: string): boolean => {
  return getStageIndex(id) === STAGES.length - 1;
};

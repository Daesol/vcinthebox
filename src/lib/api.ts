// Typed API client for backend endpoints

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface MeResponse {
  credits: number;
  user: User;
}

export interface SessionStartResponse {
  agentId: string;
  anamSessionToken: string;
  runId: string;
}

export interface Turn {
  speaker: 'user' | 'agent';
  text: string;
  timestamp?: number;
}

export interface StageCompleteRequest {
  runId: string;
  stageId: string;
  transcript: Turn[];
}

export interface StageCompleteResponse {
  stars: number;
  moneyRaised: number;
  feedback: string[];
  passFail: 'pass' | 'fail';
  totalRaised: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  totalRaised: number;
  createdAt: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

class ApiClient {
  private baseUrl = '/api';

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getMe(): Promise<MeResponse> {
    return this.fetch<MeResponse>('/me');
  }

  async startSession(stageId: string): Promise<SessionStartResponse> {
    return this.fetch<SessionStartResponse>('/session/start', {
      method: 'POST',
      body: JSON.stringify({ stageId }),
    });
  }

  async completeStage(data: StageCompleteRequest): Promise<StageCompleteResponse> {
    return this.fetch<StageCompleteResponse>('/run/stage/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return this.fetch<LeaderboardEntry[]>('/leaderboard');
  }

  async submitToLeaderboard(runId: string): Promise<void> {
    await this.fetch('/leaderboard/submit', {
      method: 'POST',
      body: JSON.stringify({ runId }),
    });
  }

  async createCheckout(): Promise<CheckoutResponse> {
    return this.fetch<CheckoutResponse>('/billing/checkout', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();


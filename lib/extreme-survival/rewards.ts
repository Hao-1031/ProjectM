export interface RewardCalculationInput {
  wave: number;
  isOverclock: boolean;
  performanceScore: number;
  elapsedTime: number;
  todayClaimed: number;
}

export interface RewardResult {
  tokens: number;
  totalTokens: number;
  capReached: boolean;
  remainingCap: number;
}

export const DAILY_REWARD_CAP = 500;
export const OVERCLOCK_MULTIPLIER = 1.7;
export const BASE_TOKEN_RATE = 2;
const DAILY_REWARD_KEY = "project_m_extreme_daily_rewards";

interface DailyRewardRecord {
  date: string;
  claimed: number;
}

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function getTodayClaimed(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(DAILY_REWARD_KEY);
    if (!raw) return 0;
    const record = JSON.parse(raw) as DailyRewardRecord;
    return record.date === getTodayKey() ? Math.max(0, record.claimed) : 0;
  } catch {
    return 0;
  }
}

export function addTodayClaimed(amount: number): void {
  if (typeof window === "undefined" || amount <= 0) return;
  try {
    const today = getTodayKey();
    const raw = localStorage.getItem(DAILY_REWARD_KEY);
    const record: DailyRewardRecord = raw
      ? (JSON.parse(raw) as DailyRewardRecord)
      : { date: today, claimed: 0 };
    if (record.date !== today) {
      record.date = today;
      record.claimed = 0;
    }
    record.claimed = Math.min(DAILY_REWARD_CAP, record.claimed + Math.max(0, amount));
    localStorage.setItem(DAILY_REWARD_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage errors
  }
}

export function calculateRewards(input: RewardCalculationInput): RewardResult {
  const { wave, isOverclock, performanceScore, todayClaimed } = input;
  const clampedWave = Math.max(0, wave);
  const baseTokens = clampedWave * BASE_TOKEN_RATE;
  const performanceBonus = Math.floor(performanceScore / 10);
  const multiplier = isOverclock ? OVERCLOCK_MULTIPLIER : 1;

  const totalTokens = Math.ceil((baseTokens + performanceBonus) * multiplier);
  const remainingCap = Math.max(0, DAILY_REWARD_CAP - todayClaimed);
  const tokens = Math.min(totalTokens, remainingCap);

  return {
    tokens,
    totalTokens,
    capReached: tokens < totalTokens,
    remainingCap: Math.max(0, remainingCap - tokens),
  };
}

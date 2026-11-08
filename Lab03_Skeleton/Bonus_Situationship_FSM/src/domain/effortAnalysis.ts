import type { EffortSignal, RelationshipState } from "../types/relationship";

export interface EffortMetrics {
  readonly emSteps: number;
  readonly otherSteps: number;
  readonly emScore: number;
  readonly otherScore: number;
  readonly totalScore: number;
  readonly emPercent: number;
  readonly otherPercent: number;
  readonly redFlags: readonly string[];
}

/** Entirely derived from immutable logs; never store redundant score in React state. */
export function deriveEffortMetrics(
  efforts: readonly EffortSignal[],
  messageStatus: RelationshipState["message"]["status"]
): EffortMetrics {
  const em = efforts.filter((signal) => signal.actor === "EM");
  const other = efforts.filter((signal) => signal.actor === "AI_DO");
  const emSteps = em.reduce((sum, signal) => sum + signal.steps, 0);
  const otherSteps = other.reduce((sum, signal) => sum + signal.steps, 0);
  const emScore = em.reduce((sum, signal) => sum + signal.steps * signal.multiplier, 0);
  const otherScore = other.reduce((sum, signal) => sum + signal.steps * signal.multiplier, 0);
  const totalScore = emScore + otherScore;
  const redFlags: string[] = [];

  if (emSteps >= 5 && emSteps >= otherSteps * 5) {
    redFlags.push(`Em có ${emSteps} lượt cố gắng, còn Ai Đó có ${otherSteps} lượt — chênh lệch tần suất rõ rệt.`);
  }
  if (messageStatus === "IGNORED" || messageStatus === "SEEN_NO_REPLY") {
    redFlags.push("Tin nhắn không được phản hồi; nên xem lại cách giao tiếp và ranh giới.");
  }

  return {
    emSteps,
    otherSteps,
    emScore,
    otherScore,
    totalScore,
    emPercent: totalScore > 0 ? (emScore / totalScore) * 100 : 0,
    otherPercent: totalScore > 0 ? (otherScore / totalScore) * 100 : 0,
    redFlags,
  };
}

/**
 * One relationship phase at a time. No conflicting isDating/isLoved booleans.
 * The exercise slide's prose and example code disagree on names; this project
 * follows the four phase names explicitly required by the prose.
 */
export type RelationshipPhase =
  | "STRANGERS"
  | "DATING_NO_LOVE"
  | "COMMITTED"
  | "SELF_RESPECT_EXIT";

export type EffortActor = "EM" | "AI_DO";
export type ReplyStatus =
  | "IDLE"
  | "WAITING"
  | "REPLIED"
  | "IGNORED"
  | "SEEN_NO_REPLY";

export interface EffortSignal {
  readonly id: number;
  readonly actor: EffortActor;
  readonly steps: number;
  readonly multiplier: number;
  readonly timestamp: number;
}

export interface HistoryEntry {
  readonly id: number;
  readonly timestamp: number;
  readonly description: string;
}

export interface MessageState {
  readonly status: ReplyStatus;
  readonly requestId: number;
  readonly sentAt: number | null;
}

export interface RelationshipState {
  readonly phase: RelationshipPhase;
  readonly efforts: readonly EffortSignal[];
  readonly history: readonly HistoryEntry[];
  readonly message: MessageState;
  readonly notice: string;
  readonly noticeTone: "info" | "success" | "warning";
  readonly nextId: number;
}

export type RelationshipAction =
  | { readonly type: "START_DATING"; readonly at: number }
  | { readonly type: "COMMIT"; readonly at: number }
  | { readonly type: "EXIT"; readonly at: number }
  | { readonly type: "SWITCH_TO_OTHER"; readonly at: number }
  | { readonly type: "RESET"; readonly at: number }
  | { readonly type: "LOAD_DEMO"; readonly at: number }
  | {
      readonly type: "LOG_EFFORT";
      readonly actor: EffortActor;
      readonly steps: number;
      readonly at: number;
    }
  | { readonly type: "SEND_MESSAGE"; readonly at: number }
  | { readonly type: "RECEIVE_REPLY"; readonly at: number }
  | { readonly type: "IGNORE_MESSAGE"; readonly at: number }
  | {
      readonly type: "MESSAGE_TIMEOUT";
      readonly requestId: number;
      readonly at: number;
    };

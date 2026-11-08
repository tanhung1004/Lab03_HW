import type {
  EffortActor,
  RelationshipAction,
  RelationshipPhase,
  RelationshipState,
} from "../types/relationship";

/** Deliberately asymmetric weights from the exercise: 100 * 0.1 vs 1 * 50. */
export const EFFORT_WEIGHTS: Readonly<Record<EffortActor, number>> = {
  EM: 0.1,
  AI_DO: 50,
};

export const PHASE_LABELS: Readonly<Record<RelationshipPhase, string>> = {
  STRANGERS: "Người dưng",
  DATING_NO_LOVE: "Hẹn hò nhưng không yêu",
  COMMITTED: "Tình yêu rõ ràng",
  SELF_RESPECT_EXIT: "Chọn bản thân",
};

const ALLOWED_TRANSITIONS: Readonly<
  Record<RelationshipPhase, readonly RelationshipPhase[]>
> = {
  STRANGERS: ["DATING_NO_LOVE"],
  DATING_NO_LOVE: ["COMMITTED", "SELF_RESPECT_EXIT"],
  COMMITTED: ["SELF_RESPECT_EXIT"],
  SELF_RESPECT_EXIT: ["STRANGERS"],
};

export function canTransition(
  from: RelationshipPhase,
  to: RelationshipPhase
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function createInitialState(): RelationshipState {
  return {
    phase: "STRANGERS",
    efforts: [],
    history: [],
    message: { status: "IDLE", requestId: 0, sentAt: null },
    notice: "Bắt đầu hành trình để khám phá những trạng thái rõ ràng.",
    noticeTone: "info",
    nextId: 1,
  };
}

function record(
  state: RelationshipState,
  at: number,
  description: string,
  notice: string,
  noticeTone: RelationshipState["noticeTone"] = "info"
): RelationshipState {
  return {
    ...state,
    history: [
      { id: state.nextId, timestamp: at, description },
      ...state.history,
    ].slice(0, 25),
    nextId: state.nextId + 1,
    notice,
    noticeTone,
  };
}

function transition(
  state: RelationshipState,
  to: RelationshipPhase,
  at: number,
  description: string,
  notice: string
): RelationshipState {
  if (!canTransition(state.phase, to)) return state;
  return record(
    { ...state, phase: to, message: { ...state.message, status: "IDLE" } },
    at,
    description,
    notice,
    to === "SELF_RESPECT_EXIT" ? "success" : "info"
  );
}

/** Pure reducer: every action returns a new state without mutating prior logs. */
export function relationshipReducer(
  state: RelationshipState,
  action: RelationshipAction
): RelationshipState {
  switch (action.type) {
    case "START_DATING":
      return transition(
        state, "DATING_NO_LOVE", action.at,
        "Bắt đầu một mối quan hệ chưa rõ tên.",
        "Đang tìm hiểu. Hãy quan sát sự cân bằng nỗ lực."
      );

    case "COMMIT":
      return transition(
        state, "COMMITTED", action.at,
        "Cả hai thống nhất một cam kết rõ ràng.",
        "Trạng thái COMMITTED — không còn tình trạng mập mờ."
      );

    case "EXIT":
      return transition(
        state, "SELF_RESPECT_EXIT", action.at,
        "Đã chủ động rời mối quan hệ.",
        "SELF_RESPECT_EXIT — đặt sự rõ ràng và giới hạn lên trước."
      );

    case "SWITCH_TO_OTHER":
      return transition(
        state, "SELF_RESPECT_EXIT", action.at,
        "Xuất hiện 'Ai Đó': hủy mọi tin nhắn đang chờ và rời khỏi vòng lặp.",
        "Đã hủy yêu cầu đang chờ khi chuyển sang 'Ai Đó'."
      );

    case "RESET": {
      const initial = createInitialState();
      return record(
        { ...initial, message: { ...initial.message, requestId: state.message.requestId + 1 } },
        action.at,
        "Đã reset toàn bộ trạng thái và nhật ký.",
        "Đã bắt đầu một phiên phân tích mới."
      );
    }

    case "LOAD_DEMO": {
      // Each log stores input steps and multiplier. The aggregate is derived.
      const demo: RelationshipState = {
        ...createInitialState(),
        phase: "DATING_NO_LOVE",
        efforts: [
          { id: 1, actor: "EM", steps: 100, multiplier: EFFORT_WEIGHTS.EM, timestamp: action.at },
          { id: 2, actor: "AI_DO", steps: 1, multiplier: EFFORT_WEIGHTS.AI_DO, timestamp: action.at },
        ],
        message: { status: "IDLE", requestId: state.message.requestId + 1, sentAt: null },
        nextId: 3,
      };
      return record(
        demo, action.at,
        "Nạp ví dụ: Em cố 100 lần (×0.1), Ai Đó cố 1 lần (×50).",
        "100 × 0.1 = 10, còn 1 × 50 = 50. Không được đếm số lần như điểm tương đương."
      );
    }

    case "LOG_EFFORT": {
      if (
        state.phase !== "DATING_NO_LOVE" &&
        state.phase !== "COMMITTED"
      ) return state;
      if (!Number.isInteger(action.steps) || action.steps < 1 || action.steps > 1000)
        return state;

      const multiplier = EFFORT_WEIGHTS[action.actor];
      const next: RelationshipState = {
        ...state,
        efforts: [
          ...state.efforts,
          {
            id: state.nextId,
            actor: action.actor,
            steps: action.steps,
            multiplier,
            timestamp: action.at,
          },
        ],
        nextId: state.nextId + 1,
      };
      return record(
        next, action.at,
        `${action.actor === "EM" ? "Em" : "Ai Đó"} thực hiện ${action.steps} lần (×${multiplier}).`,
        "Đã thêm nỗ lực vào nhật ký bất biến."
      );
    }

    case "SEND_MESSAGE": {
      if (
        state.phase !== "DATING_NO_LOVE" &&
        state.phase !== "COMMITTED"
      ) return state;
      if (state.message.status === "WAITING") return state;
      const next: RelationshipState = {
        ...state,
        message: {
          status: "WAITING",
          requestId: state.message.requestId + 1,
          sentAt: action.at,
        },
      };
      return record(next, action.at, "Đã gửi tin nhắn, chờ phản hồi tối đa 5 giây.",
        "Đã gửi! Đếm ngược 5 giây để chờ phản hồi.");
    }

    case "RECEIVE_REPLY": {
      if (state.message.status !== "WAITING") return state;
      return record(
        { ...state, message: { ...state.message, status: "REPLIED" } },
        action.at,
        "Đã nhận phản hồi trước khi hết giờ.",
        "Đã rep! Bộ hẹn giờ đã bị hủy.", "success"
      );
    }

    case "IGNORE_MESSAGE": {
      if (state.message.status !== "WAITING") return state;
      return record(
        { ...state, message: { ...state.message, status: "IGNORED" } },
        action.at,
        "Tin nhắn bị bỏ qua; hủy promise chờ phản hồi.",
        "RED FLAG: tin nhắn bị phớt lờ. Đã hủy bộ hẹn giờ.", "warning"
      );
    }

    case "MESSAGE_TIMEOUT": {
      if (
        state.message.status !== "WAITING" ||
        state.message.requestId !== action.requestId
      ) return state;
      return record(
        { ...state, message: { ...state.message, status: "SEEN_NO_REPLY" } },
        action.at,
        "Đã đủ 5 giây mà vẫn Seen không rep.",
        "RED FLAG: Seen không rep sau 5 giây.", "warning"
      );
    }
  }
}

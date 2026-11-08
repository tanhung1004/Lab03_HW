import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  createInitialState,
  relationshipReducer,
} from "../domain/relationshipMachine";
import type { EffortActor } from "../types/relationship";

export const REPLY_TIMEOUT_MS = 5000;

/** An abortable Promise: cancellation removes the timer and listener. */
function delayWithAbort(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Canceled", "AbortError"));
      return;
    }

    const onAbort = () => {
      window.clearTimeout(timeoutId);
      signal.removeEventListener("abort", onAbort);
      reject(new DOMException("Canceled", "AbortError"));
    };

    const timeoutId = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export function useRelationshipMachine() {
  const [state, dispatch] = useReducer(relationshipReducer, undefined, createInitialState);
  const [remainingMs, setRemainingMs] = useState(REPLY_TIMEOUT_MS);
  const abortRef = useRef<AbortController | null>(null);

  const abortPending = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => {
    if (state.message.status !== "WAITING" || state.message.sentAt === null) {
      setRemainingMs(REPLY_TIMEOUT_MS);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = state.message.requestId;
    const deadline = state.message.sentAt + REPLY_TIMEOUT_MS;

    const updateRemaining = () => {
      setRemainingMs(Math.max(0, deadline - Date.now()));
    };
    updateRemaining();
    const tickId = window.setInterval(updateRemaining, 100);

    void delayWithAbort(Math.max(0, deadline - Date.now()), controller.signal)
      .then(() => {
        if (!controller.signal.aborted) {
          dispatch({ type: "MESSAGE_TIMEOUT", requestId, at: Date.now() });
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Reply timer failed", error);
        }
      });

    return () => {
      controller.abort();
      window.clearInterval(tickId);
      if (abortRef.current === controller) abortRef.current = null;
    };
  }, [state.message.status, state.message.requestId, state.message.sentAt]);

  // Cleanup of useEffect also covers React StrictMode and unmount.
  return {
    state,
    remainingMs,
    startDating: () => dispatch({ type: "START_DATING", at: Date.now() }),
    commit: () => { abortPending(); dispatch({ type: "COMMIT", at: Date.now() }); },
    exit: () => { abortPending(); dispatch({ type: "EXIT", at: Date.now() }); },
    switchToOther: () => {
      abortPending();
      dispatch({ type: "SWITCH_TO_OTHER", at: Date.now() });
    },
    reset: () => { abortPending(); dispatch({ type: "RESET", at: Date.now() }); },
    loadDemo: () => { abortPending(); dispatch({ type: "LOAD_DEMO", at: Date.now() }); },
    logEffort: (actor: EffortActor, steps: number) => {
      dispatch({ type: "LOG_EFFORT", actor, steps, at: Date.now() });
    },
    sendMessage: () => { abortPending(); dispatch({ type: "SEND_MESSAGE", at: Date.now() }); },
    receiveReply: () => {
      abortPending();
      dispatch({ type: "RECEIVE_REPLY", at: Date.now() });
    },
    ignoreMessage: () => {
      abortPending();
      dispatch({ type: "IGNORE_MESSAGE", at: Date.now() });
    },
  };
}

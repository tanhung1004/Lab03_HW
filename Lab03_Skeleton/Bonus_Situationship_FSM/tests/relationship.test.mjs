import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransition,
  createInitialState,
  EFFORT_WEIGHTS,
  relationshipReducer,
} from "../src/domain/relationshipMachine.ts";
import { deriveEffortMetrics } from "../src/domain/effortAnalysis.ts";

const at = 1_700_000_000_000;
const dispatch = (s, type, extra = {}) => relationshipReducer(s, { type, at, ...extra });

test("initial FSM has exactly one phase and no contradictory booleans", () => {
  const s = createInitialState();
  assert.equal(s.phase, "STRANGERS");
  assert.equal(s.message.status, "IDLE");
  assert.equal(s.efforts.length, 0);
  assert.equal("isDating" in s, false);
  assert.equal("isLoved" in s, false);
});

test("valid phase transitions and forbidden jumps", () => {
  assert.equal(canTransition("STRANGERS", "COMMITTED"), false);
  assert.equal(canTransition("STRANGERS", "DATING_NO_LOVE"), true);
  const start = createInitialState();
  assert.equal(dispatch(start, "COMMIT"), start, "No instant commitment from strangers");
  const dating = dispatch(start, "START_DATING");
  assert.equal(dating.phase, "DATING_NO_LOVE");
  const official = dispatch(dating, "COMMIT");
  assert.equal(official.phase, "COMMITTED");
  const left = dispatch(official, "EXIT");
  assert.equal(left.phase, "SELF_RESPECT_EXIT");
  assert.equal(dispatch(left, "START_DATING"), left, "Cannot date from exit phase");
  assert.equal(dispatch(left, "RESET").phase, "STRANGERS");
});

test("effort is asymmetric, derived, and action logs remain immutable", () => {
  const dating = dispatch(createInitialState(), "START_DATING");
  const a = dispatch(dating, "LOG_EFFORT", { actor: "EM", steps: 100 });
  const b = dispatch(a, "LOG_EFFORT", { actor: "AI_DO", steps: 1 });
  assert.equal(EFFORT_WEIGHTS.EM, 0.1);
  assert.equal(EFFORT_WEIGHTS.AI_DO, 50);
  const metrics = deriveEffortMetrics(b.efforts, b.message.status);
  assert.equal(metrics.emScore, 10);
  assert.equal(metrics.otherScore, 50);
  assert.equal(metrics.totalScore, 60);
  assert.equal(metrics.emSteps, 100);
  assert.equal(metrics.otherSteps, 1);
  assert.ok(metrics.redFlags.length > 0);
  assert.equal(a.efforts.length, 1, "Previous immutable state is untouched");
  assert.notEqual(b.efforts, a.efforts);
  assert.notEqual(b.history, a.history);
  assert.equal(dispatch(a, "LOG_EFFORT", { actor: "EM", steps: -2 }), a);
  assert.equal(dispatch(a, "LOG_EFFORT", { actor: "EM", steps: 1.5 }), a);
});

test("demo fills two independent effort signals with correct weights", () => {
  const s = dispatch(createInitialState(), "LOAD_DEMO");
  assert.equal(s.phase, "DATING_NO_LOVE");
  assert.equal(s.efforts.length, 2);
  const m = deriveEffortMetrics(s.efforts, "IDLE");
  assert.deepEqual([m.emScore, m.otherScore], [10, 50]);
});

test("timeout only changes a matching pending message token", () => {
  const dating = dispatch(createInitialState(), "START_DATING");
  const waiting = dispatch(dating, "SEND_MESSAGE");
  assert.equal(waiting.message.status, "WAITING");
  const wrong = dispatch(waiting, "MESSAGE_TIMEOUT", { requestId: 999 });
  assert.equal(wrong, waiting);
  const ghosted = dispatch(waiting, "MESSAGE_TIMEOUT", { requestId: waiting.message.requestId });
  assert.equal(ghosted.message.status, "SEEN_NO_REPLY");
  assert.equal(deriveEffortMetrics(ghosted.efforts, ghosted.message.status).redFlags.length, 1);
  assert.equal(dispatch(ghosted, "RECEIVE_REPLY"), ghosted);
});

test("receiving or ignoring response invalidates delayed timeout", () => {
  const dating = dispatch(createInitialState(), "START_DATING");
  const waiting = dispatch(dating, "SEND_MESSAGE");
  for (const action of ["RECEIVE_REPLY", "IGNORE_MESSAGE"]) {
    const done = dispatch(waiting, action);
    const stale = dispatch(done, "MESSAGE_TIMEOUT", { requestId: waiting.message.requestId });
    assert.equal(stale, done);
    assert.equal(done.message.status, action === "RECEIVE_REPLY" ? "REPLIED" : "IGNORED");
  }
});

test("switch to Ai Đó exits and invalidates an in-flight message", () => {
  const dating = dispatch(createInitialState(), "START_DATING");
  const pending = dispatch(dating, "SEND_MESSAGE");
  const exit = dispatch(pending, "SWITCH_TO_OTHER");
  assert.equal(exit.phase, "SELF_RESPECT_EXIT");
  assert.equal(exit.message.status, "IDLE");
  const stale = dispatch(exit, "MESSAGE_TIMEOUT", { requestId: pending.message.requestId });
  assert.equal(stale, exit);
});

test("phase guards disallow messaging and effort while strangers", () => {
  const start = createInitialState();
  assert.equal(dispatch(start, "SEND_MESSAGE"), start);
  assert.equal(dispatch(start, "LOG_EFFORT", { actor: "EM", steps: 1 }), start);
});

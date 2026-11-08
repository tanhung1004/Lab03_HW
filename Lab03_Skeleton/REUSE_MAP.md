# Lab 02 → Lab 03 Reuse Map

This file is a planning reference. **No Lab 02 implementation files have been copied into this skeleton yet.** We will inspect and transfer code together when the relevant homework step starts.

| Lab 03 target | Lab 02 source to review | Planned use |
|---|---|---|
| HW1 Drum Kit | `HW1/src/` (React + TypeScript patterns, keyboard/focus and accessibility work) | Reuse suitable React setup and accessibility techniques; do not reuse the DataGrid UI as the drum kit. |
| HW2 Piano | `HW2/src/audio-engine.ts`, `HW2/src/audio-queue-controller.ts`, `HW2/src/audio-visualizer.ts` | Review audio context, queue, and visualization logic; adapt to piano notes, polyphony, FIFO voice stealing, and React lifecycle. |
| HW3 PUBG Arena | `HW3/src/anti-drift-timer.ts`, `HW3/src/inventory-state-machine.ts`, `HW3/src/order-queue.ts`, `HW3/src/race-condition-test.ts` | Review timer and inventory/concurrency logic; adapt to the airdrop countdown, claim/rollback, and arena requirements. |
| HW3 audit | `HW3/AI_FAILURE_AUDIT.md` | Review its structure and document only real, reproducible AI-related bugs in the new project. |

## Reuse rule

Before copying a module:
1. Read the complete source file.
2. Identify dependencies and assumptions.
3. Compare it with the Lab 03 requirement.
4. Copy only if it is genuinely reusable.
5. Test the copied/adapted module and record any regression.

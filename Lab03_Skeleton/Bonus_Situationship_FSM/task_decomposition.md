# Bonus — Task Decomposition & Verification

## Implementation

- [x] B01 — Define one strict RelationshipPhase union and allowed state transitions.
- [x] B02 — Implement a pure reducer with guarded actions; avoid Boolean soup.
- [x] B03 — Store effort signals and action history immutably.
- [x] B04 — Derive weighted scores and red flags from immutable logs; 100×0.1 vs 1×50.
- [x] B05 — Implement 5-second Seen-No-Reply timer in useEffect using AbortController.
- [x] B06 — Cancel pending promises on reply, ignore, phase change and unmount.
- [x] B07 — Add useId labels, output role=status aria-live=polite, focus-visible controls.
- [x] B08 — Build responsive single-column layout for 375px screens.
- [x] B09 — Include pure reducer and metrics unit tests.

## Automated verification

- [ ] `npm test` passes in developer environment.
- [ ] `npm run build` passes in developer environment.

## Manual regression

- [ ] Demo 100 vs 1 shows weighted scores 10 vs 50.
- [ ] Invalid FSM jumps are blocked.
- [ ] Message timeout produces a red flag after 5 seconds.
- [ ] Reply/ignore before timeout prevents stale timeout mutation.
- [ ] Switch to Ai Đó cancels pending timer, transitions to exit.
- [ ] Reset clears logs and cancels stale messages.
- [ ] 375px mobile and keyboard navigation pass.
- [ ] Lighthouse report captured with actual scores, if required.

## Notes

The assignment slide's prose and code sample use inconsistent phase names. This implementation follows the prose: STRANGERS / DATING_NO_LOVE / COMMITTED / SELF_RESPECT_EXIT.

## Suggested commit

`feat(bonus): implement situationship finite state machine`

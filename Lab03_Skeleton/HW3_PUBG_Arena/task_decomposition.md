
# HW3 — Task Decomposition

## Goal
Build a React 19 PUBG Vietnam Arena with an anti-drift timer,
optimistic claim handling, leaderboard and AI Failure Audit.

## Tasks

- [ ] HW3-01: Review Lab 02 timer, inventory and virtual list code.
- [ ] HW3-02: Define PUBG domain types and mock data.
- [ ] HW3-03: Build responsive esports dashboard UI.
- [ ] HW3-04: Implement usePubgAirdropTimer.
- [ ] HW3-05: Handle visibilitychange and timer synchronization.
- [ ] HW3-06: Implement optimistic crate/ticket claiming.
- [ ] HW3-07: Add duplicate-request prevention using claimId lock.
- [ ] HW3-08: Implement rollback when the server returns HTTP 409.
- [ ] HW3-09: Build PUBG Vietnam leaderboard.
- [ ] HW3-10: Implement leaderboard sorting, filtering and kill feed.
- [ ] HW3-11: Test concurrency, countdown and inventory consistency.
- [ ] HW3-12: Document at least 3 verified AI failures and fixes.

## Definition of Done
- Countdown stays accurate after background tab throttling.
- Claiming updates inventory optimistically.
- Duplicate claims are prevented.
- HTTP 409 restores consistent inventory.
- Leaderboard filtering and sorting work.
- AI_FAILURE_AUDIT.md contains at least 3 real findings.
- Tests pass and each completed task is committed.

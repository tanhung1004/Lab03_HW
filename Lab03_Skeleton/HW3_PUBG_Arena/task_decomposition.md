
# HW3 — Task Decomposition

## Goal
Build a React 19 PUBG Vietnam Arena with an anti-drift timer,
optimistic claim handling, leaderboard and AI Failure Audit.

## Tasks

- [x] HW3-01: Review Lab 02 timer, inventory and virtual list code.
- [x] HW3-02: Define PUBG domain types and mock data.
- [x] HW3-03: Build responsive esports dashboard UI.
- [x] HW3-04: Implement usePubgAirdropTimer.
- [x] HW3-05: Handle visibilitychange and timer synchronization.
- [x] HW3-06: Implement optimistic crate/ticket claiming.
- [x] HW3-07: Add duplicate-request prevention using claimId lock.
- [x] HW3-08: Implement rollback when the server returns HTTP 409.
- [x] HW3-09: Build PUBG Vietnam leaderboard.
- [x] HW3-10: Implement leaderboard sorting, filtering and kill feed.
- [x] HW3-11: Test concurrency, countdown and inventory consistency.
- [x] HW3-12: Document at least 3 verified AI failures and fixes.

## Definition of Done
- Countdown stays accurate after background tab throttling.
- Claiming updates inventory optimistically.
- Duplicate claims are prevented.
- HTTP 409 restores consistent inventory.
- Leaderboard filtering and sorting work.
- AI_FAILURE_AUDIT.md contains at least 3 real findings.
- Tests pass and each completed task is committed.


## HW3-01 — Lab 02 Code Reuse Review

### Goal
Reuse existing Lab 02 logic to develop
the PUBG Vietnam Arena.

### Reusable Modules

1. Anti-Drift Timer
   - Source: Lab 02 HW3
   - Reuse timestamp-based countdown logic.
   - Adapt to usePubgAirdropTimer.
   - Add visibilitychange synchronization.

2. Inventory State Machine
   - Source: Lab 02 HW3
   - Reuse optimistic inventory updates.
   - Adapt to PUBG ticket and crate claiming.
   - Handle HTTP 409 conflict rollback.

3. Virtual Scroller
   - Reference: Lab 02 Slide 22
   - Apply to leaderboard or kill feed if needed.
   - Verify original implementation before reuse.

4. AI Failure Audit
   - Reuse Lab 02 documentation approach.
   - Record at least 3 verified AI-generated bugs.
   - Include reproduction, root cause and fixes.

### Next Task
HW3-02 — Define PUBG domain types and mock data.


## HW3-02 — PUBG Domain Types & Mock Data

### Implementation
- Defined DropPhase union type.
- Defined PubgCrateDrop interface.
- Defined PubgVnSquadStanding interface.
- Created 3 mock ticket/crate items.
- Created 4 mock PUBG Vietnam squads.
- Used readonly fields for safer state management.

### Verification
- TypeScript build: PASS
- Mock crates: 3
- Mock squads: 4
- Unique identifiers: PASS
- Data validation: PASS

### Notes
- Prices, standings, and stock are fictional demo data.
- Drop timestamps currently reset on page reload.
- Backend-driven timestamps will be considered later.

### Next Task
HW3-03 — Build Responsive PUBG Arena Dashboard.

## HW3-03 — Responsive Arena Dashboard

### Implemented
- PUBG Vietnam Arena hero section.
- Crate and ticket cards using mock data.
- Vietnamese currency formatting.
- Squad leaderboard with computed total points.
- Responsive desktop and mobile layout.
- PUBG background image.

### Deferred Features
- Live countdown: HW3-04 / HW3-05
- Claim and rollback: HW3-06 to HW3-08
- Leaderboard sorting/filtering: HW3-10


## HW3-06 — Drop Phase State Machine

### Implementation
- Implemented four DropPhase states.
- WARMUP before opening time.
- AIRDROP_LIVE during active event with stock.
- LOOTED_OUT when stock reaches zero.
- EXPIRED when the event window closes.
- Defined a 15-minute demo live window.
- Integrated dynamic status into reward cards.
- Kept Claim disabled until the claim workflow task.

### Verification
- WARMUP transition: PASS
- AIRDROP_LIVE transition: PASS
- LOOTED_OUT transition: PASS
- EXPIRED transition: PASS
- Production build: PASS

### Known Limitations
- Stock is still mock data.
- Drop deadlines reset on page reload.
- The 15-minute window is a demo assumption.

### Next Task
HW3-07 — Optimistic Claim & Inventory Update.


## HW3-07 — Optimistic Claim & Inventory Update

### Implementation
- Enabled Claim button during AIRDROP_LIVE.
- Used React state for local inventory.
- Decreased stock immediately after clicking Claim.
- Simulated asynchronous confirmation (800ms).
- Added an in-flight Set to block duplicate requests.
- Disabled Claim while the request is pending.
- Preserved separate inventory for each crate.
- Prevented stock from becoming negative.

### Verification
- LIVE claim is enabled: PASS
- Immediate inventory update: PASS
- Duplicate in-flight request blocked: PASS
- Pending state displayed: PASS
- Other crate inventory unchanged: PASS
- Production build: PASS

### Known Limitations
- Claim confirmation is currently simulated.
- Stock is only maintained in browser memory.
- Reloading resets mock inventory.
- No cross-user inventory synchronization.
- No simulated HTTP 409 conflict yet.
- No per-user claim limit yet.

### Next Task
HW3-08 — HTTP 409 Conflict & Optimistic Rollback.


## HW3-08 — HTTP 409 Conflict & Optimistic Rollback

### Implementation
- Created an in-memory Mock Claim API.
- Simulated 800ms network latency.
- Implemented MockHttpError with status 409.
- Added a checkbox to force conflict responses.
- Preserved immediate optimistic stock updates.
- Restored stock after simulated conflict.
- Synchronized stock with mock server responses.
- Preserved per-crate in-flight request locking.
- Displayed success and error feedback.

### Verification
- Successful claim: PASS
- Forced 409 response: PASS
- Optimistic rollback: PASS
- Duplicate pending request blocked: PASS
- Retry after conflict: PASS
- Production build: PASS

### Limitations
- No real HTTP backend.
- Mock inventory exists only within one browser tab.
- No cross-tab or cross-user atomic transactions.
- Refreshing the page resets demo inventory.

### Next Task
HW3-09 — Concurrency & Oversell Prevention Tests.


## HW3-09 — Concurrency & Oversell Prevention Tests

### Implementation
- Refactored Mock Claim API into independent instances.
- Preserved the original requestClaim interface.
- Created isolated concurrency test scenarios.
- Used Promise.allSettled for concurrent requests.
- Validated successful and rejected claims.
- Ensured stock never becomes negative.
- Added a Concurrency Test Lab to the dashboard.

### Test Scenarios
- 10 requests / stock 1: 1 success, 9 conflicts.
- 10 requests / stock 3: 3 successes, 7 conflicts.
- 10 requests / stock 0: 0 successes, 10 conflicts.
- 2 requests / stock 5: 2 successes, 0 conflicts.

### Verification
- All four test scenarios: PASS
- Overselling prevented in mock runtime: PASS
- Main application inventory unchanged: PASS
- Production build: PASS

### Limitations
- Tests use one JavaScript runtime only.
- Mock servers do not share inventory across tabs.
- No real HTTP or database transaction.
- Production oversell prevention requires
  atomic database operations.

### Next Task
HW3-10 — Leaderboard Filtering and Sorting.


## HW3-10 — Leaderboard Filtering & Sorting

### Implementation
- Implemented squad name filtering.
- Added case-insensitive search.
- Added sorting by Total Points.
- Added WWCD, Placement and Kill sorting.
- Added alphabetical squad name sorting.
- Supported ascending and descending order.
- Added dynamic ranking and result counts.
- Added empty search result feedback.
- Preserved previous Claim and Concurrency features.

### Verification
- Squad search: PASS
- Case-insensitive matching: PASS
- Total Points sorting: PASS
- Numeric metric sorting: PASS
- Ascending/descending: PASS
- Empty results: PASS
- Existing features regression: PASS
- Production build: PASS

### Next Task
HW3-11 — Virtual Scroller for Leaderboard.


## HW3-11 — Virtualized Squad Leaderboard

### Implementation
- Extracted leaderboard into SquadLeaderboard component.
- Implemented fixed-height virtual scrolling.
- Used viewport-based start/end row indices.
- Added overscan to improve scrolling continuity.
- Preserved searching and sorting.
- Added 1,000-squad stress test mode.
- Preserved original 4-squad demo mode.
- Supported horizontal scrolling on mobile.

### Verification
- Production build: PASS
- Default squad list: PASS
- 1,000-row stress mode: PASS
- Rendered DOM rows significantly reduced: PASS
- Scroll to final rows: PASS
- Filtering and sorting: PASS
- Existing claim and concurrency features: PASS

### Limitations
- Virtualization assumes fixed 52px row height.
- Stress-test squads are fictional.
- All records are still filtered and sorted in memory.
- This is not server-side pagination.

### Next Task
HW3-12 — Final QA, Accessibility and AI Failure Audit.


## HW3-12 — Final QA & AI Failure Audit

### Scope
- Verify all existing features.
- Check mobile responsiveness at 375px.
- Review keyboard accessibility.
- Run Chrome Lighthouse.
- Complete AI_FAILURE_AUDIT.md.
- Confirm clean build and Git status.

### Verification
- Production build: PENDING
- Countdown and phase logic: PENDING
- Optimistic Claim and rollback: PENDING
- Concurrency tests: PENDING
- Leaderboard search/sort: PENDING
- Virtual scrolling: PENDING
- Mobile responsiveness: PENDING
- Lighthouse: PENDING
- Three verified AI failures: PENDING

### Known Limitations
- In-memory Mock Claim API.
- No cross-tab inventory synchronization.
- Demo event timestamps may reset on reload.
- Fixed-height virtual scrolling.

### Completion Criteria
Mark HW3-12 complete only after:
1. All required tests pass.
2. Three genuine AI failures are documented.
3. Changes are committed and pushed.
```

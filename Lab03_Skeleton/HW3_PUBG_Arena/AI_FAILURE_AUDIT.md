# AI Failure Audit – HW3

This is a blank evidence log. Do not fill it with invented bugs. Add an entry only after an AI-generated suggestion or code change causes a reproducible issue.

## Audit entry template

### AI Bug #1 – [Short title]
- **AI-generated suggestion/code:**
- **Expected behavior:**
- **Actual behavior:**
- **Steps to reproduce:**
- **Root cause:**
- **Fix applied:**
- **Regression test / evidence:**

### AI Bug #2 – [Short title]
- **AI-generated suggestion/code:**
- **Expected behavior:**
- **Actual behavior:**
- **Steps to reproduce:**
- **Root cause:**
- **Fix applied:**
- **Regression test / evidence:**

### AI Bug #3 – [Short title]
- **AI-generated suggestion/code:**
- **Expected behavior:**
- **Actual behavior:**
- **Steps to reproduce:**
- **Root cause:**
- **Fix applied:**
- **Regression test / evidence:**


## AI Failure — Incorrect TSX Syntax in HW3-09

### AI-generated task
Implement optimistic Claim, HTTP 409 rollback,
and concurrency testing in App.tsx.

### Observed failure
VS Code reported a syntax error near line 457
inside the handleClaim callback.

### Impact
The frontend could not pass TypeScript compilation.

### Fix
Rewrote the handleClaim function with clearer
try/catch/finally blocks and corrected JSX structure.

### Verification
Run `npm run build` and confirm the error is resolved.

### Status
Pending verification.


# AI Failure Audit — Lab 03 HW3

## Project
PUBG Vietnam Arena

## Objective
Document real issues encountered when using
AI-generated code and development instructions.

Each issue must include:
- Context
- Observed failure
- Root cause
- Correction
- Verification result
- Evidence

---

## Failure 01 — Incorrect Hook File Name

### Context
AI generated the countdown hook for HW3-04
and HW3-05.

### Observed Failure
AI instructed the developer to use:
`src/hooks/usePubgAirdropTimer.ts`

However, the existing project skeleton contained:
`src/hooks/useAirdropTimer.ts`

The suggested file name did not match the
actual project structure.

### Root Cause
AI assumed a new file name instead of
following the existing skeleton.

### Correction
Used the existing file:
`src/hooks/useAirdropTimer.ts`

Updated the App.tsx import to:
`import { useAirdropTimer } from
"./hooks/useAirdropTimer";`

### Verification
Confirm the application imports the hook
successfully and TypeScript build passes.

### Evidence
VS Code screenshot showing the original
hooks directory and file name.

### Status
Corrected. Final build verification required.

---

## Failure 02 — Invalid App.tsx Syntax

### Context
AI generated the HW3-09 implementation,
including optimistic Claim, HTTP 409 rollback,
and concurrency testing.

### Observed Failure
VS Code reported a syntax error in App.tsx,
near line 457, inside the handleClaim code.

The editor showed an "expected" syntax error
around a closing bracket/parenthesis.

### Root Cause
The generated or copied TSX contained an
invalid syntax structure near the error location.

The exact token-level cause should be confirmed
against the original broken file.

### Impact
The code could not compile successfully.

### Correction
Replaced App.tsx with a revised implementation
containing clearly separated try/catch/finally
logic and valid JSX structure.

### Verification
Run:
`npm run build`

Confirm that the previous syntax error
does not appear.

### Evidence
VS Code screenshot of the original syntax error.

### Status
Revised. Confirm final build result.

---

## Failure 03 — Pending Real-World Verification

### Candidate Issue
Mock airdrop deadlines may reset after
refreshing the page.

### Code Under Review
`src/data/mockCrates.ts`

The demo uses:
`const demoStartMs = Date.now();`

### Reproduction Procedure
1. Open PUBG Vietnam Arena.
2. Note the remaining time on the first crate.
3. Wait approximately 30 seconds.
4. Refresh the page.
5. Compare the countdown before and after reload.

### Expected Behavior
For a persistent event, the countdown should
continue toward the same original deadline.

### Possible Failure
The application may generate a new deadline
when the page reloads.

### Assessment
The current implementation explicitly uses
session-based mock event times.

Classify this as an AI failure only if
the assignment requires the same deadline
to survive page reloads.

Otherwise, record it as a known demo limitation
and find another verified bug.

### Correction
Not applied yet.

### Verification
Pending manual reproduction.

### Status
NOT VERIFIED — DO NOT COUNT AS A FAILURE YET.

---

## Known Demo Limitations

- The Claim API is simulated in browser memory.
- HTTP 409 is a mock error, not a real network response.
- Inventory is not shared across browser tabs.
- No real database transaction is implemented.
- Stress-test squad statistics are fictional.
- Virtual scrolling assumes fixed-height rows.

---

## Final Regression Checklist

- [ ] TypeScript production build passes.
- [ ] Countdown and tab synchronization pass.
- [ ] All drop phases behave correctly.
- [ ] Optimistic Claim updates stock immediately.
- [ ] Simulated HTTP 409 restores inventory.
- [ ] All concurrency scenarios pass.
- [ ] Leaderboard search and sorting pass.
- [ ] Virtual scrolling passes 1,000-row test.
- [ ] Mobile layout passes at 375px.
- [ ] Keyboard accessibility is checked.
- [ ] Lighthouse results are recorded.
- [ ] At least 3 real AI failures are verified.

## Final Status
Pending final verification.

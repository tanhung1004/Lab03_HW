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

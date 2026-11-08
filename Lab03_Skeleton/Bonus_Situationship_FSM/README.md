# Lab 03 Bonus — Hẹn Hò Nhưng Không Yêu (Situationship FSM)

A self-contained **React 19 + TypeScript + Vite** bonus app that implements the assignment slide's `<SituationshipAnalyzer />` concept. All text and values are fictional academic demo examples, not real-life advice.

## 1. Installation

From `Lab03_HW/Lab03_Skeleton/Bonus_Situationship_FSM`:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173/`). If port 5173 is already occupied, use the URL Vite displays.

Production build:

```powershell
npm run build
```

Pure FSM tests (Node 22+):

```powershell
npm test
```

## 2. Features aligned to slide

- **Strict state machine:** `STRANGERS`, `DATING_NO_LOVE`, `COMMITTED`, `SELF_RESPECT_EXIT` — single `phase` union, no contradictory isDating/isLoved booleans.
- **Allowed transitions only:** STRANGERS → DATING_NO_LOVE → COMMITTED, or choose SELF_RESPECT_EXIT; RESET starts a fresh session.
- **Asymmetric effort:** `EM` weight `0.1`, `AI_DO` weight `50`, immutable `EffortSignal[]`, pure `deriveEffortMetrics`. Demo: `100 × 0.1 = 10`, `1 × 50 = 50`.
- **Ghosting timer:** send a message → 5-second timeout in a React effect; reply, ignore, switch phase, reset, or unmount cancel the pending asynchronous work with `AbortController`.
- **Accessibility:** inputs linked using `useId`, semantic buttons, `<output role="status" aria-live="polite">` for notifications, visible keyboard focus.
- **Responsive:** 3-column desktop dashboard becomes a single column on mobile, tested design breakpoint at 375px.
- **Auditable activity:** immutable action timeline and effort log.

### Note on naming discrepancy in slide

The exercise slide **prose** names `STRANGERS`, `DATING_NO_LOVE`, `COMMITTED`, `SELF_RESPECT_EXIT`, while its example code names `FRIENDS`, `DATING_NO_LOVE`, `OFFICIAL_LOVE`, `GHOSTED_EXIT`. This project intentionally follows the prose's four-state naming consistently. The two alternatives were **not** combined into 8 states.

## 3. Quick demonstration

1. Click **Thử kịch bản 100 vs 1**. The app loads 100 efforts from Em with ×0.1 and 1 effort from Ai Đó with ×50. Weighted score must show `10.0 vs 50.0`. The red-flag monitor should report an asymmetric frequency.
2. Click **Gửi tin nhắn**. Wait 5 seconds: status becomes `SEEN_NO_REPLY`, with an accessible warning.
3. Send again and click **✓ Đã rep** before 5 seconds: status becomes `REPLIED` and no later ghosting warning should appear from the old timeout.
4. Send again and click **Seen & bỏ qua** before 5 seconds: the pending timer is canceled and the status becomes `IGNORED`.
5. Click **Chuyển sang “Ai Đó”** during a pending message: state changes to `SELF_RESPECT_EXIT`, and old promises cannot update the new session.
6. Click **Bắt đầu lại ↺**. All effort logs disappear and phase returns to `STRANGERS`.
7. At 375px width in DevTools, check that the controls fit without page-wide horizontal scrolling. Use Tab/Enter/Space to navigate and activate controls.

## 4. Code layout

```text
Bonus_Situationship_FSM/
├── index.html
├── package.json
├── README.md
├── task_decomposition.md
├── tests/
│   └── relationship.test.mjs
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── style.css
    ├── components/
    │   ├── EffortLog.tsx
    │   └── RelationshipStatus.tsx
    ├── domain/
    │   ├── effortAnalysis.ts
    │   └── relationshipMachine.ts
    ├── hooks/
    │   └── useRelationshipMachine.ts
    └── types/
        └── relationship.ts
```

## 5. Git

Place this **folder only** alongside `HW1_DrumKit`, `HW2_Piano`, `HW3_PUBG_Arena`; do not nest it inside `HW3_PUBG_Arena`.

From `Bonus_Situationship_FSM` after successful local verification:

```powershell
git add .
git status
git commit -m "feat(bonus): implement situationship finite state machine"
git push origin main
```

Use `git status` to confirm that only the expected Bonus files are being committed. `node_modules` and `dist` must be excluded by the repository `.gitignore`.

## 6. Limitations

- The 5-second reply is simulated, not connected to a messaging provider.
- Effort weights are fictional and intentionally asymmetric per assignment.
- The red-flag indicator is an educational heuristic, not a diagnosis or counseling tool.
- Scores and logs are stored in current session's React memory and reset on refresh.
- Lighthouse/mobile manual verification should be performed on your computer; no fixed score is claimed.

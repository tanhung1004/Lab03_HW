
# HW1 — Task Decomposition

## Goal
Build an accessible Production Studio Drum Kit using React 19,
reusing accessibility and keyboard techniques from Lab 02.

## Tasks

- [x] HW1-01: Review Lab 02 HW1 and identify reusable code.
- [x] HW1-02: Initialize React components and drum pad data.
- [] HW1-03: Build responsive Drum Kit UI.
- [ ] HW1-04: Implement keyboard controls using event.code.
- [ ] HW1-05: Prevent key-repeat and ignore typing in input fields.
- [ ] HW1-06: Implement drum sounds using Web Audio API.
- [ ] HW1-07: Add accessible buttons and focus management.
- [ ] HW1-08: Implement visual hit history and decibel meter.
- [ ] HW1-09: Test keyboard, audio, accessibility and responsive UI.
- [ ] HW1-10: Run Lighthouse audit, fix issues and document results.

## Definition of Done
- All 7 drum pads work with keyboard and mouse.
- No repeated triggering when holding a key.
- Keyboard shortcuts do not interfere with text inputs.
- WCAG 2.2 AA requirements are checked.
- Lighthouse results are recorded.
- Bugs are documented and fixed.
- Completed tasks have meaningful Git commits.



## HW1-01 — Lab 02 Code Reuse Review

**Status:** Completed

### Reusable Components and Patterns

1. React Project Structure
   - Source: Lab02/HW1/src/main.tsx
   - Reuse the React 19 + TypeScript + Vite setup.

2. Keyboard Accessibility
   - Source: Lab02/HW1/src/components/DataGrid.tsx
   - Reuse keyboard event handling patterns.
   - Adapt them to physical key codes: W/A/S/D/J/K/L.

3. Focus Management
   - Source: Lab02/HW1/src/components/DataGrid.tsx
   - Reuse focus management principles.
   - Drum pads will use native buttons.

4. Accessibility Styling
   - Source: Lab02/HW1/src/style.css
   - Reuse focus-visible, responsive and
     reduced-motion techniques.

5. Semantic HTML and ARIA
   - Source: Lab02/HW1/src/App.tsx
   - Reuse semantic structure and ARIA principles.

### What Must Be Implemented in Lab 03

- DrumPad component.
- useDrumKeyboard hook using event.code.
- Anti-repeat keyboard guard.
- Input focus isolation.
- Drum audio engine.
- Visual hit history.
- Decibel meter.

### Conclusion

Lab 03 HW1 inherits accessibility techniques
from Lab 02 HW1 without copying the DataGrid
business logic.

Next Task: HW1-02 — Initialize drum pad structure.

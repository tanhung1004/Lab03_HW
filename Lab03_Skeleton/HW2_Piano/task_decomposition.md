
# HW2 — Task Decomposition

## Goal
Build an 88-key polyphonic piano with FIFO voice management,
React.memo optimization and asynchronous melody playback.

## Tasks

- [x] HW2-01: Review Lab 02 AudioTaskQueue and React.memo examples.
- [x] HW2-02: Define MIDI note and piano key data models.
- [x] HW2-03: Generate 88 piano keys algorithmically (A0–C8).
- [x] HW2-04: Build responsive piano keyboard UI.
- [x] HW2-05: Implement the Web Audio PolyphonicSynth.
- [x] HW2-06: Implement 8-voice polyphony and FIFO voice stealing.
- [x] HW2-07: Add ADSR-style gain ramp and audio cleanup.
- [x] HW2-08: Optimize PianoKey using React.memo.
- [x] HW2-09: Implement note recording and FIFO sequence storage.
- [x] HW2-10: Implement replay at 0.5x, 1x and 2x speeds.
- [ ] HW2-11: Implement AbortController cancellation and test.

## Definition of Done
- Exactly 88 keys are generated without hardcoding.
- Up to 8 notes can play simultaneously.
- The 9th note steals the oldest active voice.
- React Profiler confirms render isolation.
- Recording and replay work at three speeds.
- Stop cancels playback and cleans up active voices.
- Bugs and fixes are documented.
- Each completed task has a Git commit.


## HW2-01 — Lab 02 Code Reuse Analysis

**Status:** Completed

### 1. FIFO Queue Controller
Source: Lab02/HW2/src/audio-queue-controller.ts

Reusable:
- FIFO processing order.
- Queue management.
- Async/await and Promise handling.
- AbortController cancellation.
- Resource cleanup.

Adaptation:
- Replace audio download tasks with MIDI note events.
- Support asynchronous sequence replay.
- Manage cancellation on Stop/Unmount.

### 2. Web Audio Engine
Source: Lab02/HW2/src/audio-engine.ts

Reusable:
- AudioContext lifecycle management.
- Audio node connection and cleanup.
- Start/Stop principles.

Adaptation:
- Use OscillatorNode instead of AudioBufferSourceNode.
- Support up to 8 simultaneous voices.
- Implement FIFO voice stealing.

### 3. React.memo
Source: Lab02 Slide 21

Reusable:
- Component memoization principles.

Adaptation:
- Create 88 memoized PianoKey components.
- Prevent unrelated keys from re-rendering.
- Verify with React DevTools Profiler.

### Conclusion
Lab03 HW2 reuses Lab02 queue and audio lifecycle
principles, while implementing a new polyphonic
piano engine and MIDI-based sequencer.

Next: HW2-02 — Define MIDI Note Data Models.


## HW2-02 — MIDI Data Models

**Status:** Completed

### Implementation
- Defined PianoKeyData interface.
- Defined RecordedNote interface.
- Defined standard MIDI range (21–108).
- Added note name constants.
- Implemented MIDI-to-frequency calculation.

### Validation
- TypeScript build: PASS
- MIDI A4 reference frequency: 440 Hz
- Expected piano range: 88 keys

### Next Task
HW2-03 — Generate and display 88 piano keys.


## HW2-03 — Generate 88 Piano Keys

**Status:** Completed

### Implementation
- Generated piano keys algorithmically using Array.from().
- Supported MIDI range 21–108.
- Calculated note names and octave numbers.
- Calculated note frequency using equal temperament.
- Identified black and white keys.

### Test Results
- Total keys: 88
- White keys: 52
- Black keys: 36
- First note: A0
- Last note: C8
- A4 frequency: 440 Hz
- Build: PASS

### Next Task
HW2-04 — Build Responsive Piano Keyboard UI.

### HW2-06 — Test Results
- Maximum simultaneous voices: 8
- FIFO data structure: ES6 Map
- Ninth note steals oldest voice: PASS
- Voice cleanup: PASS
- TypeScript/Vite build: PASS


## HW2-07 — Gain Envelope & Audio Cleanup

### Implementation
- Added 15ms attack envelope.
- Added 40ms release envelope.
- Replaced abrupt FIFO stop with smooth voice release.
- Added audio node cleanup via oscillator.onended.
- Added AudioContext disposal.

### Test Results
- FIFO 9-note test: PASS
- Smooth voice release: PASS
- Voice cleanup: PASS
- Production build: PASS

### Next Task
HW2-08 — Optimize PianoKey using React.memo.

## HW2-08 — React.memo Optimization

### Implementation
- Memoized PianoKey component using React.memo.
- Added active key state using Set.
- Used useCallback for stable event handlers.
- Preserved 88-key layout and audio playback.

### Verification
- React DevTools Profiler: PASS
- Unchanged keys skip unnecessary renders.
- Audio playback: PASS
- FIFO 9-note test: PASS
- Production build: PASS

### Next Task
HW2-09 — Implement note recording and FIFO sequence storage.


## HW2-10 — Variable-Speed FIFO Replay

### Implementation
- Reused recorded FIFO note sequence.
- Implemented asynchronous playback using async/await.
- Supported 0.5x, 1.0x and 2.0x replay speeds.
- Adjusted note intervals and playback durations.
- Prevented overlapping replay sessions.
- Preserved existing FIFO voice stealing test.

### Verification
- 0.5x replay: PASS
- 1.0x replay: PASS
- 2.0x replay: PASS
- FIFO order preserved: PASS
- Production build: PASS

### Known Limitation
- Recorded note duration is currently fixed at 1500ms.
- Immediate replay cancellation will be added in HW2-11.

### Next Task
HW2-11 — AbortController cancellation and final testing.

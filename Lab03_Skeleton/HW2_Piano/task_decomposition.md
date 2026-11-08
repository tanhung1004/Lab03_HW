
# HW2 — Task Decomposition

## Goal
Build an 88-key polyphonic piano with FIFO voice management,
React.memo optimization and asynchronous melody playback.

## Tasks

- [x] HW2-01: Review Lab 02 AudioTaskQueue and React.memo examples.
- [x] HW2-02: Define MIDI note and piano key data models.
- [ ] HW2-03: Generate 88 piano keys algorithmically (A0–C8).
- [ ] HW2-04: Build responsive piano keyboard UI.
- [ ] HW2-05: Implement the Web Audio PolyphonicSynth.
- [ ] HW2-06: Implement 8-voice polyphony and FIFO voice stealing.
- [ ] HW2-07: Add ADSR-style gain ramp and audio cleanup.
- [ ] HW2-08: Optimize PianoKey using React.memo.
- [ ] HW2-09: Implement note recording and FIFO sequence storage.
- [ ] HW2-10: Implement replay at 0.5x, 1x and 2x speeds.
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

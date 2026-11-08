
# HW2 — Task Decomposition

## Goal
Build an 88-key polyphonic piano with FIFO voice management,
React.memo optimization and asynchronous melody playback.

## Tasks

- [ ] HW2-01: Review Lab 02 AudioTaskQueue and React.memo examples.
- [ ] HW2-02: Define MIDI note and piano key data models.
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

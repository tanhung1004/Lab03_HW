# Git Workflow

## Initial setup

Run from the `Lab03_Skeleton` root:

```bash
git init
git branch -M main
git add .
git commit -m "chore: initialize lab03 homework skeleton"
```

## Suggested branch names

- `feat/hw1-drum-kit-setup`
- `feat/hw1-drum-keyboard`
- `feat/hw1-drum-audio`
- `feat/hw2-piano-setup`
- `feat/hw3-pubg-setup`
- `fix/hw1-key-repeat`

Create a branch when we start a feature; do not create all branches in advance.

## Commit examples

```bash
git add .
git commit -m "chore(hw1): add drum kit project scaffold"
git commit -m "feat(hw1): add keyboard trigger mapping"
git commit -m "fix(hw1): prevent repeated key triggers"
```

Only use a `fix` commit after a real bug has been reproduced and fixed. Commit messages should describe work actually completed.

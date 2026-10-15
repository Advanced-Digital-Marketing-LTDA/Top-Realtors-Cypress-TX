---
name: adversarial-review
description: Run an adversarial self-review of the current diff before every push. Tries to break the change, verifies each finding, and fixes the confirmed ones.
---

# Adversarial review

Run this before every `git push`, after `npm run verify` passes.

1. Capture the change: `git diff origin/<base>...HEAD` plus any uncommitted changes, where `<base>` is the PR's base branch (default `main`).
2. Pass 1, attack: read the diff as a hostile reviewer. Look for wrong behavior, broken invariants in `AGENTS.md`, unescaped source text, weakened or skipped tests, new lint/type suppressions, and routes, citations or disclosures that changed without being asked for.
3. Pass 2, attack again with fresh eyes on what pass 1 missed: edge cases, failure paths, and anything the tests do not actually exercise.
4. Verify: for each finding, trace a concrete input or state that triggers it. Drop findings you cannot reproduce or trace.
5. Fix confirmed findings with the smallest change that resolves them. Do not widen scope.
6. Re-run `npm run verify` and report: findings, which were confirmed, what was fixed, and what was dropped and why.

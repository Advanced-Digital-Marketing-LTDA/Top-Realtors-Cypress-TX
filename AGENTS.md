# Top Realtors Cypress TX

Adapted from Site-Bootstrap-ADM 916df29d, with the user's explicit Astro correction taking precedence over the superseded Python export.

## Scope

Work only in this isolated target repository. `build/astro-sponsored-cypress` replaces the unpublished Python build; main is release. Commit verified work locally. New-branch push needs parent/root approval. No merge, deployment, DNS, production access, credentials or public reviewer messages are authorized.

## Scope discipline

Change only what I explicitly ask you to change. Never remove, restyle, or "clean up" anything else (design, images, animations, layout, code, settings). If I ask for a text rewrite, touch text only. Standard development steps the repo requires (tests, evidence, checks) are expected; this rule means never changing or removing existing work based on assumptions about what I meant.

## Website foundation

Astro 7/TypeScript 6, Node 24.19/npm 11.9, one lockfile. Source content lives in src/content; dist and .astro are generated and ignored. No Python build/runtime/generator scripts. No CMS, accounts, forms, APIs, database or tracking service unless selected in the approved plan.

## Verification

Run `npm ci`, `npm run verify`, `npm run test:e2e`, the scoped `npm run test:mutation`, and actual container HTTP/browser smoke for serving changes. Ordinary tests discover fast-check properties against production URL/content/config rules. Record faults, seeds, survivors and pending live-host evidence. Keep docs/bootstrap.md, task/route/env/invariant/plan/runbook records current. Never weaken a test to hide a genuine failure.

## Content and public boundaries

Preserve seven verified profiles, stable .html routes, linked source citations and licensed responsive photo copies. Lippincott is first. Keep a visible “Paid placement” disclosure in the feature card (the owner removed the profile-page notice on 2026-10-14); keep “Sponsored listing” on its directory row. Individual HAR ratings retain subject/count/platform/date/scope; missing metrics are omitted. Do not present an objective performance ranking or team-wide rating. Astro must escape source text and attributes. Local success does not establish CI, DNS/TLS, deployment or recovery.

## Review tooling

Before a PR, inside Claude Code: run the PR Review Toolkit agents `pr-test-analyzer` and `silent-failure-hunter` on every change, and run the `adversarial-review` project skill before every push. Run gstack `/cso` and `/test-audit` for changes to auth, owner-scoping or tests. Warp validate-changes-match-specs applies once tasks carry a spec.

In CI on every PR: `ratchets.yml` runs `scripts/ratchet.mjs` (test count may not fall; lint/type suppressions and type escapes may not rise; baseline in `ratchet-baseline.json`). `adversarial-review.yml` needs the `ANTHROPIC_API_KEY` secret, and `claude-code-review.yml` needs it or `CLAUDE_CODE_OAUTH_TOKEN`; each skips with a notice when its credential is absent. Update the baseline only with `node scripts/ratchet.mjs --update` and only when the change is intended.

# HVAC SaaS Blueprint

A staged build system for an AI-assisted residential HVAC quote-to-payment SaaS.

## Mission
Build a narrow vertical SaaS that helps small residential HVAC shops get paid faster, then expand only after proof through activation, retention, and payment volume.

## Current operating rule
No stage advances until its gate issue is closed with evidence.

## Stage order
1. Stage 0 — Thesis freeze
2. Stage 1 — Validation sprint
3. Stage 2 — MVP build
4. Stage 3 — Activation + retention
5. Stage 4 — Minimum marketable product
6. Stage 5 — Payments expansion
7. Stage 6 — Collections automation
8. Stage 7 — Adjacency expansion
9. Stage 8 — Platformization

## Repo map
- `ROADMAP.md` — complete stage map and gates
- `stages/` — full stage specs
- `prompts/` — Claude Code prompts for each stage
- `scorecards/validation-scorecard.md` — pass/warning/fail thresholds
- `ops/build-sequence.md` — execution order
- `.github/ISSUE_TEMPLATE/` — issue templates
- `.github/workflows/` — stage progression automation scaffold

## Non-negotiables
- No skipping stages.
- No adding features outside the active stage unless the gate issue explicitly allows it.
- No calling something validated without attached evidence.
- No expanding into fintech layers before the payments stage gate is passed.

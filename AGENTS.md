# AGENTS.md — Meralco Sub-Meter Pro

Shared development instructions for Antigravity 2.0 and Codex CLI.

## Project and commands
React 19, TypeScript, Vite 8, Tailwind CSS 3, IndexedDB/idb and PDF exports; package-lock.json.

- Development: `npm run dev`.
- Verification: `npm run lint`, `npm run build`. Run affected checks before reporting implementation complete.
- Use installed dependencies and the current lockfile; do not upgrade tools just to follow an example.

## Project invariants
- Preserve offline-first storage, existing records and export/import compatibility. Never clear local data to repair an unrelated issue.
- Verify readings, units, rate assumptions, allocation totals and monetary rounding before changing billing logic. Test zero usage, invalid readings and partial periods where applicable.
- Verify PDF statements, totals and pagination when reports change. Use synthetic account data in screenshots.
- Read `MULTI_AGENT_SOP.md` for role context. This AGENTS.md and `.agents/rules/` define the current workflow and approval controls if older SOP prose conflicts.
- Read `.agents/rules/tdd-workflow.md`, `git-approval-gate.md` and `db-migration-gate.md` for applicable work. Scope substantial features through product brief, design specification, implementation plan, verification, and conditional database review; focused fixes use a short plan.

## Co-working and release controls
- Antigravity leads architecture, integration and browser verification; Codex handles assigned terminal tasks, focused edits, debugging and reviews. The user can change that assignment.
- Check `git status --short` before editing. Preserve unrelated work. Assign one writer per file and record scope, branch, owned files, checks and remaining work when handing off between apps. Reuse existing handoff documents; they are context, not fresh authorization.
- Follow shared global defaults and these project instructions. Read relevant referenced rules explicitly in Codex. Use available skills when relevant; report missing tools honestly rather than claiming a review or invocation.
- Do not commit, push, merge, deploy, publish externally, run production migrations or execute destructive rollback commands without explicit user authorization for that action. Satisfy verification and schema-review gates first. Already granted authorization remains valid for its scope.
- Keep secrets and personal data out of logs, screenshots, handoffs and external model prompts. Never weaken authorization or data isolation to make a test pass.
- Report checks actually run, results and limitations. Do not invent package scripts or claim visual verification from a build alone.

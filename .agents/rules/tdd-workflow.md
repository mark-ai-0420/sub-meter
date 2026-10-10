---
trigger: always_on
---
# Engineering verification and collaboration

For substantial multi-file features, prepare a product brief, design specification when relevant, and an implementation plan using existing `handoffs/<feature>/` conventions. Focused fixes can use a short plan. Antigravity coordinates product/design and integration; Codex can implement or review explicitly assigned files.
Delegate independent work when supported and useful; assign disjoint file ownership and never imply a model or slash command is available when it is not. Focused Codex tasks can execute directly. If a required independent review is unavailable, report that limitation before release.
Use tests for changed behavior where suitable, run the project checks listed in AGENTS.md, and verify affected existing journeys. Builders run focused checks; run shared build output generation sequentially after integration rather than competing over the same generated artifacts.
For UI work, verify affected desktop/mobile behavior and save synthetic-data screenshots when browser access is available. Present a concise walkthrough with PASS/FAIL/NOT RUN results. Build success alone does not prove interaction correctness.
For schema changes complete database review before release. Inspect staged, unstaged and untracked changes; do not apply production migrations just because SQL was edited.
After failed checks, fix the root cause and rerun relevant checks. After two unsuccessful rework iterations for the same defect, explain the blocker and escalate rather than claiming success or endlessly retrying.
For major releases, review functional, visual, performance and authorization risks; use independent reviewers when available. On a post-release regression, diagnose and prepare a rollback proposal. Obtain explicit authorization before revert, push, migration rollback or external announcements.

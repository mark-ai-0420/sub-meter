---
trigger: always_on
---
# Git and release approval

Never commit, push or merge without explicit user authorization for the action. Existing authorization applies only to its stated scope. Inspect working-tree changes, preserve unrelated edits and stage only intended files after authorization.
Before a release, run the checks listed in AGENTS.md, report failures or unavailable checks, present applicable visual proof, and complete a database audit if schema/security changed. Show the proposed Conventional Commit message, destination branch and intended operation before requesting missing approval. Do not assume `main` is the right destination.
Deployment, production database changes and external publication require their own applicable authorization; Git approval alone does not authorize them.

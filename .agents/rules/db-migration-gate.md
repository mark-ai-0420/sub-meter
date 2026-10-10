---
trigger: always_on
---
# Conditional schema and database review

Inspect staged, unstaged and untracked files for migrations, schema definitions, SQL, database functions and access policies. Review relevant changes rather than relying on staged migration paths alone.
If database structure, access or data changes: document an audit covering tenant/user isolation, RLS and privileged access, constraint/index effects, existing-data compatibility, migration sequencing and rollback/recovery. Record PASS/FAIL and remaining risks in `handoffs/<feature>/04_dba_audit_report.md` or the existing project audit convention. Obtain required review before release and explicit authorization before applying production changes.
Use local/disposable databases with synthetic data for checks when available. If no database changes occurred, mark database review not applicable; no unrelated database task is needed.

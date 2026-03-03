# Branching Plan (Saved for Later)

**Created:** 2026-02-25  
**Status:** Deferred / Not started

## Goal
Keep `main` stable at v1.3.0 baseline and isolate feature work in:
- `feature/v1.3.1`
- `feature/v1.3.2`

## Rules
- Fixes go to `main` first.
- Propagate fixes to feature branches via `.github/workflows/propagate-fix.yml`.
- Feature regressions remain isolated to their feature branch.

## Resume Checklist
- [ ] Create/protect `feature/v1.3.1`
- [ ] Create/protect `feature/v1.3.2`
- [ ] Set repo variable `PROPAGATE_TARGET_BRANCHES`
- [ ] Test manual workflow_dispatch backport
- [ ] Test label flow with `propagate-fix`
- [ ] Update release docs/versioning policy

## Notes
(Any decisions/questions to revisit)
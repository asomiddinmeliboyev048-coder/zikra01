# Zikra Rivojlanish 2.0 — Silver Redesign Implementation Plan

## Approved direction
- Visual system: Adaptive Silver (light + dark)
- Learning path: 3D Silver Hybrid
- Working branch: `feat/rivojlanish-silver`
- Base branch: `main`
- Stack: Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase

## Repository audit (2026-11-08)

### Repository and routing
- Repository: `asomiddinmeliboyev048-coder/zikra01`
- Default branch: `main`
- The authenticated Rivojlanish route is `src/app/lessons/page.tsx`.
- It renders `LearningExperienceLab` inside the global `Navbar`.
- `src/app/lessons/experience-lab/page.tsx` currently redirects to `/lessons`; it is not the primary UI entry point.

### Existing learning UI
- `LearningExperienceLab.tsx` loads saved learning plans and assessments, and controls onboarding, assessment, LearningHub, and the Duel overlay.
- `LearningHub.tsx` is the active learning dashboard and owns the home/vocabulary/assessment/practice/games/stats tabs and learning activity interactions.
- `DailyPath.tsx` contains a five-step daily quiz path and calls `completeDailyTaskAction`.
- `PersonalizedLearningMap.tsx` contains track-specific learning curriculum levels.
- `SkillDuel.tsx` contains the existing real-time duel experience and must remain unchanged.

### Styling and dependencies
- Global styles are in `src/app/globals.css`; the current global palette is emerald/teal with gold accents.
- Tailwind is already configured.
- `lucide-react` is installed.
- Framer Motion is not currently listed in `package.json`; prefer CSS transitions/animations initially or add it only as a deliberate dependency change after checking bundle impact.
- Existing theme support is implemented in the app; inspect the root theme provider and toggle before connecting Adaptive Silver to avoid a second theme state.

### Data and XP safeguards
- Existing migrations include the learning path, daily tasks, unified learning XP, learning experience, and learning schema repair.
- `202611040007_unified_learning_xp.sql` defines the central learning progress and daily task reward functions.
- `202611070002_repair_learning_schema_and_xp.sql` includes the idempotent practice reward function.
- Do not create a parallel XP ledger, directly update XP from client components, or change Duel reward behavior.
- Do not run database migrations as part of the visual redesign.
- Preserve current user records and RLS policies.

## Implementation sequence

1. **Baseline and integration map**
   - Inspect complete LearningHub render structure, theme provider, progress API, XP actions, and all imports.
   - Record current build/test status where an executable environment is available.
2. **Silver design tokens**
   - Add scoped silver surface, border, text, shadow, and focus tokens.
   - Support both light and dark themes through the existing theme mechanism.
   - Keep changes scoped to Rivojlanish rather than recoloring the whole Zikra application.
3. **Dashboard shell**
   - Rebuild the Rivojlanish header, summary metrics, weekly progress, and responsive layout.
   - Reuse current plan, assessment, activity, and progress data sources.
4. **Hybrid Learning Path**
   - Build responsive path nodes and connecting route with Active/Completed/Locked states.
   - Use existing curriculum/progress data; no fabricated completion or XP values.
5. **Missions, achievements, analytics**
   - Consolidate duplicate daily-task presentation into one clear module.
   - Read existing persisted progress; implement only missing views, not duplicate reward logic.
6. **Regression and release**
   - Verify desktop/mobile, light/dark, accessibility, loading/empty/error states.
   - Verify Duel and XP-related files remain unchanged.
   - Run typecheck/build and inspect deployment checks before opening a PR.

## Protected files and behaviors
- Do not edit `src/app/lessons/experience-lab/SkillDuel.tsx`.
- Do not rewrite XP functions in Supabase migrations.
- Do not alter daily/practice XP award semantics.
- Any future data-layer change requires a separate review and an additive, backward-compatible migration.

## Current status
- Audit completed from the GitHub `main` tree and relevant source files.
- Branch `feat/rivojlanish-silver` created from `main`.
- No application code, database schema, or production data changed in this audit step.

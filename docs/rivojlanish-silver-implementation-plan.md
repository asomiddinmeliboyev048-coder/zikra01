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

## Expanded application-wide Silver scope (added 2026-11-08)

The Silver redesign now covers the wider product, not only Rivojlanish:
- **Kashf etish:** discovery feed, category/filter chips, content cards, empty/loading states.
- **Video:** video feed/cards, player chrome, playback controls, metadata and related content surfaces.
- **Reels:** full-screen vertical viewer, action rail, progress indicators, comments and overlays.
- **Chat:** conversation list, message bubbles, composer, attachments, unread/active states; preserve full-screen chat behavior.
- **Learn:** lesson/course cards, learning navigation, practice and learning activity surfaces.
- **Rivojlanish:** dashboard, hybrid path, missions, stats and achievements.

Use the existing `dark` theme class and `zikra-theme` preference. Avoid a second theme state. Prefer shared semantic Silver tokens plus scoped page/component styles; do not globally override every emerald class blindly because status colors (success, warning, error) and media affordances must remain meaningful.

## Implementation sequence

1. **Baseline and integration map**
   - Inspect complete LearningHub render structure, theme provider, progress API, XP actions, and all imports.
   - Record current build/test status where an executable environment is available.
2. **Silver design tokens**
   - Add scoped silver surface, border, text, shadow, and focus tokens.
   - Support both light and dark themes through the existing theme mechanism.
   - Establish shared Adaptive Silver design tokens for the whole authenticated app, while applying component-scoped styling to avoid unintended regressions.
   - Recolor Kashf etish, Video, Reels, Chat, Learn, and Rivojlanish surfaces, cards, controls, navigation states, and interaction states.
   - Preserve each section's distinct UX and media treatment; Silver means a consistent palette, not flattening every screen into identical layouts.
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

## Current status (2026-11-08)
- Repository audit completed.
- Branch `feat/rivojlanish-silver` created from `main`.
- First implementation slice committed: `SilverLearningPath.tsx`, scoped `silver-learning.css`, and integration into `LearningHub.tsx`.
- Adaptive Silver tokens and light/dark styling are scoped to the Rivojlanish experience; no global theme rewrite was made.
- Hybrid path uses the existing activity history count for its initial progress visualization; it does not grant XP or mutate learning records.
- `SkillDuel.tsx` blob SHA is identical on `main` and this branch; Duel remains untouched.
- No database migrations or production data were changed.
- Build/typecheck has not yet been run in a local checkout. The observed Vercel check was only its feedback-comments check, not a build result.

- Scope clarification: user explicitly expanded the Silver visual redesign to Kashf etish, Video, Reels, Chat, and Learn in addition to Rivojlanish. Global palette changes must be intentional and regression-tested; existing global emerald styles are still in use outside the learning area.

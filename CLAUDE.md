@AGENTS.md

<!-- veyr:spend-status:begin -->
## Veyr optimization context
> Stable prompt-cache anchor. Live data: `~/.veyr/agent-status/VEYR_PROJECT_STATUS.md`.

Before changing model, compacting context, or making a budget-driven tradeoff, read the live status file above.
Before adding code, search for an existing helper and consolidate exact repetition when the shared abstraction is clearer.
Never reduce correctness, relevant source context, validation, tests, or code quality to save tokens.
<!-- veyr:spend-status:end -->

<!-- veyr:guidance:begin -->
## Veyr agent guidance
> Auto-updated by Veyr · 2026-09-17 10:55 · ~316 tokens · edit ~/.veyr/guidance-rules.json to customize

- **Don't state unverified claims as fact** — If you haven't checked something — a file's contents, whether a test passes, how an API behaves — verify it before asserting it, or say explicitly that it's unverified. Don't present a guess as a confirmed fact.
- **Don't restate full context before a small edit** — Before making a small, targeted change, don't echo the whole file or unchanged surrounding code back first. Reference only the specific lines being changed.
- **Skip acknowledgment boilerplate** — Don't open responses by restating the task, thanking the user, or narrating what you're about to do before doing it. Lead with the substantive content or the action itself.
- **Write the smallest clear, correct implementation** — Before adding a helper or branch, search for an existing abstraction you can reuse. Consolidate exact repeated logic when the shared name is clearer, but never minify source, hide control flow, weaken validation, remove tests, or change public behavior.
- **Keep prose terse and code exact** — Use concise prose by default, especially late in long sessions. Never shorten, omit, or paraphrase requested code, patches, commands, error messages, test results, or other details needed to implement or verify the work correctly.
<!-- veyr:guidance:end -->

<!-- veyr:graph-context:begin -->
## Veyr codebase graph
> Powered by Graphify · Full graph · 2026-09-17 02:51

### Architecture
65 files, 407 symbols in 14 communities. Primary languages: TypeScript, JavaScript. Highest-impact code: types.ts, PrefControls.tsx, activityStore.ts.

### Critical path (highest-impact files)
- **types.ts** (src/content/types.ts) — 34 connections
- **PrefControls.tsx** (src/components/prefs/PrefControls.tsx) — 32 connections
- **activityStore.ts** (src/state/activityStore.ts) — 32 connections
- **engine.ts** (src/feed/engine.ts) — 31 connections
- **types.ts** (src/feed/types.ts) — 28 connections

### Token savings
Reading this summary saves ~25014 tokens vs. exploring files manually.
<!-- veyr:graph-context:end -->

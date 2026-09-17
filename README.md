# Micro

A learn-while-you-scroll app. It's a full-screen vertical feed that mixes explainer videos, facts, book summaries and quotes, with a popular YouTube Short "brain break" every few cards. See [CONCEPT.md](CONCEPT.md) for the product idea.

This is a **clickable prototype**. It uses Expo (SDK 57) and React Native, runs on local seed content and has no backend.

## Run it

```bash
npm install
npx expo start        # scan the QR code with Expo Go, or press i / a for a simulator
```

Other scripts: `npm test` (feed engine tests), `npm run typecheck`, `npm run lint`.

## How the feed works

- **Blocks:** the feed is built from blocks: `N-1` learning cards, then 1 Short. N defaults to 5, and users can set it to 3, 5, 8, 10 or off.
- **Rules inside a block** (`src/feed/rules.ts`):
  - at least one video
  - at most one quote
  - never the same format twice in a row
  - book summaries at most every other block

  If no card fits every rule, the rules are relaxed in that order so the feed never stalls.
- **Weighting** (`src/feed/scoring.ts`):
  - **Format:** base mix 35% videos, 30% facts, 20% book summaries, 15% quotes, shifted by the videos↔reads slider
  - **Topic:** chosen topics get about 7x the weight of the rest
  - **Behavior:** saves, shares, likes, full watches and quick skips adjust both weights
  - **"Not interested":** turns a topic or format down
- **Engine** (`src/feed/engine.ts`): a pure function with a seeded random generator, covered by `src/feed/__tests__`. It returns a cursor after every item, so the upcoming cards can be rebuilt from any point, for example after a preference change, without breaking the break pattern.
- **Brain breaks:** handled by an `EntertainmentProvider` (`src/entertainment/`). The current provider plays curated YouTube Shorts through YouTube's official embedded player. A different source can replace it without touching the engine.

## Layout

```
src/app/            routes: onboarding/ (4 steps), (tabs)/ feed · vault · me
src/content/        card types, topics, seed JSON (facts, quotes, books, videos)
src/entertainment/  break-slot provider + curated Shorts
src/feed/           engine, rules, scoring, rng, tests
src/state/          zustand stores persisted to AsyncStorage (prefs, activity)
src/components/     cards/, feed/, prefs/, ui/
src/hooks/          feed generation, dwell tracking, double-tap, speech, entrance animation
```

## Gestures

- **Swipe up:** next card
- **Swipe sideways:** book summary slides
- **Double-tap:** like
- **Tap a video or Short:** mute or unmute
- **Long-press, or "More":** tune the feed (less of this topic or format, report a fact)

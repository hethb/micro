# Micro

A learn-while-you-scroll app. It's a full-screen vertical feed that mixes explainer videos, facts, book summaries and quotes, with a popular YouTube Short "brain break" every few cards. See [CONCEPT.md](CONCEPT.md) for the product idea.

This is a **clickable prototype**. It uses Expo (SDK 57) and React Native and runs on local seed content. Accounts and saved data use [Supabase](https://supabase.com).

## Run it

1. Set up Supabase (one time):
   - Create a Supabase project.
   - In the SQL editor, run the files in [`supabase/migrations/`](supabase/migrations) in order: `0001_accounts.sql` (profiles and synced state), `0002_comments.sql` (card comments) and `0003_moderation.sql` (blocking and reporting). They all set up row-level security.
   - Optional for testing: turn off **Authentication → Sign In / Providers → Email → Confirm email**, so new profiles can use the app right away. With it on, users confirm by email and then log in.
   - Copy `.env.local.example` to `.env.local` and fill in the project URL and publishable (anon) key from **Project Settings → API**.
2. Start the app:

   ```bash
   npm install
   npx expo start        # scan the QR code with Expo Go, or press i / a for a simulator
   ```

Other scripts: `npm test` (feed engine, mind map and sync tests), `npm run typecheck`, `npm run lint`.

## Accounts and saved data

- **First launch:** welcome screen → create a profile (name, email, password) → onboarding questions (topics, learning style, brain breaks, daily goal) → feed. Returning users log in instead.
- **Routing:** `src/app/_layout.tsx` uses protected routes. Signed-out users can only reach `auth/`, signed-in users who haven't onboarded only `onboarding/`, everyone else the tabs.
- **Sync** (`src/account/sync.ts`): the prefs and activity stores stay local-first in AsyncStorage. On login the account's saved copy replaces the local one, and a brand-new account starts blank. Changes upload to `user_state` a few seconds later and when the app goes to the background. Unsent changes survive restarts and upload on the next launch. If two devices edit at once, the last upload wins.
- **Logging out** uploads pending changes, then clears the user's data from the device.

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
- **Video playback** (`src/components/cards/YouTubePlayer.tsx`): on iOS and Android the IFrame player runs in a WebView loaded with an `https://` base URL. YouTube rejects embeds that don't send a referrer ("Error 153"), so without that base URL videos only show a "Watch on YouTube" link.

## Mind map

A new account's map shows only the topics picked in onboarding. The ideas behind cards appear as the user likes, saves and finishes them, and related ideas are suggested from there.

## Layout

```
src/app/            routes: auth/ (welcome, sign-up, log-in), onboarding/ (4 steps), (tabs)/ feed · vault · me
src/account/        Supabase session handling and cloud sync
src/lib/            Supabase client
supabase/           database migrations
src/content/        card types, topics, seed JSON (facts, quotes, books, videos)
src/entertainment/  break-slot provider + curated Shorts
src/feed/           engine, rules, scoring, rng, tests
src/state/          zustand stores persisted to AsyncStorage and synced to the account (prefs, activity)
src/components/     cards/, feed/, prefs/, ui/
src/hooks/          feed generation, dwell tracking, double-tap, speech, entrance animation
```

## Comments

Every learning card has a comment thread, stored in the `comments` table. Comments are written under the profile's name, anyone signed in can read them, and people can delete their own. The side rail shows each card's count (fetched for the cards around the one on screen through the `comment_counts` function), and posting a comment counts as a strong signal for ranking, like a save or a share.

**Moderation.** Any comment from someone else has a menu to report it (spam, abuse, or something else) or block the person. Both take effect immediately: the `visible_comments` view leaves out comments the reader reported and everyone they blocked, and counts follow the same rule. Blocked people are listed in Settings, where a tap unblocks them. Reports land in `comment_reports` — review them in the Supabase dashboard and delete offending rows from `comments`.

## Publishing

`app.json` uses the app id `com.hethbhatt.micro` on both platforms — change it before the first build, since an id can't be changed afterwards. `eas.json` has three build profiles: `development` (dev client), `preview` (internal sharing) and `production` (store builds, with version numbers tracked by EAS).

```bash
npm install -g eas-cli
eas login
eas init

# Supabase keys: .env.local is never uploaded, so set them on EAS once per environment.
eas env:set --name EXPO_PUBLIC_SUPABASE_URL --value "https://<ref>.supabase.co" --environment production --visibility plaintext
eas env:set --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value "sb_publishable_..." --environment production --visibility plaintext

eas build --platform all --profile production
eas submit --platform ios      # TestFlight / App Store
eas submit --platform android  # Play Console
```

The web build deploys separately: `npx expo export --platform web` then `eas deploy`.

Before submitting for review:

- Turn **Confirm email** back on in Supabase, so people can't sign up as someone else.
- The comment threads are user-generated content, so the store listing needs terms that say objectionable content isn't tolerated, and reports have to be acted on within 24 hours. Reporting, blocking and deleting your own comments are built in; a word filter and a published moderation contact are not.
- Check that hiding YouTube's player controls behind Micro's own tap-to-mute layer is acceptable under YouTube's embed terms, and that the seed facts, quotes and book summaries are yours to publish.

## Gestures

- **Swipe up:** next card
- **Swipe sideways:** book summary slides
- **Double-tap:** like
- **Comment:** open the card's thread from the side rail
- **Tap a video or Short:** mute or unmute
- **Long-press, or "More":** tune the feed (less of this topic or format, report a fact)

# Micro: Learn While You Scroll

> Working name. Alternatives: **Unrot**, **Scrollwise**, **Brainfeed**, **Rewire**.

## 1. The problem

Microlearning apps like Blinkist, Headway, Imprint and Nibble all take the same approach: they shrink books into short summaries. You still end up **reading**, though. People don't open Reels or TikTok to read. They open them for fast, full-screen, sound-on motion that asks nothing of them and gives a small reward every few seconds. A reading app doesn't compete with that, so people use it for a week and go back to Reels.

## 2. The idea

A vertical, full-screen, swipe-up feed that **feels like Reels** but is mostly learning content:

- **Facts:** one surprising fact per card, with animation and a voiceover
- **Quotes:** designed for sharing, with the author and background context
- **Book summaries:** a narrated 45–60s video or a carousel of 3–5 cards, not a block of text
- **Short explainer videos:** 60 seconds at most, one idea per video
- **A popular TikTok every 5th scroll:** a pure-entertainment break that keeps the feed from feeling like homework

Users choose their topics during onboarding, and the feed keeps adapting to what they watch.

**Positioning:** *"Doomscroll, minus the doom."* It isn't a replacement for books. It's a replacement for the 40 minutes of Reels you'd watch anyway.

## 3. Core design principles

1. **Visual and audio first.** Every card has motion or sound. Text-only cards are the exception and never run back-to-back.
2. **Every card takes 3–60 seconds.** Anything longer gets split or cut.
3. **One idea per card.** No "part 1 of 7" homework feeling.
4. **Reward, don't demand.** No required quizzes and no guilt. Optional interactions only.
5. **Entertainment is part of the design.** Regular entertainment breaks lower the cost of staying in the app.

## 4. Feed structure

### The 5-slot block

```
[1] Learning  →  [2] Learning  →  [3] Learning  →  [4] Learning  →  [5] Popular TikTok
```

The block repeats forever. Rules for slots 1–4:

| Rule | Why |
|---|---|
| At least 1 video per block | Keeps the Reels feel |
| No format twice in a row (e.g. fact, then fact) | Variety is the hook |
| At most 1 text-heavy card (quote or text fact) per block | Avoids a reading slump |
| Book summaries appear at most every other block | They're the "heaviest" format |
| Topics weighted by user preferences plus live engagement | Personalization |

**Default format mix (tunable per user):** videos 35%, facts 30%, book summaries 20%, quotes 15%.

### Entertainment slot (every 5th)

- A trending/popular TikTok embed, filtered to **clean, broadly safe content** (no politics, no NSFW)
- Optionally matched to the user's interests: a cooking TikTok for a nutrition learner, a science-trick TikTok for a science learner
- The user can change the frequency in settings: every 3, 5, 8 or 10 cards, or off
- **Future:** make the ratio adaptive. If watch-through drops, add entertainment sooner. If the user is binging learning content, add it later.

## 5. Onboarding and preferences

**Screen 1: "What do you want to get smarter about?"** (pick 3 or more, shown as visual chips)
> Psychology · Money & Investing · History · Science · Space · Health & Fitness · Productivity · Business & Startups · Philosophy · Tech & AI · Art & Design · Relationships · Nature & Animals · Language & Words · Geography · Food Science

**Screen 2: "How do you like to learn?"** (sliders or toggles)
- Mostly videos ↔ Mostly quick reads
- Light & fun ↔ Deep & serious

**Screen 3: "Entertainment breaks"**
- Every 5 cards (default) / Less often / Off
- Pick TikTok vibes: Comedy · Animals · Satisfying · Sports · Food · Life hacks

**Screen 4: Daily goal** (optional)
- 5 / 15 / 30 minutes of learning per day

Users can change any of these later in Settings. The feed also learns from implicit signals:

| Signal | Weight |
|---|---|
| Watch-through / dwell time | High |
| Save / share | Very high |
| Fast skip (< 1.5s) | Negative |
| "Not interested" long-press | Strong negative (topic or format) |

## 6. Interactions per card

- **Swipe up:** next card
- **Double-tap:** like
- **Save:** saves to a "Brain Vault" library, grouped by topic
- **Share:** generates a branded image or clip, which doubles as free marketing
- **"Go deeper" button:** on a book summary or explainer, opens a longer read, the full book link (affiliate) or related cards
- **Long-press:** "Not interested", "Less of this topic", "Less of this format"

## 7. Engagement and retention

- **Learning streaks:** lightweight, with free streak freezes
- **"Things you learned today" recap:** shown when the user closes the app, e.g. "You learned 23 things in 11 minutes"
- **Optional recall cards:** about every 20 cards, a single-tap quiz on something seen earlier (spaced repetition that doesn't feel like school). Skippable.
- **Weekly "Brain Wrapped":** shareable stats (topics, facts learned, top-saved quote)
- **Knowledge map:** a visual that fills in as the user learns across topics

## 8. Content strategy

This is the hardest part of the business, so it gets its own section.

| Format | Source (MVP) | Source (Scale) |
|---|---|---|
| Facts | AI-drafted plus human fact-check, templated animation, TTS voiceover | Same pipeline, plus community submissions with review |
| Quotes | Public-domain and attributed short quotes, templated motion design | Licensed quote libraries |
| Book summaries | Original written summaries turned into narrated video (AI voice plus kinetic type/stock b-roll) | Publisher partnerships and author-recorded summaries |
| Explainer videos | Licensed or partnered educational creators (revenue share) | Creator program where educators upload natively |
| Popular TikToks | TikTok **embed** (oEmbed / Embed Player), curated trending list | Licensed entertainment clips or creator partnerships |

**Launch catalog target:** about 2,000 cards across 12 topics, enough for a heavy user's first 2 weeks without repeats.

**Accuracy:** each fact card carries a source link, and a "Report inaccuracy" button feeds a review queue. Trust is the moat against "brainrot facts" accounts.

## 9. ⚠️ Key risks and mitigations

| Risk | Detail | Mitigation |
|---|---|---|
| **TikTok embedding** | Embeds must use TikTok's official player (branding, attribution, possibly no autoplay, may push users to the TikTok app). You can't legally download and rehost clips. TikTok could restrict embeds or object to an "every 5th" pattern. | Use only official embeds and follow TikTok's developer terms. Build the entertainment slot as a **pluggable source**, with fallbacks to YouTube Shorts embeds, licensed clip libraries or partnered creators. Validate with TikTok's terms before launch. |
| Copyright on book summaries | Summaries must be original writing, not paraphrased chapters | Written from scratch, no reproduced passages, short attributed quotes only |
| Content cost | Video production at volume is expensive | Templated, AI-assisted production pipeline, with creator partnerships for premium videos |
| "It's just another feed" | Could feel addictive in a bad way | Session recap, optional time limits and a "you've learned enough today 🎉" soft stop |
| Cold start | Personalization is weak on day 1 | Onboarding preferences plus a diverse first session |
| Misinformation | One viral wrong fact damages trust | Sources on every card, a review queue and the report button |

## 10. Monetization

1. **Freemium subscription (primary):** free tier has unlimited feed with the standard mix. **Pro ($4.99–7.99/mo)** adds unlimited saves, "Go deeper" long-form, offline mode, recall quizzes, no sponsored cards and custom entertainment frequency.
2. **Native sponsored cards:** a brand-sponsored fact card, clearly labeled, at most 1 per 20 cards
3. **Book affiliate links:** "Get the book" on summaries
4. **B2B / education (later):** team learning feeds, classroom versions

## 11. MVP scope (v0.1, ~8–10 weeks)

**In**
- iOS + Android (React Native / Expo), full-screen vertical pager
- Onboarding with topic + format + entertainment preferences
- 4 learning formats + TikTok embed every 5th card
- Rule-based feed ranking (preferences + simple engagement weights)
- Like / save / share / not interested
- Streaks + end-of-session recap
- ~1,000–2,000 cards, 10–12 topics
- Basic admin CMS to upload and tag cards

**Out (for now)**
- ML recommendation model
- Creator uploads
- Recall quizzes, Brain Wrapped, knowledge map
- Social features / following

## 12. Suggested tech stack

| Layer | Choice |
|---|---|
| App | React Native + Expo, `react-native-pager-view` or FlashList for the vertical feed, `expo-video` |
| Backend | Supabase (Postgres, auth, storage) or Firebase |
| Video delivery | Mux or Cloudflare Stream (HLS, fast start) |
| Feed service | Edge function that builds the next 10-card batch from the block rules + weights |
| Content pipeline | LLM drafting → human review → template render (Remotion) → TTS (ElevenLabs) |
| Analytics | PostHog (dwell time, skips, retention cohorts) |
| Entertainment slot | TikTok oEmbed / Embed Player behind a `EntertainmentProvider` interface |

### Core data model (sketch)

```
Card        id, type(fact|quote|book|video|entertainment), topic_ids[], title,
            body, media_url, duration_s, source_url, depth(light|deep), status
UserPrefs   user_id, topics[], format_weights{}, depth_pref, ent_frequency, ent_vibes[]
Event       user_id, card_id, action(view|skip|like|save|share|hide), dwell_ms, ts
Save        user_id, card_id, ts
```

## 13. Success metrics

- **D1 / D7 / D30 retention** (target D7 ≥ 25%)
- **Avg session length** and **cards per session**
- **Learning-card watch-through rate** vs. entertainment-card rate (the key health metric: learning content should stay competitive)
- **Save + share rate** per format
- **Share-driven installs**

## 14. Open questions

1. Is every 5th card the right ratio, or should it be adaptive from day 1?
2. Should the entertainment be TikTok specifically, or "any trending short-form" (Shorts, Reels embeds)?
3. Should we produce videos in-house, or lead with a creator partnership model?
4. Who is the target audience: Gen Z students, young professionals, or anyone trying to cut screen-time guilt?
5. Could it be a **web-first MVP** (installable PWA) to validate the feed mix before building native apps?

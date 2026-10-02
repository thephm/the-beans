Asked ChatGPT
## Beans

> Back to my coffee roaster site, I need to give Copilot for VS Code instructions on functionality for coffee beans and need a great prompt: some meta data about the beans including their origin (Africa, Latin America, Asia), roast level (light, medium, dark), processing method (Washed, Natural, Honey), deep linked to the roasters we have in the database to see their profile. Are there other origins? is the processing methods ok? I don't want to maintain too many detailed data points but I know I bought some espresso and it mentions raisin flavour, peach and all kinds so I should likely be able to support that. Each type of beans will have one or more photos. People will be able to rate the beans like 1 to 5. Maybe add comments with the ability for automated spam/ foul language removal

Here’s how I’d approach this so you give Copilot a clear, structured prompt while also making sure your coffee roaster site can grow without drowning in data entry.

1. Origins

- **Africa** (e.g., Ethiopia, Kenya, Rwanda)
- **Latin America** (e.g., Colombia, Brazil, Guatemala, Costa Rica, Honduras)
- **Asia** (e.g., Indonesia, Vietnam, India, Yemen)
- **Oceania** (Papua New Guinea, Solomon Islands) – rare but notable in specialty coffee.

Instead of hardcoding origins, make Origin a field that can be expanded later — maybe prefilled with these continents/regions. Down the road will add country-level precision.

2. Roast Levels

- Light
- Medium
- Medium-Light
- Medium-Dark
- Dark

3. Processing Methods

- Washed
- Natural
- Honey
- Anaerobic
- Experimental

4. Flavor Notes

A controlled list for analytics later e.g., “Fruit", “Nut”, “Chocolate” but don’t enforce it at the start.

A free-text field where roasters/curators can enter more “raisin, peach, chocolate, floral” etc.

5. Media

One or more images per bean type (roast close-up, packaging, latte art, etc.). Store images in the database, linked to bean record.

6. Ratings & Comments

1–5 star rating per user per bean.

Optional comment per rating.

Automated moderation:

Profanity filter: common foul language list from source?

Spam detection e.g., hyperlinks, repeated text, rapid posting

Option to auto-hide flagged comments until admin review. Enabled by default.

7. Deep Linking to Roasters

Each bean record should have a foreign key to the roaster’s profile in your database.

Display roaster name & link to their page.

Build a backend and frontend component for a coffee bean catalog feature.
Each bean record should have:

`id` (unique identifier)

`name` (string)

- `origin_continent` (string: Africa, Latin America, Asia, Oceania)
- `origin_country` (enum: ca, us etc)
- `roast_level` (enum: light, medium-light, medium, medium-dark, dark)
- `processing_method` (enum: Washed, Natural, Honey, Anaerobic, Experimental)
- `flavor_type` (enum: fruity, nutty, chocolate, floral, spicy, berry, citrus, caramel, earthy, etc.).
- `flavor_notes` (free-text string, comma-separated, e.g., “raisin, peach, chocolate”)
- `roaster_id` (foreign key to roaster table)
- `photos` (array of image deeplink URLs which render from the DB)
- `ratings` (1–5 stars, average + count)
- `comments` (array with user, text, timestamp, moderated flag)
- `created_by` user id
- `created_at` timestamp
- `updated_at` timestamp

`flavor_notes` is an array of flavor IDs from a controlled flavors table

`flavors` table stores id, name, and status (approved, pending).

Requirements:

1. Fully multilingual like the rest of the app
2. Strings for English and French
3. Ability to view all beans, filter by origin, roast, processing method.
4. User can select from approved flavors.
5. Users can type a new flavor suggestion — system adds it to flavors table with status pending
5. Display roaster name with link to their profile.
6. Allow users to submit a rating + optional comment.
7. Allows multiple flavor selections per bean.
8. Automatic moderation: block foul language and spam in comments.
9. Store all data in a relational database with efficient queries.
10. API endpoints for listing, creating, updating, deleting beans (admin only)
11. API endpoints for rating roaster or beans
12. API endpoints for commenting roaster or beans
13. Frontend UI to display bean details, photos, roaster name which is hyperlink to the roaster details page, ratings, and comments.
14. Mobile-friendly layout.
15. Admin dashboard shows pending flavors for approval or rejection.
16. Beans can have multiple flavor notes.

## Multilingual

> it will need to be multilingual, the rest of the app is not yet but I need to convert it, should i ask copilot to do that first?

Yes — it’s much better to bake multilingual support into the foundation rather than bolt it on later, especially for something like flavor notes where you’ll have a controlled list.

If you don’t, you’ll end up with:

Flavor IDs tied to English text only, making translation painful.

UI elements hardcoded in English instead of using a localization system.

The need for a big refactor later just to support multiple languages.

### Recommended sequence

1. **Ask Copilot to implement multilingual support in the app first**

  - Introduce an i18n framework (depending on your stack — e.g., i18next for JS/TS).

  - Store all UI text in translation files instead of hardcoded strings.

  - Add locale switching support.

  - Make sure database-controlled lists (like flavor notes) store language-specific labels or reference a translations table.

2. **Then build the coffee bean feature with multilingual-ready fields**:

  - `flavors` table should have:
    - `id` (unique key)
    - `slug` (language-agnostic identifier, e.g., “raisin”)
    - `translations` (JSON: { en: "raisin", fr: "raisin", es: "uva pasa" })

  - Same approach for `origin` and `processing_method` values.

UI should display flavor names in the currently selected language.

If you want, I can rewrite your full Copilot prompt so:

- Multilingual support is built-in

- Flavor notes, origins, and processing methods are stored in a translation-friendly way

- Copilot knows to use an i18n library from the start

That way you won’t be stuck redoing the database schema in 6 months.

Do you want me to prepare that multilingual-ready prompt now?

> yes please let's work on that first, each user should be able to set language preference or maybe we just remember based on what they set the site language to in some button/menu on the navbar? or should it be flag plus language code like Canadian flag and EN or FR beside it?

Alright — let’s make this multilingual foundation solid so you can layer your coffee bean feature on top without rework later.

### Language preference

You’ve got two main options:

A. **Per-user preference** (best if you have logins)

- Store preferred language in the user profile in the database.

- When logged in, load their saved preference every time.

- When not logged in, fallback to cookie/session storage for the last chosen language.

**Pros**: Always consistent for logged-in users.
**Cons**: A little more work if you don’t have user accounts yet.

B. **Site-level choice remembered in the browser** (best for guest browsing)

- User picks language via a navbar selector.

- Store choice in localStorage or cookies.

- Load that choice on page refresh.

**Pros**: Works without logins, simple.
**Cons**: If the user switches devices, preference won’t carry over.

### 💡 Recommendation for your case:

Since you haven’t mentioned user accounts yet, go with Option B now (remember choice in localStorage/cookie), but design it so when you add accounts later it can store in the DB instead.

### Language selector design

I suggest:

- Flag + language code works well for recognition, but flags ≠ languages (e.g., French is spoken in France, Canada, Belgium, Switzerland).

- The clearest is language name in that language + optional flag:

  - 🇨🇦 English (EN)
  - 🇨🇦 Français (FR)

- If you want minimal UI, just show a globe 🌐 icon that opens a dropdown with the options above.

### Copilot multilingual foundation prompt

Here’s the first building block you can give to Copilot before adding coffee beans:

Implement full multilingual support for the app using i18next (or another well-supported i18n library for the chosen framework).
Requirements:

- All UI strings must be moved to translation files (`/locales/en.json`, /`locales/fr.json`, etc.).

- Add a language selector to the navbar:

- Shows language name in its own language (e.g., “English”, “Français”).

- Optionally shows flag + language code beside it.

- Language choice should persist:

- If user is logged in, store preference in their profile in the database.

- If guest, store choice in localStorage or cookie.

- The default language is English unless the browser Accept-Language header matches a supported language.

- All controlled vocabulary items in the database (e.g., coffee origins, processing methods, flavor notes) must have a translations field that stores JSON with keys for each supported language.
Example: { en: "raisin", fr: "raisin", es: "uva pasa" }

- Database queries for multilingual content should return the translation for the currently active language, falling back to English if missing.

- The system should allow adding new translations later without schema changes.

- Prepare helper functions to:

  - Switch language dynamically on the frontend.

  - Retrieve correct language text from DB for the active language.

- All forms should display and save translations when editing vocabulary items.

If you want, I can extend this Copilot prompt so it also covers coffee bean feature requirements in one shot, fully multilingual. That way you start with one master spec that Copilot can build from.

Do you want me to merge them now?

> no let's start with making the app multilingual
ChatGPT said:

Alright — let’s keep the coffee beans on the shelf for now and just set up the multilingual foundation.

Here’s a clear step-by-step roadmap + Copilot prompt you can drop into VS Code so Copilot focuses purely on i18n.

### Multilingual Setup Roadmap

1. Pick an i18n library

- For JS/TS frontends: i18next (React, Vue, Svelte friendly)

- For backend (Node): i18next or nestjs-i18n

- For Python (FastAPI/Django): Babel or django-i18n

2. **Organize translation files**

```bash
/locales
  /en/common.json
  /fr/common.json
```

- Keep files small and grouped logically (common UI, navbar, forms, errors, etc.).

3. **Language selector in navbar**

- Shows language name in its own language: "English", "Français"

- Optional flag + language code for extra clarity.

- Dropdown or click-to-toggle.

- Store choice in:

  - localStorage for guests.

  - Database users.language field if logged in.

4. **Default language behavior**

- Use Accept-Language header from the browser if supported, otherwise default to English.

- On first visit, set that choice in storage so it’s consistent.

5. **Controlled vocabulary in DB**

For things like origins, processing methods, flavor notes, store:

```bash
id | slug       | translations
1  | raisin     | {"en":"raisin","fr":"raisin","es":"uva pasa"}
```

- Always return the active language string in API responses (fall back to English if missing).

6. **Helpers**

  - `t(key)` function on frontend to get the translation.

  - Backend helper to fetch DB field in the active language.

### Copilot Prompt for Multilingual Setup

Paste this into VS Code when you start:

Implement full multilingual support for the app.
Use i18next (or another well-supported i18n library if better for the current framework) for both frontend and backend.
Requirements:

1. Move all hardcoded UI text into translation files under `/locales/{lang}/common.json`.

2. Create a language selector in the navbar:

  - Shows language name in its own language (e.g., “English”, “Français”).

  - Optional: show country flag and language code beside name.

  - Stores the selected language in `localStorage` for guests, and in `users.language` DB field if logged in.

3. Default language selection:

  - Use browser `Accept-Language` if supported; otherwise default to English.

  - Persist choice after first visit.

4. For database-controlled vocabulary (e.g., coffee origins, processing methods, flavor notes):

  - Each record should have `slug` and `translations` JSON field storing keys for each supported language.

  - Backend API should return the active language’s translation, falling back to English if missing.

5. Provide helper functions:

  - `t(key)` for frontend translations.

  - Backend helper to retrieve DB field in the active language.

6. Make the system easily extendable to more languages without schema changes.

7. Test by adding English and French translations for all UI text and sample DB vocabulary entries.

If you’d like, I can also prep your first `/locales/en.json` and `/locales/fr.json` files so you have a working base right after Copilot runs. That way you can test switching languages immediately.

> earlier you said you weren't sure about user accounts, yes the app supports those, does that change anything

Yes — if your app already supports user accounts, we can make multilingual support more consistent and skip some of the guest-only limitations.

Here’s what changes:

### Language Preference Handling

Instead of “store in localStorage unless they log in,” you can always store the setting in the DB:

- Add a column to the users table:

```sql
ALTER TABLE users ADD COLUMN language VARCHAR(5) DEFAULT 'en';
```

- On login, load this language and set the i18n context accordingly.

- When a logged-in user changes their language in the navbar:

  - Update it immediately in their profile via API.

  - Update the UI instantly (no reload needed if i18n supports dynamic switching).

### Benefits with Accounts

- Consistent across devices — they get the same language if they log in from a phone or a new browser.
- No cookie/localStorage drift — one authoritative setting in the DB.
- Easier to send multilingual emails/notifications in the correct language.
- Future analytics: see what percentage of users prefer each language.

### Small UX Considerations

- Still keep a one-time language selector for first-time visitors before login (store temporarily in localStorage or session).

- On login, if they haven’t set a language before, detect from browser or site default and save it.

- When logged out, you can default to English or last-remembered choice.

### Updated Copilot Prompt (with accounts)

Here’s the revised multilingual setup instruction:

Implement full multilingual support for the app using `i18next` (or another well-supported i18n library for the chosen framework).

Requirements:

1. Move all hardcoded UI text into translation files under `/locales/{lang}/common.json`.

2. Add a language column to the `users` table (`VARCHAR(5)`, default `'en'`).

3. Create a language selector in the navbar:

  - Shows language name in its own language (e.g., “English”, “Français”).

  - Optionally show country flag and language code.

  - If logged in, changing language updates `users.language` in DB and switches UI immediately.

  - If guest, store choice in localStorage until login, then prompt to save preference.

4. On login, set active language from the `users.language` field. If not set, use browser `Accept-Language` and save it.

5. For database-controlled vocabulary (e.g., coffee origins, processing methods, flavor notes):

  - Each record should have `slug` and `translations` JSON field storing translations for each supported language.

  - Backend API should return the translation for the active language, falling back to English if missing.

6. Provide helper functions:

  - t(key) for frontend translations.

  - Backend helper to retrieve DB field in the active language.

7. Make the system easily extendable to more languages without schema changes.

8. Test by adding English and French translations for all UI text and sample DB vocabulary entries.

If you want, I can now design the database schema for the multilingual coffee data (origins, processing methods, flavor notes) so when you add that feature, you won’t have to redo anything.

Do you want me to set up that schema now while we’re still in “multilingual mode”?

## Not storing bad words

I am building an app and it has a search function which remembers popular searches. If someone searches using inapropriate language I don't want that stored in the database and shown to other users in the popular search pill buttons. Is there a public API for checking that text in any language is not innapropriate? ie does not include profanity, hate message, etc?

Yes — there are public / third-party APIs and services you can use (or adapt) to check user input for profanity, hate speech, and other toxic / inappropriate content across multiple languages. It’s a common content moderation need. I can list a few, along with pros/cons, and some considerations for using them in production. If you want I can also pull up pricing & suggestions specific to Canada / your stack.

### ✅ Example APIs & services

Here are some services / tools you might consider:

Name | What it does / strengths	| Notes / limitations
--- | --- | ---
SightEngine — Text Moderation	| Detects profanity, hateful / sexual / toxic content in any user-generated text: comments, posts, usernames, etc. | Good for filtering / flagging. Need to check how well it handles non-English / local dialects.
Moderation API	| Automated text moderation (toxicity, profanity, etc.) ‒ good safety features.  moderationapi.com | Depending on plan, might have limits; review response latency and language coverage.
WebPurify Profanity Filter | Classic profanity filter / blocking + options like replace, checkcount, etc. | Historically more English-centric; check which other languages are supported.
Profanity Filter API (API Ninjas)	| Detect & censor profanity/bad words; returns censored text etc. | Good for simpler profanity detection; may not catch hate speech or subtle abusive content.
Bad Words API (apilayer marketplace) | Detects bad/swear words, censoring; works to catch variations. | English only (per current documentation) for many features. Non-English coverage may be weaker.
Deepgram Profanity Filtering | Part of speech transcription pipelines, with profanity masking, for audio/text in multiple languages. 
developers.deepgram.com | If your “search input” is text it may be overkill; but good if you also deal with voice or other input.

### ⚠️ Key considerations

When selecting/implementing one, here are things to watch out for / plan for:

- **Language & locale coverage**: Does the API support the languages your users use (including dialects, romanization, slang, code-mixing)? Many services focus mostly on English, Spanish, etc. You might have to augment or train something yourself for less common or mixed languages.

- **False positives / negatives**: Some profanity or “bad” words are context dependent, even in the same language (tone, usage, etc.). Also, some words may be harmless in some cultures but offensive in others.

- **Obfuscation / attempts to bypass filters**: Users often try to mask bad words (e.g. “f#ck”, “f*ck”, foreign scripts, use of spaces or punctuation). You’ll want something robust or allow you to expand/maintain block-lists or use ML models.

- **Latency & cost**: Checking every user search in real time can become expensive / slow depending on scale. Maybe you don’t need a full ML API for every query — perhaps a lightweight filter, or cache of known good/bad terms might help.

- **Privacy / compliance**: You're sending user input to third-party services; ensure their data policies are acceptable (GDPR, etc.). For search terms, may not be super sensitive, but still.

- **Moderation vs blocking vs sanitization**: Decide what you’ll do when you detect inappropriate: reject search, sanitize, not store for popular terms, etc. Also store the reason or category (profanity, hate speech, etc.) so you can analyse / tune.

- **Updating / adaptability**: Slang, new insult terms show up all the time — ensure whatever system you use is maintainable, allows you to add new terms or retrain or tweak thresholds.

### 🤔 Possible custom / open-source alternatives

If none of the third-party ones meet your language / performance / cost requirements, you could build or integrate:

- A small ML model (e.g. using transformer or a fine-tuned open-source model) for “toxicity detection” / “hate speech detection” in multiple languages.

- Maintain your own blocklist / allowlist; maybe combined with ML.

- Use open datasets (or multilingual ones) + open-source tools like some of the models in the literature for multilingual hate speech detection. (Some academic work shows good results across multiple languages for hate/offensive detection). 

If you like, I can compare a few of these in more detail (cost, language support, integration effort) and pick ones that might work well for your app (given your region, expected user base). Do you want me to pull those together for you?

> Maybe a simpler way is to rate limit somene who is continually searching in an attempt to save the same bad words

Yes — that’s often the simpler and cheaper approach compared to running every search through a moderation API.

Instead of fully classifying the text, you can:

1. **Maintain a blocklist (swear words, slurs, etc.)**

- Store a small dictionary of known offensive terms (expandable over time).
- If a search matches, don’t save it to “popular searches.”
- Optionally increment a “bad search counter” for that user.

2. **Rate limit based on abuse attempts**

- If a user repeatedly tries to search with blocked terms, slow them down or temporarily suspend search.
- Example:
  - 1st time → ignore silently (just don’t save to popular searches).
  - 2nd/3rd time in a short window → add a cooldown (e.g. 30s before next search).
  - Repeated abuse → block search for X minutes or flag the account.

3. **Edge: avoid false positives**

- Keep the blocklist minimal to start (obvious slurs/profanity).
- For words with multiple meanings, consider context or allow them unless clearly used abusively.
- This reduces the risk of “innocent” searches being blocked.

4. **Hybrid model**

- Lightweight blocklist filter for the majority of cases.
- Optionally, run suspicious or borderline terms through a moderation API (to catch creative bypasses, multi-language issues, etc.).

🔧 Implementation idea (pseudo-flow):

```python
if search_term in blocked_terms:
    increment bad_search_counter(user)
    if bad_search_counter > threshold:
        apply_rate_limit(user)
    do_not_save_to_popular()
else:
    reset bad_search_counter(user)
    save_to_popular()
```

This way you:

- **Don’t pay** for API calls on every query.
- **Still protect** “popular searches” UI.
- **Discourage trolls** by slowing them down.

Do you want me to sketch a Python snippet for a basic blocklist + rate limit system (so you can drop it into your app)?

## The Roasters tab is mostly a duplicate of Discover so let's delete it

## does google local have an API to retrieve store info like hours of operation, address, reviews, etc?

ChatGPT

Yes — Google (via its Maps/Places platform) provides APIs that let you retrieve business / “place” information (address, hours, reviews, etc.). The main one is the Places API (both the “legacy” and newer forms). 

[Places Oveview](https://developers.google.com/maps/documentation/places/web-service/overview) [About the Places API](https://developers.google.com/maps/documentation/places/web-service/op-overview)

Here are the details, capabilities, and caveats you should know:

✅** What Google’s Places / Maps APIs offer**

- The Place Details endpoint lets you fetch detailed info about a place (given its place ID): e.g. full address, phone number, user ratings, reviews, opening hours, etc. [About the Places API (New)](https://developers.google.com/maps/documentation/places/web-service/op-overview?utm_source=chatgpt.com)

- You can also use Nearby Search, Text Search, or Autocomplete to find places and then fetch details. 

- The APIs support fields for “opening_hours,” “current_opening_hours” (including special / holiday hours), and secondary opening hours (e.g. drive-through times) 
[Help users discover more with new Places API updates](https://mapsplatform.google.com/resources/blog/help-users-discover-more-new-places-api-updates/?utm_source=chatgpt.com)

- You can get user reviews (often up to ~5 reviews in the result) and ratings via the “reviews” field (if you request those fields) 
[Working with Google Maps Reviews API](https://elfsight.com/blog/working-with-google-maps-reviews-api)

- Some newer place attributes are supported (e.g. whether a place is wheelchair-accessible, whether it supports takeout/delivery, etc.) 

⚠️ **Caveats, limits, and policy considerations**

- You must enable billing and usage will consume quota / incur costs beyond free tiers.

- You must explicitly request which fields you want — don’t request more than needed.

- Not all data is guaranteed: some places may lack certain attributes (e.g. no reviews, missing hours, etc.).

- There are usage, attribution, and terms of service constraints (you have to follow Google’s branding / usage policies).

- Some data (e.g. “popular times,” real-time live occupancy) is not (or not officially) exposed in the standard APIs. (Third-party scrapers sometimes try to extract those, but that violates terms.)

## Tracking Submittor contact

For my coffee roaster discovery site, I'm trying to think of a good label for a person who submits a roaster to be added to my site and tied to the roaster for attribution. Recommendor doesn't make sense if they don't really recommend the roaster, just telling me about it. Suggestor? Other?

Here are some options that feel natural, neutral, and don’t imply endorsement:

### **Best fits**

* **Contributor** — clean, common, and doesn’t imply approval.
* **Submitter** — very clear; they submitted the roaster.
* **Source** — works well if you want to show “who this information came from.”

### **More personality / community-leaning**

* **Finder** — implies they discovered it and brought it to your site.
* **Spotter** — like “coffee spotter”; nice if your brand leans casual.
* **Scout** — suggests they located the roaster but doesn’t imply they recommend it.

### **If you want a tech-data tone**

* **Reporter** — they reported the roaster’s existence.
* **Originator** — they originated the entry (though a bit formal).

### My recommendation

**Contributor** or **Scout**.

* *Contributor* fits any site, clean and professional.
* *Scout* gives it a community vibe without implying endorsement.

If you tell me the tone you want for the site—professional, fun, coffee-nerdy—I can refine it further.

> I kind of like finder but then also think we could have them be roaster scouts or also like roaster spotter. Finder seems blah but logical. I agree contributor is also logical but no personality. With the others i could have badges down the road if I go more social

If you’re thinking about future badges, community features, and giving the role some personality, then **Scout** and **Spotter** open up the most room for fun.

Here’s how the options stack up with that in mind:

### **Roaster Scout**

⭐ Best blend of personality + clarity

* Implies discovery and exploration
* Easy to build a badge system around (“Senior Scout,” “Master Scout,” etc.)
* Feels like they’re helping expand the map of coffee roasters

### **Roaster Spotter**

* Slightly more playful and casual
* Has a “birdwatcher” vibe — they *spotted* a roaster
* Easy badge names: “Sharp-Eyed Spotter,” “First Spot,” “Top Spotter”

### **Roaster Finder**

* Most literal
* Sounds like a function, not a role
* Works but has less energy

### **My recommendation**

If you want personality and room to grow **without implying endorsement**, go with:

**→ Roaster Scout**
or
**→ Roaster Spotter**

Between the two:

* **Scout** feels more like a recognized role on a platform.
* **Spotter** feels more fun and quirky.

If you want, I can help brainstorm badge names or short descriptions for the role.

> Yeah I think you're right scout

Great choice — **Roaster Scout** hits the sweet spot.

If you ever want to build around it later, here are some things that will slot in naturally:

### **Role Description (optional for your site)**

*A Roaster Scout is someone who discovers new or lesser-known coffee roasters and submits them to help grow our directory.*

### **Future Badge Ideas**

* **First Scout** — for their first submission
* **Trailblazer** — found a roaster in a new city or country
* **Master Scout** — 10+ verified submissions
* **Cartographer** — helped complete detailed info
* **Eagle Eye** — spotted a roaster before it became popular

Just let me know if you want me to generate branding text or microcopy for the role.

- Resources section for coffee roasters #219
# thebeans.ca Resources Feature

## 1. Purpose

Add a **Resources** section to thebeans.ca for useful coffee-related websites, directories, communities, publications, books, videos, research resources, apps, discovery tools, and other content encountered while researching coffee roasters.

Resources serve three purposes:

1. Help visitors explore the wider coffee ecosystem.
2. Give attribution to resources that helped discover roasters listed on thebeans.ca.
3. Preserve useful coffee references without requiring thebeans.ca to reproduce or maintain the third party's data.
    

The primary product remains the roaster directory. Resource maintenance must remain lightweight.

# 2. Navigation

Add:

**Discover → Resources**

The Resources navigation item should appear immediately after Discover.

Routes:

```text
/resources
/resources/[slug]
```

Existing roaster pages should gain a small resource-attribution section:

```text
Discovered through
```

with links to the relevant Resource pages.

# 3. Important Product Rules

### 3.1 Do not copy third-party roaster data

A resource may contain a directory of hundreds of roasters.

thebeans.ca does **not** attempt to reproduce that directory.

Example:

Coffee Insurrection may have hundreds of roasters listed.

If the user discovers 12 roasters through Coffee Insurrection and independently verifies those 12 using the roasters' own websites, only those 12 need to be linked to Coffee Insurrection.

Do not create or maintain a complete:

```text
Resource → every roaster appearing on that resource
```

relationship.

Instead:

```text
Resource → roasters actually discovered through this resource
```

### 3.2 Independent verification remains mandatory

A resource can provide a lead.

The roaster's own website, social account, contact page, location page, etc. must be used to independently verify the roaster record.

The resource is an attribution/discovery source, not the authoritative source for the roaster's thebeans.ca record.

### 3.3 Exact discovery URL should be retained

If a specific page led to the discovery, retain that URL.

Example:

```text
Coffee Insurrection
    ↓
Best Specialty Coffee Roasters in the World
    ↓
Roaster
```

The relationship should retain the specific Coffee Insurrection URL where possible rather than only the site's home page.

### 3.4 Approximate resource counts are observations

Resources may advertise or be observed to contain a certain number of roasters.

Examples:

```text
300+ roasters
400+ roasters
487 roasters
```

Do not treat these as a permanent exact count maintained by thebeans.ca.

Store the value as an attributed, dated observation.

Example:

```text
Approximate coverage: 487 roasters
Observed/published: 2024
Source: RoastGuide
```

If displayed publicly, make the wording clear that it is approximate or historical.

### 3.5 Research notes are not public resource descriptions

Research observations such as:

```text
Google ads pop up
Registration required to suggest a roaster
100 km search returned 12 roasters
```

should not automatically become public content.

Store them as private/admin research notes.

# 4. Resource Data Model

Use one primary `Resource` entity.

Do NOT create separate first-class entities for:

- Platform
- Website
- Directory
- Community
- Article
- Book
- Video
- App
- Blog
- Publication
    
These are attributes/types of a Resource.

The model should remain flexible.

## Resource

Suggested fields:

```text
id
name
slug
url
description
resource_type
platform
state
location
publisher_organization_id
parent_resource_id
email
phone
social_networks
created_at
updated_at
```

### resource_type

Use a small flexible vocabulary rather than forcing every resource into a rigid taxonomy.

Initial values:

```text
website
directory
community
app
article
book
video
blog
publication
research
reference
discovery_tool
```

Allow `other` if required.

### platform

Free/simple controlled value.

Examples:

```text
Web
Reddit
Discord
YouTube
Apple App Store
Wikipedia
```

Platform is deliberately **not** a database entity.

### status

```text
active
archived
inactive
closed
unknown
```

This is particularly useful for resources such as INeedCoffee.com.

### location

Optional.

This describes the resource organization/person/service where appropriate.

It must not be confused with the locations of roasters listed by the resource.

### social_networks

Optional JSON object mapping a social network key to a profile URL, stored as `socialNetworks` (JSONB).

This uses the exact same storage shape, allowed keys, form component and validation as roaster socials, so the two features stay in sync.

Allowed keys:

```text
instagram
tiktok
facebook
linkedin
youtube
threads
pinterest
bluesky
x
reddit
```

Rules:

- Only the keys above are stored; unknown keys are dropped on save.
- Values must be absolute `http`/`https` URLs; empty values are omitted rather than stored as blanks.
- Admin add/edit resource forms render the shared Socials section (`SocialNetworksFields`).

# 5. Resource People

People should be reusable records rather than repeated strings.

Use the existing person model if the application already has one.

If no suitable model exists, create:

```text
Person
-------
id
name
slug
email
website_url
notes
created_at
updated_at
```

Then:

```text
ResourcePerson
--------------
resource_id
person_id
role
```

Initial relationship roles:

```text
founder
creator
maintainer
author
publisher
contact
owner
contributor
```

A person may have more than one role.

Example:

```text
Coffee Review
    → Kenneth Davids
       founder

Coffee Review
    → Ron Walters
       founder

Coffee Review
    → Kim Westerman
       contact
```

Do not build a generalized knowledge graph.

# 6. Resource Organizations

If the existing application already has an organization/company entity, reuse it.

Otherwise Resource can simply contain:

```text
publisher_organization_name
```

Do not create an organization system solely for Resources unless one already exists.

Examples:

```text
World Coffee Research
Alma Coffee
Colonial Coffee
The Coffee Maven
```

may act as publishers/organizations.

Existing roasters can also publish resources.

Example:

```text
Maple Creek Coffee
    publishes
Maple Creek Coffee's Roasting Blog
```

# 7. Parent / Child Resources

A Resource may optionally belong to another Resource.

Use:

```text
parent_resource_id
```

Examples:

```text
World Coffee Research
    └── Sensory Lexicon

The Coffee Maven
    ├── 69 Top Coffee-Producing Countries...
    └── Coffee Roaster - Local...

YouTube
    └── Alma Coffee video
```

Do not create a top-level resource solely because a URL happens to be nested under another site.

Use the relationship when it improves navigation or attribution.

# 8. Resource URL and Social Networks

Each Resource has one primary URL for its main destination. Social profile URLs belong in the Resource's `socialNetworks` field. Do not store additional URLs in a separate resource-link collection.

# 9. Resource → Roaster Relationship

Create:

```text
ResourceRoaster
---------------
id
resource_id
roaster_id
source_url
source_title
discovered_at
notes
```

`source_url` should contain the exact page that led to the discovery when available.

`source_title` is optional.

`discovered_at` records when the relationship was established.

`notes` should normally remain administrative/private.

The relationship means:

> This resource was actually used to discover this roaster for thebeans.ca.

It does **not** mean:

> This roaster is officially listed by or endorsed by this resource.

# 10. Resource Observations

Use a small observation table for changing or historical resource statistics.

```text
ResourceObservation
-------------------
id
resource_id
observation_type
value
observed_at
source_url
notes
```

Initial observation types:

```text
roaster_count
visitor_count
other
```

Examples:

```text
resource = RoastGuide
observation_type = roaster_count
value = 487
observed_at = 2024
```

or:

```text
resource = r/coffeerotation
observation_type = visitor_count
value = 1100
observed_at = 2026-...
```

Do not expose every observation automatically.

# 11. Resource Page

## Mobile-first design

The page should be visually rich and use existing thebeans.ca card styling.

Avoid presenting Resources as a giant conventional table.

On mobile, use horizontally scrollable/snap sections where appropriate.

On desktop, those sections can become grids.

Reuse existing roaster cards rather than inventing a second roaster-card design.

## Resource detail layout

Suggested order:

### Header

```text
Resource name

Short factual description

Type / platform

[Visit resource]
```

Optional:

```text
Active
Archived
```

### About

Description and basic information.

### People

Show linked people where present.

Example:

```text
Kenneth Davids
Founder

Ron Walters
Founder
```

### Coverage

Only display if useful data exists.

Examples:

```text
300+ roasters
```

or:

```text
487 roasters
2024 observation
```

Avoid presenting historical figures as current exact counts.

### Roasters discovered through this resource

Use exactly this conceptually:

> **Roasters discovered through this resource**

Do not call this:

> All roasters from this resource

Use existing roaster cards.

Each card links to the existing thebeans.ca roaster page.

### Related resources

Show parent/child resources or other explicitly related resources when useful.

# 12. Roaster Page Integration

Existing roaster pages should display:

## Discovered through

Example:

```text
Discovered through

Coffee Insurrection
Best Specialty Coffee Roasters in the World
```

Clicking the resource opens:

```text
/resources/coffee-insurrection
```

If an exact source URL exists, provide an external link to it.

This creates the bidirectional relationship:

```text
Resource
   ↓
thebeans.ca roaster

Roaster
   ↓
Resource
```

# 13. Resources Index Page

Route:

```text
/resources
```

Suggested introduction:

```text
Explore the coffee world

Discover the people, communities, publications, tools and other resources that help us learn about coffee and find roasters.
```

Do not make the page feel like an administrative database.

Use visually appealing resource cards.

Each card may contain:

```text
Resource name
short description
type/platform
approximate coverage when available
people/publisher when useful
```

Avoid putting every available field on the card.

# 14. Mobile Interaction

Mobile is the primary design target.

Use horizontal scrolling/snap sections for groups of resources where appropriate.

For example:

```text
Featured resources
[ card ][ card ][ card ] →
```

and:

```text
Roasters discovered through this resource
[ roaster ][ roaster ][ roaster ] →
```

Desktop can use a responsive grid.

Do not implement endless nested carousels.

The interaction should remain easy to understand and accessible.

# 15. API

Follow the existing API conventions.

Suggested endpoints:

```text
GET    /resources
GET    /resources/:slug

POST   /resources
PATCH  /resources/:id
DELETE /resources/:id

POST   /resources/:id/people
DELETE /resources/:id/people/:personId

POST   /resources/:id/links
PATCH  /resources/:id/links/:linkId
DELETE /resources/:id/links/:linkId

POST   /resources/:id/roasters
DELETE /resources/:id/roasters/:roasterId

POST   /resources/:id/observations
DELETE /resources/:id/observations/:observationId
```

Public API responses should expose only fields intended for public display.

Do not expose private research notes.

`POST /resources` and `PATCH /resources/:id` accept an optional `socialNetworks` object (same shape as the roaster endpoints). The server keeps only the allowed network keys with valid `http`/`https` URLs and rejects non-object values.


# 16. Admin Workflow

Adding a Resource should require as little work as possible.

Recommended workflow:

### Step 1 — Create resource

Required:

```text
Name
URL
Resource type
```

Optional:

```text
Description
Platform
Status
Location
Email
Phone
Social networks
Publisher
Parent resource
```

### Step 2 — Add people

Optional.

Select an existing person or create a new one.

Choose relationship:

```text
Founder
Creator
Maintainer
Author
Publisher
Contact
Owner
Contributor
```

### Step 3 — Record approximate coverage

Optional.

Example:

```text
487
Roaster count
2024
```

### Step 4 — Link discovered roasters

Only add roasters actually discovered through the resource.

Select an existing roaster.

Optionally enter:

```text
Source URL
Source title
```

This should take seconds, not require maintaining a complete third-party directory.

# 17. Privacy / Notes

Separate:

### Public information

Suitable for visitors:

- resource description
- URL
- people
- publisher
- location
- resource type
- platform
- status
- appropriately qualified coverage observations
- discovered-through relationships

### Private/admin information

Not displayed publicly:

- research notes
- search results observed during research
- subjective opinions
- advertising observations
- registration frustrations
- temporary verification notes
- internal decisions about whether a resource is useful
    

If the existing admin system has a notes field, reuse it.

# 18. Attribution Semantics

There are two different attribution paths and they must not be confused.

### Resource discovery

Example:

```text
Reddit post
    ↓
Coffee Insurrection
```

This says the Reddit post helped the user discover Coffee Insurrection.

### Roaster discovery

Example:

```text
Coffee Insurrection
    ↓
Roaster
```

This says Coffee Insurrection helped the user discover the roaster.

These should be independently recordable.

A Resource may itself have been discovered through another Resource or external source.

# 19. Seed Data

The following seed data is based on the examples supplied during the design discussion.

Important:

**Treat these records as research seeds, not automatically verified production facts.**

The existing thebeans.ca verification rules still apply. Do not invent missing fields. Fields not supplied should remain blank/null until independently verified.

## 19.1 Coffee Insurrection

```yaml
name: Coffee Insurrection
slug: coffee-insurrection
url: https://www.coffeeinsurrection.com
resource_type: website
platform: Web
status: active
location: Italy
description: ""
```

People:

```yaml
- name: Tanya Nanetti
  role: creator

- name: Endri Nonaj
  role: creator
```

Social URLs supplied:

```text
https://www.facebook.com/
https://www.instagram.com/
https://www.linkedin.com/
https://x.com/
```

These require verification of the exact Coffee Insurrection profiles before production import.

Discovery relationship:

```text
discovered_through:
  source: Reddit
```

## 19.2 Reddit — r/pourover

```yaml
name: r/pourover
slug: r-pourover
url: https://www.reddit.com/r/pourover/
resource_type: community
platform: Reddit
status: active
description: ""
```

## 19.3 Reddit — r/espresso

```yaml
name: r/espresso
slug: r-espresso
url: https://www.reddit.com/r/espresso/
resource_type: community
platform: Reddit
status: active
description: ""
```

## 19.4 Reddit — r/coffee_roasters

```yaml
name: r/coffee_roasters
slug: r-coffee-roasters
url: https://www.reddit.com/r/coffee_roasters/
resource_type: community
platform: Reddit
status: active
```

## 19.5 Discord — Espresso Aficionado Community

```yaml
name: Espresso Aficionado Discord
slug: espresso-aficionado-discord
url: https://discord.com/invite/mysterycoffeeleague
resource_type: community
platform: Discord
status: active
```

## 19.6 Google Maps

```yaml
name: Google Maps
slug: google-maps
url: https://maps.google.com/
resource_type: discovery_tool
platform: Web
status: active
```

Private research note:

```text
Useful for geographic roaster discovery. User reports it works better for this purpose than plain Google search. Do not publish subjective comparison.
```

## 19.7 RoastGuide

```yaml
name: RoastGuide
slug: roastguide
url: https://apps.apple.com/gb/app/roastguide/id1454418262
resource_type: app
platform: Apple App Store
status: active
description: ""
```

Observation:

```yaml
- observation_type: roaster_count
  value: 487
  observed_at: 2024
  notes: Reported/supplied as the number of roasters worldwide as of 2024.
```

## 19.8 r/coffeerotation

```yaml
name: r/coffeerotation
slug: r-coffeerotation
url: https://www.reddit.com/r/coffeerotation/
resource_type: community
platform: Reddit
status: active
```

Person:

```yaml
name: DannyyDo
role: contributor
```

Observation supplied:

```yaml
- observation_type: visitor_count
  value: 1100
  observed_at: ""
  notes: User supplied weekly visitor figure; verify date before publication.
```

Creation date supplied:

```text
2024-10-31
```

Store as a community metadata field only if the application already supports creation dates, otherwise retain it as a dated observation.

## 19.9 Roastful

```yaml
name: Roastful
slug: roastful
url: https://www.roastful.com/
resource_type: website
platform: Web
status: active
email: hello@roastful.com
description: ""
```

## 19.10 LoffeeLabs

```yaml
name: LoffeeLabs
slug: loffeelabs
url: https://www.loffeelabs.com/roasters-registry/
resource_type: directory
platform: Web
status: active
location: Oahu, Hawaii, USA
email: loffeelabs@gmail.com
description: ""
```

Social networks:

```yaml
instagram: https://www.instagram.com/loffeelabs/
youtube: https://www.youtube.com/@LoffeeLabs
```

Notes for verification:

```text
The supplied site text says the organization is located on Oahu and holds meetups with fellow coffee lovers.
```

## 19.11 CoffeeDrippd

```yaml
name: CoffeeDrippd
slug: coffeedrippd
url: https://coffeedrippd.com/
resource_type: discovery_tool
platform: Web
status: active
location: Reykjavik, Iceland
email: support@coffeedrippd.com
description: ""
```

Social networks:

```yaml
linkedin: https://www.linkedin.com/company/coffeedrippd/about/
```

Private research observation:

```text
User tested a 100 km search and observed 12 roasters in NY. Do not publish without date/context.
```

## 19.12 CoffeeRoast

```yaml
name: CoffeeRoast
slug: coffeeroast
url: https://coffeeroast.com/
resource_type: directory
platform: Web
status: active
description: ""
```

Person:

```yaml
name: Theo C.
role: creator
```

Private research notes:

```text
Google authentication observed.
User reports advertising popups.
User reports that suggesting a roaster requires registration.
Do not publish these as resource facts unless independently verified and deliberately selected for publication.
```

## 19.13 Coffee Review

```yaml
name: Coffee Review
slug: coffee-review
url: https://www.coffeereview.com
resource_type: publication
platform: Web
status: active
location: Berkeley, CA, USA
description: ""
```

People:

```yaml
- name: Kenneth Davids
  role: founder

- name: Ron Walters
  role: founder

- name: Kim Westerman
  role: contact
  email: Kim@CoffeeReview.com
```

Address supplied:

```text
2625 Alcatraz Avenue
Berkeley, CA 94705
USA
```

Features supplied:

```text
Chinese translations
```

Historical/publication claims supplied by Coffee Review should be independently verified before being used as public resource description.

## 19.14 World Coffee Research

```yaml
name: World Coffee Research
slug: world-coffee-research
url: https://worldcoffeeresearch.org
resource_type: research
platform: Web
status: active
description: ""
```

Child resource:

```yaml
name: Sensory Lexicon
slug: world-coffee-research-sensory-lexicon
url: https://worldcoffeeresearch.org/resources/sensory-lexicon
resource_type: reference
platform: Web
status: active
parent_resource: world-coffee-research
```

# 20. Books

## The Fair Trade Scandal

```yaml
name: The Fair Trade Scandal
slug: the-fair-trade-scandal
url: https://www.ohioswallow.com/9780821420928/the-fair-trade-scandal/
resource_type: book
platform: Web
status: active
```

Person:

```yaml
name: Noonco Sylla
role: author
```

## Organic Coffee

```yaml
name: Organic Coffee
slug: organic-coffee
url: https://www.ohioswallow.com/9780896802476/organic-coffee
resource_type: book
platform: Web
status: active
```

Person:

```yaml
name: Maria Elena Martinez-Torres
role: author
```

## Holy Grounds

```yaml
name: Holy Grounds - The Surprising Connection between Coffee and Faith
slug: holy-grounds
url: https://www.amazon.com/Holy-Grounds-Surprising-Connection-between/dp/1506448232
resource_type: book
platform: Web
status: active
```

Person:

```yaml
name: Tim Schenck
role: author
```

# 21. Articles

## 69 Top Coffee-Producing Countries From A To Z

```yaml
name: 69 Top Coffee-Producing Countries From A To Z (That Means Angola To Zimbabwe)
slug: 69-top-coffee-producing-countries
url: https://www.thecoffeemaven.com/guide/top-coffee-producing-countries
resource_type: article
platform: Web
status: active
```

Person:

```yaml
name: Bryan De Luca
role: author
```

Publication date:

```text
2021-09-07
```

Parent resource:

```text
The Coffee Maven
```

## Coffee Roaster - Local - Coffee Roastery Near You

```yaml
name: Coffee Roaster - Local - Coffee Roastery Near You. Find Your Local Coffee Roaster
slug: coffee-roaster-local
url: https://www.thecoffeemaven.com/coffee-roaster-local
resource_type: article
platform: Web
status: active
```

Person:

```yaml
name: Bryan Harrington
role: author
```

Parent resource:

```text
The Coffee Maven
```

## 10 Steps to Coffee

```yaml
name: 10 Steps to Coffee
slug: 10-steps-to-coffee
url: https://www.colonialcoffee.ca/10steps
resource_type: article
platform: Web
status: active
```

Parent resource:

```text
Colonial Coffee
```
## What is Coffee?

```yaml
name: What is Coffee?
slug: what-is-coffee
url: https://www.colonialcoffee.ca/whatiscoffee
resource_type: article
platform: Web
status: active
```

Parent resource:

```text
Colonial Coffee
```

## Coffee around the world

```yaml
name: Coffee around the world
slug: coffee-around-the-world
url: https://www.colonialcoffee.ca/coffeearoundtheworld
resource_type: article
platform: Web
status: active
```

Parent resource:

```text
Colonial Coffee
```
# 22. INeedCoffee.com

```yaml
name: INeedCoffee.com
slug: ineedcoffee
url: https://ineedcoffee.com/section/
resource_type: publication
platform: Web
status: archived
description: ""
```

Person:

```yaml
name: @digitalcolony
role: maintainer
```

GitHub identity supplied:

```text
@digitalcolony
```

Do not imply that the site is currently maintained.

# 23. Video

## What Does Coffee Processing Look Like?

```yaml
name: What Does Coffee Processing Look Like? | Video Walkthrough
slug: what-does-coffee-processing-look-like
url: https://www.youtube.com/watch?v=Ux98IXer_UE
resource_type: video
platform: YouTube
status: active
```

Parent/channel resource:

```yaml
name: Alma Coffee
slug: alma-coffee-youtube
url: https://www.youtube.com/@myalmacoffee
resource_type: website
platform: YouTube
status: active
```

Organization:

```text
Alma Coffee
```

# 24. Maple Creek Coffee's Roasting Blog

```yaml
name: Maple Creek Coffee's Roasting Blog
slug: maple-creek-coffee-roasting-blog
url: https://maplecreekcoffee.ca/blog
resource_type: blog
platform: Web
status: active
```

Publisher:

```text
Maple Creek Coffee
```

If Maple Creek Coffee already exists as a roaster in the database, link the Resource to that roaster rather than creating a duplicate organization.

Relationship:

```text
Maple Creek Coffee
    publishes
Maple Creek Coffee's Roasting Blog
```

# 25. Commonly Coffee Blog

```yaml
name: Commonly Coffee Blog
slug: commonly-coffee
url: https://commonlycoffee.com
resource_type: blog
platform: Web
status: active
description: ""
```

# 26. Wikipedia — Economics of Coffee

```yaml
name: Economics of coffee
slug: wikipedia-economics-of-coffee
url: https://en.wikipedia.org/wiki/Economics_of_coffee
resource_type: reference
platform: Wikipedia
status: active
```

# 27. Seed Data Implementation Rules

The seed data should be imported as a development/research dataset first.

Do not silently convert user-supplied information into verified production data.

For every field:

```text
verified = true
```

only after the normal thebeans.ca verification process has independently confirmed it.

For missing information:

```text
NULL
```

not:

```text
unknown
N/A
guess
```

unless the application specifically needs a status value.

Do not fabricate:

- emails
- phone numbers
- founders
- addresses
- social URLs
- dates
- descriptions
- organization relationships

# 28. Search / Filtering

Do not initially build an elaborate filtering system.

Resources should be searchable by:

```text
name
description
resource type
platform
```

Optional future filtering:

```text
country/location
has roaster discoveries
```

Do not make categories the central navigation mechanism.

The content itself should drive discovery.

# 29. Localization

Resources should use the existing i18next architecture.

Resource database content should initially be stored in its original factual form.

UI strings must be localized through the existing translation system.

Examples:

```text
Resources
Explore the coffee world
Visit resource
People
Roasters discovered through this resource
Related resources
Discovered through
```

Do not create a separate translation architecture just for Resources.

# 30. Accessibility

Required:

- keyboard-accessible resource cards
- visible focus states
- semantic headings
- accessible external-link indicators
- horizontal scrolling must work without a mouse
- cards must not rely solely on hover
- adequate touch target sizes
- screen-reader-friendly section labels
- no auto-advancing carousels

# 31. Performance

Resources should not cause the application to load all associated roasters at once.

Resource list:

```text
load resource summary
```

Resource detail:

```text
load resource
load people
load discovered roasters
```

Use existing React Query patterns.

Use pagination or lazy loading if a resource eventually has a large number of discovered roasters.

Images should not be required for a Resource record.

Do not introduce image scraping.

# 32. Security

Admin operations must use the existing authentication/authorization system.

Public users must not be able to:

- create resources
- modify resources
- add discovery relationships
- modify observations
- view private research notes

Validate URLs before storing them.

External links should open safely according to existing application conventions.

# 33. Non-Goals

Do not build:

- a generalized knowledge graph
- a complete mirror of third-party directories
- automatic scraping of resource websites
- automatic synchronization with third-party directories
- a social network for resource owners
- a review/rating system for resources
- resource rankings
- resource quality scores
- complex platform entities
- an exhaustive taxonomy
- a second independent roaster database

The purpose is **curation, discovery and attribution**.

# 34. Acceptance Criteria

### Navigation

- Resources appears immediately after Discover.
- `/resources` works.
- `/resources/[slug]` works.

### Resources

- Resources can be created and edited by an administrator.
- Each Resource has a name, URL, type and lifecycle state.
- Platform is a simple Resource attribute.
- Resources can optionally have people.
- Resources can optionally have a publisher/organization.
- Resources can optionally have a parent Resource.
- Resources can have dated observations.
- Resources can optionally have social network links, using the same fields, storage and validation as roasters.
- Resources can be archived without deleting historical attribution.

### Discovery attribution

- A Resource can be linked to an existing roaster.
- The relationship can retain the exact source URL.
- Resource pages display “Roasters discovered through this resource.”
- Roaster pages display “Discovered through.”
- No requirement exists to enumerate every roaster contained by a third-party resource.

### Data quality

- No third-party roaster information is automatically copied into the roaster database.
- Missing information remains blank/null.
- No unverifiable data is fabricated.
- Approximate/historical counts are dated and attributed.
- Private research notes are not exposed publicly.

### UX

- Mobile-first layout.
- Existing roaster cards are reused.
- Resource cards are visually consistent with thebeans.ca.
- Horizontal sections work on mobile.
- Desktop uses an appropriate responsive layout.
- No inaccessible carousel behavior.

### Localization

- Resource UI strings use i18next.
- Existing language-selector architecture remains unchanged.
    
# 35. Recommended Implementation Order

Implement in this order:

```text
1. Database migration
2. Resource model
3. Resource/person relationships
4. Resource/roaster relationships
5. Resource observations
6. API endpoints
7. Admin UI
8. /resources index
9. /resources/[slug] detail page
10. Roaster "Discovered through" section
11. Seed development data
12. Responsive/mobile refinement
13. Localization
14. Accessibility testing
15. Production verification/import
```

The initial production version should deliberately remain small. The most important capability is:

```text
Resource
   ↓
specific source page
   ↓
roaster discovered
   ↓
verified independently
   ↓
thebeans.ca roaster page
```

That attribution chain provides the practical value without creating a maintenance-heavy directory of directories.

# 36. Current Implementation Status

The Resources feature is implemented as a first production slice.

## Public experience

- `Discover -> Resources` is available in the desktop and mobile navigation.
- `/resources` displays resource cards with type, platform, location, description, and discovered-roaster counts where available.
- `/resources/[slug]` displays resource details, social profiles, people, coverage observations, and roasters discovered through the resource. Parent and child resource data is available in the API response for future public navigation.
- Resource detail pages show the primary URL beside social profiles. Back and Edit actions appear below the resource details; Back uses browser history and falls back to `/resources` for direct visits.
- External links use a new tab and safe opener settings.
- Existing `RoasterCard` components are reused for discovered roasters.
- Roaster detail pages display `Discovered through` links and exact source-page links when recorded.

## Data and API

The Prisma schema and migration include:

- `Resource`
- `Person`
- `ResourcePerson`
- `ResourceRoaster`
- `ResourceObservation`

Public endpoints are available at:

```text
GET /api/resources
GET /api/resources/:slug
```

Administrator-only endpoints support resource creation, updates, archival, people, discovered-roaster relationships, and observations. Archived resources are retained so historical attribution is not deleted. Private resource notes, relationship notes, and person notes are removed from public responses.

Resource and source URLs are restricted to HTTP and HTTPS. Empty successful responses such as archive operations are handled by the shared client API without attempting to parse an empty JSON body.

## Admin workflow currently available

The admin Resources page supports:

- Creating a resource with name, generated slug, URL, resource type, platform, and description.
- Archiving an existing resource.
- Platform selection from `Web`, `Reddit`, `Discord`, `YouTube`, `Wikipedia`, `Apple App Store`, and `Google Play Store`.
- URL-based platform inference with manual override.
- Platform-to-type inference in the create and edit forms: `Web` sets `website`, `Reddit` and `Discord` set `community`, `YouTube` sets `video`, and `Apple App Store` and `Google Play Store` set `app`.
- Resource type pills use clearly distinct, high-contrast colors by type across public cards, detail pages, and the admin table. The palette must remain readable in light and dark mode and must not collapse into one nearly identical color.
- Automatic URL-safe slug generation from the name, including numeric suffixes for collisions.
- A multi-line description field at the bottom of the form.
- A Resource list using the established admin table layout with name, type, platform, state, and actions.
- The admin list is the default view; the creation form opens from a green `Add resource` button and closes after saving or cancellation.
- Resource names in the admin table open `/admin/resources/[id]` for editing instead of opening the external resource URL. The edit page supports core metadata, platform, type, description, lifecycle state, and save.
- The edit Resource form has only a Save action. After a successful save, it returns to the Admin Resources list, matching the navigation behavior of the other admin editors.
- Edit Resource includes a searchable lookup of existing roasters to select the roaster providing the resource. The public resource detail page displays that provider as a link to the roaster page. The separate “Roasters discovered through this resource” UI is not part of the current Resource workflow.
- Reversible resource deprecation. Deprecation sets the lifecycle state to `archived` and retains attribution; administrators can undeprecate a resource to restore its `active` state and public visibility.
- Resource lifecycle is stored as `state` (`active`, `archived`, `inactive`, `closed`, or `unknown`).

The relationship and observation API is available for administrative tooling. Dedicated admin controls for adding people, observations, and discovered roasters remain follow-up work.

## Seed data

The supplied research seed records are included in `server/prisma/seed.ts`, including resources, social profiles, people, observations, parent relationships, lifecycle states, and private research notes. Missing values remain null. The seed does not create third-party roaster records or imply independent verification.

## Localization and current UX scope

Resource UI strings are present in English and French through the existing i18next files. The public index uses the established centered, large purple gradient heading style. The current index and detail layouts use responsive grids; a dedicated horizontal snap carousel has not been added.
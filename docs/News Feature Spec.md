Below is a Copilot-ready product/technical spec. I’ve included the reasoning behind the feature so the implementation decisions have context rather than just a list of requirements.

# thebeans.ca — Coffee News & People

## Product & Technical Specification v1

## 1. Purpose

Add a **Coffee News** section to thebeans.ca that helps consumers discover what is happening in the coffee world, understand why particular stories matter, and discover the people and roasters behind those stories.

The feature should eventually support a lightweight **People** section using a sports-card-inspired presentation for interesting people in coffee.

The goal is **not** to build another generic news aggregator, coffee industry publication, social network, or ethical-coffee certification service.

The goal is to strengthen the core purpose of thebeans.ca:

> **Help coffee consumers discover roasters, coffee, origins, and the people behind them.**

The feature should encourage useful discovery and repeat visits because the content is genuinely interesting and useful—not through addictive engagement mechanisms, infinite scrolling, artificial urgency, or gamification.

---

# 2. Why this feature exists

thebeans.ca currently helps people answer:

> "Where can I find coffee from interesting roasters?"

News can expand that question to:

> "What's happening in the coffee world, and who are the people behind it?"

There is a large human ecosystem behind every bag of coffee:

* coffee producers and farmers
* green coffee buyers
* importers
* roasters
* founders
* baristas
* researchers
* educators
* writers
* equipment developers
* other people who influence how coffee is grown, traded, roasted and consumed

Thebeans.ca should help consumers discover that ecosystem.

This is particularly important because coffee is more than brands and products. Stories about relationships between roasters and producers, sourcing decisions, changes in coffee-growing regions, new roasting approaches, and the people doing interesting work can give consumers a better understanding of the coffee they buy.

The site can be interested in issues such as producer wellbeing, fair relationships and the history of exploitation in coffee without positioning itself as an organization that certifies businesses as "ethical."

**Thebeans.ca should document and connect publicly available information, not determine which coffee companies are good or ethical.**

For example:

Good:

> The roaster states that it has worked with the cooperative since 2018 and publishes information about the prices it pays.

Avoid:

> This is an ethical roaster.

The first is a documented fact. The second is a judgment/certification that thebeans.ca should not make.

---

# 3. Product philosophy

## 3.1 Useful discovery rather than addictive engagement

The feature should give people reasons to return because there is something worthwhile to discover.

Do not optimize for:

* infinite scrolling
* engagement streaks
* notifications designed to create anxiety
* clickbait
* sensational headlines
* artificial scarcity
* excessive "recommended for you" loops
* gamification
* maximizing time on site

Instead optimize for:

* useful information
* interesting people
* meaningful discovery
* connections between stories, people, roasters and origins
* high-quality sources
* clear attribution
* helping consumers explore coffee

A useful internal principle is:

> **Don't optimize for time spent. Optimize for useful discoveries.**

---

# 4. The consumer journey

The feature should create a natural discovery path:

**News → Story → Person → Roaster → Coffee → Origin → More discovery**

For example:

1. A user sees an article about a roaster's relationship with Ethiopian producers.
2. The user reads the short summary on thebeans.ca.
3. The story identifies the roaster and, where appropriate, a person involved.
4. The user visits the roaster's thebeans.ca profile.
5. The user discovers that the roaster sources from Ethiopia.
6. The user explores other roasters sourcing Ethiopian coffee.

The original publisher remains the source of the article. thebeans.ca provides the **consumer-oriented context and discovery layer** around it.

---

# 5. News scope

News is **consumer-focused coffee news**.

Include stories that are likely to be useful or interesting to people who buy coffee.

### Roaster news

Examples:

* new roasters
* roaster openings
* closures
* significant collaborations
* notable new initiatives
* changes in ownership when relevant
* meaningful changes in sourcing
* significant product or roasting developments
* notable awards or competitions when genuinely relevant

Awards and championships may be included, but **they should not become the editorial focus of the section**.

Thebeans.ca is interested in the people and coffee behind those achievements, not in creating a leaderboard of coffee professionals.

### Origin and sourcing

Examples:

* harvest conditions
* crop problems
* climate/weather effects
* producer stories
* farming developments
* processing developments
* sourcing relationships
* producer cooperatives
* changes affecting specific origins
* traceability
* meaningful developments in producer/roaster relationships

### Industry

Include developments that affect coffee consumers or the coffee available to them:

* coffee prices
* tariffs
* supply issues
* regulations
* major market changes
* significant sustainability developments
* industry changes that affect availability or pricing

Avoid industry news that is purely corporate or financial unless it has a meaningful consumer/coffee impact.

### Brewing

Include useful developments involving:

* brewing techniques
* brewing research
* equipment
* extraction
* preparation
* consumer-facing coffee science

---

# 6. What should not be included

Exclude:

* café-only news where the business does not roast
* generic restaurant news
* unrelated food news
* corporate announcements with no meaningful coffee relevance
* promotional content that provides no useful information
* low-quality clickbait
* duplicate stories
* stories where coffee is only mentioned incidentally
* content primarily intended for industry professionals unless it has consumer value

The question should be:

> **Would a person who enjoys buying and drinking coffee be glad they saw this?**

---

# 7. Source policy

Use a **hand-maintained source allowlist**.

There should be no open-ended web crawling.

Every source must be manually added and reviewed before it can provide content.

The source review should consider:

* accessibility
* paywall
* advertising load
* editorial quality
* relevance to coffee consumers
* tone
* reliability
* RSS/Atom feed quality
* licensing/copyright considerations
* whether the source regularly produces useful content

A source should not be automatically added because an article happens to appear in search results.

---

# 8. News source model

Create:

```text
news_sources
```

Fields:

```text
id
name
site_url
feed_url
logo_url
enabled
reviewed_at
notes
last_success_at
last_failure_at
consecutive_failures
created_at
updated_at
```

### Notes

`notes` is an administrative field for information such as:

* paywall observations
* advertising observations
* source-quality notes
* feed-specific issues
* editorial considerations

Do not expose administrative notes publicly.

---

# 9. News item model

Create:

```text
news_items
```

Fields:

```text
id
source_id
title
url
excerpt
why_it_matters
published_at
topic
roaster_id
status
fetched_at
reviewed_at
rejected_reason
created_at
updated_at
```

### URL

`url` must be the canonical article URL.

It must be unique.

Deduplicate by canonical URL.

### Excerpt

Strip HTML.

Do not store the full article.

Target approximately 200 characters.

The excerpt should help the user understand what the article is about without reproducing the article.

### why_it_matters

This is an important consumer-oriented field.

Where practical, provide a short explanation of why the story matters to a coffee consumer.

Example:

> Changes in Brazil's harvest could affect the availability and pricing of coffees from the world's largest coffee-producing country.

This should be factual and should not exaggerate importance.

Do not simply rewrite the headline.

---

# 10. Topic taxonomy

Use a small fixed set:

```text
roaster-news
origin-sourcing
industry
brewing
```

Do not create arbitrary topics for every article.

URLs:

```text
/news
/news?topic=origin-sourcing
/news/origin-sourcing
```

Either filtering URL approach is acceptable, but use a consistent canonical URL strategy for SEO.

Topic names displayed to users can be friendlier than the internal slugs:

* Roaster News
* Origin & Sourcing
* Industry
* Brewing

---

# 11. Roaster association

A news item may optionally reference a roaster already in the thebeans.ca directory.

Use:

```text
roaster_id
```

nullable.

This is a major reason for building News into thebeans.ca rather than using a generic RSS reader.

Example:

> Article: "Toronto roaster expands its direct sourcing program"

If the roaster is in the directory, the article can provide:

> **Explore this roaster on thebeans.ca →**

The roaster association should initially be treated as a **suggested match requiring confidence/review**, rather than blindly linking based on a name match.

Avoid matching similarly named businesses without sufficient evidence.

---

# 12. People association

Design the data model so that News can eventually connect to People.

Do not build a large People database in v1.

A future news item may have relationships such as:

```text
news_item → person
news_item → roaster
news_item → origin
```

For v1, it is acceptable to implement only the person relationship necessary to support the initial People feature.

The architecture should not make adding this relationship later difficult.

---

# 13. People — product concept

The eventual People section should be inspired by the **sports trading-card concept**.

The metaphor is about:

* recognizable people
* attractive presentation
* discoverability
* collecting/remembering interesting people
* seeing someone's coffee journey

It is **not** about:

* scores
* rankings
* leaderboards
* artificial statistics
* declaring who is the "best"
* gamification

A person should be interesting because of their contribution or story, not because thebeans.ca assigns them a numerical value.

---

# 14. People should remain lightweight

Do not attempt to create a comprehensive database of everyone in coffee.

That would create a substantial ongoing research and maintenance burden.

Instead:

> **Create a People profile when there is a good reason to feature that person.**

Examples:

* they are frequently mentioned in News
* they are an interesting person behind a directory roaster
* they have an interesting coffee career
* they have meaningful involvement with coffee producers
* they have contributed significant research or education
* they have an interesting documented story

Fifty genuinely interesting people is better than thousands of poorly maintained profiles.

---

# 15. Lightweight People data model

A future `people` table can start with:

```text
people
  id
  name
  photo_url
  title
  bio
  roaster_id
  created_at
  updated_at
```

Optional:

```text
social_urls
```

Only store information that can be supported by public sources.

Do not guess.

---

# 16. Career history

A particularly useful optional feature is a person's documented coffee career.

Example:

```text
person_career
  id
  person_id
  roaster_id
  role
  from_year
  to_year
  source_url
```

Example presentation:

> **Coffee career**
>
> 2014–2017 — Roaster A · Roaster
> 2017–2020 — Roaster B · Green Coffee Buyer
> 2020–present — Roaster C · Founder

If dates are not publicly documented, do not invent them.

It is acceptable to show:

> Previously — Roaster B · Green Coffee Buyer

with a source.

Career history should only be maintained when the information is publicly available and sufficiently reliable.

---

# 17. People card UI

The card should visually evoke a modern coffee trading card.

### Front

Show:

* portrait
* person's name
* current title
* current roaster/company
* roaster logo where appropriate

Example:

```text
┌────────────────────────────┐
│                            │
│         PORTRAIT           │
│                            │
│                            │
│       Jane Smith           │
│       Founder & Roaster    │
│                            │
│       Roaster Name         │
│                            │
└────────────────────────────┘
```

### Profile/back/detail view

Show:

* short biography
* current role
* coffee career, if documented
* related roaster
* related News
* social links where appropriate
* relevant coffee origins/connections where supported

Keep it visually rich without requiring a large amount of data.

---

# 18. People are not certifications

Do not create fields such as:

```text
ethical
ethical_score
farmer_friendly
sustainability_score
best_roaster
```

Do not imply that inclusion in the People section means that thebeans.ca endorses the person or company.

If a person or roaster has documented practices relating to producer relationships, sustainability, sourcing, etc., describe the publicly documented facts.

The user decides what those facts mean.

---

# 19. News ingestion

Use a scheduled server-side job.

Initial target:

**hourly**

The implementation should support changing the schedule later.

For each enabled source:

1. Fetch its RSS/Atom feed.
2. Use conditional requests where supported:

   * ETag
   * Last-Modified
3. Respect per-source rate limits.
4. Parse feed entries.
5. Extract:

   * title
   * canonical URL
   * publication date
   * source
   * description/excerpt
6. Strip HTML.
7. Truncate excerpt to approximately 200 characters.
8. Deduplicate by canonical URL.
9. Run filtering/classification.
10. Publish or place into review.
11. Record fetch status.

Do not store full article text.

---

# 20. Automated filtering

Every item should undergo:

### Profanity check

Check:

* title
* excerpt
* `why_it_matters`

Anything failing the check should not automatically publish.

### Coffee relevance

Determine whether the article is meaningfully about coffee.

### Consumer relevance

Determine whether the article is useful or interesting to coffee consumers.

### Topic classification

Assign one of the fixed topics.

### Roaster matching

If the story mentions a known directory roaster, attempt to identify the roaster.

Low-confidence matches go to review.

---

# 21. Review queue

The review queue is important because automated classification should not be trusted blindly.

Initially, **the site owner manually reviews low-confidence items**.

Admin interface should make it easy to:

* publish
* reject
* edit title
* edit excerpt
* edit `why_it_matters`
* change topic
* assign/remove roaster
* assign/remove person
* hide an already published item
* disable a source

A rejection reason should be recorded where practical.

Example:

```text
not coffee relevant
duplicate
low consumer value
poor source quality
incorrect roaster match
profanity
```

---

# 22. Failure handling

Feed failures should be logged.

Retry failed sources using backoff.

Track:

```text
last_success_at
last_failure_at
consecutive_failures
```

A source that repeatedly fails should eventually be disabled automatically or flagged for administrative attention.

Do not silently stop ingesting a source.

---

# 23. News UI

The primary page should be:

```text
/news
```

The page should be mobile-first.

### Header

Suggested positioning:

> **Coffee News**

Supporting text:

> Stories about the people, places and ideas behind the coffee you drink.

Avoid describing it as "industry news" because the audience is consumers.

---

# 24. Featured stories

Do not create an infinite stream.

Use a curated/selected group of prominent stories followed by the latest news.

A featured story can include:

* title
* short excerpt
* why it matters
* topic
* publication date
* source name
* source logo
* related roaster/person where applicable

The exact featured-selection algorithm can be simple initially.

Manual selection is acceptable for v1 if it keeps quality high.

---

# 25. News cards

Cards should match the visual language of `/resources`.

Each card should show:

* title
* excerpt
* topic chip
* date
* source name
* source logo
* roaster/person connection where applicable

Do not use publisher article images in v1.

Instead:

> **source logo + tinted background**

This provides consistent presentation while avoiding unnecessary publisher-image rights/permission issues.

---

# 26. Article links

The entire card should link to the original publisher.

Open the article in a new tab.

Use:

```html
target="_blank"
rel="noopener"
```

Always show the publisher/source clearly.

The site should not attempt to reproduce the article.

Footer/page-level wording:

> **Headlines link to their original publishers.**

---

# 27. Attribution

Every published item must include:

* source name
* source link

No exceptions.

The publisher should be visually obvious.

Do not make the user click through several layers to discover where the story originated.

---

# 28. Report / removal

The News section should provide a visible:

> **Report / request removal**

contact mechanism.

Admin must be able to immediately hide:

* an individual news item
* an entire source

Removing an item from public display should not require deleting the underlying record.

Prefer:

```text
status = rejected
```

or another administrative hidden state rather than destructive deletion.

---

# 29. Publisher images

**v1 decision: no publisher article images.**

Do not fetch, cache, proxy, or display publisher photographs in v1.

Use source logos and consistent backgrounds instead.

A future permission-based image system can be added if there is a clear benefit.

---

# 30. Accounts

Do not require an account to read News.

Public:

* full News section
* topic filtering
* source filtering
* article links
* roaster links
* People links

Future account features:

* follow roasters
* follow people
* follow topics
* save News items
* personalized coffee-news feed
* weekly digest

Do not gate headlines behind account registration.

The public News section is useful for discovery and SEO.

---

# 31. Personalization philosophy

Personalization should be based on things the user explicitly chooses to follow.

Examples:

> Follow this roaster

> Follow this person

> Follow Ethiopia

> Follow Origin & Sourcing

This is preferable to an opaque engagement algorithm deciding what the user should see.

The future personalized experience could be:

> **Your Coffee World**

rather than a generic algorithmic "For You" feed.

---

# 32. Digest

Do not implement email digest in v1.

However, design the data model so that it can eventually support a weekly digest.

The eventual digest should be curated rather than simply dumping every article from the database.

Potential structure:

> **This week in coffee**
>
> 5 stories worth knowing about
>
> New people worth discovering
>
> Roasters worth exploring
>
> Coffee origins in the news

The digest should lead back into thebeans.ca's discovery features.

---

# 33. Canadian content

Do not artificially rank Canadian news higher in v1.

Thebeans.ca is Canadian, but the product is intended to help people discover coffee from around the world.

Collect enough usage/content data first.

If useful later, introduce:

* Canada filter
* country filtering
* regional discovery
* user-selected geographic preferences

Do not silently distort the news feed simply because the site is Canadian.

---

# 34. SEO

News should create indexable pages.

Potential structure:

```text
/news
/news/roaster-news
/news/origin-sourcing
/news/industry
/news/brewing
/news/[article-slug]
```

However, do not create thin pages merely for SEO.

An individual News page should provide useful context:

* headline
* excerpt
* why it matters
* source
* publication date
* topic
* relevant roaster
* relevant person
* relevant origin
* link to original article
* related thebeans.ca content

The original publisher should remain clearly identified.

Use canonical URLs appropriately.

---

# 35. Future People URLs

When People is implemented, use clean URLs such as:

```text
/people
/people/[person-slug]
```

People pages should be indexable when they contain sufficient useful public information.

Do not create pages for people with only a name and no meaningful content.

---

# 36. Future relationship graph

Design the system so these relationships can eventually exist:

```text
Person
  ↓
works/worked at
  ↓
Roaster
  ↓
sources from
  ↓
Origin / Producer

Person
  ↓
appears in
  ↓
News

Roaster
  ↓
mentioned in
  ↓
News

Origin
  ↓
mentioned in
  ↓
News
```

This relationship graph is potentially more valuable to thebeans.ca than simply accumulating thousands of articles.

It allows consumers to move naturally between:

**people → roasters → origins → stories → other roasters**

---

# 37. Maintenance philosophy

TheBeans.ca already has a substantial roaster dataset to maintain.

Do not create another massive maintenance project.

Therefore:

### Roasters

Comprehensive directory.

### News

Automated collection + manual review of uncertain content.

### People

Small, curated set of genuinely interesting people.

### Career history

Only documented information.

### Relationships

Add them when useful rather than attempting to model the entire coffee industry.

The system should favor **quality and maintainability over completeness**.

---

# 38. Data integrity rules

Continue applying the existing thebeans.ca principle:

> **Do not guess.**

If information cannot be verified from an appropriate public source:

* leave it blank
* don't infer it
* don't manufacture a date
* don't infer a job title
* don't infer a relationship
* don't infer that someone is a founder
* don't infer that someone represents a company

Where practical, retain a source URL for manually researched People/career information.

---

# 39. Technical architecture

Assume the existing thebeans.ca architecture:

* Next.js frontend
* existing Node/TypeScript backend/API
* PostgreSQL database
* Dockerized services
* Render deployment

Do not introduce another hosting provider or a separate database/service solely for News.

The scheduled ingestion process should run using the existing backend/infrastructure where practical.

If the existing architecture already has a scheduled-job mechanism, use it rather than introducing another scheduler.

---

# 40. Suggested implementation phases

## Phase 1 — News foundation

Implement:

* `news_sources`
* `news_items`
* source administration
* feed ingestion
* conditional requests
* deduplication
* filtering
* review queue
* topic filtering
* source filtering
* News cards
* publisher attribution
* original article links
* no publisher images
* roaster association

Do not implement accounts or personalization yet.

---

## Phase 2 — People foundation

Implement:

* `people`
* lightweight People profiles
* sports-card-inspired UI
* person ↔ roaster association
* person ↔ News association
* optional career history
* source links

Keep the number of People profiles intentionally small.

---

## Phase 3 — Discovery connections

Add:

* News → roaster
* News → person
* News → origin
* Roaster → related News
* Person → related News
* Person → coffee career
* Origin → related News
* contextual "Explore" links

This is where News becomes deeply integrated into thebeans.ca rather than being a standalone feed.

---

## Phase 4 — Accounts and personalization

Eventually add:

* follow roasters
* follow people
* follow topics
* saved stories
* personalized News
* weekly digest

Keep personalization user-controlled and transparent.

---

# 41. Success criteria

Do not measure success primarily by page views or time spent.

The most meaningful product signals are whether News causes useful discovery.

Examples:

* News → roaster profile visits
* News → People profile visits
* News → origin exploration
* News → Discover usage
* number of users following a person/topic/roaster
* saved stories
* return visits to discover new content
* original publisher click-through
* percentage of published stories judged useful during review

A successful News feature should make the user think:

> **"I didn't know that about coffee."**

or:

> **"I want to know more about that person."**

or:

> **"I didn't know this roaster existed."**

Those outcomes are more aligned with thebeans.ca than maximizing consumption of news.

---

# 42. Guiding principle for implementation

When there is a choice between adding more content and making existing content more useful, prefer **more useful**.

When there is a choice between automating something that might introduce incorrect information and requiring lightweight human review, prefer **accuracy**.

When there is a choice between making the site more addictive and making it more valuable, prefer **value**.

The product should ultimately feel like:

> **A place where coffee consumers discover the people, roasters, origins and stories that make the coffee world interesting.**

The News feature is one part of that larger discovery experience—not a destination intended to compete with news publishers.

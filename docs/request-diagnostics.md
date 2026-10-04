# Temporary HTTP Request Diagnostics

This is a permanent reference for a temporary, opt-in diagnostic feature. Implementation baseline: Next.js 14.2.35, October 2026.

## 1. Purpose

The site normally receives roughly 10-20 real visits, but Render reported about 2,448 client requests during an unexpectedly busy period. Diagnostics help investigate whether that activity resembles browsing, crawling, scraping, security scanning, or repeated requests from one source.

This is **request diagnostic logging, not user analytics**. Requests are not visits, and hashes are not people. This feature neither replaces nor modifies the application's existing analytics.

## 2. How it works

1. A request reaching the Next.js frontend passes through
   [Edge middleware](../client/src/middleware.ts), before response generation.
2. Only the exact environment value `REQUEST_DIAGNOSTICS=true` enables logging. Otherwise no diagnostic headers are read, hashes calculated, or entries emitted.
3. The helper excludes static asset noise, then builds an explicit field allowlist.
4. If a nonempty secret is configured, it reads the client IP from the trimmed `CF-Connecting-IP` header first. Otherwise it takes the trimmed **first** comma-separated entry in `X-Forwarded-For`. It does not use a socket IP fallback.
5. Built-in Web Crypto calculates:

   ```text
   utcDate = current timestamp's UTC YYYY-MM-DD
   dailySalt = REQUEST_DIAGNOSTIC_SECRET + ":" + utcDate
   ipHash = first 12 lowercase hexadecimal characters of
            SHA-256(dailySalt + ":" + clientIP)
   ```

6. One structured JSON line is written with `console.log` to application stdout. Render captures it in the frontend service's application logs.
7. Middleware returns `NextResponse.next()` without setting diagnostic headers, cookies, redirects, or cache directives.

The raw IP is used transiently as hash input and never included in the diagnostic object, database, or response. A missing secret or missing IP yields `ipHash: "unavailable"`; there is no raw-IP fallback. The secret and hash never reach browser code. Same-day correlation requires the same secret across instances. UTC midnight changes the hash input automatically; no scheduled task is needed.

On a diagnostic failure, middleware emits a separate safe JSON error with `type: "request_diagnostic_error"`, a UTC `timestamp`, and
`message: "Unable to generate request diagnostic"`. It omits the exception and request details and still passes the request through.

## 3. Configuration

Configure both variables in **Render > the-beans-frontend > Environment**, not the separate API service.

| Variable | Default | Meaning | Browser exposure |
|---|---|---|---|
| `REQUEST_DIAGNOSTICS` | `false` in examples/Blueprint; unset is also disabled | Only lowercase, exact `true` enables diagnostics. `TRUE`, `1`, and other values do not. | Server-side only; do not use a `NEXT_PUBLIC_` variant. |
| `REQUEST_DIAGNOSTIC_SECRET` | Empty/unset | Strong private hash salt. Missing value produces `"unavailable"`, without stopping requests. | **Never expose** it, commit it, or add it to public Next.js config. |

The [client example environment](../client/.env.example) documents both names.

The [Render Blueprint](../render.yaml) declares only the disabled flag; configure the secret manually. A strong random secret should remain stable throughout an investigation. Replacing it changes hashes even within the same UTC day.

Enable only for a bounded investigation of unusual traffic. Disable as soon as enough evidence is collected; do not leave it on as ongoing visitor tracking.

For local Docker use, set values in `client/.env.local` and recreate the client container to load environment changes; restart after code changes.

## 4. What gets logged

| Field | Actual implementation |
|---|---|
| `type` | Always `"request_diagnostic"` for successful diagnostic entries. |
| `timestamp` | UTC ISO timestamp captured before hashing. |
| `method` | Request HTTP method, including POST when applicable; no body is read. |
| `path` | Next.js pathname only, with a defensive removal of any `?` suffix. No query values or full URL. |
| `status` | Always `null`: middleware cannot reliably observe the final response status. |
| `ipHash` | 12-character daily salted SHA-256 prefix, or `"unavailable"`. |
| `userAgent` | Actual `User-Agent` header, or `null` if absent. |
| `userAgentCategory` | `"bot-like"`, `"browser-like"`, or `"unknown"`; only a diagnostic hint. |
| `cfRay` | Actual `CF-Ray` header, or `null`. |
| `country` | Actual `CF-IPCountry` header, or `null`; no geolocation lookup. |
| `host` | Lowercase hostname from a syntactically validated `Host` header, without its port; falls back to Next.js URL hostname. |

The category rule recognizes case-insensitive occurrences of `Googlebot`, `Bingbot`, `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Applebot`, `AhrefsBot`, `SemrushBot`, `MJ12bot`, `Bytespider`, and `facebookexternalhit` as bot-like.

Otherwise, `Mozilla/5.0` followed by Chrome, Firefox, Edge, or Version/Safari signatures is browser-like; all other agents are unknown. No detection package, identity verification, or fingerprinting is involved.

**Deliberately not collected:** raw IPs, cookies, authorization headers, request bodies/form data, query parameters, referrers, account emails/usernames, and other personal account fields. However, pathnames and User-Agents are recorded as untrusted text, not generally scrubbed for personal information. Do not place
emails, usernames, secrets, or search text in path segments; a malicious caller can put arbitrary content in a User-Agent. Keep access to logs restricted.

### Included and excluded requests

- Pages, missing paths/scanner probes, `/api` and `/api/...` requests are included.  API routes remain included even with file-like extensions such as `.json` or `.csv`.
  Non-API JSON paths are not excluded just because they end in `.json`.
- `robots.txt` and `sitemap.xml` are included.
- `/_next/static/...`, `/_next/image` and its subpaths, `/manifest.json`, `/site.webmanifest`, and `/locales/...` paths ending in `.json` are excluded.
- Non-API paths ending in these common asset extensions are excluded,
  case-insensitively: `avif`, `bmp`, `css`, `csv`, `eot`, `gif`, `ico`, `jpg`, `jpeg`, `js`, `mjs`, `map`, `mp3`, `mp4`, `ogg`, `otf`, `pdf`, `png`, `svg`, `ttf`, `wav`, `webm`, `webp`, `woff`, `woff2`.

Filtering is path-based, not response-content-type-based. A non-API application route ending in one of those asset extensions will also be excluded.

## 5. How to use it on Render

1. Ensure the feature code has been deployed through your normal approved workflow.
2. Open the **the-beans-frontend** service, then **Environment**.
3. Add `REQUEST_DIAGNOSTIC_SECRET` with a strong random private value. Do not paste the value into tickets, logs, documentation, or source control.
4. Set `REQUEST_DIAGNOSTICS` to `true`.
5. Save using Render's **rebuild/redeploy** option and wait until the new deployment is live. Treat Next.js 14 middleware environment changes as requiring a rebuild; do not assume editing an environment value updates the running middleware.
6. Send a normal page request, then open the frontend **Logs** tab.
7. Filter for `request_diagnostic`. Successful entries have the exact JSON field `"type":"request_diagnostic"`; distinguish them from `request_diagnostic_error`.
8. Investigate a limited time window. If exporting logs, store them securely and delete the export when no longer needed.
9. Set `REQUEST_DIAGNOSTICS=false`, save with rebuild/redeploy again, and confirm new requests no longer generate diagnostic entries.

Illustrative output (not a real visitor or secret):

```json
{"type":"request_diagnostic","timestamp":"2026-10-04T14:24:00.000Z","method":"GET","path":"/discover","status":null,"ipHash":"a1b2c3d4e5f6","userAgent":"GPTBot/1.0","userAgentCategory":"bot-like","cfRay":null,"country":null,"host":"thebeans.ca"}
```

Disabling stops new diagnostic entries, not previously captured Render logs.

## 6. Investigating traffic spikes

Choose one UTC-day window and compare request counts/rates by `ipHash`, pathname, and User-Agent. Inspect timing and repeated paths, not just the total. Never group all `"unavailable"` entries as one source, and do not correlate hashes across days.

| Possible activity | Example evidence to investigate, not proof |
|---|---|
| Search-engine crawling | `Googlebot`, `Bingbot`, or `Applebot`; requests to robots/sitemap followed by many public pages. |
| AI crawling | `GPTBot`, `ClaudeBot`, `PerplexityBot`, or `Bytespider`; repeated fetching of public content. |
| SEO crawling | `AhrefsBot`, `SemrushBot`, or `MJ12bot`; broad page sweeps or repeated checks. |
| Ordinary browsing | Recognizable browser agent, page navigation with pauses, limited requests; prefetches/data requests may add volume. |
| Scripted scraping | `curl/...`, `python-requests/...`, or similar unknown agents; fixed intervals, rapid enumeration, repeated API paths. |
| Generic security scanning | Bursts of `/.env`, `/wp-login.php`, unfamiliar administrative paths, or many unrelated probes. |
| One repeatedly requesting source | One same-day hash dominates a path or high-rate burst; could also be a shared network or health check. |

User-Agent alone **does not prove crawler or human identity**. Scrapers can claim browser signatures, and anyone can claim Googlebot. Query values are intentionally absent, so different queries to the same path cannot be distinguished. Final response status cannot be used to confirm successful fetches or failed probes.

## 7. Verifying crawlers

Independently verify claimed identities when decisions depend on them. Useful evidence combines User-Agent, timing/rate, requested paths, request patterns, and trustworthy source/network information from the ingress.

For Google crawlers, consult Google's [official verification instructions](https://developers.google.com/search/docs/crawling-indexing/verifying-googlebot).
Depending on the crawler type, those methods use published IP ranges or reverse DNS followed by forward DNS confirmation. Use the claimed provider's current official instructions where available; a name in a header is not verification.

**This diagnostic cannot perform IP-range or DNS verification:** a truncated hash cannot recover the source IP. It collects no ASN, reverse DNS, or other network details. If an existing, authorized Cloudflare/Render edge tool supports source verification, use it under your privacy policy; `cfRay` can help correlate an event where available. Do not add raw-IP logging to this feature or attempt to
reverse hashes. If suitable independent evidence is unavailable, report the identity as unverified rather than treating the User-Agent claim as fact.

Forwarded IP and Cloudflare headers are trustworthy only if your ingress overwrites them and prevents bypass/spoofing. The implementation does not authenticate Cloudflare headers or validate the proxy chain.

## 8. Privacy

- Daily rotation avoids a stable cross-day diagnostic identifier. The hash is **pseudonymous**, not a guarantee of anonymity or a unique person.
- Raw IP is never persisted by this feature; only its short salted digest is logged.
- No cookies, localStorage/sessionStorage identifiers, or persistent visitor IDs are created. Existing cookie/storage and analytics behavior stays unchanged.
- No database table or external analytics/logging service is added; output goes only to existing application logs.
- Keep the secret private, log access limited, and the investigation short. Shared IPs can merge people; changing IPs can split sources; hashes can collide.
- This feature does not alter existing application/proxy logging, Render log retention, or third-party infrastructure behavior.

## 9. Troubleshooting

| Problem | Check / solution |
|---|---|
| No diagnostic entries | Confirm frontend service, deployed code, exact `true`, completed rebuild/redeploy, correct log time window, and a non-static path. Upstream-served/blocked requests may never reach Next.js. |
| Missing secret | Configure the private frontend `REQUEST_DIAGNOSTIC_SECRET` and rebuild/redeploy. Until then entries remain valid but have `"unavailable"`. |
| Missing IP hash | `"unavailable"` means missing/empty secret or missing/empty client-IP headers. Check ingress configuration without dumping headers or logging raw IPs. |
| Hash changes unexpectedly | Check UTC midnight, secret changes, instance configuration, changing client IPs, and forwarded-header behavior. |
| Unexpected User-Agent/category | Agents are caller-controlled. `null` means absent. `unknown` is normal for curl/Python and unlisted agents; inspect patterns without assuming identity. |
| Excessive volume | Static filtering does not remove API traffic, health checks, prefetches, repeated pages, or probes. Shorten the investigation and disable the flag; no sampling/rate cap is implemented. |
| Logs difficult to search | Select the frontend service and a narrow time window; search `request_diagnostic` or the exact type field, then a hash/path/agent. Use a securely stored export with a local JSON-aware tool if necessary; do not upload logs to another service. |
| Diagnostic error entry | Check the safe `request_diagnostic_error` message and runtime/build configuration; run focused tests. Do not dump requests or exception details into logs. Requests continue normally. |
| Status always null | Expected middleware limitation, not a configuration error. |

## 10. Removal

1. Disable the flag and rebuild/redeploy first.
2. Remove [middleware](../client/src/middleware.ts) if still dedicated solely to diagnostics; if future functionality is added there, remove only diagnostic wiring.
3. Delete the [helper](../client/src/server/requestDiagnostics.ts),
   [tests](../client/test/testRequestDiagnostics.ts), and
   [test runner](../client/scripts/testRequestDiagnostics.cjs).
4. Remove `test:request-diagnostics` from [client scripts](../client/package.json), both variables from the [example environment](../client/.env.example), and the diagnostic flag from the [Blueprint](../render.yaml).
5. Remove the variables from the frontend Render environment and local configuration.
6. Update the [deployment guide](./deployment/RENDER_DEPLOYMENT.md) and README links. Retain this document as a historical reference marked removed, if useful.
7. Run client type-check/build and smoke-test page/API responses. No database migration, dependency removal, cookie cleanup, or browser-storage cleanup is needed.
8. Handle retained logs/exports according to the applicable retention policy; removing code does not erase them.

## 11. Implementation notes

- Next.js **14.2.35** at implementation; App Router pages plus Pages Router API endpoints. Uses `src/middleware.ts`, not newer Next.js `proxy.ts`.
- Middleware matches `/:path*`; filtering happens inside the helper. Even disabled mode retains middleware invocation overhead, but performs no diagnostic work.
- Built-in Web Crypto SHA-256 and `console.log`; no added dependencies.
- Relevant code/config/test files are linked above. The focused command is `npm run test:request-diagnostics` from the client directory.
- Render configuration assumes a Node frontend service rooted at `client`, built with `npm install && npm run build` and started with `npm run start` (`next start`). This is not a static-site deployment. The separate Express API is not covered.
- Middleware sees requests before the final response, so errors, redirects, and successful responses all have `status: null`. It does not modify authentication, SEO, cache policy, or response content.
- Counts include health checks and App Router prefetch/data requests. Upstream caching/blocking can hide requests. Country and CF-Ray may be absent.
- Host uses the validated request header because Next.js can normalize its internal URL hostname to `localhost`; neither host nor Cloudflare headers establish a verified source identity.

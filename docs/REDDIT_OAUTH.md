# Obtaining a Reddit Refresh Token

This document walks you through obtaining a permanent Reddit `refresh_token` and wiring it into the server so the app can post to Reddit on behalf of your account.

## Goal
Get a permanent `REDDIT_REFRESH_TOKEN` to add to `server/.env` so the server can use OAuth refresh-token flow instead of a password grant.

## Prerequisites
- Access to your Reddit app at https://www.reddit.com/prefs/apps
- Ability to edit `server/.env` and restart the server container
- Admin account in app frontend (used by the redirect exchange page)

## Steps

1. Create or edit a Reddit Web App

- Go to https://www.reddit.com/prefs/apps
- Click **Create App** (or edit an existing app).
- Use these values:
  - **Name:** The Beans (or any descriptive name)
  - **Type:** Web App
  - **Redirect URI:** `http://localhost:3000/redirect`
- Save and note the `client_id` and `client_secret`.

2. Configure local server env

Edit `server/.env` (locally) and set these values (don't add the refresh token yet):

```dotenv
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=your_app_name/1.0 by your_reddit_username
```

3. Build the authorization URL

Open this URL in a browser (replace `CLIENT_ID`):

```
https://www.reddit.com/api/v1/authorize?client_id=CLIENT_ID&response_type=code&state=RANDOM&redirect_uri=http://localhost:3000/redirect&duration=permanent&scope=submit,identity
```

Notes:
- `duration=permanent` returns a `refresh_token`.
- `scope=submit,identity` gives posting + identify permissions.
- Use a random `state` string for CSRF protection.

4. Authorize and capture the code

- Log in to Reddit with the account that will make posts.
- Click **Allow** when prompted.
- Reddit will redirect to:
  `http://localhost:3000/redirect?code=AUTH_CODE&state=...`

5. Exchange the code for tokens

- The app includes a redirect page at `http://localhost:3000/redirect` which will POST the code to:/api/reddit/exchange
- That server endpoint exchanges the code with Reddit and returns `access_token` and `refresh_token`.
- The redirect page displays the `refresh_token` with a Copy button.

6. Store the refresh token

- Copy the `refresh_token` shown on the redirect page.
- Add it to `server/.env`:

```dotenv
REDDIT_REFRESH_TOKEN=your_refresh_token_here
```

- Restart the server to pick up env changes:

```bash
docker-compose restart server
```

7. Test posting

- In the admin UI edit a verified roaster and click the blue **Post** button.
- Alternatively run the server-side test curl (with an admin JWT):

```bash
curl -X POST http://localhost:5000/api/roasters/<ROASTER_ID>/post-to-reddit \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json"
```

## Troubleshooting
- If Reddit returns a "whoa there, pardner" block page: wait and retry, or try from a different IP. Include the reference code if contacting Reddit support.
- If the redirect exchange fails, check server logs:

```bash
docker-compose logs --no-color --tail=200 server
```

Common causes:
- Redirect URI mismatch (must exactly match the one registered in Reddit app).
- Incorrect `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET`.
- Reddit rate or IP block.

## Security notes
- Store `REDDIT_REFRESH_TOKEN` in a secure place (secrets manager) in production — do not commit to source control.
- Use a descriptive `REDDIT_USER_AGENT` like `your_app_name/1.0 by your_reddit_username`.

---

File locations referenced:
- `server/.env.example` (now includes `REDDIT_REFRESH_TOKEN`)
- Redirect page: `http://localhost:3000/redirect` (client)
- Server exchange endpoint: `POST /api/reddit/exchange` (admin-authenticated)

If you want, I can add a small admin page to persist the refresh token on the server (requires storing secrets), or generate the exact authorization URL if you paste your `REDDIT_CLIENT_ID`.

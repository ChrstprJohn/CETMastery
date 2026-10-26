# Google sign-in setup

Supabase handles Google OAuth and issues the session. Express verifies that session; Prisma stores the learner profile. Google credentials belong in the hosted Supabase provider configuration. This guide prepares that configuration; the browser sign-in button and callback are not implemented yet.

## Profile information available at sign-in

With the basic `openid email profile` scopes, Google can provide a stable account identifier, email and verification status, name, picture, and optional given/family names and locale. Availability varies; do not require every field. Supabase holds identity, email, verification state, and linked providers. Our provider-independent profile stores optional display name, first name, last name, avatar, locale, and timestamps. Basic sign-in does not supply a Google password, and we do not request additional birthday, phone, Gmail, or Drive access.

The backend maps available Supabase metadata into a new profile. Missing names remain blank and can be collected by a future profile form. Repeat login does not overwrite saved profile values. Supporting another provider later will use Supabase Auth and the same profile shape; the current API continues to require Google.

## Application environment

`backend/.env` is already configured with `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL`, and `DIRECT_URL`. Keep these settings; Google setup needs no additional backend variables.

`frontend/.env` needs the same project's public values:

```env
VITE_API_BASE_URL=/api
VITE_SUPABASE_URL=https://mnazgdgidfdrqxyylpfy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
API_PROXY_TARGET=http://127.0.0.1:3001
```

The public project values can be copied from `backend/.env`; never copy its database URLs into the frontend. No `GOOGLE_CLIENT_SECRET` or `VITE_GOOGLE_CLIENT_SECRET` is needed. The Google Client ID and Client Secret will be pasted into Supabase, not app environment files. Restart Vite after editing its environment.

The current local frontend and backend environment files are already filled with the verified Supabase project settings. Your remaining credentials to obtain later are the Google **Client ID** and **Client Secret** for the Supabase provider dashboard. Existing values in either `.env` file should be preserved.

| Google/Supabase console setting | Value to enter |
|---|---|
| Google app name | `CETMastery` |
| Google client application type | `Web application` |
| Google authorized JavaScript origin | `http://localhost:5174` |
| Google authorized redirect URI | `https://mnazgdgidfdrqxyylpfy.supabase.co/auth/v1/callback` |
| Supabase Google Client ID | The Client ID you create in Google Cloud |
| Supabase Google Client Secret | The Client Secret you create in Google Cloud |
| Supabase Site URL | `http://localhost:5174` |
| Supabase allowed redirect URL | `http://localhost:5174/auth/callback` |

This is hosted Supabase Auth; examples for running the Supabase CLI locally may show Google secret environment variables and a `127.0.0.1:54321` callback. Those local-stack settings do not apply to this project.

## Local URLs to use consistently

Use **http://localhost:5174** for this Google setup. If starting the frontend on that port, run:

```sh
pnpm --filter @cetmastery/frontend dev --port 5174
```

The default `pnpm dev` frontend port is 5173; use the command above when relying on the 5174 settings below. Start the API separately with `pnpm dev:backend`. If you choose a different port or use `127.0.0.1` instead of `localhost`, update the console and Supabase URL settings to match the actual browser origin.

## Your steps in Google Cloud

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create or select the **CETMastery** project.
2. Open **Google Auth Platform**. If prompted, click **Get started**. Under **Branding**, set app name **CETMastery**, your support email, and your developer contact email.
3. Under **Audience**, choose **External** for personal Gmail accounts. While the app is in testing, add your Google account and any other testers under **Test users**.
4. Under **Data Access**, use only the basic sign-in scopes: `openid`, `https://www.googleapis.com/auth/userinfo.email`, and `https://www.googleapis.com/auth/userinfo.profile`. Email/profile may already be selected. No Gmail, Drive, or Calendar access is needed.
5. Under **Clients**, choose **Create client → Web application**. Name it **CETMastery Web**.
6. Add this **Authorized JavaScript origin**:

   ```text
   http://localhost:5174
   ```

7. Add this **Authorized redirect URI**:

   ```text
   https://mnazgdgidfdrqxyylpfy.supabase.co/auth/v1/callback
   ```

   Confirm that this is also the callback URL displayed by Supabase's Google provider settings. This is the hosted Supabase callback, even though the frontend is running locally.

8. Create the client and save its **Client ID** and **Client Secret** for the next step. A Google API key or service-account JSON file is not used for this flow.

## Your steps in Supabase

1. Open **Authentication → Sign In / Providers → Google** (the label may appear as **Providers**).
2. Enable Google. Paste the Google **Client ID** and **Client Secret**, then save. Leave nonce verification enabled.
3. Disable the **Email** provider and anonymous sign-in. Other providers should remain disabled. Allow new users to sign up so first-time Google users can join.
4. Under **Authentication → URL Configuration**, set **Site URL** to:

   ```text
   http://localhost:5174
   ```

5. Add this to **Redirect URLs**:

   ```text
   http://localhost:5174/auth/callback
   ```

The two callback URLs have different owners: Google sends the result to Supabase's `/auth/v1/callback`; Supabase then sends the browser to our future `/auth/callback` route.

## Next implementation step

After the provider settings are saved, implement the Google button and PKCE callback, attach the Supabase access token to Axios, and call `POST /api/auth/session` to create the Prisma profile. Then verify sign-in, `/me`, repeat login, and sign-out. Console configuration alone does not add the login UI.

## References

- [Supabase Google provider setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)
- [Supabase redirect URL settings](https://supabase.com/docs/guides/auth/redirect-urls)
- [Google OAuth web clients](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google OpenID Connect profile claims](https://developers.google.com/identity/openid-connect/openid-connect)

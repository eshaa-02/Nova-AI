# Nova AI

A premium, unified AI workspace — chat, search, image generation, voice
chat, video generation, music generation, a photo editor, and productivity
tools, all in one place. Built as a real, runnable monorepo: Next.js
frontend, Express + Socket.IO backend, MongoDB, and a provider-agnostic AI
abstraction with a working Google Gemini integration.

> **Status:** Auth, real-time streaming chat with Gemini, conversation
> history, Files, Web Search, Settings, Admin, Image Generation, Voice Chat,
> Photo Editor, and Tools are complete and functional end-to-end. Video and
> Music generation have a fully built UI and real backend endpoints, but no
> vendor integration is implemented yet — see [Roadmap](#roadmap). Nothing
> in this repo fakes a result: unimplemented capabilities show an honest
> "not configured" or "not yet implemented" state rather than pretending to
> work.

This guide walks through **every step** needed to get the project running
on your machine, from installing prerequisites to opening the app in your
browser. Follow it top to bottom the first time; after that, jump to
whichever section you need.

---

## Table of contents

1. [What you'll need](#1-what-youll-need)
2. [Get the code](#2-get-the-code)
3. [Install dependencies](#3-install-dependencies)
4. [Set up MongoDB](#4-set-up-mongodb)
5. [Get a Google Gemini API key](#5-get-a-google-gemini-api-key)
6. [Configure environment variables](#6-configure-environment-variables)
7. [Run the app](#7-run-the-app)
8. [Verify everything works](#8-verify-everything-works)
9. [Create your first admin account](#9-create-your-first-admin-account)
10. [Optional features](#10-optional-features)
11. [Running tests](#11-running-tests)
12. [Building for production](#12-building-for-production)
13. [Deploying](#13-deploying)
14. [Project structure](#14-project-structure)
15. [Troubleshooting](#15-troubleshooting)
16. [Roadmap](#roadmap)

---

## 1. What you'll need

Install these before you start. Skip anything you already have.

### Node.js 18.18 or newer

Check what you have:

```bash
node -v
```

If it's missing or older than `v18.18.0`, install it:

- **macOS**: `brew install node` (requires [Homebrew](https://brew.sh)), or download from https://nodejs.org
- **Windows**: download the installer from https://nodejs.org (choose the "LTS" version)
- **Linux**: use [nvm](https://github.com/nvm-sh/nvm) —
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  nvm install --lts
  ```

npm comes bundled with Node — confirm you have npm 9+:

```bash
npm -v
```

### Git

To clone the repository. Check with `git --version`; if missing, install
from https://git-scm.com/downloads.

### A MongoDB database

You have two options — pick one now, set it up in [Step 4](#4-set-up-mongodb):

- **Docker** (easiest for local dev) — install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **MongoDB Atlas** (free hosted database, no local install) — just need a browser

### A Google AI Studio account (free)

For a real Gemini API key. You just need a Google account — sign-up steps
are in [Step 5](#5-get-a-google-gemini-api-key). You can skip this and run
with a mock AI provider instead if you just want to see the UI, but real
chat responses require this key.

### A code editor (optional but recommended)

[VS Code](https://code.visualstudio.com/) is a good default if you don't
already have one, for editing `.env` files in later steps.

---

## 2. Get the code

```bash
git clone <this-repo-url>
cd nova-ai
```

(Replace `<this-repo-url>` with wherever this repository is hosted for you.
If you received this project as a folder rather than a git remote, just
`cd` into that folder instead of running `git clone`.)

---

## 3. Install dependencies

From the repository root (the `nova-ai/` folder that contains `package.json`):

```bash
npm install
```

This single command installs dependencies for **all three workspaces** at
once — `apps/web`, `apps/api`, and `packages/shared` — because the project
uses npm workspaces. You should see it working through all three; it can
take a minute or two the first time.

**Nothing to run yet** — don't run `npm run dev` until you've completed
Steps 4–6 below, or the backend will fail to start (no database connection,
no secrets configured).

---

## 4. Set up MongoDB

Pick **one** of these two options.

### Option A — Docker (fastest for local development)

With Docker Desktop installed and running:

```bash
docker run -d --name nova-mongo -p 27017:27017 mongo:7
```

This starts MongoDB in the background, listening on port 27017. Your
connection string will be:

```
mongodb://localhost:27017/nova-ai
```

To confirm it's running: `docker ps` should list a container named
`nova-mongo`. To stop it later: `docker stop nova-mongo`. To start it again
after a reboot: `docker start nova-mongo`.

### Option B — MongoDB Atlas (free hosted database)

1. Go to https://www.mongodb.com/atlas and sign up (or log in).
2. Create a new **free (M0) cluster** — accept the defaults, pick any
   region close to you.
3. Under **Database Access**, create a database user with a username and
   password (save these — you'll need them in the connection string).
4. Under **Network Access**, click **Add IP Address** and choose **Allow
   access from anywhere** (`0.0.0.0/0`) for local development. (For a real
   production deployment, restrict this to your server's IP instead.)
5. Go back to your cluster, click **Connect** → **Drivers**, and copy the
   connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with the credentials from step 3,
   and add a database name before the `?`, e.g.:
   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/nova-ai?retryWrites=true&w=majority
   ```

Keep this connection string handy — you'll paste it into `MONGODB_URI` in
[Step 6](#6-configure-environment-variables).

---

## 5. Get a Google Gemini API key

This powers real AI chat responses. It's free to obtain (Google's free
tier applies) and takes under a minute.

1. Go to https://aistudio.google.com/apikey
2. Sign in with a Google account if prompted.
3. Click **Create API key** (choose "Create API key in new project" if
   asked).
4. Copy the key that's generated — it's a long string starting with `AIza...`.

Keep this key handy for [Step 6](#6-configure-environment-variables). You'll
paste it into `GOOGLE_API_KEY`.

**Don't have a Google account or want to skip this for now?** You can still
run the whole app with `AI_PROVIDER=mock` — see [Step 6](#6-configure-environment-variables)
— which returns clearly-labeled placeholder responses instead of real AI
answers, so you can see the whole UI without a key. You can add a real key
later at any time.

---

## 6. Configure environment variables

The project has two separate `.env` files — one for the backend, one for
the frontend. Create both by copying the provided examples:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### 6a. Edit `apps/api/.env`

Open `apps/api/.env` in your editor and fill in these values:

```bash
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

MONGODB_URI=mongodb://localhost:27017/nova-ai

JWT_ACCESS_SECRET=replace-with-a-long-random-string
JWT_REFRESH_SECRET=replace-with-a-different-long-random-string
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
COOKIE_SECRET=replace-with-another-long-random-string

AI_PROVIDER=google

GOOGLE_API_KEY=your-key-from-step-5
GOOGLE_MODEL=gemini-2.5-flash
GOOGLE_IMAGE_MODEL=

SEARCH_PROVIDER=none
TAVILY_API_KEY=

VIDEO_PROVIDER=none
RUNWAY_API_KEY=

MUSIC_PROVIDER=none
SUNO_API_KEY=

UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=15
```

Here's what each variable means and what to put there:

| Variable | Required? | What to put |
|---|---|---|
| `NODE_ENV` | yes | `development` for local work. Only ever `production` on a real deployment. |
| `PORT` | yes | The port the backend listens on. `5000` is fine unless something else is using it. |
| `CLIENT_URL` | yes | Where your frontend runs. Keep as `http://localhost:3000` for local dev. |
| `MONGODB_URI` | yes | Your connection string from [Step 4](#4-set-up-mongodb) — either the Docker one or your Atlas one. |
| `JWT_ACCESS_SECRET` | yes | Any long random string. Generate one with `openssl rand -hex 32` (see below). |
| `JWT_REFRESH_SECRET` | yes | A **different** long random string — don't reuse the access secret. |
| `COOKIE_SECRET` | yes | A third long random string. |
| `AI_PROVIDER` | yes | `google` to use real Gemini responses. `mock` to skip needing a key (dev only — blocked in production). |
| `GOOGLE_API_KEY` | if `AI_PROVIDER=google` | The key you copied in [Step 5](#5-get-a-google-gemini-api-key). |
| `GOOGLE_MODEL` | no | Defaults to `gemini-2.5-flash`. Leave as-is unless you have a reason to change it. |
| `GOOGLE_IMAGE_MODEL` | no | Leave empty unless you want Image Generation / Photo Editor working — see [Step 10](#10-optional-features). |
| `SEARCH_PROVIDER`, `TAVILY_API_KEY` | no | Leave as `none` unless you want real Web Search — see [Step 10](#10-optional-features). |
| `VIDEO_PROVIDER`, `RUNWAY_API_KEY` | no | Leave as `none` — video generation has no working vendor integration yet (see [Roadmap](#roadmap)). |
| `MUSIC_PROVIDER`, `SUNO_API_KEY` | no | Leave as `none` — same as above, for music. |
| `UPLOAD_DIR` | no | Folder (relative to `apps/api`) where uploaded files and generated media are stored. Default `uploads` is fine. |
| `MAX_FILE_SIZE_MB` | no | Per-upload size cap. Default `15` is fine. |

**Generating random secrets:** run this once per secret (or use any random
string generator — they just need to be long and unpredictable):

```bash
openssl rand -hex 32
```

Run it three times and paste one result into each of `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, and `COOKIE_SECRET`. Don't have `openssl`? This also
works:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6b. Edit `apps/web/.env.local`

This one needs no changes for local development — the defaults already
point at your local backend:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Only change these if you run the backend on a different port or host.

**Important:** never put an API key (Gemini, Tavily, etc.) into
`apps/web/.env.local` or anything prefixed `NEXT_PUBLIC_*` — those values
are shipped to the browser. All API keys belong only in `apps/api/.env`.

---

## 7. Run the app

From the repository root:

```bash
npm run dev
```

What this does:
1. Builds `packages/shared` (the TypeScript types and Socket.IO contracts
   both apps depend on).
2. Starts the backend on **http://localhost:5000**.
3. Starts the frontend on **http://localhost:3000**.

You'll see interleaved logs from both, labeled `[API]` and `[WEB]`. Wait
for a line like:

```
[API] 🚀 Nova AI API listening on http://localhost:5000 (development)
[API]    AI provider: google
[WEB] ▲ Next.js ... Local: http://localhost:3000
```

If you'd rather run them in separate terminals (useful for reading logs
separately):

```bash
# terminal 1
npm run dev:backend

# terminal 2
npm run dev:frontend
```

Now open **http://localhost:3000** in your browser.

---

## 8. Verify everything works

Walk through this checklist on your first run:

1. **Landing page loads** at http://localhost:3000 with the Nova AI hero,
   features grid, and footer.
2. **Register an account** — click "Get started", fill in name/email/
   password, submit. You should land in the chat workspace.
3. **Send a chat message** — type something in the composer and press
   Enter. You should see a streamed response.
   - If you set `AI_PROVIDER=google` with a real key: you'll get a real
     Gemini answer.
   - If you set `AI_PROVIDER=mock`: you'll get a clearly-labeled
     "development mock response".
4. **Refresh the page** — you should stay logged in (session restoration).
5. **Create a second conversation** via "New chat" in the sidebar, rename
   it, pin it, and check it moves to the top.
6. **Log out and log back in** from Settings → Security.

If steps 2–3 fail, jump to [Troubleshooting](#15-troubleshooting).

---

## 9. Create your first admin account

New registrations always get the `user` role — there is intentionally no
public sign-up path to `admin`. To promote your account:

**If you're using Docker MongoDB:**

```bash
docker exec -it nova-mongo mongosh nova-ai --eval \
  'db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })'
```

**If you're using MongoDB Atlas** (or have `mongosh` installed locally):

```bash
mongosh "your-mongodb-uri-here" --eval \
  'db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })'
```

Replace `you@example.com` with the email you registered with. You should
see `modifiedCount: 1` in the output.

Then, in the browser, **sign out and back in** (or wait ~15 minutes for
your access token to naturally refresh) so the new role takes effect. An
"Admin dashboard" link will appear at the bottom of the sidebar, and
`/admin` will show real platform stats and user management.

---

## 10. Optional features

Everything below is off by default and safe to skip — the app runs fully
without any of it, and each feature shows an honest "not configured"
message in the UI until you turn it on.

### Image Generation & Photo Editor (AI operations)

Both use the same Gemini image-output capability.

1. Confirm your Google AI Studio key has access to an image-output-capable
   Gemini model — check https://ai.google.dev/gemini-api/docs/models for
   current availability (model names change over time; don't assume the
   example below is still current).
2. In `apps/api/.env`, set:
   ```
   GOOGLE_IMAGE_MODEL=gemini-2.5-flash-image
   ```
   (using whatever the current model name is per the docs link above).
3. Restart the backend (`Ctrl+C` then `npm run dev` again, or just
   `npm run dev:backend`).
4. `/image` will now generate real images. In Photo Editor (`/photo-editor`),
   "Remove background", "Enhance", and "Edit with prompt" will work too —
   crop and resize always work with no configuration, since they're plain
   client-side canvas operations.

### Web Search

1. Sign up at https://tavily.com and get an API key (they offer a free tier).
2. In `apps/api/.env`, set:
   ```
   SEARCH_PROVIDER=tavily
   TAVILY_API_KEY=your-tavily-key
   ```
3. Restart the backend. `/search` will now return real, cited results.

### Video Generation & Music Generation

These have a fully built UI and backend job-tracking, but **no vendor
integration ships in this repo** — `RunwayProvider` and `SunoProvider` are
intentionally unimplemented placeholders (they throw a clear "not yet
implemented" error rather than fabricating a video or track). To actually
enable one:

1. Pick a real vendor (Runway, Pika, Luma for video; Suno, Udio, ElevenLabs
   Music for music — or any other).
2. Implement `generateVideo()` in
   `apps/api/src/services/video/providers/RunwayProvider.ts` (or
   `generateMusic()` in `apps/api/src/services/music/providers/SunoProvider.ts`)
   against that vendor's real API. These are typically async/job-based:
   submit a generation request, poll for completion, download the result,
   and return it as `{ base64, mimeType }`. The class-level comments in
   those files describe this in more detail.
3. Set `VIDEO_PROVIDER=runway` (or `MUSIC_PROVIDER=suno`) plus the
   corresponding API key in `apps/api/.env`.

### OpenAI / Anthropic as the chat provider

`AI_PROVIDER=openai` and `AI_PROVIDER=anthropic` are wired into the
provider factory, but — like the video/music vendors above — their
provider classes are unimplemented stubs. To activate one, implement
`streamChat()` in `apps/api/src/services/ai/providers/OpenAIProvider.ts`
(or `AnthropicProvider.ts`) following the same shape as `GoogleProvider.ts`.

### Voice Chat

Nothing to configure — it uses your browser's built-in `SpeechRecognition`
and `speechSynthesis` APIs directly. Works in current Chrome, Edge, and
Safari. Firefox doesn't support the Web Speech API, so `/voice` will show
an honest "not supported in this browser" message there instead of a
broken microphone button.

---

## 11. Running tests

```bash
npm run test
```

This runs the backend's Vitest suite (`apps/api/tests`) — covering error
handling, the mock AI provider, the Google provider's capability gating
(image generation/editing), the tools catalog, admin validation, and the
video/music provider honesty guarantees (they never return fake data).

---

## 12. Building for production

```bash
npm run build
```

This builds, in order: `packages/shared`, then `apps/api`, then `apps/web`.
Then start each built app:

```bash
npm run start:backend
npm run start:frontend
```

Before doing this for a real deployment, make sure `apps/api/.env` has
`NODE_ENV=production` — this also enforces that `AI_PROVIDER` cannot be
`mock` in production (the backend will refuse to start if it is).

---

## 13. Deploying

- **Frontend** — Vercel (or any Next.js-compatible host). Set
  `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` as environment
  variables in your hosting dashboard, pointed at your deployed backend's
  **HTTPS** URL.
- **Backend** — Render, Railway, Fly.io, or any VPS that runs Node. Set
  `CLIENT_URL` to your deployed frontend's HTTPS URL exactly (CORS is
  strict about this), and set `NODE_ENV=production`.
- **Database** — MongoDB Atlas (see [Step 4](#4-set-up-mongodb), Option B).
- Cookies are marked `secure` automatically once `NODE_ENV=production`, so
  **both** the frontend and backend must be served over HTTPS in
  production, or login/session cookies won't be set by the browser.
- Set every environment variable from [Step 6](#6-configure-environment-variables)
  (and any optional ones you're using from [Step 10](#10-optional-features))
  in your hosting provider's environment variable settings — don't commit
  `.env` files to git.

---

## 14. Project structure

```
nova-ai/
  apps/
    web/          Next.js App Router frontend
      app/         Pages (landing, auth, chat, image, voice, video, music,
                    photo-editor, tools, files, search, settings, admin)
      components/  UI, layout, chat, image, voice, files, admin, settings
      stores/      Zustand state (auth, chat, theme, toast, images, etc.)
      lib/         API client, Socket.IO client, voice hooks, utilities
    api/          Express + Socket.IO backend
      src/
        config/      env validation, MongoDB connection
        models/      Mongoose schemas (User, Conversation, Message, etc.)
        middleware/  auth, error handling, rate limiting, uploads, validation
        services/
          ai/        AIProvider interface + Google/OpenAI/Anthropic/Mock
          search/    SearchProvider interface + Tavily/None
          video/     VideoProvider interface + Runway(stub)/None
          music/     MusicProvider interface + Suno(stub)/None
          tools/     Prompt-templated AI tools catalog
        controllers/ Route handlers
        routes/      Express routers, mounted under /api
        sockets/     Real-time streaming chat (Socket.IO)
      tests/       Vitest test suite
  packages/
    shared/        TypeScript types & Socket.IO event contracts shared by
                    both apps (built to packages/shared/dist)
```

---

## 15. Troubleshooting

**`npm install` fails or hangs**
Make sure you're on Node 18.18+ (`node -v`) and npm 9+ (`npm -v`). Delete
`node_modules` and `package-lock.json` at the root and try again if you
switched Node versions recently.

**Backend won't start: "Invalid environment configuration"**
One of the required variables in `apps/api/.env` is missing or too short
(secrets need to be at least 16 characters). Re-check against the table in
[Step 6a](#6a-edit-appsapienv).

**"AI model temporarily unavailable" in chat**
Usually an invalid `GOOGLE_API_KEY`, or a `GOOGLE_MODEL` your key doesn't
have access to. Check the backend terminal for the underlying error, and
confirm your key at https://aistudio.google.com/apikey.

**Chat loads but nothing streams / composer just spins**
Check `NEXT_PUBLIC_SOCKET_URL` in `apps/web/.env.local` matches your
backend's actual address, and that `CLIENT_URL` in `apps/api/.env` matches
your frontend's actual address exactly (including `http://` vs `https://`
and no trailing slash) — CORS and the Socket.IO handshake are strict about
this.

**Getting logged out repeatedly / refresh loop**
Check your browser isn't blocking third-party or all cookies for
`localhost`. The refresh token is an `httpOnly` cookie scoped to
`/api/auth` — if it's blocked, refresh will keep failing.

**MongoDB connection errors on startup**
- Docker: confirm the container is running (`docker ps`) and
  `MONGODB_URI=mongodb://localhost:27017/nova-ai` matches.
- Atlas: confirm your IP is allow-listed under Network Access, and that
  the username/password in the connection string are correct (special
  characters in the password may need URL-encoding).

**Port already in use**
Something else is using port 3000 or 5000. Either stop that process, or
change `PORT` in `apps/api/.env` (and update `NEXT_PUBLIC_API_URL` /
`NEXT_PUBLIC_SOCKET_URL` to match) and/or run `PORT=3001 npm run dev:frontend`
for the frontend.

**Changes to `packages/shared` aren't showing up**
That package isn't watched automatically. After editing anything in
`packages/shared/src`, run `npm run build:shared`, then restart
`npm run dev`.

---

## Roadmap

Built in phases per the original build order. Phases 1–11 (auth, AI
provider abstraction, streaming chat, conversation history, landing page,
chat workspace) are done, plus Files (upload + AI-backed summarize/extract/
explain/ask), Web Search (Tavily-backed, with AI-generated related
questions grounded in real results), Settings (account, appearance, AI
info, security sessions, privacy/account deletion, connected accounts), an
Admin dashboard (real platform stats, system status, and user management —
role changes, disable/enable, delete — all backed by real endpoints, with
the current admin blocked from disabling or deleting their own account),
Image Generation (real Gemini image output when `GOOGLE_IMAGE_MODEL` is
configured; an honest "not configured" error otherwise — never a faked
image), Voice Chat (real speech-to-text and text-to-speech via the
browser's native Web Speech API — no server-side voice provider needed;
each voice turn becomes a real, persisted conversation you can revisit
from the sidebar), Photo Editor (AI operations — remove background,
enhance, edit-with-prompt — reuse the same `GOOGLE_IMAGE_MODEL` as Image
Generation; crop and resize are genuine client-side canvas operations
needing no provider at all), Tools (eleven prompt-templated assistants —
summarizer, translator, email writer, and so on — running on whatever
`AI_PROVIDER` is already configured, so they work as soon as chat does),
and Video / Music Generation (full prompt/style/duration UI and real
job-tracking endpoints wired end-to-end; `VIDEO_PROVIDER` and
`MUSIC_PROVIDER` default to `none` so both honestly report "not
configured" until a real vendor integration is implemented in
`RunwayProvider`/`SunoProvider` — see [Step 10](#10-optional-features) for
what that involves).

Every planned surface from the original spec now exists and is either
fully functional or fails honestly instead of faking a result.

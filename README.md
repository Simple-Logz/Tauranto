# Tauranto VoiceOps 0.8

Tauranto is a mobile-first restaurant operations assistant. It captures a spoken or typed instruction, converts it into a structured proposal with OpenAI, requires human approval, and executes only through a configured connector. This repository contains the Expo iOS/Android/web client, Vercel serverless API, Supabase schema/RLS, email notifications, approval workflow, audit log, and execution worker.

## Safety contract

- `OFF` means no microphone or wake-word engine is running. A truly off app cannot hear and react to speech.
- `STANDBY` uses the iOS/Android speech-recognition service while Tauranto remains open and waits for “Hey Tauranto.” Tauranto uploads only the command recorded after activation, although the operating-system recognition provider may process wake-listener audio.
- Command recording ends after approximately 1.7 seconds of silence. OpenAI transcribes the audio server-side, Tauranto reads it back, and the operator says yes or try again before a proposal is created.
- Every command is a proposal. The AI never executes tools.
- Approval is unanimous by default. One rejection blocks the action.
- Approved jobs execute idempotently; every transition is audited.
- OpenAI, Supabase service-role, email, SMS, webhook, and cron secrets are server-only. Never prefix them with `EXPO_PUBLIC_`.

## Workflow

1. While foregrounded, the native client watches for “Hey Tauranto.”
2. Tauranto acknowledges activation and records the actual command audio.
3. Silence detection closes the recording, with a 30-second safety maximum.
4. `POST /api/audio/transcribe` authenticates the user and transcribes the audio server-side.
5. Tauranto reads the transcript back and listens for yes or try again.
6. Only a confirmed transcript reaches `POST /api/commands/interpret`.
7. The existing clarification, unanimous approval, idempotent execution and audit workflow remains enforced.

## Accounts needed

- Supabase (Auth + Postgres)
- OpenAI Platform API key
- Vercel
- Resend for approval emails
- Optional Twilio for SMS; do not enable until sender compliance and consent are configured

## 1. Supabase

Run `supabase/migrations/001_enterprise_core.sql` in the SQL editor. The client currently signs users up and in with email + password (`src/screens/AuthScreen.tsx`), not magic links — enable email/password auth in Supabase Auth settings. (Password auth with no MFA is a lighter security posture than magic-link; revisit this before onboarding paying customers if that's not the intended long-term model.) Create your first auth user, then bootstrap it (replace UUIDs):

```sql
insert into public.profiles(id,full_name,email) values ('AUTH_USER_UUID','Owner','owner@example.com');
insert into public.restaurants(id,name) values ('RESTAURANT_UUID','Harbor & Hearth');
insert into public.restaurant_members(restaurant_id,user_id,role,can_approve)
values ('RESTAURANT_UUID','AUTH_USER_UUID','owner',true);
```

Add any number of managers to `restaurant_members`; set `can_approve=true` for required approvers.

## 2. Environment

Copy `.env.example` to `.env.local`. In Vercel, add the same values under Project Settings → Environment Variables. Only `EXPO_PUBLIC_*` values may enter the mobile bundle. The Supabase anon key is intentionally public and protected by RLS; the service-role key is private.

`CREDENTIALS_ENCRYPTION_KEY` and `OAUTH_STATE_SECRET` are required and must each be their own random value (`openssl rand -base64 32`) — do not reuse the Supabase service-role key for these. They are used to encrypt stored OAuth credentials and to sign OAuth state respectively; the app throws on startup use of either feature if they are unset.

Never paste keys into chat, commit `.env.local`, embed private keys in Expo, or expose the Supabase service-role key.

## 3. Voice standby and native build

No Picovoice account, key, or `.ppn` file is required. Set the phrase in `.env.local`:

```env
EXPO_PUBLIC_WAKE_PHRASE=hey tauranto
```

The free pilot uses the phone's speech-recognition service for foreground standby. Create a native development build for reliable microphone testing:

```bash
npm install
npx expo prebuild
npx expo run:android
```

Keep Tauranto foregrounded during standby. iOS and Android background microphone policies prevent an ordinary app from promising invisible, indefinite wake listening. For a later offline production engine, integrate sherpa-onnx as a native module and validate it in noisy kitchens; do not represent the present pilot as fully offline.

## 4. Run and test

```bash
npm install
npm run typecheck
npx vercel dev
```

Sign in through Supabase and send its access token as `Authorization: Bearer <token>` when testing APIs.

## 5. Deploy

1. Import this folder into Vercel.
2. Add the environment variables.
3. Deploy the web/PWA shell and `/api` functions.
4. Set `EXPO_PUBLIC_API_URL` to the Vercel origin.
5. Build native binaries with EAS Build for TestFlight/Play testing. Vercel hosts the backend and web build, not `.ipa` or `.aab` files.

## API

- `POST /api/audio/transcribe` — authenticated command-audio transcription
- `POST /api/commands/interpret` — AI proposal, clarification gate, approvals, notifications
- `GET /api/commands/list?restaurantId=...` — queue
- `POST /api/approvals/decision` — authenticated manager decision
- `POST /api/realtime/session` — ephemeral Realtime client secret
- `GET /api/jobs/run` — cron-protected execution worker

Supplier email executes through Resend. All other approved actions use a configured `custom_webhook` integration. OAuth connectors for Toast, Square, Google Calendar, Microsoft, HubSpot, Shopify, and WordPress require each provider’s credentials and cannot be made live with code alone.

## Pilot gate

Before a live restaurant pilot: finish manager sign-in/onboarding screens, sandbox every connector, add SMS consent/opt-out handling, test noisy-kitchen transcription, add monitoring, publish privacy/recording notices appropriate to the jurisdiction, and test rejection/idempotency/retries. Begin with one restaurant and non-financial actions. Keep purchasing disabled until quantity/unit reconfirmation and spend limits are added.

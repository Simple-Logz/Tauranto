# Tauranto VoiceOps 0.4

Tauranto is a mobile-first restaurant operations assistant. It captures a spoken or typed instruction, converts it into a structured proposal with OpenAI, requires human approval, and executes only through a configured connector. This repository contains the Expo iOS/Android/web client, Vercel serverless API, Supabase schema/RLS, email notifications, approval workflow, audit log, and execution worker.

## Safety contract

- `OFF` means no microphone or wake-word engine is running. A truly off app cannot hear and react to speech.
- `STANDBY` uses the device speech-recognition service while Tauranto remains open and waits for “Hey Tauranto.” The pilot does not upload ambient audio to the Tauranto backend or OpenAI, but the phone's recognition provider may process it.
- Every command is a proposal. The AI never executes tools.
- Approval is unanimous by default. One rejection blocks the action.
- Approved jobs execute idempotently; every transition is audited.
- OpenAI, Supabase service-role, email, SMS, webhook, and cron secrets are server-only. Never prefix them with `EXPO_PUBLIC_`.

## Workflow

1. While foregrounded, Expo watches the recognition transcript for the configured wake phrase and collects one instruction.
2. Speech recognition creates a transcript.
3. `POST /api/commands/interpret` authenticates membership and asks OpenAI for strict structured output.
4. Low-confidence or ambiguous proposals stop for clarification.
5. Valid proposals create approval assignments for every active manager and send email links.
6. Only unanimous approval creates an execution job.
7. Vercel Cron invokes `/api/jobs/run`; a connector executes with an idempotency key and records an audit event.

## Accounts needed

- Supabase (Auth + Postgres)
- OpenAI Platform API key
- Vercel
- Resend for approval emails
- Optional Twilio for SMS; do not enable until sender compliance and consent are configured

## 1. Supabase

Run `supabase/migrations/001_enterprise_core.sql` in the SQL editor. Enable email magic-link authentication. Create your first auth user, then bootstrap it (replace UUIDs):

```sql
insert into public.profiles(id,full_name,email) values ('AUTH_USER_UUID','Owner','owner@example.com');
insert into public.restaurants(id,name) values ('RESTAURANT_UUID','Harbor & Hearth');
insert into public.restaurant_members(restaurant_id,user_id,role,can_approve)
values ('RESTAURANT_UUID','AUTH_USER_UUID','owner',true);
```

Add any number of managers to `restaurant_members`; set `can_approve=true` for required approvers.

## 2. Environment

Copy `.env.example` to `.env.local`. In Vercel, add the same values under Project Settings → Environment Variables. Only `EXPO_PUBLIC_*` values may enter the mobile bundle. The Supabase anon key is intentionally public and protected by RLS; the service-role key is private.

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

- `POST /api/commands/interpret` — AI proposal, clarification gate, approvals, notifications
- `GET /api/commands/list?restaurantId=...` — queue
- `POST /api/approvals/decision` — authenticated manager decision
- `POST /api/realtime/session` — ephemeral Realtime client secret
- `GET /api/jobs/run` — cron-protected execution worker

Supplier email executes through Resend. All other approved actions use a configured `custom_webhook` integration. OAuth connectors for Toast, Square, Google Calendar, Microsoft, HubSpot, Shopify, and WordPress require each provider’s credentials and cannot be made live with code alone.

## Pilot gate

Before a live restaurant pilot: finish manager sign-in/onboarding screens, sandbox every connector, add SMS consent/opt-out handling, test noisy-kitchen transcription, add monitoring, publish privacy/recording notices appropriate to the jurisdiction, and test rejection/idempotency/retries. Begin with one restaurant and non-financial actions. Keep purchasing disabled until quantity/unit reconfirmation and spend limits are added.

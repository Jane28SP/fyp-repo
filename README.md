## FYP Monorepo (Web + Mobile + Shared + Supabase)

### Structure

```
apps/
  web/      # React + Vite + TS
  mobile/   # Expo React Native + TS
packages/
  shared/   # Shared types/schemas/utils
  api-client/ # Supabase init + auth + CRUD + realtime
```

### Prerequisites
- Node 18+
- pnpm (`npm i -g pnpm`)
- Expo CLI (`npm i -g expo-cli`)

### Setup
1. Copy envs and fill values
   - `cp .env.example apps/web/.env`
   - `cp .env.example apps/mobile/.env`
   - Edit values:
     - Web: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
     - Mobile: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
2. Install deps
   - `pnpm install`

### Run
- Web: `pnpm dev:web` → http://localhost:5173
- Mobile: `pnpm dev:mobile` → scan QR with Expo Go or use emulator

### Notes
- Shared logic (schemas, api client) lives under `packages/` and is consumed by both apps.
- Only use the Supabase anon key in clients. Service role keys must not be used on client.

### Git
```
git init
git add .
git commit -m "init monorepo (web+mobile+shared)"
# Create a repo on GitHub and then:
git remote add origin <your-repo-url>
git push -u origin main
```



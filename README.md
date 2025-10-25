# Atlas — Notion-like Workspace

Atlas is a collaborative workspace inspired by Notion, built with Next.js 14 (App Router), Tailwind CSS, and Supabase. It supports real-time-friendly document editing with block-based content, workspace bootstrapping, and email/OAuth authentication.

## Features

- Supabase Auth with magic link and OAuth (GitHub, Google, Discord)
- Automatic profile and personal workspace provisioning on first login
- Hierarchical pages sidebar with create/delete actions and emoji icons
- Block-based editor supporting paragraph, heading, and to-do block types
- Tailwind-powered responsive UI with mobile sidebar toggle
- Supabase migrations defining profiles, workspaces, documents, and blocks with RLS policies

## Tech Stack

- [Next.js 14 App Router](https://nextjs.org/)
- [React 18](https://reactjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Copy `.env.example` to `.env.local` and fill in your Supabase project credentials.
   ```bash
   cp .env.example .env.local
   ```

   Required values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (e.g. `http://localhost:3000` in development)
   - `SUPABASE_SERVICE_ROLE_KEY` (optional, only needed for admin scripts)

3. **Apply database schema**
   Run the SQL file in `supabase/migrations/0001_init.sql` on your Supabase project. You can use the SQL editor in the Supabase dashboard or the Supabase CLI.

4. **Start the dev server**
   ```bash
   npm run dev
   ```

5. **Lint & build**
   ```bash
   npm run lint
   npm run build
   ```

## Deployment on Vercel

1. Ensure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` are configured in your Vercel project settings.
2. Run the production build locally (`npm run build`) to verify success.
3. Deploy using the CLI command provided in the task instructions:
   ```bash
   vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-cc603c24
   ```
4. After deployment, verify the site:
   ```bash
   curl https://agentic-cc603c24.vercel.app
   ```

## Project Scripts

- `npm run dev` — start Next.js in development mode
- `npm run build` — create a production build
- `npm run start` — run the built app in production mode
- `npm run lint` — run ESLint
- `npm run format` — format source files with Prettier

## Supabase Database Overview

- `profiles` — basic user profile synced with Supabase Auth
- `workspaces` — shared spaces owned by a user
- `workspace_members` — membership + role (owner/editor/viewer)
- `documents` — pages within a workspace
- `blocks` — block-based content for each document

Row Level Security (RLS) policies ensure members can read data while owners/editors can make changes.

## Notes

- Default placeholder Supabase credentials are used during local builds when environment variables are absent; supply real values before deploying or running against a live backend.
- The editor currently provides a focused experience for text and to-do blocks; extend block types or add real-time presence with additional Supabase features as needed.

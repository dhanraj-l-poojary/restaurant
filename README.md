# FoodieHub — Restaurant Ordering Website

A responsive restaurant ordering starter built with Next.js, TypeScript, Tailwind CSS, and Supabase. It includes a food menu, search and category filters, cart, checkout, order creation, order tracking UI, and an admin dashboard starter.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase PostgreSQL, Storage, and Realtime
- Vercel deployment

## Run locally
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in Supabase values (the menu can still show demo items without them).
4. Run `npm run dev` and open `http://localhost:3000`.

## Supabase setup
Run `supabase/migrations/202610270001_initial_schema.sql` in the Supabase SQL Editor. Create a Storage bucket named `food-images` and configure upload policies for authorized admins before enabling image uploads.

Environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose with `NEXT_PUBLIC_`)
- `ADMIN_ACCESS_TOKEN` (protects demo admin API actions)

## Deploy
Import this repository in Vercel, add the environment variables, and deploy. Run the SQL migration in Supabase before using persistent ordering. Without Supabase credentials, the UI uses demo menu data and checkout returns a demo order ID; demo orders are not persisted.

## Notes
- Prices are validated server-side against the database when Supabase is configured.
- Payment gateway integration is not enabled yet. Do not treat demo checkout as a real payment.
- For production, add Supabase Auth for customers/staff, verify admin roles through trusted claims, and integrate a payment provider with signed webhook verification.

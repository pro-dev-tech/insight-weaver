

## Plan: Remove `public.users` table dependency, use `auth.users` directly

### Problem
The app queries/inserts into a `public.users` profile table that doesn't exist. All tables already reference `auth.users(id)` via `user_id`. The profile table is redundant and causes 500/403 errors.

### Changes

**1. Simplify `User` type in `src/types/index.ts`**
- Remove `authUserId`, `businessName`, `ownerName`, `businessEmail`, `createdAt`, `updatedAt` fields
- Remove `mapUser` function
- Keep `id` as `auth.users.id` (the auth UUID used as `user_id` FK everywhere)

**2. Refactor `src/contexts/AuthContext.tsx`**
- Remove `fetchOrCreateProfile` (no more querying/inserting `public.users`)
- Build `User` object directly from `session.user` + `user_metadata`
- On auth state change: `user.id = session.user.id`, business fields from metadata

**3. Verify `src/contexts/InvoiceDataContext.tsx`**
- Already uses `user?.id` as `user_id` in all Supabase queries — will work since `user.id` becomes the auth UUID
- Verify all insert/select operations match the provided schema (customers, invoices, reminder_logs, etc.)

**4. Verify `src/pages/Settings.tsx`** and other pages
- Ensure `user.id` is passed as `user_id` for activity_logs, smtp_settings, notification_preferences, etc.
- Ensure field names match the provided schema exactly

### Files to modify
- `src/types/index.ts` — simplify User, remove mapUser
- `src/contexts/AuthContext.tsx` — remove profile table logic
- Any files referencing `mapUser` or old User fields

### No database changes needed
All tables already exist with correct schema and RLS policies using `auth.uid()`.


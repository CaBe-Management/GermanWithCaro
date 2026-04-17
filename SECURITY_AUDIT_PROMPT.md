You are doing a full security audit of a Next.js 15 + Supabase app called "German With Caro" (gwc_v2).

Stack: Next.js 15 App Router, TypeScript, Supabase (Postgres + Auth + RLS), Tailwind CSS. Deployed on Vercel.

Admin email: caroline091996@gmail.com

---

## YOUR TASKS

Work through each section below. For every issue you find: describe the problem, rate severity (Critical / High / Medium / Low), and provide the exact fix (code or SQL).

---

### 1. ADMIN PAGE PROTECTION

Check every file under `app/admin/`:
- Does `checkAdminAndLoad()` (or equivalent) verify BOTH that the user is logged in AND that `user.email === 'caroline091996@gmail.com'`?
- Could any admin route be accessed by a non-admin logged-in user?
- Is there any admin functionality exposed via API routes that lacks email verification?

Fix: every admin page must redirect to `/dashboard` if the user is not the admin email.

---

### 2. SUPABASE ROW LEVEL SECURITY (RLS)

Connect to the project (URL: from `.env.local` → `NEXT_PUBLIC_SUPABASE_URL`) and audit these tables:

**Public read tables** (should be readable by anyone, writable only by admin via service role):
- `gwc_videos` — public SELECT when `is_draft = false`, no public INSERT/UPDATE/DELETE
- `gwc_video_sentences` — public SELECT for sentences of published videos, no public write

**Per-user tables** (each user reads/writes only their own rows):
- `gwc_video_reviews` — filtered by `session_id = auth.uid()`
- `gwc_video_learned` — filtered by `session_id`
- `gwc_progress` — filtered by `session_id`
- `gwc_badges` — filtered by `session_id`
- `gwc_streaks` — filtered by `session_id`

**Check for each table:**
- Is RLS enabled?
- Are there INSERT/UPDATE/DELETE policies that shouldn't be public?
- Can a user read or modify another user's rows?
- Are there any tables with RLS disabled entirely?
- Are there any tables missing policies (RLS enabled but no policy = no one can access)?

Run this SQL to get a full overview:
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

### 3. API ROUTES

Check all files under `app/api/`:
- `app/api/tiktok-meta/route.ts` — does it validate/sanitize the `url` parameter? Could it be abused to proxy arbitrary URLs (SSRF)?
- Any other API routes — do they require auth where needed?

For `tiktok-meta`: add a check that the URL starts with `https://www.tiktok.com/` before forwarding.

---

### 4. CLIENT-SIDE AUTH CHECKS

Search all `.tsx` files for patterns like:
- `user?.email ===` — email checks done only client-side (these are UI guards, not real security)
- `getOrCreateSessionId()` — is this used for anything sensitive? Session IDs from localStorage should not gate sensitive writes

Flag any place where security depends purely on client-side state that a user could manipulate.

---

### 5. ENVIRONMENT VARIABLES & SECRETS

- Check `.gitignore` — is `.env.local` listed?
- Search the codebase for any hardcoded API keys, tokens, or secrets that should be in env vars
- Check `NEXT_PUBLIC_*` variables — anything sensitive accidentally exposed to the client?
- Verify `SUPABASE_SERVICE_ROLE_KEY` is NOT in any `NEXT_PUBLIC_` variable

---

### 6. SUPABASE AUTH SETTINGS (to check manually in dashboard)

List these items for Caroline to verify in the Supabase dashboard:
- Authentication → URL Configuration → Site URL is set to the production domain (not localhost)
- Authentication → URL Configuration → Redirect URLs includes the production domain
- Authentication → Providers → only Email enabled (no unintended OAuth providers)
- Authentication → Email Templates → confirmation email uses the correct redirect URL

---

### 7. MISSING CHECKS / QUICK WINS

- Is the `ADMIN_EMAIL` constant defined in multiple places? It should be in one place only (e.g. `lib/config.ts`) to avoid drift
- Is there any page that should require auth but is listed in `PUBLIC_PATHS` in `AuthGuard.tsx`?
- Is there any `supabase.from(...).select('*')` that returns more columns than needed (data over-fetching that could expose sensitive fields)?

---

## OUTPUT FORMAT

For each section, output:

**[SECTION NAME]**
Status: ✅ OK / ⚠️ Issues found / ❌ Critical issue

Then list each finding as:
- Severity: Critical/High/Medium/Low
- Issue: [description]
- Fix: [exact code or SQL]

End with a prioritised fix list: Critical first, then High, Medium, Low.

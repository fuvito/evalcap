# Backlog

Items that are intentionally deferred and not in active scope.

---

## Auth

### Google Sign-In / Sign-Up
- **Web:** `apps/web/src/app/auth/login/page.tsx` and `apps/web/src/app/auth/signup/page.tsx`
  - `GoogleIcon` component, `handleGoogleSignIn` / `handleGoogleSignUp`, button UI, and "or" divider all removed.
  - Logic used `supabase.auth.signInWithOAuth({ provider: 'google', ... })` — straightforward to restore.
- **Mobile:** No implementation existed yet.
- **Why deferred:** Not needed for launch. OAuth provider setup (Google Cloud Console, Supabase config) and testing can be done as a self-contained sprint later.
- **To restore:** Re-add the `GoogleIcon` SVG, `googleLoading` state, handler function, button + divider in both auth pages. Wire up the Google OAuth provider in Supabase dashboard.

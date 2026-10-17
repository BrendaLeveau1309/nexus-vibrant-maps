<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep mobile and backoffice experiences in the same TanStack application with role-aware entry points, because both share NexoVital data and identity.
- Use Lovable Cloud with row-level policies for persistent user and hospital data, because medical workflows require tenant isolation.
- Render maps with Google Maps JavaScript using the public connector key; use authenticated server calls for any Places data.
- Keep shared visual roles in semantic CSS tokens and use the shared Button for controls, so mobile and institutional views remain visually consistent.
- Account reads the authenticated profile and successful donation count under existing RLS, with an explicitly labeled signed-out demo fallback, so donor identity and share text never silently substitute demo data for a real user.
- Backoffice demo stage counters derive from the same persisted process records as the editor and refresh on storage events, so counts track stage transitions without a second source of truth.
- Derive donor recognition and red-cell compatibility with pure shared helpers, and display compatibility separately from the carnet, so profile-specific rules remain testable without storing duplicate data.

- The mobile app (login, splash, and main views) renders inside a shared `PhoneFrame` wrapper in src/routes/index.tsx: 390px phone bezel on desktop, full-bleed below the sm breakpoint. Overlays meant to fill the app screen use `absolute inset-0`, not `fixed`, so they stay inside the frame.

# v2.9.44 — email + password sign-in (+ Google, gated)

Owner (2026-08-15, on the phone): "I want to create an email password system, this magic link doesn't work" → then "looks like I can add gmail as a login as well".

- `signin-modal.png` — Sign in / Create account / Forgot password? / Cancel (`.ui-btn--link`).
- `set-password-mode.png` — the same modal in `setpass` mode (☰ → Set / change password; also `recovery` mode after a reset link).
- Google button: rendered only when `GET /auth/v1/settings` reports `external.google=true`. Glyph is monochrome `currentColor` — §5.0 two-colour rule; the four Google brand hexes would have pushed the off-token ratchet 31→35. Owner may stamp the multicolour G later (add the four to design.md §2.1 first).
- Live check: `POST /auth/v1/token?grant_type=password` with a wrong password → 400 `invalid_credentials` → coach copy shown. Provider state at ship: `{email:true}`, `mailer_autoconfirm:false` (Confirm email ON).

Owner actions: set own password via SQL (`auth.users.encrypted_password = extensions.crypt(...)`), Providers → Email → Confirm email (choice), Providers → Google (Cloud OAuth client), URL Configuration (Site URL / Redirect URLs) — required for confirmation, reset and OAuth return legs.

# v2.9.43 — ☰ drawer taps on iPhone (WebKit hit-test)

**Owner report (2026-08-15, on the phone):** "sign in via cloud link isn't working" → "when I tap from the hamburger menu the email pop up doesn't happen" → "the main page sign in works".

**Diagnosis:** a temporary `?diag=1` on-screen log strip in the local build, served to the owner's iPhone over LAN (`http://192.168.0.237:8002/index.html?diag=1`). Owner's screenshots showed:

- landing CTA: `click → BUTTON "Sign in to get started"` → `authOv class→"ov show"` ✔
- ☰ route (before fix): `openDrawer(homeMenu) auth-btn: disabled=false onclick=function label="Sign in for cloud sync"` then **`click → DIV#appDrawerScrim.on`** — the tap on the drawer button was delivered to the scrim behind it.
- ☰ route (after fix): `click → BUTTON.ui-btn ui-btn--ghost drawer-auth "Sign in for cloud sync"` → `authOv class→"ov show"` ✔ (iOS 18.7, WebKit 605.1.15)

**Root cause:** `#homeMenu/#gameMenu/#planMenu` are `position:fixed` (z 9500) but were nested inside their screens' `.scr` overflow scrollers; the scrim (z 9400) is a body-level sibling of `.app`. WebKit paints the drawer above the scrim but hit-tests the fixed-in-scroller drawer below it. Chromium is correct here — no desktop test / gallery tile could catch it.

**Fix:** `hoistDrawers()` (called on `openDrawer`) moves the three drawers to body right after the scrim.

Files: `drawer-open.png` (Chromium iPhone-13 emulation, drawer open, post-fix DOM), `after-tap-modal.png` (modal after tapping the drawer's Sign in).

**Not an app bug, owner action:** the magic-link email redirects to `http://localhost:3000` because the Supabase auth **Site URL / Redirect URLs** don't include `https://sub-timer.vercel.app` (GoTrue falls back to Site URL when `redirect_to` isn't allow-listed — visible as `"referer":"http://localhost:3000"` in auth logs). Dashboard → Authentication → URL Configuration.

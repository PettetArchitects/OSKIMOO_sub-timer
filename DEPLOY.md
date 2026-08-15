# Sub Timer — Deploy Workflow (READ BEFORE EDITING)

**Live:** https://sub-timer.vercel.app
**Deploy repo:** `PettetArchitects/sub-timer` (GitHub → Vercel auto-deploys `main`)
**Source of truth:** the deployed `main` branch — **NOT** this iCloud copy.
**Supabase (live):** project **`grvrigrxujbnmullixiz`** ("Oskimoo - Data", ap-southeast-1 — the one shared data project for Sub Timer AND the roster/Team Manager app; renamed from "Team Manager" 2026-08-15). Auth URL config (Site URL / Redirect URLs for `https://sub-timer.vercel.app`) lives THERE. The OSKIMOO-org project `dnjwcfuegvlobhfwkfjo` ("Sub - Timer", Tokyo) was **retired 2026-05-30** (commit `a1a2587`) — it auto-pauses from disuse; ignore it, don't configure it.

---

## 🔒 `main` is protected — you cannot push to it directly

As of 2026-06-07, `main` has GitHub branch protection:
- **No direct pushes.** All changes land via a **pull request**.
- **Required check: `smoke`** — the CI gate (sanity + smoke + sports + edge, 287
  checks) must pass before a PR can merge.
- **Strict / up-to-date** — the PR branch must be current with `main` before merge
  (this is also a second line of defence against the stale-overwrite bug).
- No force-pushes, no branch deletion.
- `enforce_admins` is **off** — the owner keeps an emergency break-glass (see below).

### The everyday workflow (Tier 2)
1. Work on **`dev`** (or a `feature/*` branch). Push freely — CI runs on every push.
2. The open PR (`dev → main`, e.g. #9) shows the preview URL + the `smoke` result.
3. When the PR is green, **merge it** → Vercel auto-deploys `main` to production.
   (Solo dev: 0 approvals required, so you can merge your own green PR.)
4. After merging, sync the iCloud copy from `main` before the next edit.

### Break-glass (emergencies only)
If CI is broken/flaky and you MUST ship a fix:
```bash
# temporarily drop the required check, merge, then put it straight back
gh api -X DELETE repos/PettetArchitects/OSKIMOO_sub-timer/branches/main/protection/required_status_checks
# ...merge the PR...
gh api -X PUT repos/PettetArchitects/OSKIMOO_sub-timer/branches/main/protection --input <protection.json>
```

---

## ⚠️ The rule that exists because of 2026-06-07

On 2026-06-07 a stale local copy (v2.5.2) was pushed on top of newer live work
(v2.7.92), silently overwriting ~3,400 lines — the Roster tab, water polo, side
drawer, smoke-test harness and more. It was recoverable from git history, but it
should never have happened.

**Root cause:** the iCloud `sub-timer.html` had drifted behind the deployed
`main` because another session edited live. Editing + pushing without syncing
first clobbered the newer build.

**Therefore: ALWAYS sync from live `main` before editing. Every session.**

---

## Sync-first procedure (do this at the START of every editing session)

```bash
# 1. Get the live source
git clone https://github.com/PettetArchitects/sub-timer.git /tmp/sub-timer-deploy   # (or git -C /tmp/sub-timer-deploy pull)

# 2. Compare live vs your iCloud copy
diff <(grep -o "APP_VERSION='v[0-9.]*-beta'" /tmp/sub-timer-deploy/index.html) \
     <(grep -o "APP_VERSION='v[0-9.]*-beta'" sub-timer.html)

# 3. If live is NEWER than your iCloud copy → adopt live as the base:
cp /tmp/sub-timer-deploy/index.html sub-timer.html
#    (back up your iCloud copy first if it has un-deployed changes you need to re-port)
```

If the versions match, you're in sync — edit freely.

---

## Deploy procedure (do this to ship)

```bash
# 1. Bump APP_VERSION in sub-timer.html and add a CHANGELOG_DATA entry.

# 2. Syntax-check the inline <script> blocks (node vm):
node -e 'const fs=require("fs");const h=fs.readFileSync("sub-timer.html","utf8");
const re=/<script(\b[^>]*)>([\s\S]*?)<\/script>/gi;let m,e=0;
while((m=re.exec(h))){if(/\bsrc\s*=/.test(m[1]||""))continue;try{new Function(m[2])}catch(x){e++;console.log("ERR:"+x.message)}}
console.log(e?"FAIL":"ok")'

# 3. GUARD — refuse to deploy if live >= local (backstop against the bug above):
./deploy-guard.sh            # exit 0 = safe, exit 1 = abort

# 4. Only if the guard passes: copy to the deploy repo, commit, push:
cp sub-timer.html /tmp/sub-timer-deploy/index.html
cp CHANGELOG.md   /tmp/sub-timer-deploy/CHANGELOG.md   # if changed
cd /tmp/sub-timer-deploy && git add -A && git commit -m "vX.Y.Z-beta: ..." && git push origin main

# 5. Poll live until the new version appears:
for i in $(seq 1 25); do v=$(curl -s "https://sub-timer.vercel.app/?cb=$(date +%s)" \
  | grep -o "APP_VERSION='v[0-9.]*-beta'" | head -1); echo "$v"; \
  echo "$v" | grep -q "X.Y.Z" && break; sleep 8; done
```

---

## Quick reference

| Thing | Where |
|-------|-------|
| Live URL | https://sub-timer.vercel.app |
| Deploy repo | `PettetArchitects/sub-timer` (push `main`) |
| Version + changelog | `APP_VERSION` + `CHANGELOG_DATA` near the top of the inline `<script>` |
| Guard script | `./deploy-guard.sh` (exit 1 = do not deploy) |
| Local preview | `/tmp/dragonflies-sub-timer/` served on port 8765 |

**If the guard says ABORT, do not force past it — sync from live, re-port your
changes onto the newer base, bump the version, and retry.**

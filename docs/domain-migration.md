# openmindsstudios.com — Leaving Wix, moving the domain to Namecheap

**Prepared for:** Juan — Open Minds Studios
**Date:** August 20, 2026

**Decisions made:** transfer the domain out of Wix to **Namecheap**, cancel the Wix subscription entirely, and serve the new site from the `OpenMinds` repo. Site code is ready; nothing is deployed yet.

---

## 1. The correction that matters most

**You do not buy this domain. You already own it.**

Live registry lookup on `openmindsstudios.com`, today:

| Field | Current value |
|---|---|
| Registrar of record | **Wix.com Ltd.** (IANA ID 3817) |
| Registered | March 2, 2017 |
| Paid through | **March 2, 2027** |
| Registry locks | `clientTransferProhibited`, `clientUpdateProhibited` |
| Nameservers | `ns0.wixdns.net`, `ns1.wixdns.net` |

Wix isn't squatting on your domain — Wix is your **registrar**, the company that holds the registration on your behalf. It's registered and paid for another 18 months. If you search for it at Namecheap it will come back as taken, because it is: by you.

So there is nothing to purchase. What you do is a **transfer** — moving the registration from Wix to Namecheap. It costs one year of registration and *extends* your expiry rather than replacing it.

> ⚠️ **Never** cancel the domain or let it expire hoping to re-register it. It would enter a 30-day redemption window, then be publicly released, and a 9-year-old domain with an established business name gets caught by drop-catchers in seconds. Do not let anyone at Wix support talk you into "cancel and repurchase."

---

## 2. The sequence

You said the site is ready to deploy but isn't deployed anywhere yet. That sets the order, because a domain can only point at something that already exists.

```
TODAY          Phase 0  Pre-flight checks in Wix        (20 min)
               Phase 1  Click "Transfer away from Wix"  (5 min)
               Phase 2  Start the transfer at Namecheap (15 min)
                            ↓
DAYS 1-6       Phase 3  Deploy the site while the transfer processes
                        - frontend → Netlify
                        - API → Render/Fly/Railway
                            ↓
TRANSFER DONE  Phase 4  Build the DNS zone at Namecheap, flip nameservers
                            ↓
VERIFIED       Phase 5  Cancel Wix
```

The 5–7 day transfer wait is not dead time — it's exactly the window you need to get the app deployed. Starting the transfer today means the two tracks finish together.

**Why not just repoint the DNS from inside Wix right now?** You could — Wix allows editing A and CNAME records. But Wix **does not allow nameserver changes** on Wix-registered domains (their words: *"it's not possible to change name servers (edit NS records) for a Wix domain"*), and only A and CNAME are editable for external hosting. You'd be building DNS twice and doing the second build under Wix's constraints. Since nothing is deployed yet anyway, one clean cutover is less work and less risk.

---

## 3. Phase 0 — Pre-flight, before you click anything

### 0.1 — Check the registrant email (do this first)

`···` menu next to the domain → **Edit contact info**. Read the email address on file. Don't change anything yet.

Wix sends the transfer authorization code (EPP code) to **that address**. Because this account was just recovered, there's a real chance it's an inbox you no longer control.

- ✅ **You can open that inbox today** → close the panel, change nothing, continue to Phase 1.
- ⚠️ **You can't** → you must update it, and Wix's policy is explicit: *"changing your registrant contact information locks your domain from transfer for 60 days."* Update it, write down the date, and see §7 for what to do while you wait.

**Do not tidy up the contact info out of habit.** Any edit can start the 60-day clock.

### 0.2 — Export the DNS zone

`···` menu → **Manage DNS records** → screenshot every section (A, CNAME, MX, TXT, SRV). You'll rebuild this by hand at Namecheap.

Here's what's live right now from an external lookup. Compare against your screenshots and add anything I couldn't see from outside:

**Website records — these get replaced by Netlify values:**

| Type | Host | Current value |
|---|---|---|
| A | `@` | `185.230.63.107`, `185.230.63.171`, `185.230.63.186` (Wix) |
| CNAME | `www` | `cdn1.wixdns.net` (Wix) |

**Email + verification records — recreate these exactly or email stops working:**

| Type | Host | Value | Priority |
|---|---|---|---|
| MX | `@` | `aspmx.l.google.com` | 10 |
| MX | `@` | `alt1.aspmx.l.google.com` | 20 |
| MX | `@` | `alt2.aspmx.l.google.com` | 30 |
| MX | `@` | `aspmx2.googlemail.com` | 40 |
| MX | `@` | `aspmx3.googlemail.com` | 50 |
| TXT | `@` | `v=spf1 include:_spf.google.com ~all` | — |
| TXT | `@` | `google-site-verification=5CMrIcNhGnQt6d0yHxgN-GGOdieHBMYmcANfXHIy178` | — |

**You are running Google Workspace email on this domain.** This is the biggest risk in the whole operation. A website that breaks is visible in thirty seconds. Email that breaks is invisible — inquiries from parents just stop arriving and nobody knows why.

Also worth noting: there is **no DKIM record and no DMARC record** on the domain today. Add both after the move (Google Admin → Apps → Gmail → Authenticate email generates the DKIM key; then a simple `_dmarc` TXT with `v=DMARC1; p=none; rua=mailto:...`). Your app sends inquiry notification emails, and mail from a domain with no DKIM/DMARC increasingly lands in spam.

### 0.3 — Email: checked, and decided ✅

`···` menu → **Manage business email** confirmed it: Wix Business Email **is Google Workspace resold by Wix**, one mailbox (`openminds@openmindsstudios.com`), **$80/year**.

The surprising finding: moving that billing to Google *directly* costs **more** ($84/yr at Google's 2026 list price), not less. The saving comes from leaving Google Workspace, not from leaving Wix's billing.

**Decision: Namecheap Private Email Pro — 3 mailboxes for $41.88/yr** (`openminds@`, `nina@`, `karen@`), same domain, real IMAP so the existing mail history migrates cleanly. Saves **~$198/yr** versus three mailboxes on Wix ($240) or Google ($252).

Full detail, exact DNS records and the migration steps are in the companion doc: **`email-migration.md`**. The important interlock with *this* document: **the new MX records go into the Namecheap zone in Phase 4**, and **Wix is not cancelled until the new mailboxes are verified working** in Phase 5.

---

## 4. Phase 1 — Start the transfer out of Wix

1. `···` menu → **Transfer away from Wix**
2. Read the confirmation screen and confirm. **This is the action that clears the `clientTransferProhibited` lock** — there is no separate unlock toggle to hunt for.
3. Wix emails the **authorization code (EPP / auth code)** to the registrant address from §0.1. Usually minutes; give it a few hours.
4. If Private Registration / WHOIS privacy is on, turn it off first so transfer emails actually reach you.

Wix charges nothing to transfer a domain away.

**Leave "Unassign from this site" alone.** You don't need it — a registrar transfer doesn't require unassigning, and the old site staying up costs you nothing while you deploy the new one. It's outdated, but an outdated site beats a Wix error page for the week it takes to cut over.

---

## 5. Phase 2 — Pull the domain into Namecheap

1. Create the Namecheap account. Two things here are not optional:
   - Use a **business email you will still control in five years** — not a personal address, not something tied to a former team member. This is how you lost the Wix account.
   - Turn on **2FA** immediately, and save the recovery codes somewhere your team can reach them.
2. Namecheap → **Transfer** → enter `openmindsstudios.com`
3. Paste the auth code and pay.
4. **Namecheap .com pricing today:** transfer **$11.48** (includes +1 year → your expiry becomes **March 2, 2028**), then **$18.48/year** at renewal. Domain Privacy is free for life.
5. Wix will email you a transfer confirmation. **Approving it completes the transfer in hours instead of days.** Ignore it and ICANN rules auto-approve after 5 days.
6. Expect 5–7 days total.

> Heads up on the renewal number: Namecheap's $18.48/yr is about $7/yr more than Porkbun's flat $11.08. Not a reason to change course — Namecheap is a solid registrar with a real support team and free privacy — just so the figure isn't a surprise next March.

**Your site and email keep working throughout.** A registrar transfer doesn't touch nameservers. The domain stays delegated to `wixdns.net` and everything resolves normally until you deliberately change it in Phase 4.

---

## 6. Phase 3 — Deploy the site (during the transfer window)

Your stack is a Vite/React frontend plus an **Express + SQLite backend** in `server/`. That's two hosts, not one.

### Frontend → Netlify

Netlify's free tier covers this comfortably. Connect the repo, set the build to `npm run build` with publish directory `dist`.

Two things your `LOCAL_DEVELOPMENT.md` already flags:
- **SPA routing.** Add a `_redirects` file or `netlify.toml` rule: `/* /index.html 200`. Without it, every refresh on a sub-route 404s.
- **`VITE_API_BASE_URL`** must point at the deployed API's full URL, not `/api`.

### API → its own host

SQLite needs a real filesystem that survives restarts, which rules out anything serverless. Realistic options:

| Host | Rough cost | Note |
|---|---|---|
| Render | $7/mo Starter + $0.25/GB disk | Simplest. Free instances sleep when idle — a 30-second cold start on your login page isn't acceptable, so budget for Starter. |
| Fly.io | ~$5/mo minimum | Persistent volumes, more control, steeper learning curve. Free allowance is gone. |
| Railway | ~$5/mo minimum | Easy deploys, usage-based billing. |

Give it a subdomain: **`api.openmindsstudios.com`** — one more record in the Phase 4 zone.

Production env vars per your `.env.example`:

```
NODE_ENV=production
SESSION_SECRET=<a real random 32+ byte value, not the placeholder>
CORS_ORIGIN=https://openmindsstudios.com
COOKIE_SAME_SITE=none
COOKIE_SECURE=true
COOKIE_DOMAIN=.openmindsstudios.com
DATABASE_PATH=<path on the persistent disk>
```

The frontend on Netlify and the API on another host are **cross-site**, which is why `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true` are required for sessions to work at all. Also: set up `npm run db:backup` on a schedule. A single SQLite file with student and tutor records and no backup is a bad week waiting to happen.

### About "only pay for the domain yearly and nothing else"

Worth being straight with you, since this is why you're leaving Wix. Achievable for the domain, not for the whole system:

| Item | Cost | Avoidable? |
|---|---|---|
| Domain (Namecheap) | $18.48/yr | No — this is the one you wanted |
| Business email, 3 mailboxes (Namecheap Private Email Pro) | $41.88/yr | Only by giving up `@openmindsstudios.com` email, or by accepting Zoho's free webmail-only tier |
| Frontend (Netlify) | $0 | Free tier is genuinely enough here |
| API host | ~$5–7/mo | Only if you drop the student/tutor/manager portals and ship the marketing site as pure static |
| App notification emails (Resend/Brevo free tier) | $0 | Free tiers cover your volume comfortably |

Realistic floor with the portals live: **$60.36/year in fixed costs plus roughly $5–7/month for the API.** Call it $120–145/year all in, versus Wix Premium plus $240/yr for three mailboxes on Wix — and you own every piece of it.

If the portals aren't needed for launch, deploying just the marketing site to Netlify gets the running cost down to **$60.36/year total** — domain and three mailboxes, nothing else. Worth considering as a phase 1.

---

## 7. Phase 4 — Point the domain at the new site

Do this as soon as the transfer completes. Once the domain leaves the Wix account, Wix has no obligation to keep answering DNS for it — don't linger on their nameservers.

**Build the zone first, flip nameservers last.** That way there's no window where records are missing.

1. In Namecheap: **Domain List → Manage → Advanced DNS**. Namecheap's BasicDNS supports **ALIAS** records on the apex, which is what Netlify wants. Create:

   | Type | Host | Value |
   |---|---|---|
   | ALIAS | `@` | `apex-loadbalancer.netlify.com` |
   | CNAME | `www` | `your-site-name.netlify.app` |
   | CNAME | `api` | *(target given by Render/Fly/Railway)* |
   | MX | `@` | `mx1.privateemail.com` (priority 10) |
   | MX | `@` | `mx2.privateemail.com` (priority 10) |
   | TXT | `@` | `v=spf1 include:spf.privateemail.com ~all` |
   | TXT | `privateemail._domainkey` | *(DKIM value from the Private Email panel)* |
   | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:openminds@openmindsstudios.com` |
   | TXT | `@` | `google-site-verification=5CMrIcNhGnQt6d0yHxgN-GGOdieHBMYmcANfXHIy178` |
   | CNAME | `mail`, `autodiscover`, `autoconfig` | `privateemail.com` (optional, makes phone setup painless) |

   Notes:
   - The **Google MX records and Google SPF from §0.2 are deliberately not carried over** — email is moving to Namecheap Private Email. See `email-migration.md`, and make sure the mail history is copied across *before* you flip these.
   - **Only ever one SPF record per domain.** Two breaks both. Don't keep the Google one alongside the new one.
   - Keep the `google-site-verification` TXT — that's Search Console, not email.
   - Delete any conflicting A / CNAME / URL-redirect record on `@` before adding the ALIAS — Namecheap won't let them coexist. If ALIAS gives you trouble, the documented fallback is `A` → `75.2.60.5`, but prefer ALIAS: it survives Netlify changing their IPs.

2. In Netlify: **Site configuration → Domain management → Add custom domain.** Add both `openmindsstudios.com` and `www.openmindsstudios.com` — Netlify adds both automatically and both need records.

3. Set the nameservers to Namecheap BasicDNS. **This is the moment the switch happens.** Usually minutes; allow up to 48 hours for full global propagation.

4. Verify before telling the team it's done:
   - [ ] `openmindsstudios.com` loads the new site over **HTTPS** — check Netlify shows the certificate as issued, not pending
   - [ ] `www.openmindsstudios.com` redirects to the apex (pick one canonical version and stick to it, for SEO)
   - [ ] A deep link works on a hard refresh (proves the SPA redirect rule)
   - [ ] Login works — this is what proves cookies survive the cross-site setup
   - [ ] **Send an email to a mailbox on the domain from an outside address, then reply from it.** Both directions. Do not skip this.
   - [ ] The inquiry form actually delivers a notification email

---

## 8. Phase 5 — Close out Wix

Only once Phase 4 is verified clean:

1. Confirm the email migration is complete and verified — new mailboxes sending and receiving, history copied, Takeout archive saved (`email-migration.md` steps 1–7). **This gate comes before everything else in this phase.** Then cancel the Wix Business Email subscription.
2. Cancel the **Wix Premium plan**. Check whether you're inside their refund window — you may be owed a prorated amount, so it's worth asking rather than assuming.
3. Leave the old Wix site *unpublished* rather than deleted for a month. Cheap insurance.
4. In Google Search Console: verify the new site, submit a fresh sitemap, and watch for 404s. The old Wix site's URLs won't match your new routes — set up redirects in `netlify.toml` for any old page that has inbound links or ranking.

---

## 9. Risks, ranked by how much they'd hurt

| Risk | Impact | Prevention |
|---|---|---|
| MX/SPF not rebuilt before the nameserver flip | **Silent email loss** — inquiries stop and nobody notices | Build the full zone in §7.1 *before* flipping; test both directions |
| Wix's Google Workspace cancelled before mail history is copied | **Permanent loss of the client's email archive** | Google Takeout backup + IMAP migration first — `email-migration.md` steps 1–4, gated before Phase 5 |
| Two SPF records left on the domain at once | Email authentication fails for *both* providers | Delete the Google SPF when adding the Private Email one |
| Registrant contact edited during account recovery | 60-day transfer lock | §0.1 — check before touching anything |
| Auth code sent to an inbox you can't open | Transfer can't start at all | §0.1 |
| Domain cancelled instead of transferred | Could lose the name permanently | Never cancel; only transfer |
| Namecheap account on a personal email, no 2FA | You repeat the lost-account problem | §5.1 |
| SQLite on a host with no persistent disk | Student/tutor data wiped on every deploy | Paid instance + disk, plus scheduled `db:backup` |
| `COOKIE_SAME_SITE`/`CORS_ORIGIN` unset in production | Login silently fails on the live site | §6, and test login in §7.4 |

---

## 10. If the 60-day lock hits you

If §0.1 forced a contact-info change, the transfer is blocked for 60 days. You don't have to wait to launch:

1. Deploy to Netlify as in Phase 3.
2. In Wix: `···` → **Manage DNS records**. Delete the three Wix A records on `@` and add `A` → `75.2.60.5`. Change the `www` CNAME from `cdn1.wixdns.net` to `your-site.netlify.app`. Leave every MX and TXT record untouched.
3. Add both domain forms in Netlify and let it issue the certificate.
4. Keep the Wix plan running (you still need their DNS), set a calendar reminder for the lock expiry, then do Phases 1, 2, 4 and 5 then.

Slower and you pay Wix for two more months, but the new site goes live this week.

---

## Sources

- [Transferring Your Wix Domain Away from Wix — Wix Help Center](https://support.wix.com/en/article/transferring-your-wix-domain-away-from-wix-2477749)
- [Request: Changing Name Server (NS) Records for a Wix Domain — Wix Help Center](https://support.wix.com/en/article/request-changing-name-server-ns-records-for-a-wix-domain)
- [Connecting a Wix Domain to an External Site — Wix Help Center](https://support.wix.com/en/article/connecting-a-wix-domain-to-an-external-site)
- [Google Workspace: FAQs — Wix Help Center](https://support.wix.com/en/article/google-workspace-faqs)
- [Transfer subscriptions between Google and resellers — Google Workspace Admin](https://knowledge.workspace.google.com/admin/billing/transfer-subscriptions-between-google-and-resellers)
- [.com domain pricing — Namecheap](https://www.namecheap.com/domains/registration/gtld/com/)
- [How to create an ALIAS record — Namecheap Knowledgebase](https://www.namecheap.com/support/knowledgebase/article.aspx/10128/2237/how-to-create-an-alias-record-for-a-domain/)
- [Configure external DNS for a custom domain — Netlify Docs](https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/)
- [Pricing — Render](https://render.com/pricing)
- [Domain pricing — Porkbun](https://porkbun.com/products/domains) (renewal comparison)
- [Transfer a domain to Cloudflare Registrar — Cloudflare Docs](https://developers.cloudflare.com/registrar/get-started/transfer-domain-to-cloudflare/) (why Cloudflare can't take a Wix transfer directly)
- Registry data via Verisign RDAP for `openmindsstudios.com`; live DNS via Google Public DNS, August 20, 2026

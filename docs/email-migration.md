# Business email — moving openmindsstudios.com mail off Wix

**Companion to** `domain-migration.md` and `launch-runbook.md`
**Date:** August 20, 2026
**Mailboxes wanted:** `openminds@`, `nina@`, `karen@` — three, all `@openmindsstudios.com`

---

## First, the thing that confuses everyone

**The addresses don't change. Not one character.**

`openminds@openmindsstudios.com` has two halves that belong to different things:

- **`openmindsstudios.com`** — the domain. *You* own this. It's what you're moving to Namecheap.
- **`openminds@`** — the mailbox name. You invent these, and you can make as many as you want.

The email *provider* is only the company that stores the messages. Changing provider is like changing which warehouse holds your packages — the address on the box is unaffected. Business cards stay valid, nothing to announce, no forwarding to set up. The only visible difference: Nina and Karen log into a different site (or app) to read their mail.

### Mailbox vs. alias — worth knowing, it saves money

| | What it is | Cost |
|---|---|---|
| **Mailbox** | A real account. Own password, own inbox, own login. One per *person*. | Costs money |
| **Alias** | An extra address that lands in a mailbox you already have. | **Free** |

You need **3 mailboxes** because Nina and Karen each want a private inbox the other can't read, plus the shared `openminds@`.

But `info@`, `contact@`, `admissions@`, `billing@`, `hello@` are **aliases** — free, and you point each one at whichever of the three mailboxes should receive it. Set up as many as you like.

---

## The plan: Namecheap Private Email **Pro** — $41.88/year for all three

### Why Pro rather than adding extras to Starter

| | 3 mailboxes / year | Storage each | Aliases | Push sync on phones |
|---|---|---|---|---|
| Starter + 2 extra mailboxes | $32.64 | 5 GB | 10 | ❌ |
| **Pro** ⭐ | **$41.88** | **10 GB** | **50** | ✅ |

Pro costs **$9.24/year more** and gives double the storage, five times the aliases, and push sync. That last one matters more than it sounds: Nina and Karen are on Gmail today, where new mail *arrives*. On Starter, IMAP fetches on an interval instead — a minute or two of delay. It's the kind of small regression a client notices and blames the whole migration for. Pay the $9.

### What you're saving

| Option | 3 mailboxes / year | Same addresses? | Real IMAP? |
|---|---|---|---|
| Stay on Wix | **$240** (3 × $80) | ✅ | ✅ |
| Google Workspace, billed direct | **$252** (3 × $84) | ✅ | ✅ |
| **Namecheap Private Email Pro** ⭐ | **$41.88** | ✅ | ✅ |
| Zoho Mail Forever Free (5 mailboxes) | $0 | ✅ | ❌ webmail + Zoho app only |

**Saving: about $198/year.** And note the thing nobody expects — moving your Google Workspace billing from Wix to Google *directly* would cost **more** ($252 vs $240). Wix's price is a slight discount on Google's list. The saving comes from leaving Google Workspace, not from leaving Wix's billing.

**Why not Zoho's free tier?** It's genuinely $0 for five mailboxes and I'd normally push for it. Two reasons I'm not: the existing mail must come with you, and Zoho's free plan has no IMAP — which turns a drag-and-drop migration into a fight. And you'd be asking a non-technical client to abandon the Gmail app for Zoho's. Saving $42/year isn't worth either.

---

## What's running today

Confirmed from the Wix panel and live DNS:

- Wix Business Email **is Google Workspace, resold by Wix** (hence the "Go to Gmail" button)
- **One** mailbox exists today: `openminds@openmindsstudios.com` — Nina and Karen are new
- MX points at Google: `aspmx.l.google.com` + four backups
- SPF: `v=spf1 include:_spf.google.com ~all`
- **No DKIM. No DMARC.** Both get fixed during this move — you're emailing parents, and mail from a domain with neither increasingly gets filtered.

---

## The key insight that makes this safe

**You can move the mail history before you move the delivery.**

A mailbox is reachable over IMAP whether or not MX points at it. MX only decides where *new* mail lands. So the order is:

1. Create the three mailboxes at Namecheap — **no DNS change, zero risk**
2. Copy years of mail into `openminds@` over IMAP — **still no DNS change, still zero risk**
3. *Then* flip MX in one clean cutover
4. Run one more sync to sweep up anything that arrived during propagation

All the slow, scary work happens while the live system is untouched. The only moment of actual change is step 3, and by then you've already proved the new mailboxes work.

This also means you can buy Private Email and do steps 1–2 **while the domain transfer is still processing** — Namecheap sells Private Email for domains registered elsewhere, and documents this exact case for Wix-hosted domains.

---

## Step by step

### 1. Safety copy first — before touching anything

In the Google account behind Wix Business Email, run **[Google Takeout](https://takeout.google.com)**. Export Mail, and tick Drive, Contacts and Calendar too — there may be things in that account nobody remembers.

You get a `.mbox` file. Put it somewhere permanent. This is insurance independent of everything below. Do it not because the migration will fail, but because occasionally it does.

### 2. Buy Private Email Pro and create the mailboxes

Can be done today, mid-transfer.

1. Namecheap → Private Email → **Pro**, for `openmindsstudios.com`
2. Create all three mailboxes: `openminds@`, `nina@`, `karen@`
3. Set strong unique passwords. Put them in a password manager the team can reach — not a text file, not a WhatsApp message.
4. Add any aliases you want (`info@`, `contact@`, …) — free
5. In the Private Email panel, **generate the DKIM record** and copy the value. You'll need it in step 5.

If Namecheap asks you to confirm domain ownership with a DNS record, add it in the Wix DNS panel. That's safe — it doesn't touch MX.

### 3. Get IMAP credentials on the Google side

To pull the old mail out you need to log into the old mailbox from a mail app:

1. Open the Google Admin Console for that Workspace — Wix's `···` → **Manage business email** → the admin link, or `admin.google.com`
2. Confirm IMAP is enabled (Gmail → Settings → Forwarding and POP/IMAP)
3. Turn on 2-Step Verification for the account, then create an **App Password** — Google won't issue one without 2SV. Use that 16-character password for the migration, never the real one.

### 4. Copy the mail across

**Easiest route — Thunderbird** (free, runs on your Mac):

1. Add the **Gmail** account as IMAP, using the app password from step 3
2. Add **`openminds@`** on Private Email as IMAP:
   - IMAP: `mail.privateemail.com`, port **993**, SSL/TLS
   - SMTP: `mail.privateemail.com`, port **465** SSL (or 587 STARTTLS)
   - Confirm these in the Private Email panel before trusting them
3. Let Gmail finish downloading everything — a large mailbox takes hours. Leave the Mac awake.
4. Create matching folders under Private Email, then **drag messages across in batches** of a few thousand. One giant drag will stall.
5. Spot-check: oldest message, newest message, an attachment, a couple of folders

Only `openminds@` has history. Nina's and Karen's mailboxes are new and empty — nothing to migrate.

For flag-and-timestamp-perfect fidelity, `imapsync` is the proper tool, but Thunderbird is fine for one mailbox and doesn't need the command line.

### 5. Flip the MX records

Do this as part of building the Namecheap DNS zone, so website and email cut over together — one change, one verification pass.

**Remove** the five Google MX records and the Google SPF. **Add:**

| Type | Host | Value | Priority |
|---|---|---|---|
| MX | `@` | `mx1.privateemail.com` | 10 |
| MX | `@` | `mx2.privateemail.com` | 10 |
| TXT | `@` | `v=spf1 include:spf.privateemail.com ~all` | — |
| TXT | `privateemail._domainkey` | *(DKIM value from step 2.5)* | — |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:openminds@openmindsstudios.com` | — |
| CNAME | `mail` | `privateemail.com` | — |
| CNAME | `autodiscover` | `privateemail.com` | — |
| CNAME | `autoconfig` | `privateemail.com` | — |

**Keep** `google-site-verification=5CMrIcNhGnQt6d0yHxgN-GGOdieHBMYmcANfXHIy178` — that's Search Console, not email. Removing it breaks your verification.

Three things people get wrong here:

- **Only ever one SPF record per domain.** Two is a misconfiguration that breaks authentication for *both*. Delete Google's; don't add alongside it.
- **Start DMARC at `p=none`** (monitor only). Move to `quarantine` then `reject` after a few weeks of clean reports. Going straight to `p=reject` is how people bin their own invoices.
- **The autodiscover CNAMEs are optional but do them anyway** — they're what makes "add the account on my iPhone" a 30-second job instead of a support call.

### 6. Verify, then catch the stragglers

1. Send from an outside address to each of the three mailboxes → all arrive
2. **Reply from each one** → arrives, and not in spam
3. Send a message to [mail-tester.com](https://www.mail-tester.com) → SPF and DKIM both pass, score 9+/10
4. **One more incremental sync** from Gmail — anything that arrived during DNS propagation went to Google, and this sweeps it up

### 7. Set up the devices

Nina and Karen are used to Gmail, so make this painless:

- **Gmail mobile app** — accepts non-Google IMAP accounts, so they keep the app they know
- **Apple Mail / iPhone Mail** — add as IMAP with the step 4 settings; the autodiscover CNAMEs make this near-automatic
- **Webmail** — `privateemail.com`, the fallback that always works

Do this *with* them rather than sending instructions. Ten minutes on a call saves a week of "email is broken" messages.

### 8. Only now, cancel the Wix email

Do not cancel until steps 6 and 7 pass. Then:

1. Confirm you can actually open the Takeout archive from step 1
2. Cancel the Wix Business Email / Google Workspace subscription
3. Then cancel the Wix Premium plan

**Careful with auto-renew.** Don't switch it off "to be safe" before the migration is done — if the term ends mid-migration the mailbox is gone, and so is any mail you hadn't copied. Check the renewal date, work backwards from it, and leave auto-renew alone until the new setup is verified. **If the renewal is close, pay Wix for one more year rather than rushing this.** $80 is cheap next to losing the client's email archive.

---

## Separate thing: the app's notification emails

Your app sends inquiry notifications (`notifyNewInquiry` in the legacy code). **Don't route those through a mailbox** — apps that send via a personal mailbox's SMTP get rate-limited and eventually flagged as spam sources.

Use a transactional provider: **Resend** (3,000/month free) or **Brevo** (300/day free). You get an API key, a DKIM record to add, and delivery logs — so when a parent says "I never got it," you can prove otherwise.

It also keeps the concerns separate: the mailbox plan is sized for three humans reading mail, and app volume never affects it.

---

## Sources

- [Private Email plans comparison — Namecheap](https://www.namecheap.com/support/knowledgebase/article.aspx/10174/2179/private-email-plans-comparison/)
- [Prices for additional mailboxes — Namecheap](https://www.namecheap.com/support/knowledgebase/article.aspx/9185/2215/prices-for-additional-mailboxes-for-namecheap-private-email/)
- [Private Email DNS records on Namecheap nameservers](https://www.namecheap.com/support/knowledgebase/article.aspx/1338/2176/how-to-set-up-namecheap-private-email-dns-records-for-domains-on-namecheap-basicpremium-nameservers/)
- [Private Email DNS setup for domains hosted with Wix — Namecheap](https://www.namecheap.com/support/knowledgebase/article.aspx/10168/2176/namecheap-private-email-dns-records-setup-for-domains-hosted-with-wix/)
- [Business Email plans and pricing — Namecheap](https://www.namecheap.com/hosting/email/)
- [Google Workspace pricing 2026 — Name.com](https://www.name.com/blog/google-workspace-pricing)
- [Zoho Mail pricing and Forever Free plan](https://www.zoho.com/mail/zohomail-pricing.html)
- [Switching Google Workspace billing from Wix reseller to Google direct — Wix Studio forum](https://forum.wixstudio.com/t/how-can-i-switch-my-google-workspace-billing-from-wix-reseller-to-direct-google-billing-without-losing-data/74612)
- Live DNS for `openmindsstudios.com` via Google Public DNS, August 20, 2026

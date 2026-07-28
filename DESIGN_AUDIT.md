# Visual and UX audit

Audit performed on the running application at 1440, 768, and 390 pixels wide,
plus a scroll pass through the landing page. Before screenshots are the
reference for every issue below.

Guidance followed: the installed **UI/UX Pro Max** skill (accessibility and
touch first, then performance, style, layout, typography, animation, forms,
navigation) and Framer Motion best practice. Note: **no Framer Motion skill is
installed** on this machine (only `ui-styling` and `ui-ux-pro-max`), so motion
work follows the UX skill's animation rules plus Framer Motion documentation
conventions.

Skill rules that shaped the plan:
- Animation duration 150 to 300 ms for micro-interactions, never over 500 ms for UI.
- Ease-out entering, ease-in exiting. Never linear.
- Animate one or two key elements per view. Not everything that can move.
- `prefers-reduced-motion` respected (severity: high).
- Touch targets 44x44 px minimum with 8 px spacing.
- Contrast 4.5:1 for body text.
- Semantic color tokens, never raw hex scattered through components.

## Cross-cutting findings

| # | Component | Current issue | Visual improvement | Motion behavior | Accessibility concern | Status |
|---|---|---|---|---|---|---|
| C1 | Whole app | No design tokens. Brand colors are hardcoded as `rgb(98,191,161)` inline in ~40 files, so nothing can be adjusted centrally | CSS custom properties for color, tint, elevation, radius, spacing, easing, duration, z-index | n/a | n/a | done |
| C2 | Whole app | Every section redefines its own `inView` object. No shared motion vocabulary | One `src/lib/motion.js` with named variants | Shared entrance, stagger, hover, modal, tab variants | Reduced motion handled in one place | done |
| C3 | Whole app | One generic shadow (`shadow-sm`) used for every surface. No elevation hierarchy | Four-level elevation scale, layered shadows | Hover raises one level | n/a | done |
| C4 | Whole app | No `prefers-reduced-motion` handling anywhere | n/a | Motion tokens collapse to near-zero; transforms removed, short opacity kept | Was a high-severity gap | done |
| C5 | Cards everywhere | Flat: 1 px border, no depth, no hover feedback, no pointer affordance | Elevation, border response, lift on hover, directional cue on clickable cards | 180 to 260 ms lift | Clickability signalled by more than colour | partial |
| C6 | Typography | Every heading is the same heavy black. No scale, no rhythm | Display/H1/H2/H3 scale with tuned line height and tracking, measured max widths, softer body colour that still passes 4.5:1 | n/a | Body contrast raised from `slate-400` to `slate-600` on tinted backgrounds | partial |
| C7 | Buttons | Flat fills, no press state, inconsistent radii, no focus ring | Primary/secondary/accent/destructive/ghost system with hover lift and press | 120 to 180 ms | Visible focus ring restored on all variants | partial |
| C8 | Focus states | Default browser outline removed by Tailwind reset in places, never replaced | Consistent 2 px brand focus ring with offset | n/a | Keyboard navigation was invisible in several places | done |

## Public pages

| # | Component | Current issue | Visual improvement | Motion behavior | Accessibility concern | Status |
|---|---|---|---|---|---|---|
| P1 | Hero | **The headline is missing entirely.** The hero is a logo and two buttons in ~900 px of empty space. No value proposition, no supporting copy, no trust signal | Add the "Personalized Tutoring Gets Results" headline with the orange accent on "Results", supporting sentence, trust row, and clear portal actions | Staged entrance: eyebrow, headline, sub, actions, trust row | Headline must be a real `h1` | done |
| P2 | Hero background | Nearly white with two barely visible blobs | Layered radial brand lighting, subtle grid, contained blur | Static; no looping animation | Decorative only, `aria-hidden` | done |
| P3 | Section rhythm | Large flat rectangles of solid pale colour stacked directly on each other | Alternating white and 4 to 5 percent brand tints with soft radial lighting and a hairline divider | Section reveal on scroll, once | Reduced motion shows content immediately | done |
| P4 | Service cards | Plain bordered boxes, no hover, no affordance that they navigate | Icon medallion, hover lift, border tint response, arrow cue that slides | 200 ms lift, 200 ms arrow | Whole card is a link with a visible focus ring | done |
| P5 | About preview | Image, copy, and info cards fight for attention. Tier card is not obviously interactive | Rebalanced grid, tier card promoted to an interactive surface with directional cue | Hover lift + arrow | Card is a real link | not started |
| P6 | Portal preview | Heading clipped under the sticky header; large blank gaps | Scroll margin for sticky header, tightened rhythm | Reveal without gap | Anchor offset fixed | done |
| P7 | Contact form | Fields are plain, labels weak, no focus styling, no inline validation feel | Panel with elevation, clear labels, branded focus rings, animated success and error | Success check draws in; no motion while typing | Errors announced, tied to fields | not started |
| P8 | Page transitions | Routes swap instantly with a white flash | Shared `PageTransition` with a short fade and rise | 260 ms in, 180 ms out | Scroll restored to top; reduced motion fades only | done |
| P9 | Subscription plans | Three similar cards, weak differentiation, no selected state | Distinct identity per tier, gradient border on the popular tier, single badge, comparison rhythm, clearer CTA | Hover lift, badge settle, no looping glow | Badge is text, not colour alone | partial |

## Dashboards

| # | Component | Current issue | Visual improvement | Motion behavior | Accessibility concern | Status |
|---|---|---|---|---|---|---|
| D1 | Manager dashboard | **Off-brand indigo and purple** used for the primary button, active nav, and the Super Admin badge. The brand is teal, blue, and orange | Rebrand to the brand palette throughout | n/a | n/a | done |
| D2 | All dashboards | Session times render as raw 24-hour strings, e.g. "Wednesday, 14:00 – 15:00" | Friendly 12-hour format with the date, consistent with the rest of the app | n/a | Easier to parse for everyone | partial |
| D3 | All dashboards | Large empty regions below content; the page does not feel composed | Tighter grid, useful empty states that explain the next action | Empty state fades in | Empty states are text, not just an icon | partial |
| D4 | Status chips | Low-contrast pastel pills, colour is the only signal | Chip system with a dot, stronger text contrast, per-status colour | Status change animates the chip | Status conveyed by text and shape, not colour alone | partial |
| D5 | Cancel affordance | The cancel control on a session is a ~24 px icon | Real button with a label and a 44 px target | Hover and press | Was below the 44 px minimum | done |
| D6 | Manager tables | Flat rows, no hover, tiny 14 px action icons | Row hover, sticky header, larger action targets, aligned columns | Row hover 150 ms | Action buttons get accessible names | not started |
| D7 | Tab switching | Tabs swap content instantly with no spatial continuity | Animated underline and a short cross-fade | 220 ms | Tabs are buttons with proper state | not started |
| D8 | Admin Tools | Sits visually level with routine management screens | Elevated, clearly flagged as bypassing normal workflow, destructive actions distinct | Warning panel reveal | Destructive actions never look like primary actions | not started |
| D9 | Booking grid | Day cells and slots are hard to scan; selection is subtle | Clearer day cells, grouped slots, obvious selected state | Slot selection springs subtly; week change slides | Selected state has a check, not colour alone | not started |
| D10 | Loading | Full-screen spinners with no context | Skeletons that match the final layout | Gentle pulse | Announced with `aria-busy` | partial |

## Deliberately not changed

- The portal preview on the landing page keeps its illustrative demo figures.
  It is a marketing screenshot of the product, is already labelled "Demo view",
  and is not shown to a signed-in user. No mock data was added to any real
  account.
- The guide, policy, and legal page copy is unchanged; only the surrounding
  layout and typography were improved.


## Status after this pass

Shipped and verified:

- The token system, motion architecture, elevation scale, focus treatment, and
  reduced-motion handling (C1 to C4, C8).
- The hero rebuild, section rhythm, service cards, page transitions, and the
  removal of looping decoration on the subscription page (P1 to P4, P6, P8).
- Full rebrand off Tailwind indigo and purple onto the brand palette across all
  14 dashboard files (D1), friendly Eastern Time session display, status chips,
  real empty states, skeletons, and a 44px cancel control on the student
  dashboard (D2 to D5, D10).

Partially applied: the new card, typography, button, chip, and empty-state
primitives are in place and used on the landing page and the student
dashboard, but the tutor and manager panels still use their original inline
styles in many places. They are on-brand and consistent, but they do not yet
use `Surface`, `ActionButton`, or `StatusChip`.

Not started in this pass, and still carrying the issues described above:

- P5 About preview rebalance
- P7 Contact form treatment
- D6 Manager table density and action target sizes
- D7 Animated tab transitions
- D8 Admin Tools elevation and destructive-action emphasis
- D9 Booking grid scannability

These remain accurate descriptions of the current interface and are the
natural next group of work.

## Second pass: logo-first opening experience

The first redesign kept a conventional two-column hero (headline left, login
card right), which read as a generic SaaS template regardless of how well the
tokens underneath it were built. It was replaced outright.

| Item | Before | After |
|---|---|---|
| First screen | Two-column: oversized headline and eyebrow pill left, white login panel right | Single centered composition: full brand mark near the visual centre, two portal buttons beneath, nothing competing |
| Marketing copy | "Personalized Tutoring Gets Results" as the opening visual | Moved below the fold into its own band, where it supports rather than competes |
| Login affordance | Two rows inside a bordered white card | Two standalone tactile buttons, gradient filled with an edge highlight and layered shadow |
| Entrance | Ad-hoc per element, replayed on every mount | One ~2.5s choreography in `useIntroTiming`, once per browser session |
| Background | Two faint blobs on near-white | Layered radial lighting (teal, blue, orange warmth), SVG grain at 2.8 percent, soft vignette |
| Header | Plain links with inline colour swap on hover | `AnimatedNavLink` with a scale-x underline, active state, staggered intro, layered CTA, 44px mobile toggle |

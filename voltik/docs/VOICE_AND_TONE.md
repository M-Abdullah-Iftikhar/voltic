# Voltik — Voice & Tone Guide

This guide governs every line of customer-facing copy on Voltik: product
descriptions, button labels, empty states, error messages, marketing
emails, push notifications. If a string makes it to a screen, it lives
under this guide.

It's a **specification**, not a vibe — when in doubt, the rules win and
the prose adjusts.

---

## 1. The brand voice in one sentence

> **Voltik talks like the friend who actually knows their charging
> brick and refuses to oversell it.**

That sentence is the litmus test. If a draft fails any of:

- *Would a smart friend say this?*  (no jargon, no marketing word-salad)
- *Are they being honest about trade-offs?*  ("65W when you need it; 30W in your back pocket")
- *Would they bother?*  (no padding, no SEO bloat)

…rewrite it until it passes.

---

## 2. Voice — fixed brand traits

These traits are constant across every channel. They don't shift with
context.

| Trait | Means | Doesn't mean |
| --- | --- | --- |
| **Engineered, not assembled** | We lead with what's *in* the product (GaN, IPX5, 30k bend cycles) | We lecture or quote datasheets |
| **Confidently honest** | "It's not for everyone — here's why" | False modesty or apology |
| **Quietly playful** | One light moment per page (not per line) | Pun-stuffed body text |
| **Specific** | Watts, hours, drops, materials | Vague superlatives ("amazing", "ultimate") |
| **Pro-shopper** | We trust the reader to make a call | Hand-holding or sales pressure |

---

## 3. Tone — shifts by context

Voice is a constant; tone moves with the surface. Pick the row that
matches what the user is doing.

| Surface | Tone | Example |
| --- | --- | --- |
| **Product hero** | Confident, specific | "65W of GaN in something the size of a deck of cards." |
| **Marketing email** | Friendly, brief | "The Cube ships in 24 hours. We thought you'd want first dibs." |
| **Cart / checkout** | Calm, factual | "Arrives Mon, Jun 17 if you order in the next 4h 12m." |
| **Empty state** | Warm, helpful | "Nothing here yet. Want to start with the bestsellers?" |
| **Error message** | Plain, accountable | "We couldn't reach the payment processor. Try again — your cart is safe." |
| **Admin tool** | Direct, terse | "12 products selected · Apply" |
| **Push notification** | Punchy, time-aware | "Your Volt Buds shipped — out for delivery today." |
| **Compliance / legal** | Plain English, no euphemisms | "We share your address with the carrier. That's it." |

The shift is in *register*, not in *voice*. A push notification is
terse and a hero is luxurious, but both still sound like Voltik.

---

## 4. Writing rules

### Always
- Lead with what the customer cares about (outcome, not feature).
- Use real numbers. "65W" beats "fast". "30-hour battery" beats "all-day".
- Active voice: "*We test every cable*", not "Every cable is tested."
- One thought per sentence. Break long sentences into two.
- Sentence case for everything but proper nouns. (Buttons too — "Add to cart", not "ADD TO CART".)
- Title-case product names exactly: **Volt Buds Pro 2**, **GaN Cube**, **PowerCore 20K**.
- US English everywhere ("customise" → "customize"; "colour" → "color"). Exception: the admin Voice & Tone guide itself uses UK English so it's visually distinct from the storefront.

### Never
- "Revolutionary". "Game-changing". "Cutting-edge". "Next-gen".
- Emojis in product descriptions, page bodies, or CTAs. Emojis are
  reserved for: push notifications, exit-intent modals, and the cart
  "fun" empty state.
- All-caps emphasis. Use weight or color instead.
- More than one exclamation mark in a 100-word block.
- Negative framing for marketing prose ("Don't miss out"). Always
  positive: "Here's what's new."
- Acronyms without a first-mention expansion in body copy. (Buttons
  and chips can stay shorthand: "PD", "ANC", "GaN".)

---

## 5. Product description structure

Every product description follows the same three-beat shape. This is
non-negotiable — the storefront layout assumes it.

```
[1-sentence hook]   ← what it is, in plain English
[1-2 sentence why]  ← the trade-off that makes it the right pick
[1-sentence proof]  ← a verifiable spec (watts, hours, IP rating)
```

**Example — good:**

> Voltik GaN Cube · 65W charger that fits in your front pocket.
> A second-generation gallium-nitride chip lets it deliver desktop-class
> power without the brick. Tested at 65W continuous for 6 hours straight
> without thermal throttling.

**Example — bad:**

> The ultimate next-generation charging solution! Experience
> revolutionary fast-charging technology in a sleek, compact form factor
> perfect for the modern professional on the go.

(Marketing word-soup, zero numbers, vague who-it's-for.)

---

## 6. Microcopy — common slots

Reusable strings. Edit here, not at the call site.

| Slot | Approved string | Notes |
| --- | --- | --- |
| Primary CTA | `Add to cart` | Never "Buy now" — implies one-tap purchase |
| Out of stock CTA | `Notify me when back` | Past-tense feels archival |
| Cart drawer open | `View cart` | Not "Cart" alone — verb-first |
| Empty cart | `Your cart's empty.` | Casual contraction stays |
| Empty favourites | `No favourites yet.` | Period at the end, no exclamation |
| 404 | `Lost in the cables.` | One light moment — see playfulness rule |
| 500 | `Something snapped on our end.` | Owns the failure, doesn't blame the user |
| Form success | `Saved.` | One word. Trust the green check to do the rest |
| Required field | `We need this one to ship to you.` | Explain *why* it's required |
| Promo code applied | `Code applied · −15% off` | En-dash, not hyphen, before percent |
| Promo code rejected | `Hmm, that code expired.` or `…doesn't exist.` | Specific. Never generic |

---

## 7. Pricing & numbers

- Always use `$` directly before the figure, no space: `$29.00`.
- Two decimals for catalog prices (`$29.00`), zero for round totals in casual prose ("under $30").
- Range separator is an en-dash (–), not a hyphen: `$25–$60`.
- Times use a colon, lowercase am/pm with no space: `4:12pm`.
- Stock counts: `12 in stock` for ≥10; `Only 3 left` for ≤5; `7 in stock — moving fast` for the middle.

---

## 8. Inclusivity

- Default to "they/them" when the user's pronoun is unknown. Never assume gender from a name.
- Avoid metaphors that require cultural fluency (sports, regional idioms).
- Don't lean on visual descriptors as primary identifiers ("the red button"). Use the action ("the submit button").
- Test every empty-state illustration with a screen-reader scrub. Alt text describes the *purpose*, not the *picture*.

---

## 9. Examples — rewrites

| Original | Rewritten |
| --- | --- |
| "Experience revolutionary charging speeds" | "Charges your phone from 12 to 100 in under an hour." |
| "Don't miss our amazing summer sale!" | "Summer drop — 15% off Volt Buds for the next 48 hours." |
| "An error has occurred. Please try again later." | "We couldn't reach the server. Try again — your cart is safe." |
| "Click here to add to your shopping cart" | "Add to cart" |
| "Subscribe to our newsletter for exclusive deals!!!" | "Get the early-access drops. One email per week." |
| "Hurry, while stocks last!" | "Only 3 left." |

---

## 10. Approving copy

A draft is ready to ship when:

1. ✅ Passes the "smart friend" test (Section 1)
2. ✅ Follows the relevant tone for its surface (Section 3)
3. ✅ Uses real numbers where it makes a claim (Section 4)
4. ✅ Follows the product-description shape if it's a product line (Section 5)
5. ✅ Matches the approved microcopy for shared slots (Section 6)

If any check fails, the draft goes back. There's no fast track.

---

*Last updated: keep iterating, keep shipping.* ⚡

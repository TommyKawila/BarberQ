# BarberQx Product OS

Single source of truth for Founder, Marketing, Product / R&D, UX/UI, and Engineering / Cursor.

This folder is the **product** operating system. It does not replace the brand system, the repo map, or Next.js agent rules.

Canonical **structure** is locked. Canonical **content** is revised here for review; treat FACT, HYPOTHESIS, and CUSTOMER EVIDENCE as labeled in each file.

## How to use

| Role | Start here |
|---|---|
| Founder | [00-NORTH-STAR.md](./00-NORTH-STAR.md), [03-PRODUCT-ROADMAP.md](./03-PRODUCT-ROADMAP.md) |
| Marketing | [01-MARKET-POSITIONING.md](./01-MARKET-POSITIONING.md), [04-PRODUCT-DECISIONS.md](./04-PRODUCT-DECISIONS.md) |
| Product / R&D | [CURRENT-STATE.md](./CURRENT-STATE.md), [03-PRODUCT-ROADMAP.md](./03-PRODUCT-ROADMAP.md), [04-PRODUCT-DECISIONS.md](./04-PRODUCT-DECISIONS.md) |
| UX/UI | [00-NORTH-STAR.md](./00-NORTH-STAR.md), then [`../BRAND.md`](../BRAND.md) |
| Engineering / Cursor | [CURRENT-STATE.md](./CURRENT-STATE.md), [04-PRODUCT-DECISIONS.md](./04-PRODUCT-DECISIONS.md), then repo [`../../README.md`](../../README.md) |

Insights, hypotheses, and feature requests do **not** authorize engineering work. They require Product/Founder approval before roadmap or sprint entry ([PD-008](./04-PRODUCT-DECISIONS.md)).

## Index

- [00-NORTH-STAR.md](./00-NORTH-STAR.md) — who it is for and the desired outcomes
- [01-MARKET-POSITIONING.md](./01-MARKET-POSITIONING.md) — what BarberQx is and is not
- [02-CUSTOMER-INSIGHTS.md](./02-CUSTOMER-INSIGHTS.md) — hypotheses and evidence rules (not a research archive)
- [03-PRODUCT-ROADMAP.md](./03-PRODUCT-ROADMAP.md) — now / candidates / later / not now
- [04-PRODUCT-DECISIONS.md](./04-PRODUCT-DECISIONS.md) — product decision log
- [CURRENT-STATE.md](./CURRENT-STATE.md) — operational snapshot
- [sprints/SPR-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md](./sprints/SPR-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md) — active delivery item; state owned by the Sprint artifact

## Workflow folders

- `sprints/` now exists because the first real Sprint artifact has been opened.
- `handoffs/` must not be created until the first real UX handoff exists.
- `reports/` must not be created until the first real Engineering / QA report exists.

Do not create placeholder files or empty workflow directories.

## Other sources of truth (do not duplicate here)

- Brand / visual hierarchy: [`../BRAND.md`](../BRAND.md)
- Cursor brand workflow: [`../../README_FOR_CURSOR.txt`](../../README_FOR_CURSOR.txt)
- How to run, stack, tenancy: [`../../README.md`](../../README.md)
- Marketing claim locks: [`../../src/lib/marketing/layout.test.ts`](../../src/lib/marketing/layout.test.ts)
- Sales copy: [`../../src/lib/i18n/dictionary.ts`](../../src/lib/i18n/dictionary.ts)

Do not put Product OS instructions in `AGENTS.md` or `CLAUDE.md` (Next.js owns those files).

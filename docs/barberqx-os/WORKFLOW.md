# BarberQx workflow protocol

How Founder, Marketing / Customer Discovery, Product / R&D, UX/UI, Engineering / Cursor, and QA **read and write** the Product OS.

Canonical files (`00`–`04`, `CURRENT-STATE`, OS `README`) stay the constitution. This file is the protocol. Insights, hypotheses, and requests do **not** authorize engineering except via this protocol ([PD-008](./04-PRODUCT-DECISIONS.md)).

Chat cannot move state.

## 1. Purpose

Define who may change which artifacts, which item owns delivery state, how work enters a Sprint, and when Founder approval is required.

## 2. Artifact types

| Artifact | ID | Where (when first real file exists) | Owns |
|---|---|---|---|
| Insight | `INS-*` | append in `02-CUSTOMER-INSIGHTS.md` | **Evidence/review status** only |
| Hypothesis | `HYP-*` | `02-CUSTOMER-INSIGHTS.md` | Hypothesis list; not a delivery item |
| Decision | `PD-*` | `04-PRODUCT-DECISIONS.md` | **Decision status** only |
| Sprint | `SPR-*` | `docs/barberqx-os/sprints/` | **Delivery state machine** after Founder + Product open delivery |
| UX handoff | `UX-*` | `docs/barberqx-os/handoffs/` | Supporting; linked to one `SPR-*` |
| Eng / QA report | `RPT-*-ENG`, `RPT-*-QA` | `docs/barberqx-os/reports/` | Supporting; linked to one `SPR-*` |

Do not create `sprints/`, `handoffs/`, or `reports/` until the first real artifact. No BUG/SEC/OPS ID systems.

## 3. One item, one state — who owns which machine

### Before delivery

- `INS-*`: evidence/review status (`draft` / `Product-reviewed`).
- `PD-*`: decision status (`Accepted` / `Hypothesis` / revisit).

These do **not** run the delivery machine.

### After Founder + Product approve delivery and create a Sprint

`SPR-*` is the **primary delivery work item** and **owns** this state machine:

READY_FOR_UX → UX_APPROVED → READY_FOR_ENGINEERING → IMPLEMENTED → READY_FOR_QA → PASS → LOCKED

`UX-*` and `RPT-*` are supporting artifacts **linked to that `SPR-*`**. They do not run competing state machines.

### Traceability example

```
INS-014
→ PD-021
→ SPR-007
   → UX-007
   → RPT-007-ENG
   → RPT-007-QA
```

A Sprint may omit `INS-*` if it cites another approved source (section 5).

## 4. Roles — read / write / never

| Role | Must read | May write | Never write directly |
|---|---|---|---|
| Founder | `00`, `01`, `03`, `04`, `CURRENT-STATE` | Gates in §8; `PD-*` / `HYP-*` with Product; `03` NOW vs NOT NOW | Code; brand; AGENTS/CLAUDE; inventing INS as evidence |
| Marketing / Discovery | `00`, `01`, `02`, `04` (PD-002, PD-005, PD-006), claim locks | Draft `INS-*` only | North star, decisions, roadmap, HYP list, CURRENT-STATE inventory, code |
| Product / R&D | `02`, `03`, `04`, `CURRENT-STATE`, repo README | INS review; `PD-*` drafts; roadmap moves; sprint scope after Founder; CURRENT-STATE after LOCKED; P0 post-review | Code; treating HYP as shipped |
| UX/UI | `00`, `../BRAND.md`, `README_FOR_CURSOR.txt`, bound `SPR-*` / `UX-*` | `UX-*` under that Sprint | Canonical OS; INS/PD; code unless dual-hatted **and** SPR is READY_FOR_ENGINEERING |
| Engineering / Cursor | `CURRENT-STATE`, `04`, repo README, **this SPR** at READY_FOR_ENGINEERING (or P0) | Code/tests for that SPR; `RPT-*-ENG` | Canonical OS; starting from chat/HYP/sales copy |
| QA | Handoff + Eng report + CURRENT-STATE truths | `RPT-*-QA`; PASS or reject to IMPLEMENTED | Canonical OS; widening scope |

## 5. Sprint source / rationale (not INS-only)

Every Sprint **must cite an approved source/rationale**. Allowed:

- Customer evidence / `INS-*`
- Product Decision / `PD-*`
- verified defect
- security issue
- production incident
- explicit Founder-approved operational requirement

Do **not** invent BUG/SEC/OPS IDs yet. Record the rationale in the `SPR-*` header (type + pointer/description).

Roadmap **CANDIDATES AWAITING EVIDENCE — NOT APPROVED** cannot become a Sprint without Founder + Product promotion.

## 6. Normal delivery transitions (owned by `SPR-*`)

| From | To | Who | Need |
|---|---|---|---|
| — | **READY_FOR_UX** | Founder + Product create `SPR-*` | Approved source (§5); not a NOT-NOW / unpromoted candidate |
| READY_FOR_UX | **UX_APPROVED** | UX | `UX-*` linked to SPR: surfaces, states, brand hierarchy, in/out |
| UX_APPROVED | **READY_FOR_ENGINEERING** | Product | UX matches PD + sprint scope |
| READY_FOR_ENGINEERING | **IMPLEMENTED** | Engineering | Code for this SPR only + `RPT-*-ENG` |
| IMPLEMENTED | **READY_FOR_QA** | Engineering | How to verify |
| READY_FOR_QA | IMPLEMENTED | QA | Reject + gaps |
| READY_FOR_QA | **PASS** | QA | Vs handoff, not new ideas |
| PASS | **LOCKED** | Product | Update `CURRENT-STATE` if behavior changed; Marketing copy only if PD-006 + claim locks hold |

Illegal: INS/HYP → engineering; chat → Cursor task; QA PASS that contradicts PD-006.

## 7. P0 / emergency path

**Triggers (examples):** security vulnerability; tenant isolation failure; double-booking regression; booking outage; LINE/auth failure; production data integrity; other critical production incidents.

**P0 machine** (still one delivery item, typically an `SPR-*` opened as P0, or a dated incident report later attached to an `SPR-*`):

P0 INCIDENT → Product / Engineering triage → **READY_FOR_ENGINEERING** → **IMPLEMENTED** → **READY_FOR_QA** → **PASS** → **LOCKED**

- UX approval **may be skipped** if the fix does not change user-facing design.
- Founder **pre-approval may be skipped** when immediate remediation is required to protect security, data integrity, or booking availability.
- Still required: **implementation report**, **QA**, **Product review after remediation**.
- Any durable architecture/product change is recorded afterward (`PD-*` and/or `CURRENT-STATE`).
- **P0 must never bypass normal Product approval for ordinary feature work.**

## 8. Founder gates (keep)

**Required**

- Sprint creation / entering delivery (normal path)
- ICP / category / pricing / LINE-first `PD-*` changes
- Promoting a candidate feature out of NOT APPROVED
- PMF or validated pricing claims
- Revisiting NOT NOW strategic areas

**Not required**

- Normal implementation inside already-approved sprint scope
- INS drafting, Product incomplete/reject, UX iteration in READY_FOR_UX, QA reject
- P0 immediate remediation (Founder informed; Product post-review still required)

## 9. Pipeline summary

- **Insight → Product review:** `INS-*` draft → Product → Product-reviewed. Implication ≠ feature.
- **Decision → Sprint:** optional `PD-*`; Sprint only when Founder + Product open `SPR-*` with §5 rationale.
- **Sprint → UX:** SPR at READY_FOR_UX; `UX-*` supports SPR.
- **UX-approved → Eng:** Product stamps READY_FOR_ENGINEERING; Cursor implements that SPR only (unless P0).
- **Eng reports:** `RPT-*-ENG` on that SPR.
- **QA:** `RPT-*-QA`; PASS or back to IMPLEMENTED.

## 10. First artifacts

1. This file (`WORKFLOW.md`) is protocol only.
2. Later: first `INS-*` draft from founder-led discovery — **not** a Sprint until Founder + Product open delivery.
3. `sprints/` only when Founder + Product open `SPR-001`. Do not create `handoffs/` or `reports/` until the first real artifact for those folders.

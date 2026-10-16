# BarberQx Sale Page: Pain Section, 3 desktop options

Figma page: **11 · Sale Pain Section** (page `69:2`), file `CCN8MxfdiTmNC2sJBw97RY`
- Option A · Cinematic: 1440 `69:3` / 1280 `69:206`, note `70:2`
- Option B · Scene + 4 cards: 1440 `69:71` / 1280 `69:274`, note `70:9`
- Option C · Notification storm + checklist: 1440 `69:136` / 1280 `69:339`, note `70:16`
- PNG: `pain-A.png` (1440×1080), `pain-B.png` (1440×1360), `pain-C.png` (1440×920)

## Shared theme (from branch `cursor/salepage-hero-coming-5211`, `SalesPage.tsx` / `PainChatMockup.tsx`)
- Font: Noto Sans Thai (`next/font` in `src/app/layout.tsx`)
- bg `#09090b` (zinc-950) · card `#18181b` · bubble `#27272a` · border `#3f3f46` · text `#fafafa`/`#f4f4f5` · muted `#a1a1aa`/`#71717a`
- Gold `#fcd34d` (amber-300) · icon tile `#fbbf24` @10% + `#f59e0b` @25% border · badge `#ef4444`
- Icons: lucide MessageCircle, ClipboardList, Users, UserRoundX (same as in the code)
- Content grid: content width = min(1200, W−160) → side padding 120 @1440, 80 @1280. Every option was rebuilt at 1280; nothing overflows and no Thai text gets cut off (checked in the exports).
- Copy is exactly as briefed. Chat text, times and the "ลูกค้า · ทั้งวัน / คำถามเดิม ๆ • ทั้งวัน" footer come from `dictionary.ts`. No numbers or stats were added (99+ is from the code).

---
## Option A: Cinematic (copy on the left over a full-bleed photo on the right)
- **Eye-path:** gold headline (top left) → barber's face (top right; a face draws the eye fast) → the phone in his hand → the 99+ chat card just under the phone → back to the left for the 4 pains → gold closing line. Roughly a Z path.
- **Type:** H 64 ExtraBold, line-height 128% (line 1 gold, line 2 white) · pains 22 SemiBold / 145% · punch 32 ExtraBold gold / 135% · close 20 Regular zinc-300 / 150% · chat msg 17 Medium, time 11
- **Spacing:** top padding 112 · headline→pains 48 · gap between pains 22 · pains→closing 48 · chat 380 wide (340 @1280) at y 600 · frame height 1080
- **Crop:** photo takes 60% of the width × 780 tall (≈1.1:1), cut from the 4:5 file 40px from the top. A left→right gradient (opaque → 0 at 65%) and a 220px bottom fade keep the text readable.
- **Transition:** 120px fade into `#111113` so the photo dissolves into the next section.
- **Pros / cons:** strongest mood. But the chat sits over a darker part of the photo, and the photo has to stay dark, which could look grim.

## Option B: Composed scene + 4 cards
- **Eye-path:** centered headline → the scene (photo + chat card overlapping by 100px, read as one unit through Gestalt proximity / common region) → 4 cards read left to right → centered closing line.
- **Type:** H 60 ExtraBold centered · card text 20 SemiBold / 150% · punch 36 ExtraBold · close 20
- **Spacing:** top 104 · headline→scene ~64 · scene 560 tall · scene→cards 64 · card padding 28, gap 24, radius 20 · cards→closing ~56 · frame height 1360
- **Crop:** photo is 60% of the content width (720×560 ≈ 9:7), radius 28, cut 90px from the top
- **Pros / cons:** neat and easy to scan. But it is the longest option, and four equal cards make every pain feel the same size, so the emotional punch drops. It also looks a lot like a generic feature grid, which could confuse it with the solution section.

## Option C: Notification storm + checklist ★ recommended
- **Eye-path:** headline 64 (top left) → checklist of 4 items (readers tick them off in their head: "this is so me") → gold closing line. That is an F-pattern on the left column. On the right, at the edge of vision: photo + 99+ badge + 4 notifications stacked by time 09:14 → 17:48 (older ones fade out: opacity 0.6 / 0.75 / 0.9 / 1), so the eye feels a whole day of questions piling up.
- **Type:** H 64 ExtraBold (58 @1280) · checklist 22 SemiBold / 145% · punch 32 ExtraBold gold · close 20 Regular · notification msg 17 Medium, meta 12–13
- **Spacing:** top 112 · left column 50% / right 44% (6% gutter) · checklist rows 18px top/bottom padding + 1px zinc-800 divider · headline→list 40 · list→closing 40 · frame height 920 (the shortest)
- **Crop:** 4:5 → 5:6 (rw × 1.2), radius 28, with a 260px bottom fade. The notifications cover only the lower half (arm / apron), not the face or the phone.
- **Transition:** the left column ends on the gold rule → punch → "BarberQx ช่วย…" line, which is the bridge into the calmer solution section. Then the 120px fade.

## Why C (recommendation)
1. **F-pattern / text scanning:** people read a page's left edge and the start of each line most (NN/g, "F-Shaped Pattern For Reading Web Content", 2006/2017; "Text Scanning Patterns: Eyetracking Evidence"). In C, the headline, the 4 pains and the closing line all sit on one left edge, so every key message is in the high-attention zone. B puts the pains in a horizontal row, which scanning tends to skip past.
2. **Gestalt proximity + similarity:** the 4 identical checkboxes read as one group of "the shop's problems", and the 4 notifications read as one group of "the customers" (NN/g, "Proximity Principle in Visual Design"; "Similarity Principle in Visual Design").
3. **Visual hierarchy and one focal point:** size and contrast give an order of headline > gold closing > pains > notifications (NN/g, "5 Principles of Visual Design in UX": scale, visual hierarchy, contrast). The gold punch line is the only gold body text, so it stands out (the isolation / Von Restorff effect).
4. **Shortest at 920px:** the pain gets across fast and hands off to the solution without dragging out the bad feeling. *This is a design judgment, not research data.*
5. The checklist format makes the reader do the self-check ("me too, me too") without adding any numbers.

## Assumptions
- **The landscape original photo is not in the repo.** Only the 1080×1350 (4:5) file exists, so every crop comes from that 4:5 file. If the landscape file arrives, Option A would get much better (a true full-bleed with the clippers/customer visible). Crop files: `design/fig/A.jpg`, `B.jpg`, `C.jpg`.
- In C, the notification icon uses LINE green `#06C755` so people recognise it as LINE right away. The current code uses a grey avatar. If brand rules don't allow it, switch to zinc-700.
- I used literal colors from the Tailwind classes in the code, not the file's design-system variables, because the "BarberQx/*" variables and styles are tuned for the app theme rather than the sale page's dark/gold.
- The colour of the next section (Solution / LINE Signature) is assumed to be `#111113` (≈ zinc-900/50 on zinc-950) for the transition fade.
- I removed the "—" dashes in the pain lines to match the copy in the brief. The code currently has dashes.
- Mobile is not designed yet. The layout used for 1280 is the same layout with less side padding.

# Update Room Command

Before doing anything else, run `/loadBase` to load the current state of the overview, story, and mechanics files into context.

You are helping the user flesh out a room in the horror one-shot "Close to God" through collaborative iteration, one field at a time.

## Setting Context

**Close to God** is a horror one-shot set in a luxury mountain facility trapped in an eternal storm. Core themes:
- Cloning & identity horror (players may have died and been reborn countless times)
- AI surveillance — a cheerful, patronising robot assistant watches everything
- Temporal disorientation — the facility has been running for 600,000+ years
- Isolation — the storm outside is lethal; escape seems impossible
- Rooms feel subtly wrong; memories from past clones bleed through

Use these themes to inform all suggestions. Every room should feel like it is part of an artificial paradise that has been running too long.

## YAML Schema

```yaml
name: Room Name
description:
  - Bullet point facts about what the room contains and looks like.
details:
  - content: "Observable detail that rewards careful attention."
    implication: What mechanic, theme, or hidden path this points to.
hallucinations:
  violence:
    trigger: What sets it off.
    effect: What the player experiences.
  theme:
    trigger: What sets it off.
    effect: What the player experiences — disturbing horror, not just information.
    implication: Which mechanic or theme this points to (e.g. cloning, temporal horror, surveillance).
  hints:
    trigger: What sets it off.
    effect: What the player learns or discovers. No save.
connections:
  - Other Room Name
secret_pathways: Hidden or non-obvious connections. "–" if none.
access: What is needed to enter (keycard, special condition). "–" if freely accessible.
presence:
  - AI
  - robots
```

## Process Overview

Work through one room at a time. Read the current YAML, show it to the user, then go field by field. Do NOT fill everything in automatically — iterate with the user on each field.

---

## Step 1: Pick a Room

If the user hasn't specified a room, list the rooms that still need work (empty or thin fields) and ask which to start with. Rooms are organised in:

```
rooms/
  central-facility/   sleeping-area, lab, pool, library, eating-area,
                      billiard-bar, winter-garden, sport-gym, hangar
  lower-levels/       outdoors, bio-facility, mechanoid-bay
  upper-levels/       lab-of-god, lookout-facility, entry-room
  hidden/             ai-core, cloning-facility, the-burrow, airducts
  deep-levels/        the-shed, the-jump, tor-system, the-end
  side-towers/        left-tower, right-tower
```

Read the room's YAML file. Show the user the current content in a clear summary.

---

## Step 2: Description

Show the current description (if any). Ask:
> "What does this room look like and what is its function in the facility?"

Offer 5 short options if the user wants inspiration — each should reflect a different angle (aesthetic, function, atmosphere). Write as 3–5 bullet points, present tense.

**Good description qualities:**
- Grounded in physical detail (materials, scale, light, smell)
- Describes what the room is and what is in it — factual, not atmospheric
- Does not imply horror — that belongs in hallucinations

---

## Step 3: Hallucinations

Each room has exactly one hallucination of each type. Work through them one at a time: Violence first, then Theme, then Hints.

For each type, show the current value (if any), then offer 5 short options the user can pick from or riff on. Always include the trigger condition in the option.

Every hallucination must have a trigger — a specific in-game action or condition that sets it off.

**Violence** — physical horror: blood, injury, death, bodily wrongness. This should be visceral and immediate — something the player witnesses or experiences happening to a body. Keep it short and disturbing.

**Theme** — a memory bleeding through from a past clone iteration of the player. A previous version of them experienced something in this exact room — and it surfaces now as a flash of visceral, unwanted memory. This is NOT a hint, NOT information delivery, NOT an environmental detail. The player should feel dread, wrongness, existential horror. The implication should be felt, not explained. Frame every option as: a past self, in this room, experiencing something the current player cannot fully grasp. Each option must include an **implication** tag naming which mechanic it points to (cloning, temporal horror, surveillance, impossibility of escape).

**Hints** — a vision that bleeds through useful information: the location of a tool, a secret passage, a blind spot in the AI's surveillance. This replaces a clue — the information comes through a hallucination, not an object. No save required, but it still needs a trigger.

Keep each entry to one sentence.

---

## Step 4: Connections

Show the current connections list. Ask:
> "Which rooms does this connect to directly? Are any of these wrong or missing?"

Cross-check against the other rooms' connection lists if the user is unsure. Suggest logical connections based on the room's location in the facility.

---

## Step 5: Secret Pathways

Ask:
> "Are there any hidden or non-obvious ways in or out of this room?"

Options to consider: vents, hidden doors, maintenance tunnels, loose panels, underwater passages (pool). If none, set to "–".

---

## Step 6: Access

Ask:
> "Is this room freely accessible, or does it require something special to enter?"

Examples: keycard tier, time of day, AI permission, a specific condition (lights out, alarm triggered). If freely accessible, set to "–".

---

## Step 7: Details

This is a second descriptive layer — things players can find, read, or notice if they look carefully. Details should be **helpful to players**: pointing toward a useful tool, a secret route, a weakness in the AI's surveillance, or something they can act on. Pure atmosphere belongs in the description. Pure horror belongs in hallucinations. Details are rewards for paying attention.

Ask:
> "What details does this room reward careful attention with?"

Each detail has two parts:
- **content** — a concrete, observable thing a sharp player can use; a passive player can miss. No vague atmosphere.
- **implication** — what this points to: a hidden path, a tool, a surveillance blind spot, an escape route, or a mechanical advantage.

Offer 5 example details if the user wants inspiration.

---

## Step 8: Confirm & Save

Show the complete updated YAML. Ask the user to confirm before saving. Then write the file.

Print: **"Room saved. Move to the next room?"**

---

## Important Guidelines

**DO:**
- Show current content before asking about each field
- Offer 5 concrete options whenever the user wants inspiration
- Keep descriptions tight — bullet points, not prose
- Stay in the horror/sci-fi tone of the setting
- Read existing YAML files to check connection consistency
- Save immediately after confirmation, don't batch

**DON'T:**
- Fill in all fields without user input
- Write long prose descriptions — this is reference material for a GM
- Repeat the room name in the description ("The Library is a…")
- Make Theme hallucinations feel like information delivery — they must be horror first
- Add details that are too vague ("a strange feeling", "something feels off")

---

## Session Checklist

- [ ] Description — 3–5 bullet points, physical facts, no horror
- [ ] Violence hallucination — visceral, triggered, one sentence
- [ ] Theme hallucination — horror first, implication tagged, triggered
- [ ] Hints hallucination — useful info via vision, triggered, no save
- [ ] Connections — complete and cross-checked
- [ ] Secret Pathways — confirmed or set to "–"
- [ ] Access — confirmed or set to "–"
- [ ] Details — 1–4 items rewarding careful attention
- [ ] File saved and confirmed

---

Start by asking the user which room to work on, or read the first incomplete room and suggest starting there.

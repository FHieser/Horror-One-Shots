# Update Room Command

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
description: What the room is and looks like. One or two sentences. Present tense.
hallucinations: What players see or experience here — visions, sounds, sensations tied to the horror themes.
connections:
  - Other Room Name
secret_pathways: Hidden or non-obvious connections. "–" if none.
access: What is needed to enter (keycard, special condition). "–" if freely accessible.
clues:
  - "A specific, concrete findable thing or detail."
notes: GM-facing notes — hooks, timing, triggers, optional content.
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

Offer 3 short options if the user wants inspiration — each should reflect a different angle (aesthetic, function, atmosphere). Keep descriptions to 1–2 sentences, present tense.

**Good description qualities:**
- Grounded in physical detail (materials, scale, light, smell)
- Hints at the artificial paradise gone wrong
- Does not explain the horror outright — implies it

---

## Step 3: Hallucinations

Show the current hallucinations field. Ask:
> "What do players experience here — what visions, sounds, or sensations bleed through?"

Offer 3 options if wanted. Hallucinations should:
- Be specific and sensory, not abstract
- Tie to one of the core themes (identity, surveillance, time, escape)
- Feel personally threatening to the players as clones

**Format:** Single sentence or short phrase. Can include a whispered line in quotes.

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

## Step 7: Clues

Show the current clues. Ask:
> "What can players find or notice here? Give me 1–4 concrete, findable things."

Each clue should be:
- A physical object, inscription, or observable detail (not a vague "feeling")
- Useful to the overall mystery OR disturbing on its own
- Written as something a player could pick up, photograph, or describe

Offer 3 example clues if the user wants inspiration.

**Format:** Each clue is a list item. Dialogue or text should be in quotes.

---

## Step 8: Notes

Ask:
> "Any GM notes? Timing, triggers, optional scenes, things the AI might say here?"

This is optional. Leave empty if nothing needed.

---

## Step 9: Confirm & Save

Show the complete updated YAML. Ask the user to confirm before saving. Then write the file.

Print: **"Room saved. Move to the next room?"**

---

## Important Guidelines

**DO:**
- Show current content before asking about each field
- Offer 3 concrete options whenever the user wants inspiration
- Keep descriptions tight — one or two sentences max per field
- Stay in the horror/sci-fi tone of the setting
- Read existing YAML files to check connection consistency
- Save immediately after confirmation, don't batch

**DON'T:**
- Fill in all fields without user input
- Write long prose descriptions — this is reference material for a GM
- Repeat the room name in the description ("The Library is a…")
- Add clues that are too vague ("a strange feeling", "something feels off")
- Forget to keep the note field empty if the user has nothing to add

---

## Session Checklist

Use this to track progress per room:

- [ ] Description — clear, physical, present tense
- [ ] Hallucinations — specific, sensory, thematically tied
- [ ] Connections — complete and cross-checked
- [ ] Secret Pathways — confirmed or set to "–"
- [ ] Access — confirmed or set to "–"
- [ ] Clues — 1–4 concrete items
- [ ] Notes — GM content or left empty
- [ ] File saved and confirmed

---

Start by asking the user which room to work on, or read the first incomplete room and suggest starting there.

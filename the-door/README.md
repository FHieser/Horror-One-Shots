# The Door - WIP

## Overview

A cosmic horror one-shot set on a remote mining colony. The crew discovers a mysterious door in the mines that defies observation and corrupts those who interact with it.

## Details

| Aspect | Value |
|--------|-------|
| **Theme** | Cosmic Horror, Isolation, SCP-style entity |
| **Setting** | Planet 4d756e726f69 (4d7), Titanium Mining Colony |
| **Players** | 3-7 (including possible Android characters) |
| **Duration** | 4-6 hours |
| **Tone** | Paranoia, psychological breakdown, impossible choices |

## Core Concept

A mining drone discovers an impossible door deep in the tunnels. The Door doesn't want to be watched - it can only act when unobserved. As crew members investigate, they begin experiencing personalized omens. The captain goes missing. Paranoia spreads. The crew must decide: destroy it, open it, flee, or something else entirely.

## Files

```
the-door/
├── webapp/            # Static site (open webapp/index.html via a local server)
│   ├── index.html     # Overview (start page)
│   ├── map.html, room.html, mechanics.html, timeline.html, characters.html, audio.html
│   └── js/            # app.js + auto-generated content-index.js
└── data/              # Everything the pages load
    ├── overview.md    # Excerpt, at a glance, GM guide through all three acts
    ├── mechanics.md   # The Door's rules and solutions
    ├── characters.yaml, timeline.yaml, audio.yaml
    ├── map/           # map.png (reference sketch; the map itself is hand-placed SVG in webapp/map.html)
    └── rooms/         # surface/, facility/, mines/ — one YAML per room
```

After adding or removing room YAML files, run `node .github/scripts/generate-index.js`.

## Quick Reference

**The Door's Rules:**
- Can only act when unobserved (includes cameras)
- Cannot be opened while watched
- Resisting it causes: nosebleeds, stress, mine state resets
- Disappears if 3+ people interact with it simultaneously

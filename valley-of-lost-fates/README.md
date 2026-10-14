# Valley of Lost Fates - WIP

A door leads into a hidden valley. Once inside, you can't leave. The valley is shaped by old stories and by a meteor that was always there; tarot cards decide what waits in each place.

| Aspect | Value |
|--------|-------|
| **System** | [HeartCore](../../HeartCore) (Daggerheart variant, work in progress) |
| **Theme** | Dark fairy tale, tragic love, fate |
| **Language** | Myths in German, everything else in English |
| **Status** | Early draft, transferred from the "Valley of fallen Fates" notes |

## Files

```
valley-of-lost-fates/
├── webapp/              # Static site (serve the repo root and open webapp/index.html)
│   ├── index.html       # Overview
│   ├── map.html         # The wheel map (hand-placed SVG)
│   ├── locations.html, cards.html, final.html, crew.html, lore.html
│   ├── css/style.css    # Shared styles
│   └── js/app.js
└── data/                # Everything the pages load
    ├── overview.md
    ├── locations.yaml   # All locations with mechanics and artifact challenges
    ├── cards.yaml       # The 22 major arcana (upright / reversed)
    ├── final.yaml       # Final location: ruler, people and realm forms of the meteor
    ├── crew.yaml        # Expedition roles and gear
    └── lore/            # The myths (German)
```

Open points are listed in each data file under `open:` and shown on the pages.

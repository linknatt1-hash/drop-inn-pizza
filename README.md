# 🍕 The Drop Inn Pizza Dough Lab

Precision pizza dough calculation engine with dynamic flour W-factor absorption compensation, thermal baking mass calibration, cheese allocation matrices, and step-by-step fermentation timelines.

---

## 🍕 Supported Pizza Styles

1. **Neapolitan Base Profile**:
   - Calibrated for 00 flours ($W=280$ targets 63% hydration)
   - Neo-Neapolitan home oven adaptation (+2% EVOO, +1% sugar, +2% water)
   - Torn fresh mozzarella allocation ($0.9\text{g}/\text{in}^2$)
2. **Chicago Tavern Style (Thin Crust)**:
   - Ultra-crisp cracker crust with 24h curing schedule ($W=240$ targets 52% hydration)
   - 12% corn oil (enhanced color & blister fry), 2.22% salt/sugar, overnight counter desiccation & vapor-lock
   - Scaled shredded mozzarella & pecorino blend, spiced sauce & raw fennel sausage
3. **Detroit-Style Pan Pizza**:
   - Same-day hourly schedule with dynamic yeast acceleration ($W=300$ targets 73% hydration)
   - Rectangular pan geometry (9"x12", 9"x13", 10"x14", 13"x18", cast iron skillets)
   - 40% sliced Provolone pressed against pan walls (frico crown) + 60% cubed Mozzarella center
4. **New York Style (Street Slice)**:
   - Foldable, crispy slice with 4.1% EVOO and 1.6% barley malt syrup ($W=280$ targets 65% hydration)
   - Auto-blends 80% Bread Flour / 20% Central Milling Old-World T80 when T80 is selected
   - 16" and 18" screen baking launch with naked stone finish
5. **Ligurian Focaccia**:
   - Wildly bubbly high-hydration pan bread ($W=300$ targets 73% hydration, +5.88% at altitude)
   - Olive oil dimpling, 3x stretch-and-folds, flaky sea salt finish, and 205°F-210°F internal temp check

---

## 🏛️ Modular Architecture

```
Pizza app project/
├── index.html                  # Primary entry point with The Drop Inn Chicago box header
├── pizza_calculator.html       # Backward-compatible entry point
├── package.json                # Zero-dependency local dev server scripts (npm start)
├── README.md                   # Full documentation & scientific formulations
├── css/
│   ├── variables.css           # Design tokens, Italian red/green accents, Oswald typography
│   ├── base.css                # Chicago Pizza Box Header Theme & responsive layout
│   ├── components.css          # Form inputs, stat cards, alerts, tables, modal
│   ├── timeline.css            # Interactive step cards, progress bar & checkboxes
│   └── print.css               # Kitchen prep print stylesheet (window.print)
└── js/
    ├── data/
    │   ├── flours.js           # 13 categorized flours (00, Bread, AP) with W-values & custom flours
    │   ├── recipes.js          # All 5 styles, pan dimensions, and cheese allocations
    │   └── equipment.js        # Oven thermal specs (1000°F down to 450°F) & stones/steels
    ├── engine/
    │   ├── calculator.js       # Pure mathematical W-factor & geometric scaling engine
    │   ├── flourMatcher.js     # Style-specific flour evaluator (neo, tav, det, ny, foc)
    │   └── timelineEngine.js   # Dynamic schedules for cold-ferment and same-day pan bakes
    ├── state/
    │   └── store.js            # Reactive state store with localStorage persistence
    ├── ui/
    │   ├── formulaView.js      # Baker's % matrix, W-factor badge, and cheese allocation
    │   ├── toppingsView.js     # Scaled cheeses, Chicago sauce & sausage batches
    │   ├── timelineView.js     # Step-by-step checklist & completion tracker
    │   └── inventoryModal.js   # Grouped categories (00, Bread, AP) with "Toggle All"
    └── app.js                  # Main controller, pan toggle, and html2canvas snapshot
```

---

## 🚀 Running the Project

- **Direct in browser**: Double-click either [index.html](file:///c:/Users/linkn/OneDrive/Documents/Pizza%20app%20project/index.html) or [pizza_calculator.html](file:///c:/Users/linkn/OneDrive/Documents/Pizza%20app%20project/pizza_calculator.html).
- **Local server**: Run `npm start` to serve at `http://localhost:3000/`.

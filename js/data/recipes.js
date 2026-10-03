/**
 * TheDropInn Pizza Lab - Recipes & Pizza Styles Database
 * Contains deep structural recipes for all 5 styles:
 * 1. Neapolitan & Neo-Neapolitan
 * 2. Chicago Tavern Style (Cracker Crust)
 * 3. Detroit-Style Pan Pizza
 * 4. New York Style
 * 5. Focaccia
 */
(function(window) {
    'use strict';

    window.PizzaApp = window.PizzaApp || {};
    window.PizzaApp.data = window.PizzaApp.data || {};

    const STYLES = {
        neapolitan: {
            id: "neapolitan",
            name: "Neapolitan",
            fullName: "Neapolitan Base Profile",
            type: "hearth",
            densityGramsPerSqIn: 2.21,
            baseW: 280,
            baseHydration: 63.0,
            saltPct: 3.0,
            oilPct: 0.0,
            sugarPct: 0.0,
            diameters: [
                { id: "10", label: '10" Pizza', isPan: false, area: Math.PI * 25 },
                { id: "12", label: '12" Pizza (Standard)', isPan: false, area: Math.PI * 36 }
            ],
            cheesePerPizza: (area) => ({
                items: [{ name: "Fresh Mozzarella (Torn, Drained 2h)", grams: Math.round(area * 0.9) }]
            }),
            notes: "Traditional high-heat cornicione. Automatically adds 2% EVOO + 1% Sugar if home oven detected."
        },

        tavern: {
            id: "tavern",
            name: "Chicago Tavern Style",
            fullName: "Chicago Tavern Style (Thin Crust)",
            type: "cracker",
            base14DoughBallGrams: 375,
            densityGramsPerSqIn: 375 / (Math.PI * 49), // ~2.436 g/sq in
            baseW: 240,
            baseHydration: 52.0,
            saltPct: 2.22,
            oilPct: 12.0, // Corn oil (bumped to 12% for enhanced crust color and blister fry)
            sugarPct: 2.22,
            yeastAdyPct: 0.29,
            yeastIdyPct: 0.22,
            diameters: [
                { id: "10", label: '10" Pizza', isPan: false, area: Math.PI * 25 },
                { id: "12", label: '12" Pizza', isPan: false, area: Math.PI * 36 },
                { id: "14", label: '14" Pizza (Standard Tavern)', isPan: false, area: Math.PI * 49 },
                { id: "16", label: '16" Pizza', isPan: false, area: Math.PI * 64 },
                { id: "18", label: '18" Pizza', isPan: false, area: Math.PI * 81 }
            ],
            cheesePerPizza: (area) => {
                const ratio = area / (Math.PI * 49);
                return {
                    items: [
                        { name: "Low-Moisture Whole-Milk Mozzarella (shredded)", grams: Math.round(225 * ratio) },
                        { name: "Pecorino Romano or Parmesan (finely grated)", grams: Math.round(20 * ratio) }
                    ]
                };
            },
            notes: "Curing process requires rolling paper thin and leaving uncovered flat on the counter overnight to dehydrate."
        },

        detroit: {
            id: "detroit",
            name: "Detroit-Style",
            fullName: "Detroit-Style Pan Pizza",
            type: "pan",
            densityGramsPerSqIn: 3.56,
            baseW: 300,
            baseHydration: 73.0,
            saltPct: 2.0,
            oilPct: 2.0, // Olive oil
            maltPct: 2.0, // Barley malt syrup
            idealHours: 5.0,
            diameters: [
                { id: "9x12", label: '9"x12" Pan (Original Spec)', isPan: true, area: 9 * 12 },
                { id: "9x13", label: '9"x13" Quarter Sheet Pan', isPan: true, area: 9 * 13 },
                { id: "10x14", label: '10"x14" Detroit Pan (Standard)', isPan: true, area: 10 * 14 },
                { id: "13x18", label: '13"x18" Half Sheet Pan', isPan: true, area: 13 * 18 },
                { id: "10", label: '10" Cast Iron Skillet', isPan: true, area: Math.PI * 25 },
                { id: "12", label: '12" Cast Iron Skillet', isPan: true, area: Math.PI * 36 }
            ],
            cheesePerPizza: (area) => {
                const totalCheese = Math.round(area * 2.5); // 2.5g / sq in
                const provolone = Math.round(totalCheese * 0.40);
                const mozz = totalCheese - provolone;
                return {
                    items: [
                        { name: "Provolone (Sliced thick, pressed against pan walls for frico crown)", grams: provolone },
                        { name: "Low-Moisture Mozzarella (Cubed, center focus)", grams: mozz }
                    ]
                };
            },
            notes: "High-hydration pan pizza with frico caramelized cheese walls and airy focaccia-like crumb."
        },

        ny: {
            id: "ny",
            name: "New York Style",
            fullName: "New York Style (Street Slice)",
            type: "hearth",
            densityGramsPerSqIn: 3.001,
            baseW: 280,
            baseHydration: 65.0,
            saltPct: 2.5,
            oilPct: 4.1, // EVOO
            maltPct: 1.6, // Barley malt syrup
            diameters: [
                { id: "10", label: '10" Pizza', isPan: false, area: Math.PI * 25 },
                { id: "12", label: '12" Pizza', isPan: false, area: Math.PI * 36 },
                { id: "14", label: '14" Pizza', isPan: false, area: Math.PI * 49 },
                { id: "16", label: '16" Pizza (Pizza Screen)', isPan: false, area: Math.PI * 64 },
                { id: "18", label: '18" Pizza (Classic NYC Screen)', isPan: false, area: Math.PI * 81 }
            ],
            cheesePerPizza: (area) => ({
                items: [
                    { name: "Low-Moisture Whole-Milk Mozzarella (Shredded)", grams: Math.round(area * 1.44) },
                    { name: "Pecorino Romano (Finely grated, under the Mozzarella)", grams: 15 }
                ]
            }),
            notes: "Foldable, crispy yet chewy crust. If Central Milling Old-World T80 is selected, automatically blends 80% Bread / 20% T80."
        },

        focaccia: {
            id: "focaccia",
            name: "Focaccia",
            fullName: "Ligurian Olive Oil Focaccia",
            type: "pan",
            densityGramsPerSqIn: 5.83, // Calibrated so 10x14 yields ~432g flour
            baseW: 300,
            baseHydration: 73.0,
            saltPct: 2.5, // Kosher salt
            oilPct: 5.0, // EVOO for dough
            sugarPct: 1.4,
            idealHours: 5.0,
            diameters: [
                { id: "9x12", label: '9"x12" Pan (Original Spec)', isPan: true, area: 9 * 12 },
                { id: "9x13", label: '9"x13" Quarter Sheet Pan', isPan: true, area: 9 * 13 },
                { id: "10x14", label: '10"x14" Detroit / Focaccia Pan', isPan: true, area: 10 * 14 },
                { id: "13x18", label: '13"x18" Half Sheet Pan', isPan: true, area: 13 * 18 },
                { id: "10", label: '10" Cast Iron Skillet', isPan: true, area: Math.PI * 25 },
                { id: "12", label: '12" Cast Iron Skillet', isPan: true, area: Math.PI * 36 }
            ],
            cheesePerPizza: () => ({ items: [] }), // Focaccia has no mandatory cheese
            notes: "Wildly bubbly, olive oil saturated pan bread with dimpled brine and flaky sea salt."
        }
    };

    window.PizzaApp.data.recipes = STYLES;

})(window);

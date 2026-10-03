/**
 * TheDropInn Pizza Lab - Core Calculation Engine
 * Pure mathematical scaling engine supporting all 5 pizza styles:
 * Neapolitan, Chicago Tavern, Detroit-Style, New York Style, and Focaccia.
 * Incorporates W-Factor equations, surface area physics, and pan dimensions.
 */
(function(window) {
    'use strict';

    window.PizzaApp = window.PizzaApp || {};
    window.PizzaApp.engine = window.PizzaApp.engine || {};

    const Calculator = {
        /**
         * Calculates surface area in square inches for circular pizzas or rectangular pans.
         */
        calculateArea: function(diamVal) {
            if (diamVal === "9x12") return 9 * 12;
            if (diamVal === "9x13") return 9 * 13;
            if (diamVal === "10x14") return 10 * 14;
            if (diamVal === "13x18") return 13 * 18;
            
            const d = parseInt(diamVal, 10) || 12;
            return Math.PI * Math.pow(d / 2, 2);
        },

        getDisplaySizeLabel: function(diamVal) {
            if (diamVal.includes("x")) return `${diamVal} Pan`;
            return `${diamVal}"`;
        },

        calculateBallWeight: function(style, diamVal) {
            const area = this.calculateArea(diamVal);
            let gramsPerSqIn = 2.21; // Neapolitan default

            if (style === "tavern") {
                const baseArea14 = Math.PI * 49;
                gramsPerSqIn = 375 / baseArea14; // ~2.436
            } else if (style === "detroit") {
                gramsPerSqIn = 3.56;
            } else if (style === "ny") {
                gramsPerSqIn = 3.001;
            } else if (style === "focaccia") {
                gramsPerSqIn = 5.83; // 10x14 yields ~432g flour
            }

            return Math.round(area * gramsPerSqIn);
        },

        calculateFormula: function(params) {
            const {
                style = "neapolitan",
                selectedFlour,
                ovenType = "pizza",
                yeastType = "ADY",
                altitude = "high",
                startDateOffset = 0,
                cookingDateOffset = 2,
                detroitStartTime = 11,
                detroitBakeTime = 18,
                diameter = "12",
                ballCount = 3,
                checkedFlourIds = [],
                prefermentType = "none",
                prefermentPct = 20
            } = params;

            if (!selectedFlour) {
                return { success: false, error: "Please check at least one flour in your inventory setup to process." };
            }

            const area = this.calculateArea(diameter);
            const labelSize = this.getDisplaySizeLabel(diameter);
            const calculatedBallWeight = this.calculateBallWeight(style, diameter);
            const count = Math.max(1, parseInt(ballCount, 10) || 1);

            let timeDeltaDays = cookingDateOffset - startDateOffset;
            let totalHours = timeDeltaDays === 0 ? 8 : timeDeltaDays * 24;

            if (timeDeltaDays < 0) {
                return {
                    success: false,
                    error: "Configuration Error: Target Cooking Date cannot precede the Dough Start Date."
                };
            }

            // Same-day pan styles (Detroit and Focaccia)
            let availHours = 5.0;
            let actualHours = 5.0;
            let scheduleStartH = 13;
            if (style === "detroit" || style === "focaccia") {
                availHours = detroitBakeTime - detroitStartTime;
                if (availHours < 2) {
                    return {
                        success: false,
                        error: "Timing Error: Same-day pan styles require a minimum of 2 hours for mixing, proofing, and baking. Please adjust your start or bake times."
                    };
                }
                actualHours = availHours >= 5.0 ? 5.0 : availHours;
                scheduleStartH = detroitBakeTime - actualHours;
                totalHours = availHours;
            }

            // Base ingredients & percentages initialization
            let hydration = 63.0;
            let saltPct = 3.0;
            let oilPct = 0.0;
            let sugarPct = 0.0;
            let maltPct = 0.0;
            let yeastPct = 0.10;
            let altAlertText = "";
            let tavernAlertText = "";
            let homeOvenTriggered = false;

            // Flour W-Factor
            const flourW = selectedFlour.w || 280;

            if (style === "neapolitan") {
                // Base W=280 targets 63%, 1% hydration adjustment per 25 W points
                hydration = 63.0 + ((flourW - 280) / 25);
                saltPct = 3.0;

                if (ovenType !== "pizza") {
                    homeOvenTriggered = true;
                    oilPct = 2.0;
                    sugarPct = 1.0;
                    hydration += 2.0;
                }

                if (altitude === "high") {
                    hydration += 2.0;
                    altAlertText = "Altitude Adjustment: Hydration increased by +2% and yeast reduced by 20% to control fermentation rate in lower atmospheric pressure.";
                }

                hydration = Math.round(hydration * 10) / 10;

                let baseUnits = 0.0684 * 60;
                yeastPct = baseUnits / totalHours;
                if (altitude === "high") yeastPct *= 0.80;
                if (yeastType === "IDY") yeastPct *= 0.75;
                yeastPct = Math.min(Math.max(yeastPct, 0.02), 1.0);
                yeastPct = Math.round(yeastPct * 10000) / 10000;

            } else if (style === "tavern") {
                // Base 52%, scaling slightly for extreme strength
                hydration = 52.0 + ((flourW - 240) / 40);
                hydration = Math.round(hydration * 10) / 10;

                let extraWNote = flourW > 300 
                    ? ` High strength structural flour detected (W-Factor: ${flourW}). Automatically increased hydration to ${hydration}% to ensure the matrix can be rolled paper-thin without snapping back.` 
                    : ``;

                saltPct = 2.22;
                oilPct = 12.0; // Corn oil (12% for deeper crust color and golden blister fry)
                sugarPct = 2.22;

                // Scale yeast dynamically based on fermentation window:
                // 24h baseline is 0.29% ADY.
                // Longer cold cures require lower yeast to prevent over-fermentation.
                // Same-day requires higher yeast for fast activity.
                if (timeDeltaDays === 0) {
                    yeastPct = 0.60;
                    tavernAlertText = `Tavern Style Same-Day Schedule: Fast-track counter cure enabled (${totalHours}h). Yeast adjusted to 0.60% for accelerated development.${extraWNote}`;
                } else if (timeDeltaDays === 1) {
                    yeastPct = 0.29; // Authentic 24h baseline
                    tavernAlertText = `Tavern Style Engaged (24h Overnight Cure): Math engine switched to fixed baker's percentages. Curing process requires rolling paper thin and leaving uncovered to dehydrate overnight.${extraWNote}`;
                } else if (timeDeltaDays === 2) {
                    yeastPct = 0.20; // 48h cold ferment
                    tavernAlertText = `Tavern Style Multi-Day Cure (48h): Cold-fermentation schedule active. Yeast calibrated to 0.20% for optimal crust blistering and gluten relaxation.${extraWNote}`;
                } else if (timeDeltaDays === 3) {
                    yeastPct = 0.15; // 72h cold ferment
                    tavernAlertText = `Tavern Style Extended Cold Cure (72h): Deep flavor development with yeast calibrated to 0.15% to prevent over-fermentation.${extraWNote}`;
                } else {
                    yeastPct = 0.12; // 4+ days
                    tavernAlertText = `Tavern Style Slow Cold Cure (${totalHours}h): Ultra-low yeast percentage (0.12%) for extended refrigerator aging.${extraWNote}`;
                }

                if (altitude === "high") {
                    yeastPct *= 0.90;
                    altAlertText = "Altitude Adjustment: Yeast reduced by 10% to prevent over-proofing in lower atmospheric pressure.";
                }

                if (yeastType === "IDY") yeastPct *= 0.75;
                yeastPct = Math.round(yeastPct * 10000) / 10000;

            } else if (style === "detroit") {
                // Base W=300 targets 73%
                hydration = 73.0 + ((flourW - 300) / 20);
                saltPct = 2.0;
                oilPct = 2.0; // Olive oil
                maltPct = 2.0; // Barley malt syrup

                // Yeast scales with actual proofing window
                yeastPct = (5.0 / actualHours) * 1.0;

                if (altitude === "high") {
                    hydration += 2.0;
                    yeastPct *= 0.75;
                    altAlertText = `Altitude Adjustment: Hydration increased and yeast reduced to ${yeastPct.toFixed(2)}% to prevent pan collapse and maintain pillowy structure.`;
                }

                hydration = Math.round(hydration * 10) / 10;
                if (yeastType === "IDY") yeastPct *= 0.75;
                yeastPct = Math.round(yeastPct * 10000) / 10000;

            } else if (style === "ny") {
                // Base W=280 targets 65%
                hydration = 65.0 + ((flourW - 280) / 20);
                hydration = Math.round(hydration * 10) / 10;
                saltPct = 2.5;
                oilPct = 4.1; // EVOO
                maltPct = 1.6; // Barley malt syrup

                if (timeDeltaDays === 0) yeastPct = 1.0;
                else if (timeDeltaDays === 1) yeastPct = 0.50;
                else if (timeDeltaDays === 2) yeastPct = 0.35;
                else yeastPct = 0.25;

                if (altitude === "high") {
                    yeastPct *= 0.80;
                    altAlertText = `Altitude Adjustment: Yeast reduced to ${yeastPct.toFixed(2)}% to control fermentation rate in lower atmospheric pressure.`;
                }

                if (yeastType === "IDY") yeastPct *= 0.75;
                yeastPct = Math.round(yeastPct * 10000) / 10000;

            } else if (style === "focaccia") {
                // Base W=300 targets 73%
                hydration = 73.0 + ((flourW - 300) / 20);
                saltPct = 2.5;
                sugarPct = 1.4;
                oilPct = 5.0; // EVOO for dough

                yeastPct = (5.0 / actualHours) * 0.85;

                if (altitude === "high") {
                    hydration += 5.88;
                    yeastPct *= 0.78;
                    altAlertText = `Altitude Environmental Offset Applied: Hydration boosted by +5.88% (to ${hydration.toFixed(2)}%) to combat dry mountain air. Yeast systematically reduced by 22% to prevent structural blowout. Oven targets automatically increased by 25°F.`;
                }

                hydration = Math.round(hydration * 10) / 10;
                if (yeastType === "ADY") yeastPct *= 1.25;
                yeastPct = Math.round(yeastPct * 10000) / 10000;
            }

            // Total batch weights
            const rawDoughMass = count * calculatedBallWeight;
            const totalBakerMatrix = 100.0 + hydration + saltPct + yeastPct + oilPct + sugarPct + maltPct;
            const flourGrams = (rawDoughMass / totalBakerMatrix) * 100;
            const totalWaterGrams = flourGrams * (hydration / 100);
            const saltGrams = flourGrams * (saltPct / 100);
            const yeastGrams = flourGrams * (yeastPct / 100);
            const oilGrams = flourGrams * (oilPct / 100);
            const sugarGrams = flourGrams * (sugarPct / 100);
            const maltGrams = flourGrams * (maltPct / 100);
            const totalBatchGrams = flourGrams + totalWaterGrams + saltGrams + yeastGrams + oilGrams + sugarGrams + maltGrams;

            // Water split (bloom water vs cold/main water)
            let warmBloomWater = 0;
            let coldMainWater = totalWaterGrams;

            if (yeastType === "ADY") {
                if (style === "focaccia" || style === "detroit") {
                    warmBloomWater = flourGrams * 0.20;
                } else if (style === "tavern") {
                    warmBloomWater = 75 * (flourGrams / 675);
                } else if (style === "ny") {
                    warmBloomWater = 50.0;
                } else {
                    warmBloomWater = totalWaterGrams * 0.084;
                }

                if (warmBloomWater > totalWaterGrams * 0.25) {
                    warmBloomWater = totalWaterGrams * 0.20;
                }
                coldMainWater = totalWaterGrams - warmBloomWater;
            }

            // Check if T80 flour is checked for NY Style
            const hasT80 = style === "ny" && checkedFlourIds.includes("cm_bread_ow");

            // Cheese allocation
            const cheeseItems = [];
            if (style === "neapolitan") {
                cheeseItems.push({
                    name: "Fresh Mozzarella (Torn, Drained)",
                    grams: Math.round(area * 0.9)
                });
            } else if (style === "tavern") {
                const ratio = area / (Math.PI * 49);
                cheeseItems.push(
                    { name: "Low-Moisture Whole-Milk Mozzarella (shredded)", grams: Math.round(225 * ratio) },
                    { name: "Pecorino Romano or Parmesan (grated)", grams: Math.round(20 * ratio) }
                );
            } else if (style === "detroit") {
                const totalCheese = Math.round(area * 2.5);
                const provolone = Math.round(totalCheese * 0.40);
                const mozz = totalCheese - provolone;
                cheeseItems.push(
                    { name: "Provolone (Sliced thick, pressed against pan walls for frico crown)", grams: provolone },
                    { name: "Low-Moisture Mozzarella (Cubed, center focus)", grams: mozz }
                );
            } else if (style === "ny") {
                cheeseItems.push(
                    { name: "Low-Moisture Whole-Milk Mozzarella (Shredded)", grams: Math.round(area * 1.44) },
                    { name: "Pecorino Romano (Finely Grated, under Mozzarella)", grams: 15 }
                );
            }

            // Optional Pre-Ferment (Poolish / Biga) for Neapolitan and NY Style
            let preferment = null;
            if ((style === "neapolitan" || style === "ny") && prefermentType && prefermentType !== "none") {
                const pct = parseInt(prefermentPct, 10) || 20;
                const prefFlour = flourGrams * (pct / 100);
                const isPoolish = prefermentType === "poolish";
                const prefWater = isPoolish ? prefFlour * 1.0 : prefFlour * 0.50; // 100% poolish or 50% biga
                const prefYeast = isPoolish ? Math.min(0.5, prefFlour * 0.001) : Math.min(0.8, prefFlour * 0.002);
                const mainFlour = flourGrams - prefFlour;
                const mainWater = totalWaterGrams - prefWater;
                const mainYeast = Math.max(0.01, yeastGrams - prefYeast);
                preferment = {
                    type: prefermentType,
                    pct: pct,
                    prefFlourGrams: prefFlour,
                    prefWaterGrams: prefWater,
                    prefYeastGrams: prefYeast,
                    mainFlourGrams: mainFlour,
                    mainWaterGrams: mainWater,
                    mainYeastGrams: mainYeast
                };
            }

            return {
                success: true,
                meta: {
                    style,
                    flour: selectedFlour,
                    ballCount: count,
                    diameter,
                    labelSize,
                    area,
                    calculatedBallWeight,
                    rawDoughMass,
                    totalBatchGrams,
                    totalHours,
                    timeDeltaDays,
                    homeOvenTriggered,
                    altAlertText,
                    tavernAlertText,
                    yeastType,
                    altitude,
                    hasT80,
                    prefermentType,
                    prefermentPct,
                    preferment,
                    availHours,
                    actualHours,
                    scheduleStartH,
                    detroitStartTime,
                    detroitBakeTime
                },
                percentages: {
                    flour: 100.0,
                    hydration,
                    salt: saltPct,
                    yeast: yeastPct,
                    oil: oilPct,
                    sugar: sugarPct,
                    malt: maltPct,
                    total: totalBakerMatrix
                },
                weights: {
                    flourGrams,
                    totalWaterGrams,
                    warmBloomWater,
                    coldMainWater,
                    saltGrams,
                    yeastGrams,
                    oilGrams,
                    sugarGrams,
                    maltGrams,
                    totalBatchGrams
                },
                cheeses: cheeseItems
            };
        },

        /**
         * Returns specialized baking prep, peel dusting, and pan seasoning specifications
         * calibrated for each style, pan geometry, and batch count.
         */
        calculateBakingPrep: function(style, diameter, ballCount) {
            const count = Math.max(1, parseInt(ballCount, 10) || 1);
            const area = this.calculateArea(diameter);

            if (style === "tavern") {
                return {
                    title: "Chicago Tavern Peel Dusting & Skin Docking",
                    subtitle: "Key preparation steps for authentic razor-thin tavern cracker crust",
                    items: [
                        {
                            item: "Coarse Yellow Cornmeal or Semolina",
                            amount: `${Math.round(25 * count)} g (~${(count * 1.5).toFixed(1)} tbsp total)`,
                            purpose: "Dust directly on wooden peel before sliding skin. Creates the iconic Chicago tavern gritty crunch and non-stick release."
                        },
                        {
                            item: "Pastry Docker or Fork Perforation",
                            amount: "Full surface (both sides)",
                            purpose: "Heavily dock the rolled dough skin from center to rim to completely prevent giant air bubbles and keep the crust flat and wafer-thin."
                        },
                        {
                            item: "Parchment Paper Separation Sheets",
                            amount: `${count} sheets`,
                            purpose: "Place rolled skins on parchment flat on counter to desiccate overnight without sticking to work surface."
                        }
                    ]
                };
            } else if (style === "detroit") {
                const oilPerPan = Math.round((area / 140) * 18);
                return {
                    title: "Lloyd Detroit Pan Lubrication & Wall Prep",
                    subtitle: "Critical seasoning to achieve the caramelized perimeter frico cheese crown",
                    items: [
                        {
                            item: "Crisco / Vegetable Shortening or High-Smoke Oil",
                            amount: `${oilPerPan * count} g (~${(oilPerPan * 0.07).toFixed(1)} tbsp per pan)`,
                            purpose: "Rub bottom and all 4 corners/walls of Lloyd pan thoroughly. Promotes even heat conduction and prevents cheese from sticking during the frico fry."
                        },
                        {
                            item: "Extra-Virgin Olive Oil (Pan Base)",
                            amount: `${Math.round(10 * (area / 140) * count)} g (~2 tsp per pan)`,
                            purpose: "Drizzle in center before pressing dough into corners for rich olive oil crust flavor."
                        }
                    ]
                };
            } else if (style === "focaccia") {
                const panOil = Math.round((area / 140) * 35);
                return {
                    title: "Ligurian Pan Pool & Brine (Salmoria) Prep",
                    subtitle: "Oil saturation and finger-dimple emulsification for Ligurian focaccia",
                    items: [
                        {
                            item: "EVOO for Pan Bed",
                            amount: `${panOil * count} g (~${Math.round(panOil / 14)} tbsp total)`,
                            purpose: "Pour generous pool of olive oil on sheet pan bottom so the focaccia literally shallow-fries in the oven."
                        },
                        {
                            item: "Ligurian Salmoria (Emulsified Water-Oil Brine)",
                            amount: `${Math.round(50 * (area / 140) * count)} ml warm water + ${Math.round(30 * (area / 140) * count)} ml EVOO + 10g salt`,
                            purpose: "Whisk vigorously into cloudy emulsion. Pour directly into deep finger dimples before final proof to create custardy pockets and salted crust."
                        },
                        {
                            item: "Maldon Flaky Sea Salt & Fresh Rosemary",
                            amount: "Generous dusting",
                            purpose: "Sprinkle post-bake and press fresh rosemary sprigs into wells before firing."
                        }
                    ]
                };
            } else if (style === "ny") {
                return {
                    title: "NYC Screen & Deck Launch Prep",
                    subtitle: "Peel dusting and screen conditioning for street-slice execution",
                    items: [
                        {
                            item: "Fine Semolina (Peel Dusting)",
                            amount: `${Math.round(15 * count)} g`,
                            purpose: "Light dusting on wooden peel to allow smooth deck launch without excess scorched raw flour."
                        },
                        {
                            item: "Pizza Screen Non-Stick Conditioning (If using screen)",
                            amount: "Light spray",
                            purpose: "Coat seasoned aluminum screen with light oil mist. Bake first 4 minutes on screen, then slide naked onto stone deck for crisp undercarriage."
                        }
                    ]
                };
            } else {
                // Neapolitan
                return {
                    title: "Neapolitan Wood-Fired Launch Prep",
                    subtitle: "High-heat stone deck management and dusting protocol",
                    items: [
                        {
                            item: "50/50 Blend Semolina & Type 00 Flour",
                            amount: `${Math.round(20 * count)} g`,
                            purpose: "Dust bench lightly. Shake excess flour off dough before placing on peel to prevent bitter acrid burning on high-temp 900°F stone deck."
                        },
                        {
                            item: "Perforated Aluminum Peel Technique",
                            amount: "Quick single-motion shuffle",
                            purpose: "Perforations allow remaining loose flour to fall through before launch."
                        }
                    ]
                };
            }
        },

        /**
         * Scales toppings (cheese blends, sauces, proteins, aromatics)
         * for all 5 pizza styles based on style, count, and diameter.
         */
        calculateToppings: function(recipeData, ballCount, diameter, explicitStyle) {
            const count = Math.max(1, parseInt(ballCount, 10) || 1);
            const area = this.calculateArea(diameter);
            const style = explicitStyle || (recipeData && recipeData.id ? recipeData.id : "tavern");

            if (style === "tavern") {
                const standard14Area = Math.PI * 49; // 153.94 sq in
                const ratio = area / standard14Area;

                const cheeseBlend = [
                    {
                        name: "Low-Moisture Whole-Milk Mozzarella (shredded block)",
                        notes: "Shredded coarsely, spread edge-to-edge over sauce",
                        perPizzaGrams: Math.round(225 * ratio),
                        totalGrams: Math.round(225 * ratio * count)
                    },
                    {
                        name: "Pecorino Romano or Parmesan (finely grated)",
                        notes: "Dusted evenly over mozzarella for sharp savory finish",
                        perPizzaGrams: Math.round(20 * ratio),
                        totalGrams: Math.round(20 * ratio * count)
                    }
                ];

                const sauceBatchCoeff = (ratio * count) / 3;
                const sauceIngredients = [
                    { item: "Whole Peeled Canned Tomatoes (blended coarse)", notes: "Generous batch for pizza & dipping", grams: Math.round(1200 * sauceBatchCoeff) },
                    { item: "Tomato Paste", notes: "Rich body and thickening", grams: Math.round(255 * sauceBatchCoeff) },
                    { item: "Extra-Virgin Olive Oil", notes: "Silky mouthfeel & sheen", grams: Math.round(45 * sauceBatchCoeff) },
                    { item: "Granulated Sugar", notes: "Balances natural tomato acid", grams: Math.round(37.5 * sauceBatchCoeff) },
                    { item: "Red Wine Vinegar", notes: "Barrington copycat signature tang", grams: Math.round(30 * sauceBatchCoeff) },
                    { item: "Fresh Garlic Cloves (finely minced)", notes: "Aromatic foundation", grams: Math.round(24 * sauceBatchCoeff) },
                    { item: "Dried Italian Seasoning", notes: "Oregano, basil, marjoram blend", grams: Math.round(15 * sauceBatchCoeff) },
                    { item: "Fine Sea Salt", notes: "Mineral seasoning", grams: Math.round(9 * sauceBatchCoeff) },
                    { item: "Garlic Powder", notes: "Deep savory background", grams: Math.round(7.5 * sauceBatchCoeff) }
                ];
                const totalSauceGrams = sauceIngredients.reduce((sum, ing) => sum + ing.grams, 0);

                const sausageBatchCoeff = (ratio * count) / 3;
                const sausageIngredients = [
                    { item: "Ground Pork Shoulder (80/20 lean-to-fat)", notes: "Coarse raw ground pork", grams: Math.round(675 * sausageBatchCoeff) },
                    { item: "Fresh Garlic Cloves (finely minced)", notes: "Savory punch", grams: Math.round(24 * sausageBatchCoeff) },
                    { item: "Fine Sea Salt", notes: "Essential binder seasoning", grams: Math.round(10.5 * sausageBatchCoeff) },
                    { item: "Whole Fennel Seeds (toasted & crushed)", notes: "Signature Chicago tavern aroma", grams: Math.round(9 * sausageBatchCoeff) },
                    { item: "Garlic Powder", notes: "Deep umami profile", grams: Math.round(7.5 * sausageBatchCoeff) },
                    { item: "Dried Oregano", notes: "Herbaceous note", grams: Math.round(6 * sausageBatchCoeff) }
                ];
                const totalSausageGrams = sausageIngredients.reduce((sum, ing) => sum + ing.grams, 0);

                return {
                    style: "tavern",
                    cheeseBlend,
                    sauce: {
                        name: "Barrington Copycat Spiced Herb Sauce",
                        subtitle: "Edge-to-edge savory sauce with tomato paste body, vinegar tang, and dried Italian herbs.",
                        totalBatchGrams: totalSauceGrams,
                        ingredients: sauceIngredients
                    },
                    sausage: {
                        name: "Raw Pinched Italian Pork Sausage",
                        subtitle: "Apply raw in small dime-sized pinches over cheese. Cooks completely during the 8-minute bake!",
                        totalBatchGrams: totalSausageGrams,
                        ingredients: sausageIngredients
                    }
                };
            } else if (style === "detroit") {
                const totalCheesePerPan = Math.round(area * 2.5);
                const provolonePerPan = Math.round(totalCheesePerPan * 0.40);
                const mozzPerPan = totalCheesePerPan - provolonePerPan;

                const cheeseBlend = [
                    {
                        name: "Provolone / Wisconsin Brick (Deli-sliced thick)",
                        notes: "Line all 4 edges pressed firmly against pan walls for caramelized frico crown",
                        perPizzaGrams: provolonePerPan,
                        totalGrams: provolonePerPan * count
                    },
                    {
                        name: "Low-Moisture Mozzarella / Brick Cheese (Cubed 1/2\")",
                        notes: "Distribute across surface, packing corners tightly",
                        perPizzaGrams: mozzPerPan,
                        totalGrams: mozzPerPan * count
                    }
                ];

                const sauceCoeff = (area / 140) * count;
                const sauceIngredients = [
                    { item: "Crushed Plum Tomatoes (Stanislaus 7/11 or hand-crushed)", notes: "Thick simmered red sauce", grams: Math.round(350 * sauceCoeff) },
                    { item: "Extra-Virgin Olive Oil", notes: "Rich body", grams: Math.round(20 * sauceCoeff) },
                    { item: "Minced Garlic", notes: "Sautéed in oil first", grams: Math.round(10 * sauceCoeff) },
                    { item: "Dried Oregano", notes: "Herbal depth", grams: Math.round(4 * sauceCoeff) },
                    { item: "Red Pepper Flakes & Salt", notes: "Gentle warmth", grams: Math.round(5 * sauceCoeff) }
                ];
                const totalSauce = sauceIngredients.reduce((s, i) => s + i.grams, 0);

                return {
                    style: "detroit",
                    cheeseBlend,
                    sauce: {
                        name: "Detroit Red Sauce (Racing Stripes)",
                        subtitle: "Simmered thick and applied warm in 2 or 3 lengthwise racing stripes post-bake.",
                        totalBatchGrams: totalSauce,
                        ingredients: sauceIngredients
                    }
                };
            } else if (style === "ny") {
                const cheesePerPizza = Math.round(area * 1.44);
                const cheeseBlend = [
                    {
                        name: "Pecorino Romano (Finely Grated)",
                        notes: "Dusted directly over sauce layer before mozzarella",
                        perPizzaGrams: 15,
                        totalGrams: 15 * count
                    },
                    {
                        name: "Low-Moisture Whole-Milk Mozzarella (Shredded)",
                        notes: "Even edge-to-edge coverage, melts into classic foldable street-slice layer",
                        perPizzaGrams: cheesePerPizza,
                        totalGrams: cheesePerPizza * count
                    }
                ];

                const sauceCoeff = (area / 153.9) * count;
                const sauceIngredients = [
                    { item: "Crushed Peeled Tomatoes", notes: "Uncooked sweet, vibrant base", grams: Math.round(180 * sauceCoeff) },
                    { item: "Extra-Virgin Olive Oil", notes: "Fruity sheen", grams: Math.round(8 * sauceCoeff) },
                    { item: "Dried Oregano", notes: "Classic NYC slice aroma", grams: Math.round(2 * sauceCoeff) },
                    { item: "Fine Sea Salt & Black Pepper", notes: "Seasoning balance", grams: Math.round(3 * sauceCoeff) },
                    { item: "Garlic Powder", notes: "Even garlic note without moisture", grams: Math.round(2 * sauceCoeff) }
                ];
                const totalSauce = sauceIngredients.reduce((s, i) => s + i.grams, 0);

                return {
                    style: "ny",
                    cheeseBlend,
                    sauce: {
                        name: "Classic New York Street-Slice Sauce",
                        subtitle: "Uncooked bright crushed tomato sauce spiced with Sicilian oregano and garlic.",
                        totalBatchGrams: totalSauce,
                        ingredients: sauceIngredients
                    }
                };
            } else if (style === "focaccia") {
                const brineCoeff = (area / 140) * count;
                const brineIngredients = [
                    { item: "Warm Filtered Water (85°F)", notes: "Base of Ligurian salmoria emulsion", grams: Math.round(50 * brineCoeff) },
                    { item: "High-Grade Extra-Virgin Olive Oil", notes: "Whisked with water into cloudy brine", grams: Math.round(30 * brineCoeff) },
                    { item: "Fine Sea Salt", notes: "Dissolved into brine", grams: Math.round(10 * brineCoeff) },
                    { item: "Fresh Rosemary Sprigs", notes: "Pressed into dimples", grams: Math.round(8 * brineCoeff) },
                    { item: "Maldon Flaky Sea Salt", notes: "Crunchy topping crystals", grams: Math.round(6 * brineCoeff) }
                ];
                const totalBrine = brineIngredients.reduce((s, i) => s + i.grams, 0);

                return {
                    style: "focaccia",
                    cheeseBlend: [],
                    sauce: {
                        name: "Ligurian Salmoria (Brine & Olive Oil Well Infusion)",
                        subtitle: "Emulsified water and oil poured into finger dimples to create characteristic moist, custardy pockets.",
                        totalBatchGrams: totalBrine,
                        ingredients: brineIngredients
                    }
                };
            } else {
                // Neapolitan
                const approxSaucePerPizza = Math.round(area * 0.55);
                const approxMozzPerPizza = Math.round(area * 0.70);
                const cheeseBlend = [
                    {
                        name: "Fresh Fior di Latte / Buffalo Mozzarella",
                        notes: "Cut into strips, drained 2h in colander to prevent moisture pooling",
                        perPizzaGrams: approxMozzPerPizza,
                        totalGrams: approxMozzPerPizza * count
                    }
                ];

                const sauceIngredients = [
                    { item: "San Marzano D.O.P. Whole Peeled Tomatoes", notes: "Hand-crushed with 1% sea salt", grams: approxSaucePerPizza * count },
                    { item: "Fresh Sweet Basil Leaves", notes: "Whole fresh leaves (3-5 per pizza)", grams: count * 4 },
                    { item: "Extra-Virgin Olive Oil", notes: "High quality Italian EVOO drizzle", grams: count * 6 }
                ];
                const totalSauce = sauceIngredients.reduce((s, i) => s + i.grams, 0);

                return {
                    style: "neapolitan",
                    cheeseBlend,
                    sauce: {
                        name: "San Marzano D.O.P. Crushed Tomatoes",
                        subtitle: "Pure hand-crushed Italian tomatoes with sweet basil and extra virgin olive oil.",
                        totalBatchGrams: totalSauce,
                        ingredients: sauceIngredients
                    }
                };
            }
        },

        /**
         * Generates specialized baking prep, pan seasoning, and peel dusting metrics
         * tailored to each of the 5 styles (Tavern cornmeal, Detroit Lloyd pan oiling,
         * Focaccia EVOO bed & Salmoria brine, Neapolitan 50/50 bench dusting, NY semolina peel).
         */
        calculateBakingPrep: function(style, diameter, ballCount) {
            const count = Math.max(1, parseInt(ballCount, 10) || 1);
            const area = this.calculateArea(diameter);

            if (style === "tavern") {
                const cornmealGrams = Math.round(18 * count);
                return {
                    title: "Baking Prep & Pan Seasoning Matrix",
                    subtitle: "Critical peel barrier, skin docking, and oven deck transition guidelines for Chicago Tavern.",
                    items: [
                        {
                            item: "Medium Yellow Cornmeal Peel Barrier",
                            amount: `${cornmealGrams} g (~${(cornmealGrams / 12).toFixed(1)} tbsp total)`,
                            purpose: "Dust wooden peel generously prior to inverting dried dough skin. Acts as ball bearings for direct stone launch and gives signature crispy bottom grit."
                        },
                        {
                            item: "Pastry Roller Docking Density",
                            amount: "100–120 perforations per skin",
                            purpose: "Dock skin thoroughly right after rolling. Prevents giant steam bubbles from lifting the cheese and separates tavern crust into micro-crisp layers."
                        },
                        {
                            item: "Cure Dehydration Window",
                            amount: "24–48 hours in cold refrigeration",
                            purpose: "Refrigerate rolled skins interleaved with parchment uncovered to evaporate surface moisture into a stiff, leathery disc."
                        }
                    ]
                };
            } else if (style === "detroit") {
                const oilGramsPerPan = diameter === "8x10" ? 20 : (diameter === "12x17" ? 40 : 28);
                const totalOil = oilGramsPerPan * count;
                return {
                    title: "Baking Prep & Pan Seasoning Matrix",
                    subtitle: "Lloyd Pan preparation and frico cheese boundary setup for authentic Detroit-style pizza.",
                    items: [
                        {
                            item: "Lloyd Pan Well-Oiling (Crisco / Olive Oil Pool)",
                            amount: `${totalOil} g total (~${(totalOil / count).toFixed(0)} g / pan)`,
                            purpose: "Coat bottom and all 4 angled walls of the dark anodized Lloyd pan. Dough literally fries in the oil during the 500°F bake."
                        },
                        {
                            item: "Corner Dimpling & Gluten Relaxation",
                            amount: "2 relaxation passes (20 mins apart)",
                            purpose: "Press dough into corners with oiled fingers. If it pulls back, rest covered for 20 mins before gently nudging into corners."
                        },
                        {
                            item: "Perimeter Cheese Crown (Frico Wall)",
                            amount: "Deli-sliced provolone / brick against walls",
                            purpose: "Pack cheese aggressively against bare metal pan walls so melted fat runs down the side, creating the dark caramelized crown."
                        }
                    ]
                };
            } else if (style === "focaccia") {
                const oilBedGrams = Math.round(35 * count);
                const brineWater = Math.round(50 * count);
                const brineOil = Math.round(25 * count);
                const flakySalt = Math.round(6 * count);
                return {
                    title: "Baking Prep & Pan Seasoning Matrix",
                    subtitle: "Ligurian pan pooling, salmoria brine emulsion, and dimpling dynamics.",
                    items: [
                        {
                            item: "EVOO Pan Reservoir (Bottom Layer)",
                            amount: `${oilBedGrams} g total (~${Math.round(oilBedGrams / count)} g / pan)`,
                            purpose: "Pool high-grade EVOO across pan floor before transferring dough. Produces the golden fried bottom crust."
                        },
                        {
                            item: "Ligurian Salmoria Brine Emulsion",
                            amount: `${brineWater} g warm water + ${brineOil} g EVOO`,
                            purpose: "Whisk vigorously into a pale emulsion. Pour directly into dimple craters right before baking to lock in pillowy moisture."
                        },
                        {
                            item: "Piano Dimpling & Maldon Flake Crystals",
                            amount: `${flakySalt} g Maldon sea salt flakes`,
                            purpose: "Press all 10 fingertips firmly straight down to touch the pan floor. Sprinkle crunchy pyramid flakes over wet pockets."
                        }
                    ]
                };
            } else if (style === "ny") {
                const semolinaPeelGrams = Math.round(15 * count);
                const screenOilNote = (diameter === "16" || diameter === "18") 
                    ? "Pan spray / light oil film on pizza screen for 16\"–18\" pies"
                    : "Not required (direct wooden peel launch)";
                return {
                    title: "Baking Prep & Pan Seasoning Matrix",
                    subtitle: "Peel lubrication, screen seasoning, and deck transfer protocol for New York slice pies.",
                    items: [
                        {
                            item: "Coarse Semolina / Flour Blend Peel Lubrication",
                            amount: `${semolinaPeelGrams} g total (~${Math.round(semolinaPeelGrams / count)} g / peel)`,
                            purpose: "Dust wooden peel lightly. Semolina provides smooth roll-off without burning into bitter soot like raw white flour."
                        },
                        {
                            item: "Pizza Screen Conditioning (16\" / 18\")",
                            amount: screenOilNote,
                            purpose: "Screens maintain round diameter and allow even bake under high heat; transfer off screen after 3–4 mins to crisp bottom directly on stone."
                        },
                        {
                            item: "Cornicione Air Rim Preservation",
                            amount: "1/2 inch outer perimeter",
                            purpose: "Leave outer 1/2 inch untouched while pressing center flat to allow yeast gases to puff into the signature foldable NY rim."
                        }
                    ]
                };
            } else {
                // Neapolitan
                const dustingGrams = Math.round(25 * count);
                return {
                    title: "Baking Prep & Pan Seasoning Matrix",
                    subtitle: "Bench dusting formulation and high-heat peel launch preparation for Neapolitan pizza.",
                    items: [
                        {
                            item: "Bench Dusting Formulation (50/50 Semola Rimacinata & Type 00)",
                            amount: `${dustingGrams} g total (~${Math.round(dustingGrams / count)} g / ball)`,
                            purpose: "Submerge fermented dough ball into dusting bowl before opening. Semola rimacinata prevents sticking without leaving heavy raw flour residue."
                        },
                        {
                            item: "Excess Flour Slap-Off Technique (Schiaffo)",
                            amount: "3–4 gentle arm slaps per unit",
                            purpose: "Slap dough back and forth across forearms to shake off all loose surface flour before transferring to perforated metal peel."
                        },
                        {
                            item: "Perforated Metal Peel Launch",
                            amount: "Swift forward shimmy & pull",
                            purpose: "Perforations drop away any residual dusting grains so they do not ignite or turn acrid black on the 800°F refractory stone floor."
                        }
                    ]
                };
            }
        }
    };

    window.PizzaApp.engine.calculator = Calculator;

})(window);

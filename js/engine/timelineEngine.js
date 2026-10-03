/**
 * TheDropInn Pizza Lab - Timeline & Execution Engine
 * Generates calendar-synced execution schedules for all 5 styles:
 * Neapolitan, Chicago Tavern, Detroit-Style, New York Style, and Focaccia.
 */
(function(window) {
    'use strict';

    window.PizzaApp = window.PizzaApp || {};
    window.PizzaApp.engine = window.PizzaApp.engine || {};

    const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function formatDate(dateObj) {
        return `${DAYS_OF_WEEK[dateObj.getDay()]}, ${MONTHS[dateObj.getMonth()]} ${dateObj.getDate()}`;
    }

    function addDays(baseDate, days) {
        const d = new Date(baseDate.getTime());
        d.setDate(d.getDate() + days);
        return d;
    }

    function formatTime(hourDecimal) {
        let h = Math.floor(hourDecimal);
        let m = Math.round((hourDecimal - h) * 60);
        if (m >= 60) {
            h += 1;
            m -= 60;
        }
        let ampm = (h >= 12 && h < 24) ? "PM" : "AM";
        let displayH = h % 12;
        if (displayH === 0) displayH = 12;
        let displayM = m.toString().padStart(2, "0");
        return `${displayH}:${displayM} ${ampm}`;
    }

    const TimelineEngine = {
        generateTimeline: function(calcResult, baseCalendarDate, options = {}) {
            if (!calcResult || !calcResult.success) return [];

            const { style } = calcResult.meta;

            if (style === "tavern") {
                return this._generateTavernTimeline(calcResult, baseCalendarDate, options);
            } else if (style === "detroit") {
                return this._generateDetroitTimeline(calcResult, baseCalendarDate, options);
            } else if (style === "ny") {
                return this._generateNYTimeline(calcResult, baseCalendarDate, options);
            } else if (style === "focaccia") {
                return this._generateFocacciaTimeline(calcResult, baseCalendarDate, options);
            } else {
                return this._generateNeapolitanTimeline(calcResult, baseCalendarDate, options);
            }
        },

        _generateNeapolitanTimeline: function(calcResult, baseDate, options) {
            const { meta, weights } = calcResult;
            const { yeastType, altitude, homeOvenTriggered, timeDeltaDays, startDateOffset, cookingDateOffset } = meta;
            const { ovenId, stoneName, tempText } = options;

            const startObj = addDays(baseDate, startDateOffset);
            const cookObj = addDays(baseDate, cookingDateOffset);

            const timeline = [];
            const day1Str = formatDate(startObj);
            const isSameDay = timeDeltaDays === 0;

            const warmWaterVal = weights.warmBloomWater.toFixed(1);
            const coldWaterVal = weights.coldMainWater.toFixed(1);

            let phase1Text = "";
            let oilText = (homeOvenTriggered) ? ` Next, drizzle in the Olive Oil (${weights.oilGrams.toFixed(1)}g) and browning sugar (${weights.sugarGrams.toFixed(1)}g) and knead gently until completely absorbed.` : "";

            if (yeastType === "ADY") {
                phase1Text = `Isolate the Warm Water pool (${warmWaterVal}g) heated strictly to 105°F. Whisk in the Active Dry Yeast (${weights.yeastGrams.toFixed(2)}g). Allow it to sit undisturbed for 10 minutes until frothy. Dissolve the Salt (${weights.saltGrams.toFixed(1)}g) into the remaining ice-cold Water (${coldWaterVal}g). Stream the foaming slurry directly into the cold saline framework.`;
            } else {
                phase1Text = `Dissolve the Fine Sea Salt (${weights.saltGrams.toFixed(1)}g) completely within your cold water volume (${coldWaterVal}g). Whisk the Instant Dry Yeast (${weights.yeastGrams.toFixed(2)}g) directly into your dry flour matrix beforehand.`;
            }

            if (meta.preferment) {
                const pref = meta.preferment;
                const prefDate = addDays(startObj, -1);
                const prefTypeLabel = pref.type === "poolish" ? "Poolish (100% Hydration)" : "Biga (50% Hydration)";
                const prefPrepText = pref.type === "poolish"
                    ? `In a jar or tall container, whisk together Flour (${pref.prefFlourGrams.toFixed(1)}g), Room-Temp Water (${pref.prefWaterGrams.toFixed(1)}g), and yeast (${pref.prefYeastGrams.toFixed(2)}g) until completely smooth. Cover loosely and ferment at room temperature (68°F–70°F) for 14–16 hours until bubbly, expanded, and showing subtle surface dimples.`
                    : `In a mixing bowl, combine Flour (${pref.prefFlourGrams.toFixed(1)}g), Cool Water (${pref.prefWaterGrams.toFixed(1)}g), and yeast (${pref.prefYeastGrams.toFixed(2)}g). Mix briefly with fingertips for 2–3 minutes into coarse, shaggy clumps (do not form a ball). Cover and ferment at 60°F–65°F (cool room or wine cooler) for 16–18 hours.`;

                timeline.push({
                    dayLabel: `Day 0: ${formatDate(prefDate)} - Pre-Ferment Build (14-16h Prior)`,
                    dateObj: prefDate,
                    steps: [
                        {
                            stepId: "neo_step_pref_0",
                            time: "08:00 PM",
                            phase: `Phase 0: Pre-Ferment Initialization`,
                            title: `Mix & Ferment ${prefTypeLabel}`,
                            description: prefPrepText
                        }
                    ]
                });

                phase1Text = `Take your mature ${pref.type.toUpperCase()} and dissolve/break it gently into the remaining Main Water (${pref.mainWaterGrams.toFixed(1)}g). Add the remaining Flour (${pref.mainFlourGrams.toFixed(1)}g), Fine Sea Salt (${weights.saltGrams.toFixed(1)}g)${pref.mainYeastGrams > 0.05 ? `, and remaining Yeast (${pref.mainYeastGrams.toFixed(2)}g)` : ""}. Mix until no dry pockets remain.`;
            }

            timeline.push({
                dayLabel: `Day 1: ${day1Str} - Mixing & Bulk Initialization`,
                dateObj: startObj,
                steps: [
                    {
                        stepId: "neo_step_1",
                        time: "05:00 PM",
                        phase: "Phase 1: Hydration Matrix & Autolyse",
                        title: "Hydrate Flour & Rest",
                        description: `${phase1Text} Incorporate flour until all dry pockets disappear. Cover securely and hold for a mandatory 20-minute autolyse window.`
                    },
                    {
                        stepId: "neo_step_2",
                        time: "05:30 PM",
                        phase: "Phase 2: Gluten Consolidation",
                        title: "Knead & Smooth Gluten Skin",
                        description: `Knead smoothly for 8-10 minutes by hand until skin transitions to a satin texture.${oilText} Round into a tight sphere, rest 30 mins, then migrate to cold storage (36°F - 38°F).`
                    }
                ]
            });

            if (timeDeltaDays > 1) {
                const midDate = addDays(startObj, 1);
                timeline.push({
                    dayLabel: `Day 2: ${formatDate(midDate)} - Cold Development & Portioning`,
                    dateObj: midDate,
                    steps: [
                        {
                            stepId: "neo_step_3",
                            time: "10:00 AM",
                            phase: "Phase 3: Unit Portioning",
                            title: "Scale & Ball Units",
                            description: `Remove bulk dough from cold storage. Precision-scale into target mass units (${meta.calculatedBallWeight}g each). Roll each firmly into a taut sphere, seal seams, place inside oiled proofing tray, and return to cold storage.`
                        }
                    ]
                });
            } else if (timeDeltaDays === 1) {
                timeline[0].steps.push({
                    stepId: "neo_step_3_sameday",
                    time: "08:00 PM",
                    phase: "Phase 3: Unit Portioning",
                    title: "Scale & Ball Units",
                    description: `Precision-scale the bulk dough into target mass units (${meta.calculatedBallWeight}g each). Roll each firmly into a taut sphere, place in oiled proofing tray, and return to cold storage.`
                });
            }

            // Bake Day
            const bakeDate = isSameDay ? startObj : cookObj;
            const bakeHeader = isSameDay ? "Later Today" : `Day ${timeDeltaDays + 1}: ${formatDate(cookObj)}`;

            let phase4Alert = (altitude === "high") ? ` (⚠️ High Altitude Environment: Keep proofing box sealed during tempering to prevent mountain air from building a dry leather skin).` : "";
            let heatProfile = "Saturate your refractory stone baking liner under full fuel configurations for 45 minutes targeting 750°F - 800°F.";
            let bakeTime = "90 to 120 seconds";

            if (ovenId !== "pizza") {
                heatProfile = `Preheat ${stoneName} on the top-third rack at ${tempText} for exactly 1 hour.`;
                bakeTime = "4 to 7 minutes";
            }

            timeline.push({
                dayLabel: `${bakeHeader} - Matrix Tempering & Bake Execution`,
                dateObj: bakeDate,
                steps: [
                    {
                        stepId: "neo_step_4",
                        time: "03:00 PM",
                        phase: "Phase 4: Counter Tempering",
                        title: "Warm Gluten to Room Temperature",
                        description: `Exactly 3.5 hours before live fire execution, place proofing box on counter to temper to room temperature.${phase4Alert}`
                    },
                    {
                        stepId: "neo_step_5",
                        time: "05:30 PM",
                        phase: "Phase 5: Floor Saturation",
                        title: "Preheat Oven",
                        description: `${heatProfile}`
                    },
                    {
                        stepId: "neo_step_6",
                        time: "06:30 PM",
                        phase: "Phase 6: Launch & Bake",
                        title: "Stretch, Top & Bake",
                        description: `Stretch out to target diameter, top cleanly, and slide onto the ${stoneName}. Bake for ${bakeTime}, rotating dynamically until optimally charred.`
                    }
                ]
            });

            return timeline;
        },

        _generateTavernTimeline: function(calcResult, baseDate, options) {
            const { meta, weights } = calcResult;
            const { yeastType, startDateOffset, cookingDateOffset, timeDeltaDays } = meta;
            const { ovenId, stoneName, tempText } = options;

            const startObj = addDays(baseDate, startDateOffset || 0);
            const cookObj = addDays(baseDate, cookingDateOffset || 0);

            let yeastDesc = yeastType === "ADY"
                ? `Bloom Active Dry Yeast (${weights.yeastGrams.toFixed(2)}g) in warm water (${weights.warmBloomWater.toFixed(1)}g at 105°F) with a pinch of sugar for 10 minutes until frothy.`
                : `Whisk Instant Dry Yeast (${weights.yeastGrams.toFixed(2)}g) directly into dry ingredients. Dissolve salt and sugar into cold water (${weights.coldMainWater.toFixed(1)}g). Mix 90 seconds on low until shaggy. Cover and rest for 30 minutes to autolyse.`;

            let ovenDesc = ovenId === "pizza"
                ? "Turn Pizza Oven gas burner to High, targeting a stone floor temp of 540°F (Do Not Exceed 575°F). You want a lower deck temp than Neapolitan to ensure the crust dries out and crisps completely before burning."
                : `For home ovens, preheat your ${stoneName} at ${tempText} on conventional bake mode for a minimum of 60 minutes. Turn OFF convection if possible to avoid rapid surface air drying during the longer bake.`;

            const timeline = [];

            if (timeDeltaDays === 0) {
                // Same-Day Tavern Schedule
                timeline.push({
                    dayLabel: `Bake Day: ${formatDate(cookObj)}`,
                    dateObj: cookObj,
                    steps: [
                        {
                            stepId: "tav_step_1",
                            time: "10:00 AM",
                            phase: "Phase 1: Yeast Wakeup & Dough Build",
                            title: "Activate Yeast & Autolyse",
                            description: `${yeastDesc} Whisk dry ingredients in mixer, add liquids, mix 90 seconds on low until shaggy. Cover and rest for 30 minutes to autolyse.`
                        },
                        {
                            stepId: "tav_step_2",
                            time: "10:40 AM",
                            phase: "Phase 1: Yeast Wakeup & Dough Build",
                            title: "Develop Gluten & Bulk Rise",
                            description: "Knead on Speed 2 for 5 minutes (or 7 minutes by hand) until dough forms a tight, satin ball. Divide into spheres and rest 2 hours at warm room temp."
                        },
                        {
                            stepId: "tav_step_3",
                            time: "01:00 PM",
                            phase: "Phase 2: Sheet & Fast-Track Counter-Cure",
                            title: "Roll and Dehydrate",
                            description: "Roll dough balls into paper-thin disks on a floured counter. Dock heavily with a fork or pastry docker. Transfer onto parchment paper sheets and leave completely uncovered flat on the counter for 4 hours to dry out the outer skin."
                        },
                        {
                            stepId: "tav_step_4",
                            time: "05:00 PM",
                            phase: "Phase 3: Pause Desiccation & Relax",
                            title: "Vapor-Lock Holding Pattern",
                            description: "Verify skins feel dry and leather-like. Stack parchment-backed skins on a sheet pan, wrap tightly with plastic wrap to halt drying and relax gluten before baking."
                        },
                        {
                            stepId: "tav_step_5",
                            time: "05:15 PM",
                            phase: "Phase 4: Topping & Cheese Prep",
                            title: "Topping Prep",
                            description: "Shred low-moisture whole-milk mozzarella block, grate pecorino/parmesan, and pinch raw fennel pork sausage into dime-sized nuggets."
                        },
                        {
                            stepId: "tav_step_6",
                            time: "05:30 PM",
                            phase: "Phase 5: Firing the Tavern Pizza",
                            title: "Ignite Oven",
                            description: ovenDesc
                        },
                        {
                            stepId: "tav_step_7",
                            time: "06:30 PM",
                            phase: "Phase 5: Firing the Tavern Pizza",
                            title: "Assemble, Launch & Bake",
                            description: "Invert dough skin onto cornmeal-dusted wooden peel (dry, leathery side facing down). Sauce edge-to-edge, layer cheeses, and add toppings. Launch directly onto stone deck. Bake dynamically until cheese leopard-spots and edges blister."
                        }
                    ]
                });
                return timeline;
            }

            // Day 1: Start Day (Mixing & initial build)
            timeline.push({
                dayLabel: `Start Day: ${formatDate(startObj)}`,
                dateObj: startObj,
                steps: [
                    {
                        stepId: "tav_step_1",
                        time: "05:30 PM",
                        phase: "Phase 1: Yeast Wakeup & Dough Build",
                        title: "Activate Yeast & Autolyse",
                        description: `${yeastDesc} Whisk dry ingredients in mixer, add liquids, mix 90 seconds on low until shaggy. Cover and rest for 30 minutes to autolyse.`
                    },
                    {
                        stepId: "tav_step_2",
                        time: "06:10 PM",
                        phase: "Phase 1: Yeast Wakeup & Dough Build",
                        title: "Develop Gluten & Scale Balls",
                        description: timeDeltaDays === 1
                            ? "Knead on Speed 2 for 5 minutes (or 7 minutes by hand) until dough forms a tight, satin ball. Divide into spheres, place in greased containers, and sit at room temperature for 2.5 hours to proof before rolling."
                            : "Knead on Speed 2 for 5 minutes until tight and satiny. Divide into balls, lightly oil, seal in airtight containers, and place in refrigerator for cold ferment."
                    },
                    ...(timeDeltaDays === 1 ? [
                        {
                            stepId: "tav_step_3",
                            time: "09:00 PM",
                            phase: "Phase 2: Sheet & Counter-Cure",
                            title: "Roll and Dehydrate Overnight",
                            description: "Roll dough balls into paper-thin disks on a floured counter. Dock heavily with a fork or pastry docker. Transfer onto parchment paper sheets and leave completely uncovered flat on the counter overnight. This is crucial for the cracker-crust texture."
                        }
                    ] : [])
                ]
            });

            // Intermediate cold cure days (if delta > 1)
            for (let d = 1; d < timeDeltaDays; d++) {
                const curDate = addDays(startObj, d);
                const isDayBeforeBake = (d === timeDeltaDays - 1);

                const daySteps = [];
                if (isDayBeforeBake) {
                    daySteps.push(
                        {
                            stepId: `tav_cold_hold_${d}`,
                            time: "10:00 AM",
                            phase: "Phase 2: Cold Fermentation & Ripening",
                            title: "Cold Cure Maturation",
                            description: "Dough balls continue slow cold fermentation in refrigerator, building organic acids and blister development."
                        },
                        {
                            stepId: "tav_step_3",
                            time: "09:00 PM",
                            phase: "Phase 2: Sheet & Counter-Cure",
                            title: "Roll and Dehydrate Overnight",
                            description: "Remove dough balls from refrigerator. Roll paper-thin on floured surface. Dock thoroughly with fork or pastry docker. Place on parchment sheets and leave uncovered flat on counter overnight to desiccate."
                        }
                    );
                } else {
                    daySteps.push({
                        stepId: `tav_cold_hold_${d}`,
                        time: "10:00 AM",
                        phase: "Phase 2: Cold Fermentation & Ripening",
                        title: "Cold Ferment Maturation",
                        description: "Dough remains sealed in cold storage (36°F - 38°F). Slow enzymatic activity develops complex malt sweetness and blister potential."
                    });
                }

                timeline.push({
                    dayLabel: `Cold Ferment (Day ${d + 1}): ${formatDate(curDate)}`,
                    dateObj: curDate,
                    steps: daySteps
                });
            }

            // Final Day: Bake Day
            timeline.push({
                dayLabel: `Bake Day: ${formatDate(cookObj)}`,
                dateObj: cookObj,
                steps: [
                    {
                        stepId: "tav_step_4",
                        time: "06:30 AM",
                        phase: "Phase 3: Pause Desiccation & Relax",
                        title: "Vapor-Lock Holding Pattern",
                        description: "Verify skins feel dry and leather-like. Stack the parchment-backed skins on a sheet pan, wrap the entire pan tightly with several layers of plastic wrap, and keep at room temp. This stops further drying and relaxes gluten."
                    },
                    {
                        stepId: "tav_step_5",
                        time: "04:30 PM",
                        phase: "Phase 4: Cheese Shred & Topping Prep",
                        title: "Topping Prep",
                        description: "Shred whole-milk mozzarella block, grate pecorino/parmesan, and prep Barrington copycat spiced herb sauce and raw fennel sausage."
                    },
                    {
                        stepId: "tav_step_6",
                        time: "05:30 PM",
                        phase: "Phase 5: Firing the Tavern Pizza",
                        title: "Ignite Oven",
                        description: ovenDesc
                    },
                    {
                        stepId: "tav_step_7",
                        time: "06:30 PM",
                        phase: "Phase 5: Firing the Tavern Pizza",
                        title: "Assemble, Launch & Bake",
                        description: "Invert dough skin onto cornmeal-dusted wooden peel (dry, leathery side facing down). Sauce edge-to-edge, layer cheeses, and add toppings. Launch directly onto stone deck. Bake dynamically until cheese leopard-spots and edges blister."
                    }
                ]
            });

            return timeline;
        },

        _generateDetroitTimeline: function(calcResult, baseDate, options) {
            const { meta, weights } = calcResult;
            const { yeastType, altitude, scheduleStartH, detroitBakeTime, actualHours, diamVal } = meta;

            let phase1Text = yeastType === "ADY"
                ? `Whisk the Active Dry Yeast (${weights.yeastGrams.toFixed(2)}g) into the Warm Water pool (${weights.warmBloomWater.toFixed(1)}g strictly at 100°F-105°F). Allow to sit undisturbed for 10 minutes to bloom.`
                : `Whisk the Instant Dry Yeast (${weights.yeastGrams.toFixed(2)}g) directly into the dry flour.`;

            let bulkHours = (actualHours * 0.40).toFixed(1);
            let panHours = (actualHours * 0.50).toFixed(1);

            let bakeTemp = (altitude === "high") ? "525°F" : "500°F";
            let ovenMode = (altitude === "high") ? "True Convection" : "Convection (if available)";

            return [
                {
                    dayLabel: "Same-Day Detroit Process & Bake",
                    dateObj: baseDate,
                    steps: [
                        {
                            stepId: "det_step_1",
                            time: formatTime(scheduleStartH),
                            phase: "Phase 1: Yeast Activation & Mixing",
                            title: "Mix Dough",
                            description: `${phase1Text} Combine flour, Kosher Salt (${weights.saltGrams.toFixed(1)}g), Malt Syrup (${weights.maltGrams.toFixed(1)}g), Olive Oil (${weights.oilGrams.toFixed(1)}g), and Chilled Water (${weights.coldMainWater.toFixed(1)}g). Mix until cohesive, then knead for 5 minutes. Cover and rest for 15 minutes.`
                        },
                        {
                            stepId: "det_step_2",
                            time: formatTime(scheduleStartH + 0.25),
                            phase: "Phase 2: Bulk Fermentation",
                            title: "Bulk Rise",
                            description: `Perform one set of stretch and folds. Transfer dough to a lightly oiled bulk container. Rest covered at room temperature for roughly ${bulkHours} hours until doubled in volume.`
                        },
                        {
                            stepId: "det_step_3",
                            time: formatTime(scheduleStartH + 0.25 + parseFloat(bulkHours)),
                            phase: "Phase 3: Pan Transfer & Proof",
                            title: "Pan Rise",
                            description: `Pour 2 tablespoons of olive oil into your ${diamVal} pan. Gently transfer the dough. Press it out toward the edges. If it resists, let it rest 20 minutes and try again. Cover and proof at room temperature for roughly ${panHours} hours until the dough is wildly bubbly and fills the corners.`
                        },
                        {
                            stepId: "det_step_4",
                            time: formatTime(detroitBakeTime - 0.75),
                            phase: "Phase 4: Oven Pre-Heat",
                            title: "Thermal Saturation",
                            description: `Preheat oven to ${bakeTemp} on ${ovenMode} mode for a minimum of 45 minutes to saturate the baking stone or steel.`
                        },
                        {
                            stepId: "det_step_5",
                            time: formatTime(detroitBakeTime),
                            phase: "Phase 5: Topping & Bake Execution",
                            title: "Frico Crust & Bake",
                            description: "Line the outer edge of the pan with the sliced Provolone to build the frico crust. Cube the Mozzarella and distribute evenly across the center. Bake for 14-16 minutes. Use a metal spatula to free the cheese edge immediately after removing from the oven, and transfer to a wire cooling rack."
                        }
                    ]
                }
            ];
        },

        _generateNYTimeline: function(calcResult, baseDate, options) {
            const { meta, weights } = calcResult;
            const { yeastType, altitude, timeDeltaDays, startDateOffset, cookingDateOffset, diameter } = meta;
            const { ovenId, stoneName, tempText } = options;

            const startObj = addDays(baseDate, startDateOffset);
            const cookObj = addDays(baseDate, cookingDateOffset);
            const isSameDay = timeDeltaDays === 0;

            let phase1Text = yeastType === "ADY"
                ? `Whisk the Active Dry Yeast (${weights.yeastGrams.toFixed(2)}g) into the Warm Water pool (${weights.warmBloomWater.toFixed(1)}g strictly at 100°F). Allow to sit undisturbed for 10 minutes to bloom.`
                : `Whisk the Instant Dry Yeast (${weights.yeastGrams.toFixed(2)}g) directly into the dry flour.`;

            let proofingText = isSameDay
                ? `Since you selected a same-day bake, cover the dough balls and let them proof at room temperature for 3 to 4 hours until doubled in size.`
                : `Place the lightly oiled, sealed containers directly into the refrigerator (36°F - 38°F). This cold retardation will build incredible flavor over the next ${timeDeltaDays} day(s).`;

            let isScreen = diameter === "16" || diameter === "18";
            let launchText = isScreen 
                ? `Stretch dough to exactly ${diameter} inches and place it onto a lightly oiled Pizza Screen. Launch the screen directly onto the stone.` 
                : `Stretch dough to ${diameter} inches on a wooden peel dusted with semolina. Launch directly onto the naked stone deck.`;

            let durationText = isScreen 
                ? `Bake for 3 to 4 minutes on the screen to set the bottom structure, then use a peel to slide the pizza off the screen directly onto the naked stone for an additional 3 to 4 minutes to finish the bottom char.` 
                : `Bake for 5 to 7 minutes (longer in home ovens), rotating dynamically for an even, foldable crust profile.`;

            let bakeSetup = ovenId === "pizza"
                ? `Ignite oven on a low ambient flame profile targeting a strict floor temperature of 650°F (343°C).`
                : `Preheat oven to ${tempText} with the ${stoneName} on the middle rack for a full 60 minutes.`;

            const timeline = [];

            if (meta.preferment) {
                const pref = meta.preferment;
                const prefDate = addDays(startObj, -1);
                const prefTypeLabel = pref.type === "poolish" ? "Poolish (100% Hydration)" : "Biga (50% Hydration)";
                const prefPrepText = pref.type === "poolish"
                    ? `In a glass jar or bowl, whisk Flour (${pref.prefFlourGrams.toFixed(1)}g), Room-Temp Water (${pref.prefWaterGrams.toFixed(1)}g), and yeast (${pref.prefYeastGrams.toFixed(2)}g) until smooth. Cover loosely and ferment at room temperature (68°F–70°F) for 14–16 hours until bubbly, aromatic, and spongy.`
                    : `Combine Flour (${pref.prefFlourGrams.toFixed(1)}g), Cool Water (${pref.prefWaterGrams.toFixed(1)}g), and yeast (${pref.prefYeastGrams.toFixed(2)}g). Work gently into coarse, shaggy crumbs without over-kneading. Cover and let ripen for 16 hours at 60°F–65°F.`;

                timeline.push({
                    dayLabel: `Day 0: ${formatDate(prefDate)} - Pre-Ferment Build (14-16h Prior)`,
                    dateObj: prefDate,
                    steps: [
                        {
                            stepId: "ny_step_pref_0",
                            time: "08:00 PM",
                            phase: `Phase 0: Pre-Ferment Initialization`,
                            title: `Mix & Ferment ${prefTypeLabel}`,
                            description: prefPrepText
                        }
                    ]
                });

                phase1Text = `Incorporate your mature ${pref.type.toUpperCase()} into the remaining Main Water (${pref.mainWaterGrams.toFixed(1)}g). Add the remaining Flour (${pref.mainFlourGrams.toFixed(1)}g), Salt (${weights.saltGrams.toFixed(1)}g), Olive Oil (${weights.oilGrams.toFixed(1)}g), and Malt/Sugar (${weights.maltGrams.toFixed(1)}g).`;
            }

            timeline.push({
                dayLabel: `Day 1: ${formatDate(startObj)} - Mixing & Dough Build`,
                dateObj: startObj,
                steps: [
                    {
                        stepId: "ny_step_1",
                        time: "05:00 PM",
                        phase: "Phase 1: Yeast Activation & Prep",
                        title: meta.preferment ? "Incorporate Pre-Ferment" : "Yeast Bloom",
                        description: phase1Text
                    },
                    {
                        stepId: "ny_step_2",
                        time: "05:15 PM",
                        phase: "Phase 2: Matrix Development",
                        title: "Mix & Knead",
                        description: `In a mixer, combine all dough ingredients and mix on low until cohesive. Knead for 8-10 minutes until strong, smooth, and stretchy with good windowpane resistance. Cover and rest for 20 minutes to relax.`
                    },
                    {
                        stepId: "ny_step_3",
                        time: "05:45 PM",
                        phase: "Phase 3: Balling & Proofing",
                        title: "Scale & Portion",
                        description: `Divide dough into individual unit spheres (${meta.calculatedBallWeight}g each). Round them tightly, sealing the bottoms. Place in oiled containers. ${proofingText}`
                    }
                ]
            });

            timeline.push({
                dayLabel: isSameDay ? "Later Today" : `Day ${timeDeltaDays + 1}: ${formatDate(cookObj)} - Baking Execution`,
                dateObj: cookObj,
                steps: [
                    {
                        stepId: "ny_step_4",
                        time: "03:30 PM",
                        phase: "Phase 4: Counter Tempering",
                        title: "Temper Dough",
                        description: `Exactly 2 to 3 hours before baking, remove the dough from the fridge and place it on the counter to temper to room temperature.${altitude === 'high' ? ' Keep proofing box sealed during tempering.' : ''}`
                    },
                    {
                        stepId: "ny_step_5",
                        time: "05:30 PM",
                        phase: "Phase 5: Thermal Prep",
                        title: "Preheat Oven",
                        description: bakeSetup
                    },
                    {
                        stepId: "ny_step_6",
                        time: "06:30 PM",
                        phase: "Phase 6: The Bake Execution",
                        title: "Stretch, Screen & Bake",
                        description: `${launchText} ${durationText}`
                    }
                ]
            });

            return timeline;
        },

        _generateFocacciaTimeline: function(calcResult, baseDate, options) {
            const { meta, weights } = calcResult;
            const { yeastType, altitude, scheduleStartH, detroitBakeTime, actualHours, diamVal } = meta;

            let phase1Text = yeastType === "ADY"
                ? `Whisk the Granulated Sugar (${weights.sugarGrams.toFixed(1)}g) and Active Dry Yeast (${weights.yeastGrams.toFixed(2)}g) into the Warm Water pool (${weights.warmBloomWater.toFixed(1)}g strictly at 100°F-105°F). Allow to sit undisturbed for 10 minutes to bloom.`
                : `Whisk the Instant Dry Yeast (${weights.yeastGrams.toFixed(2)}g) directly into the dry flour. Dissolve the Granulated Sugar (${weights.sugarGrams.toFixed(1)}g) into your water.`;

            let bulkHours = (actualHours * 0.40).toFixed(1);
            let panHours = (actualHours * 0.50).toFixed(1);

            let bakeTemp = (altitude === "high") ? "450°F" : "425°F";
            let ovenMode = (altitude === "high") ? "True Convection" : "Convection (if available)";

            return [
                {
                    dayLabel: "Same-Day Focaccia Process & Bake",
                    dateObj: baseDate,
                    steps: [
                        {
                            stepId: "foc_step_1",
                            time: formatTime(scheduleStartH),
                            phase: "Phase 1: Yeast Activation & Hydration",
                            title: "Autolyse & Mix",
                            description: `${phase1Text} Combine the flour, Kosher Salt (${weights.saltGrams.toFixed(1)}g), Main Water (${weights.coldMainWater.toFixed(1)}g), and the yeast mixture. Mix until a shaggy dough forms. Cover and let rest for 15 minutes to autolyse.`
                        },
                        {
                            stepId: "foc_step_2",
                            time: formatTime(scheduleStartH + 0.25),
                            phase: "Phase 2: Oil Incorporation & Folds",
                            title: "Stretch & Folds",
                            description: `Pour the Extra Virgin Olive Oil (${weights.oilGrams.toFixed(1)}g) over the dough. Dimple it in with your fingers, then squeeze and fold the dough until the oil is completely absorbed. Perform 3 sets of "Stretch and Folds" spaced 15 minutes apart to build structural strength.`
                        },
                        {
                            stepId: "foc_step_3",
                            time: formatTime(scheduleStartH + 1.0),
                            phase: "Phase 3: Bulk Fermentation",
                            title: "Bulk Rise",
                            description: `Transfer the dough to a lightly oiled bulk container. Let the dough rest covered at room temperature for roughly ${bulkHours} hours until deeply bubbly and doubled in volume.`
                        },
                        {
                            stepId: "foc_step_4",
                            time: formatTime(scheduleStartH + 1.0 + parseFloat(bulkHours)),
                            phase: "Phase 4: Pan Transfer & Final Rise",
                            title: "Pan Rise",
                            description: `Pour a generous slick of olive oil (2-3 tablespoons) into your ${diamVal} pan. Gently transfer the dough into the pan. Coat the top with oil. If it resists stretching to the corners, let it rest 20 minutes and try again. Cover and proof at room temperature for roughly ${panHours} hours until the dough is wildly bubbly and jiggles when shaken.`
                        },
                        {
                            stepId: "foc_step_5",
                            time: formatTime(detroitBakeTime - 0.75),
                            phase: "Phase 5: Oven Pre-Heat",
                            title: "Oven Preheat",
                            description: `Preheat oven to ${bakeTemp} on ${ovenMode} mode for a minimum of 45 minutes to saturate the cavity.`
                        },
                        {
                            stepId: "foc_step_6",
                            time: formatTime(detroitBakeTime),
                            phase: "Phase 6: Dimpling & The Bake",
                            title: "Dimple, Flaky Salt & Bake",
                            description: "Right before baking, pour another light drizzle of oil over the top. Oil your fingers and press firmly straight down into the dough to create deep dimples. Top with flaky sea salt. Bake for approximately 16 minutes, rotating halfway through. Internal crumb should register 205°F-210°F. Remove from pan immediately to a wire rack."
                        }
                    ]
                }
            ];
        }
    };

    window.PizzaApp.engine.timelineEngine = TimelineEngine;

})(window);

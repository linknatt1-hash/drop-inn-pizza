/**
 * TheDropInn Pizza Lab - Formula View Component
 * Renders stats summary cards, flour match banner with W-Factor,
 * context alerts (Tavern curing, Altitude offset, Neo-neapolitan adaptation),
 * Baker's % table, and the Cheese Allocation table.
 */
(function(window) {
    'use strict';

    window.PizzaApp = window.PizzaApp || {};
    window.PizzaApp.ui = window.PizzaApp.ui || {};

    const FormulaView = {
        render: function(calcResult, containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            if (!calcResult.success) {
                container.innerHTML = `
                    <div class="alert alert-error">
                        <span class="alert-icon">⚠️</span>
                        <div>
                            <strong>Configuration Notice</strong>
                            <p>${calcResult.error || "Unable to calculate formula with current parameters."}</p>
                        </div>
                    </div>
                `;
                return;
            }

            const { meta, percentages, weights, cheeses } = calcResult;
            const flour = meta.flour;

            // Stats Cards HTML
            const statsHtml = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Calculated Hydration</div>
                        <div class="stat-val highlight">${percentages.hydration.toFixed(1)}%</div>
                        <div class="stat-sub">W-calibrated absorption</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Fermentation Window</div>
                        <div class="stat-val">${meta.totalHours}h</div>
                        <div class="stat-sub">${meta.style === 'detroit' || meta.style === 'focaccia' ? 'Same-day pan schedule' : `${meta.timeDeltaDays} day ferment`}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Unit Dough Weight</div>
                        <div class="stat-val">${meta.calculatedBallWeight}g</div>
                        <div class="stat-sub">${meta.labelSize}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Total Batch Weight</div>
                        <div class="stat-val">${weights.totalBatchGrams.toFixed(0)}g</div>
                        <div class="stat-sub">${meta.ballCount} unit(s) scaled</div>
                    </div>
                </div>
            `;

            // Flour Selection Badge HTML (with W-Factor highlight)
            const flourBadgeHtml = `
                <div class="flour-selected-card">
                    <div class="flour-selected-header">
                        <span class="badge-pill">System Selected Flour</span>
                        <span class="flour-score-tag">Match Score: ${window.PizzaApp.engine.flourMatcher.getStyleScore(flour, meta.style)}/10</span>
                    </div>
                    <h3 class="flour-title">${flour.brand} - ${flour.name}</h3>
                    <div class="flour-specs-row">
                        <span>Protein: <strong>${flour.protein}%</strong></span>
                        <span>Ash: <strong>${flour.ash}%</strong></span>
                        <span>W-Factor: <strong>${flour.w || 280}</strong></span>
                        <span>${flour.malted ? '<span class="malted-tag">Malted</span>' : '<span class="unmalted-tag">Unmalted</span>'}</span>
                    </div>
                    <p class="flour-notes">${flour.notes}</p>
                </div>
            `;

            // Context Alerts
            let alertsHtml = "";

            if (meta.homeOvenTriggered && meta.style === "neapolitan") {
                alertsHtml += `
                    <div class="alert alert-info">
                        <span class="alert-icon">💡</span>
                        <div>
                            <strong>Neo-Neapolitan Adjustment:</strong> Home oven constraints detected. Automatically injecting 2% Olive Oil and 1% Sugar to assist dough browning and prevent moisture blowout over longer bake times.
                        </div>
                    </div>
                `;
            }

            if (meta.tavernAlertText) {
                alertsHtml += `
                    <div class="alert alert-tavern">
                        <span class="alert-icon">🍕</span>
                        <div>${meta.tavernAlertText}</div>
                    </div>
                `;
            }

            if (meta.altAlertText) {
                alertsHtml += `
                    <div class="alert alert-warning">
                        <span class="alert-icon">🏔️</span>
                        <div>${meta.altAlertText}</div>
                    </div>
                `;
            }

            // Table Rows
            const rows = [];

            // Reference Row
            rows.push(`
                <tr class="table-ref-row">
                    <td>
                        <div class="component-name">Target Unit Weight</div>
                        <div class="component-desc">1x ${meta.labelSize} Dough Ball / Pan</div>
                    </td>
                    <td class="mono-col">---</td>
                    <td class="weight-col font-bold">${meta.calculatedBallWeight} g</td>
                </tr>
            `);

            // Flour Rows (supports NY Style T80 20% auto-blend!)
            if (meta.hasT80) {
                rows.push(`
                    <tr>
                        <td>
                            <div class="component-name">Bread Flour (${flour.brand} ${flour.name})</div>
                            <div class="component-desc">Main structural matrix (80%)</div>
                        </td>
                        <td class="mono-col">80.00%</td>
                        <td class="weight-col">${(weights.flourGrams * 0.80).toFixed(1)} g</td>
                    </tr>
                    <tr>
                        <td>
                            <div class="component-name">Old-World T80 Flour (Central Milling)</div>
                            <div class="component-desc">High-ash aromatic flavor matrix (20%)</div>
                        </td>
                        <td class="mono-col">20.00%</td>
                        <td class="weight-col">${(weights.flourGrams * 0.20).toFixed(1)} g</td>
                    </tr>
                `);
            } else {
                rows.push(`
                    <tr>
                        <td>
                            <div class="component-name">Flour (${flour.brand} ${flour.name})</div>
                            <div class="component-desc">W-Factor: ${flour.w || 280} | Protein: ${flour.protein}%</div>
                        </td>
                        <td class="mono-col">100.00%</td>
                        <td class="weight-col">${weights.flourGrams.toFixed(1)} g</td>
                    </tr>
                `);
            }

            // Water Rows
            if (meta.yeastType === "ADY") {
                const coldPct = ((weights.coldMainWater / weights.flourGrams) * 100).toFixed(2);
                const warmPct = ((weights.warmBloomWater / weights.flourGrams) * 100).toFixed(2);
                const tempLabel = meta.style === 'focaccia' || meta.style === 'detroit' ? "Main Water" : (meta.style === 'tavern' ? "Room-Temp Water (70°F)" : (meta.style === 'ny' ? "Main Mix Water (85°F)" : "Cold Water (Main Batch)"));
                rows.push(`
                    <tr>
                        <td>
                            <div class="component-name">${tempLabel}</div>
                            <div class="component-desc">Hydration baseline</div>
                        </td>
                        <td class="mono-col">${coldPct}%</td>
                        <td class="weight-col">${weights.coldMainWater.toFixed(1)} g</td>
                    </tr>
                    <tr>
                        <td>
                            <div class="component-name">Warm Water (100°F–105°F Bloom Pool)</div>
                            <div class="component-desc">Yeast activation vessel</div>
                        </td>
                        <td class="mono-col">${warmPct}%</td>
                        <td class="weight-col">${weights.warmBloomWater.toFixed(1)} g</td>
                    </tr>
                `);
            } else {
                const tempLabel = meta.style === 'detroit' ? "Chilled Water (45°F–50°F Direct Integration)" : (meta.style === 'ny' ? "Water (85°F Direct Integration)" : (meta.style === 'tavern' ? "Water (70°F Direct Integration)" : "Water (Direct Integration)"));
                rows.push(`
                    <tr>
                        <td>
                            <div class="component-name">${tempLabel}</div>
                            <div class="component-desc">Direct liquid incorporation</div>
                        </td>
                        <td class="mono-col">${percentages.hydration.toFixed(1)}%</td>
                        <td class="weight-col">${weights.totalWaterGrams.toFixed(1)} g</td>
                    </tr>
                `);
            }

            // Salt
            const saltName = meta.style === 'focaccia' ? "Kosher Salt" : "Fine Sea Salt";
            rows.push(`
                <tr>
                    <td>
                        <div class="component-name">${saltName}</div>
                    </td>
                    <td class="mono-col">${percentages.salt.toFixed(2)}%</td>
                    <td class="weight-col">${weights.saltGrams.toFixed(1)} g</td>
                </tr>
            `);

            // Sugar
            if (percentages.sugar > 0) {
                const sugarDesc = meta.style === 'tavern' ? "Granulated Sugar" : "Granulated Sugar / Browning Agent";
                rows.push(`
                    <tr>
                        <td>
                            <div class="component-name">${sugarDesc}</div>
                        </td>
                        <td class="mono-col">${percentages.sugar.toFixed(2)}%</td>
                        <td class="weight-col">${weights.sugarGrams.toFixed(1)} g</td>
                    </tr>
                `);
            }

            // Malt
            if (percentages.malt > 0) {
                rows.push(`
                    <tr>
                        <td>
                            <div class="component-name">Barley Malt Syrup</div>
                            <div class="component-desc">Enhances browning and enzymatic crust depth</div>
                        </td>
                        <td class="mono-col">${percentages.malt.toFixed(2)}%</td>
                        <td class="weight-col">${weights.maltGrams.toFixed(1)} g</td>
                    </tr>
                `);
            }

            // Oil
            if (percentages.oil > 0) {
                const oilName = meta.style === 'tavern' ? "Corn Oil" : (meta.style === 'focaccia' ? "Extra Virgin Olive Oil (For Dough)" : "Extra Virgin Olive Oil");
                rows.push(`
                    <tr>
                        <td>
                            <div class="component-name">${oilName}</div>
                        </td>
                        <td class="mono-col">${percentages.oil.toFixed(2)}%</td>
                        <td class="weight-col">${weights.oilGrams.toFixed(1)} g</td>
                    </tr>
                `);
            }

            // Yeast
            rows.push(`
                <tr>
                    <td>
                        <div class="component-name">Yeast (${meta.yeastType})</div>
                        <div class="component-desc">Kinetics calibrated for ${meta.totalHours}h duration</div>
                    </td>
                    <td class="mono-col">${percentages.yeast.toFixed(2)}%</td>
                    <td class="weight-col">${weights.yeastGrams.toFixed(2)} g</td>
                </tr>
            `);

            // Total Row
            rows.push(`
                <tr class="table-total-row">
                    <td>
                        <div class="component-name font-bold">Total Batch Weight</div>
                        <div class="component-desc">Yields ${meta.ballCount}x ${meta.labelSize} cleanly</div>
                    </td>
                    <td class="mono-col font-bold">${percentages.total.toFixed(2)}%</td>
                    <td class="weight-col font-bold highlight">${weights.totalBatchGrams.toFixed(1)} g</td>
                </tr>
            `);

            // Cheese Table HTML (if cheeses exist)
            let cheeseTableHtml = "";
            if (cheeses && cheeses.length > 0) {
                const cheeseRows = cheeses.map(c => `
                    <tr>
                        <td>
                            <div class="component-name">${c.name}</div>
                        </td>
                        <td class="weight-col font-bold">${c.grams} g</td>
                    </tr>
                `).join("");

                cheeseTableHtml = `
                    <div class="table-card mt-4">
                        <div class="table-header-title">🧀 Cheese Allocation (Per Pizza/Pan)</div>
                        <div class="table-responsive">
                            <table class="formula-table">
                                <thead>
                                    <tr>
                                        <th>Component</th>
                                        <th>Mass (Grams)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${cheeseRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }

            // Pre-Ferment Card (Poolish / Biga)
            let prefermentCardHtml = "";
            if (meta.preferment) {
                const pref = meta.preferment;
                const isPoolish = pref.type === "poolish";
                const prefName = isPoolish ? "Poolish (100% Hydration)" : "Biga (50% Hydration)";
                const prefDesc = isPoolish 
                    ? "Liquid pre-ferment matured 14–16 hours at room temperature. Produces exceptional dough extensibility, intense oven spring, and honeycombed cornicione."
                    : "Stiff pre-ferment (50% hydration) matured 16–18 hours. Delivers explosive gas retention, complex organic acidity, and supreme crust crispness.";

                prefermentCardHtml = `
                    <div class="table-card mt-4" style="border-left: 4px solid var(--brand-accent);">
                        <div class="table-header-title">🥣 Phase 1: Pre-Ferment (${prefName} - ${pref.pct}% Flour)</div>
                        <p class="table-subtitle">${prefDesc}</p>
                        <div class="table-responsive">
                            <table class="formula-table">
                                <thead>
                                    <tr>
                                        <th>Pre-Ferment Component</th>
                                        <th>Baker's %</th>
                                        <th>Mass (Grams)</th>
                                        <th>Execution Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <div class="component-name">Pre-Ferment Flour (${flour.brand})</div>
                                        </td>
                                        <td class="mono-col">${pref.pct}.00%</td>
                                        <td class="weight-col font-bold highlight">${pref.prefFlourGrams.toFixed(1)} g</td>
                                        <td class="component-desc">Drawn from total recipe flour batch</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div class="component-name">${isPoolish ? 'Water (80°F–85°F - 100% absorption)' : 'Water (68°F - 50% absorption)'}</div>
                                        </td>
                                        <td class="mono-col">${isPoolish ? '100.00%' : '50.00%'}</td>
                                        <td class="weight-col font-bold">${pref.prefWaterGrams.toFixed(1)} g</td>
                                        <td class="component-desc">${isPoolish ? 'Equal parts water and flour by weight' : 'Stiff hydration for biga structure'}</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div class="component-name">Yeast (Pinch)</div>
                                        </td>
                                        <td class="mono-col">~0.10%</td>
                                        <td class="weight-col font-bold">${pref.prefYeastGrams.toFixed(2)} g</td>
                                        <td class="component-desc">Tiny pinch to spark slow overnight maturation</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }

            const tableTitle = meta.preferment 
                ? `🥖 Phase 2: Final Main Dough Mix (${meta.ballCount}x ${meta.labelSize})`
                : `🥖 Main Dough Formula (${meta.ballCount}x ${meta.labelSize})`;

            const tableHtml = `
                <div class="table-card mt-4">
                    <div class="table-header-title">${tableTitle}</div>
                    <div class="table-responsive">
                        <table class="formula-table">
                            <thead>
                                <tr>
                                    <th>Component</th>
                                    <th>Baker's %</th>
                                    <th>Mass (Grams)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            container.innerHTML = statsHtml + flourBadgeHtml + alertsHtml + prefermentCardHtml + tableHtml + cheeseTableHtml;
        }
    };

    window.PizzaApp.ui.formulaView = FormulaView;

})(window);

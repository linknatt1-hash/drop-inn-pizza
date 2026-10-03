/**
 * Intelligent Pizza Dough Calculator - Toppings & Extras View
 * Renders scaled cheese blends, Chicago Tavern spiced herb sauce batches,
 * and raw Italian pork sausage mixes scaled for the selected quantity & diameter.
 */
(function(window) {
    'use strict';

    window.PizzaApp = window.PizzaApp || {};
    window.PizzaApp.ui = window.PizzaApp.ui || {};

    const ToppingsView = {
        render: function(calcResult, containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            if (!calcResult || !calcResult.success) {
                container.innerHTML = `<div class="p-4 text-muted">Complete dough formulation parameters above to view scaled toppings.</div>`;
                return;
            }

            const { meta } = calcResult;
            const style = meta.style;
            const ballCount = meta.ballCount;
            const diameter = meta.diameter;

            const recipeData = window.PizzaApp.data.recipes[style] || window.PizzaApp.data.recipes.tavern;
            const toppings = window.PizzaApp.engine.calculator.calculateToppings(recipeData, ballCount, diameter, style);
            const bakingPrep = window.PizzaApp.engine.calculator.calculateBakingPrep(style, diameter, ballCount);

            // Cheese table rows (if applicable)
            let cheeseSectionHtml = "";
            if (toppings.cheeseBlend && toppings.cheeseBlend.length > 0) {
                const cheeseRows = toppings.cheeseBlend.map(c => `
                    <tr>
                        <td>
                            <div class="component-name">${c.name}</div>
                            <div class="component-desc">${c.notes}</div>
                        </td>
                        <td class="mono-col">${c.perPizzaGrams} g</td>
                        <td class="weight-col font-bold">${c.totalGrams} g</td>
                    </tr>
                `).join("");

                cheeseSectionHtml = `
                    <div class="table-card mt-4">
                        <div class="table-header-title">🧀 Cheese Formulation (${meta.labelSize})</div>
                        <div class="table-responsive">
                            <table class="formula-table">
                                <thead>
                                    <tr>
                                        <th>Cheese Component</th>
                                        <th>Per Unit</th>
                                        <th>Total Batch</th>
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

            // Sauce / Brine table rows
            let sauceSectionHtml = "";
            if (toppings.sauce && toppings.sauce.ingredients && toppings.sauce.ingredients.length > 0) {
                const sauceRows = toppings.sauce.ingredients.map(s => `
                    <tr>
                        <td>
                            <div class="component-name">${s.item}</div>
                            ${s.notes ? `<div class="component-desc">${s.notes}</div>` : ''}
                        </td>
                        <td class="weight-col font-bold">${typeof s.grams === 'number' ? s.grams + ' g' : s.grams}</td>
                    </tr>
                `).join("");

                sauceSectionHtml = `
                    <div class="table-card mt-4">
                        <div class="table-header-title">🍅 ${toppings.sauce.name} (${toppings.sauce.totalBatchGrams}g Total)</div>
                        <p class="table-subtitle">${toppings.sauce.subtitle}</p>
                        <div class="table-responsive">
                            <table class="formula-table">
                                <thead>
                                    <tr>
                                        <th>Ingredient</th>
                                        <th>Batch Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${sauceRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }

            // Extras / Sausage table rows (e.g. Tavern raw sausage)
            let extrasSectionHtml = "";
            if (toppings.sausage && toppings.sausage.ingredients) {
                const sausageRows = toppings.sausage.ingredients.map(sg => `
                    <tr>
                        <td>
                            <div class="component-name">${sg.item}</div>
                            ${sg.notes ? `<div class="component-desc">${sg.notes}</div>` : ''}
                        </td>
                        <td class="weight-col font-bold">${sg.grams} g</td>
                    </tr>
                `).join("");

                extrasSectionHtml = `
                    <div class="table-card mt-4">
                        <div class="table-header-title">🥩 ${toppings.sausage.name} (${toppings.sausage.totalBatchGrams}g Total)</div>
                        <p class="table-subtitle">${toppings.sausage.subtitle}</p>
                        <div class="table-responsive">
                            <table class="formula-table">
                                <thead>
                                    <tr>
                                        <th>Sausage Ingredient</th>
                                        <th>Batch Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${sausageRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }

            // Baking Prep, Peel Dusting & Pan Seasoning Matrix
            let prepSectionHtml = "";
            if (bakingPrep && bakingPrep.items) {
                const prepRows = bakingPrep.items.map(p => `
                    <tr>
                        <td>
                            <div class="component-name">${p.item}</div>
                        </td>
                        <td class="mono-col font-bold">${p.amount}</td>
                        <td class="component-desc">${p.purpose}</td>
                    </tr>
                `).join("");

                prepSectionHtml = `
                    <div class="table-card mt-4">
                        <div class="table-header-title">🔥 ${bakingPrep.title}</div>
                        <p class="table-subtitle">${bakingPrep.subtitle}</p>
                        <div class="table-responsive">
                            <table class="formula-table">
                                <thead>
                                    <tr>
                                        <th>Prep Component</th>
                                        <th>Quantity / Specification</th>
                                        <th>Execution Purpose</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${prepRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }

            container.innerHTML = `
                <div class="toppings-section">
                    <div class="section-badge-bar">
                        <span class="badge-pill">${meta.labelSize} - ${recipeData.name || meta.style.toUpperCase()} Formulation</span>
                        <span class="text-muted">Scaled for <strong>${ballCount} unit(s)</strong></span>
                    </div>

                    ${cheeseSectionHtml}
                    ${sauceSectionHtml}
                    ${extrasSectionHtml}
                    ${prepSectionHtml}
                </div>
            `;
        }
    };

    window.PizzaApp.ui.toppingsView = ToppingsView;

})(window);

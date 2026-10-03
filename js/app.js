/**
 * TheDropInn Pizza Lab - Main Application Controller
 * Handles 5 pizza styles, dynamic diameter/pan sizes, same-day pan hourly inputs,
 * flour matching, calculation updates, and view rendering.
 */
(function(window) {
    'use strict';

    window.PizzaApp = window.PizzaApp || {};

    const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function formatDateOption(dateObj) {
        return `${DAYS_OF_WEEK[dateObj.getDay()]}, ${MONTHS[dateObj.getMonth()]} ${dateObj.getDate()}`;
    }

    class App {
        constructor() {
            this.store = window.PizzaApp.state.store;
            this.baseDate = new Date();
        }

        init() {
            this.cacheDom();
            this.populateDateDropdowns();
            this.rebuildOvenDropdown();
            this.updateDiameterOptions();
            this.toggleDateInputs();
            this.initFlourInventory();
            this.bindEvents();
            this.syncControlsWithState();

            // Subscribe to store updates
            this.store.subscribe((state) => {
                this.handleStateChange(state);
            });

            // Initial calculation & render
            this.handleStateChange(this.store.getState());
        }

        cacheDom() {
            this.dom = {
                pizzaStyle: document.getElementById("pizzaStyle"),
                stylePills: document.querySelectorAll("[data-style-target]"),
                ovenType: document.getElementById("ovenType"),
                maxTemp: document.getElementById("maxTemp"),
                stoneType: document.getElementById("stoneType"),
                yeastType: document.getElementById("yeastType"),
                altitude: document.getElementById("altitude"),
                standardDateInputs: document.getElementById("standardDateInputs"),
                detroitTimeInputs: document.getElementById("detroitTimeInputs"),
                startDate: document.getElementById("startDate"),
                cookingDate: document.getElementById("cookingDate"),
                detroitStartTime: document.getElementById("detroitStartTime"),
                detroitBakeTime: document.getElementById("detroitBakeTime"),
                diameter: document.getElementById("diameter"),
                ballCount: document.getElementById("ballCount"),
                tabButtons: document.querySelectorAll("[data-tab-target]"),
                tabPanels: document.querySelectorAll(".tab-content-panel"),
                btnDownloadImage: document.getElementById("btnDownloadImage"),
                btnCopyRecipe: document.getElementById("btnCopyRecipe"),
                btnPrintSheet: document.getElementById("btnPrintSheet"),
                btnResetApp: document.getElementById("btnResetApp"),
                toast: document.getElementById("toastNotification"),
                prefermentContainer: document.getElementById("prefermentContainer"),
                prefermentType: document.getElementById("prefermentType"),
                prefermentPct: document.getElementById("prefermentPct")
            };
        }

        populateDateDropdowns() {
            const startSelect = this.dom.startDate;
            const cookSelect = this.dom.cookingDate;
            if (startSelect && cookSelect) {
                startSelect.innerHTML = "";
                cookSelect.innerHTML = "";

                for (let i = 0; i < 10; i++) {
                    const dateObj = new Date(this.baseDate.getTime());
                    dateObj.setDate(this.baseDate.getDate() + i);
                    const label = i === 0 ? `Today (${formatDateOption(dateObj)})` : formatDateOption(dateObj);

                    startSelect.add(new Option(label, i));
                    cookSelect.add(new Option(label, i));
                }
            }

            // Detroit / Focaccia hourly time dropdowns
            const dStartSelect = this.dom.detroitStartTime;
            const dBakeSelect = this.dom.detroitBakeTime;
            if (dStartSelect && dBakeSelect) {
                dStartSelect.innerHTML = "";
                dBakeSelect.innerHTML = "";

                for (let i = 6; i <= 22; i++) {
                    const ampm = i >= 12 ? "PM" : "AM";
                    const displayH = i % 12 || 12;
                    const timeStr = `${displayH}:00 ${ampm}`;
                    dStartSelect.add(new Option(timeStr, i));
                    dBakeSelect.add(new Option(timeStr, i));
                }

                dStartSelect.value = 11; // Default 11 AM
                dBakeSelect.value = 18;  // Default 6 PM
            }
        }

        rebuildOvenDropdown() {
            const style = this.store.getState().style || "neapolitan";
            const ovenEl = this.dom.ovenType;
            if (!ovenEl) return;

            const currentVal = ovenEl.value;
            ovenEl.innerHTML = "";

            const availableOvens = window.PizzaApp.data.equipment.getAvailableOvensForStyle(style);
            availableOvens.forEach(o => {
                ovenEl.add(new Option(o.name, o.id));
            });

            const found = Array.from(ovenEl.options).some(opt => opt.value === currentVal);
            if (found) {
                ovenEl.value = currentVal;
            } else if (ovenEl.options.length > 0) {
                ovenEl.value = ovenEl.options[0].value;
            }

            this.updateOvenOptions();
        }

        updateOvenOptions() {
            const oven = this.dom.ovenType.value;
            const tempSelect = this.dom.maxTemp;
            const stoneSelect = this.dom.stoneType;
            if (!tempSelect || !stoneSelect) return;

            tempSelect.innerHTML = "";
            stoneSelect.innerHTML = "";

            const ovenData = window.PizzaApp.data.equipment.getOvenById(oven);

            ovenData.temps.forEach(t => {
                tempSelect.add(new Option(t.label, t.value));
            });

            ovenData.stones.forEach(s => {
                stoneSelect.add(new Option(s.name, s.id));
            });

            const state = this.store.getState();
            if (state.maxTemp && Array.from(tempSelect.options).some(o => o.value === state.maxTemp)) {
                tempSelect.value = state.maxTemp;
            }
            if (state.stoneType && Array.from(stoneSelect.options).some(o => o.value === state.stoneType)) {
                stoneSelect.value = state.stoneType;
            }
        }

        updateDiameterOptions() {
            const style = this.store.getState().style || "neapolitan";
            const diamSelect = this.dom.diameter;
            if (!diamSelect) return;

            const currentVal = diamSelect.value;
            diamSelect.innerHTML = "";

            const recipeStyle = window.PizzaApp.data.recipes[style];
            if (recipeStyle && recipeStyle.diameters) {
                recipeStyle.diameters.forEach(d => {
                    diamSelect.add(new Option(d.label, d.id));
                });
            } else {
                diamSelect.add(new Option('10" Pizza', "10"));
                diamSelect.add(new Option('12" Pizza', "12"));
            }

            const found = Array.from(diamSelect.options).some(opt => opt.value === currentVal);
            if (found) {
                diamSelect.value = currentVal;
            } else {
                if (style === "neapolitan") diamSelect.value = "12";
                else if (style === "tavern") diamSelect.value = "14";
                else if (style === "detroit" || style === "focaccia") diamSelect.value = "10x14";
                else if (style === "ny") diamSelect.value = "18";
            }
        }

        toggleDateInputs() {
            const style = this.store.getState().style || "neapolitan";
            const isPan = style === "detroit" || style === "focaccia";

            if (this.dom.standardDateInputs && this.dom.detroitTimeInputs) {
                if (isPan) {
                    this.dom.standardDateInputs.style.display = "none";
                    this.dom.detroitTimeInputs.style.display = "grid";
                } else {
                    this.dom.standardDateInputs.style.display = "grid";
                    this.dom.detroitTimeInputs.style.display = "none";
                }
            }
        }

        togglePrefermentVisibility() {
            const state = this.store.getState();
            const style = state.style || "neapolitan";
            const isApplicable = style === "neapolitan" || style === "ny";
            if (this.dom.prefermentContainer) {
                this.dom.prefermentContainer.style.display = isApplicable ? "block" : "none";
            }
            if (this.dom.prefermentPct) {
                this.dom.prefermentPct.style.display = (isApplicable && state.prefermentType && state.prefermentType !== "none") ? "block" : "none";
            }
        }

        initFlourInventory() {
            window.PizzaApp.ui.inventoryModal.init("inventoryContainer", "addFlourModal");
        }

        bindEvents() {
            // Dropdown Style change
            if (this.dom.pizzaStyle) {
                this.dom.pizzaStyle.addEventListener("change", (e) => {
                    const newStyle = e.target.value;
                    this.store.setState({ style: newStyle });
                    this.rebuildOvenDropdown();
                    this.updateDiameterOptions();
                    this.toggleDateInputs();
                    this.togglePrefermentVisibility();
                    this.store.setState({
                        diameter: this.dom.diameter.value,
                        ovenType: this.dom.ovenType.value,
                        maxTemp: this.dom.maxTemp.value,
                        stoneType: this.dom.stoneType.value
                    });
                });
            }

            // Style selection pills (if present)
            this.dom.stylePills.forEach(pill => {
                pill.addEventListener("click", () => {
                    const selectedStyle = pill.getAttribute("data-style-target");
                    if (this.dom.pizzaStyle) this.dom.pizzaStyle.value = selectedStyle;
                    this.store.setState({ style: selectedStyle });
                    this.rebuildOvenDropdown();
                    this.updateDiameterOptions();
                    this.toggleDateInputs();
                    this.togglePrefermentVisibility();
                    this.store.setState({
                        diameter: this.dom.diameter.value,
                        ovenType: this.dom.ovenType.value,
                        maxTemp: this.dom.maxTemp.value,
                        stoneType: this.dom.stoneType.value
                    });
                });
            });

            // Oven change
            this.dom.ovenType.addEventListener("change", (e) => {
                const newOven = e.target.value;
                this.updateOvenOptions();
                this.store.setState({
                    ovenType: newOven,
                    maxTemp: this.dom.maxTemp.value,
                    stoneType: this.dom.stoneType.value
                });
            });

            this.dom.maxTemp.addEventListener("change", (e) => {
                this.store.setState({ maxTemp: e.target.value });
            });

            this.dom.stoneType.addEventListener("change", (e) => {
                this.store.setState({ stoneType: e.target.value });
            });

            this.dom.yeastType.addEventListener("change", (e) => {
                this.store.setState({ yeastType: e.target.value });
            });

            this.dom.altitude.addEventListener("change", (e) => {
                this.store.setState({ altitude: e.target.value });
            });

            // Date synchronization
            this.dom.startDate.addEventListener("change", (e) => {
                const startVal = parseInt(e.target.value, 10);
                let cookVal = parseInt(this.dom.cookingDate.value, 10);
                if (cookVal < startVal) {
                    cookVal = startVal;
                    this.dom.cookingDate.value = cookVal;
                }
                this.store.setState({
                    startDateOffset: startVal,
                    cookingDateOffset: cookVal
                });
            });

            this.dom.cookingDate.addEventListener("change", (e) => {
                const cookVal = parseInt(e.target.value, 10);
                const startVal = parseInt(this.dom.startDate.value, 10);
                if (cookVal < startVal) {
                    this.showToast("Cooking date adjusted start date.", "warning");
                    this.dom.startDate.value = cookVal;
                    this.store.setState({
                        startDateOffset: cookVal,
                        cookingDateOffset: cookVal
                    });
                } else {
                    this.store.setState({ cookingDateOffset: cookVal });
                }
            });

            // Detroit hourly inputs
            if (this.dom.detroitStartTime) {
                this.dom.detroitStartTime.addEventListener("change", (e) => {
                    this.store.setState({ detroitStartTime: parseInt(e.target.value, 10) });
                });
            }

            if (this.dom.detroitBakeTime) {
                this.dom.detroitBakeTime.addEventListener("change", (e) => {
                    this.store.setState({ detroitBakeTime: parseInt(e.target.value, 10) });
                });
            }

            this.dom.diameter.addEventListener("change", (e) => {
                this.store.setState({ diameter: e.target.value });
            });

            this.dom.ballCount.addEventListener("input", (e) => {
                const count = Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1));
                this.store.setState({ ballCount: count });
            });

            // Pre-ferment configuration
            if (this.dom.prefermentType) {
                this.dom.prefermentType.addEventListener("change", (e) => {
                    const val = e.target.value;
                    this.store.setState({ prefermentType: val });
                    this.togglePrefermentVisibility();
                });
            }

            if (this.dom.prefermentPct) {
                this.dom.prefermentPct.addEventListener("change", (e) => {
                    this.store.setState({ prefermentPct: parseInt(e.target.value, 10) || 20 });
                });
            }

            // Tabs
            this.dom.tabButtons.forEach(btn => {
                btn.addEventListener("click", () => {
                    const targetTab = btn.getAttribute("data-tab-target");
                    this.switchTab(targetTab);
                });
            });

            // Kitchen actions
            if (this.dom.btnDownloadImage) {
                this.dom.btnDownloadImage.addEventListener("click", () => this.downloadRecipeImage());
            }

            if (this.dom.btnCopyRecipe) {
                this.dom.btnCopyRecipe.addEventListener("click", () => this.copyRecipeToClipboard());
            }

            if (this.dom.btnPrintSheet) {
                this.dom.btnPrintSheet.addEventListener("click", () => window.print());
            }

            if (this.dom.btnResetApp) {
                this.dom.btnResetApp.addEventListener("click", () => {
                    if (confirm("Reset calculator to default parameters?")) {
                        this.store.resetDefaults();
                        this.syncControlsWithState();
                        this.showToast("Reset to defaults.", "info");
                    }
                });
            }
        }

        switchTab(tabId) {
            this.store.setState({ activeTab: tabId }, true);

            this.dom.tabButtons.forEach(btn => {
                if (btn.getAttribute("data-tab-target") === tabId) {
                    btn.classList.add("tab-active");
                } else {
                    btn.classList.remove("tab-active");
                }
            });

            this.dom.tabPanels.forEach(panel => {
                if (panel.id === `tab-${tabId}`) {
                    panel.classList.add("panel-active");
                } else {
                    panel.classList.remove("panel-active");
                }
            });
        }

        syncControlsWithState() {
            const state = this.store.getState();

            if (this.dom.pizzaStyle) this.dom.pizzaStyle.value = state.style;

            this.dom.stylePills.forEach(pill => {
                if (pill.getAttribute("data-style-target") === state.style) {
                    pill.classList.add("pill-active");
                } else {
                    pill.classList.remove("pill-active");
                }
            });

            this.rebuildOvenDropdown();
            this.updateDiameterOptions();
            this.toggleDateInputs();
            this.togglePrefermentVisibility();

            if (this.dom.ovenType) this.dom.ovenType.value = state.ovenType;
            if (this.dom.yeastType) this.dom.yeastType.value = state.yeastType;
            if (this.dom.altitude) this.dom.altitude.value = state.altitude;
            if (this.dom.prefermentType) this.dom.prefermentType.value = state.prefermentType || "none";
            if (this.dom.prefermentPct) this.dom.prefermentPct.value = state.prefermentPct || 20;
            if (this.dom.startDate) this.dom.startDate.value = state.startDateOffset;
            if (this.dom.cookingDate) this.dom.cookingDate.value = state.cookingDateOffset;
            if (this.dom.detroitStartTime) this.dom.detroitStartTime.value = state.detroitStartTime || 11;
            if (this.dom.detroitBakeTime) this.dom.detroitBakeTime.value = state.detroitBakeTime || 18;
            if (this.dom.diameter) this.dom.diameter.value = state.diameter;
            if (this.dom.ballCount) this.dom.ballCount.value = state.ballCount;

            this.switchTab(state.activeTab || "formula");
        }

        handleStateChange(state) {
            if (this.dom.pizzaStyle && this.dom.pizzaStyle.value !== state.style) {
                this.dom.pizzaStyle.value = state.style;
                this.rebuildOvenDropdown();
                this.updateDiameterOptions();
                this.toggleDateInputs();
                this.togglePrefermentVisibility();
            }

            if (this.dom.prefermentType && this.dom.prefermentType.value !== state.prefermentType) {
                this.dom.prefermentType.value = state.prefermentType || "none";
            }
            if (this.dom.prefermentPct && this.dom.prefermentPct.value !== String(state.prefermentPct)) {
                this.dom.prefermentPct.value = state.prefermentPct || 20;
            }
            this.togglePrefermentVisibility();

            this.dom.stylePills.forEach(pill => {
                if (pill.getAttribute("data-style-target") === state.style) {
                    pill.classList.add("pill-active");
                } else {
                    pill.classList.remove("pill-active");
                }
            });

            // 1. Flour Matcher
            const allFlours = window.PizzaApp.data.flours.getAllFlours();
            const matchResult = window.PizzaApp.engine.flourMatcher.findBestMatch(
                state.flourInventory,
                allFlours,
                state.style
            );

            if (!matchResult.success) {
                document.getElementById("formulaViewContainer").innerHTML = `
                    <div class="alert alert-error">
                        <span class="alert-icon">⚠️</span>
                        <div>
                            <strong>Flour Inventory Empty</strong>
                            <p>${matchResult.error}</p>
                        </div>
                    </div>
                `;
                return;
            }

            const selectedFlour = matchResult.flour;

            // 2. Core Calculation
            const calcResult = window.PizzaApp.engine.calculator.calculateFormula({
                style: state.style,
                selectedFlour: selectedFlour,
                ovenType: state.ovenType,
                maxTemp: state.maxTemp,
                stoneType: state.stoneType,
                yeastType: state.yeastType,
                altitude: state.altitude,
                startDateOffset: state.startDateOffset,
                cookingDateOffset: state.cookingDateOffset,
                detroitStartTime: state.detroitStartTime,
                detroitBakeTime: state.detroitBakeTime,
                diameter: state.diameter,
                ballCount: state.ballCount,
                checkedFlourIds: state.flourInventory,
                prefermentType: state.prefermentType,
                prefermentPct: state.prefermentPct
            });

            this.lastCalcResult = calcResult;

            // 3. Render Views
            try {
                window.PizzaApp.ui.formulaView.render(calcResult, "formulaViewContainer");
            } catch (err) {
                console.error("Error rendering formula view:", err);
            }

            try {
                window.PizzaApp.ui.toppingsView.render(calcResult, "toppingsViewContainer");
            } catch (err) {
                console.error("Error rendering toppings view:", err);
            }

            // 4. Render Timeline
            try {
                const ovenData = window.PizzaApp.data.equipment.getOvenById(state.ovenType);
                const stoneObj = ovenData.stones.find(s => s.id === state.stoneType) || ovenData.stones[0];
                const tempObj = ovenData.temps.find(t => t.value === state.maxTemp) || ovenData.temps[0];

                const timelineData = window.PizzaApp.engine.timelineEngine.generateTimeline(
                    calcResult,
                    this.baseDate,
                    {
                        ovenId: state.ovenType,
                        stoneName: stoneObj ? stoneObj.name : "Stone/Steel",
                        tempText: tempObj ? tempObj.label : "550°F"
                    }
                );

                window.PizzaApp.ui.timelineView.render(
                    timelineData,
                    state.completedSteps,
                    "timelineViewContainer"
                );
            } catch (err) {
                console.error("Error rendering timeline view:", err);
            }

            // 5. Update inventory UI
            try {
                window.PizzaApp.ui.inventoryModal.render(
                    allFlours,
                    state.flourInventory,
                    selectedFlour.id
                );
            } catch (err) {
                console.error("Error rendering inventory UI:", err);
            }
        }

        downloadRecipeImage() {
            const btn = this.dom.btnDownloadImage;
            const originalHtml = btn ? btn.innerHTML : "Save";
            if (btn) {
                btn.innerHTML = "<span>📸</span> Capturing...";
                btn.style.opacity = "0.7";
                btn.disabled = true;
            }

            const targetElement = document.getElementById("outputPanel");
            if (!targetElement || typeof html2canvas !== "function") {
                this.showToast("Image capture library unavailable.", "error");
                if (btn) {
                    btn.innerHTML = originalHtml;
                    btn.style.opacity = "1";
                    btn.disabled = false;
                }
                return;
            }

            html2canvas(targetElement, {
                scale: 2,
                backgroundColor: "#ffffff",
                useCORS: true
            }).then(canvas => {
                if (btn) {
                    btn.innerHTML = originalHtml;
                    btn.style.opacity = "1";
                    btn.disabled = false;
                }

                const link = document.createElement("a");
                const styleName = this.store.getState().style || "recipe";
                const safeName = styleName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                link.download = `TheDropInn_${safeName}_Recipe.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
                this.showToast("📸 Recipe image saved!", "success");
            }).catch(err => {
                console.error("Error capturing recipe image:", err);
                if (btn) {
                    btn.innerHTML = "Error - Try Again";
                    btn.style.opacity = "1";
                    btn.disabled = false;
                }
                this.showToast("Failed to capture image.", "error");
            });
        }

        copyRecipeToClipboard() {
            if (!this.lastCalcResult || !this.lastCalcResult.success) return;

            const res = this.lastCalcResult;
            const meta = res.meta;
            const w = res.weights;
            const p = res.percentages;

            let text = `🍕 PIZZA DOUGH FORMULA - ${meta.style.toUpperCase()}\n`;
            text += `--------------------------------------------------\n`;
            text += `Yield: ${meta.ballCount} unit(s) x ${meta.labelSize} (${meta.calculatedBallWeight}g each)\n`;
            text += `Flour: [${meta.flour.brand}] ${meta.flour.name} (W-Factor: ${meta.flour.w || 280})\n`;
            text += `Calculated Hydration: ${p.hydration.toFixed(1)}%\n`;
            text += `Fermentation: ${meta.totalHours} Hours (${meta.yeastType} yeast)\n\n`;
            text += `INGREDIENTS:\n`;
            text += `• Flour (100%): ${w.flourGrams.toFixed(1)}g\n`;
            if (meta.yeastType === "ADY") {
                text += `• Cold/Main Water: ${w.coldMainWater.toFixed(1)}g\n`;
                text += `• Warm Bloom Water (100°F–105°F): ${w.warmBloomWater.toFixed(1)}g\n`;
            } else {
                text += `• Water: ${w.totalWaterGrams.toFixed(1)}g\n`;
            }
            text += `• Salt (${p.salt.toFixed(2)}%): ${w.saltGrams.toFixed(1)}g\n`;
            if (p.sugar > 0) text += `• Sugar (${p.sugar.toFixed(2)}%): ${w.sugarGrams.toFixed(1)}g\n`;
            if (p.malt > 0) text += `• Malt Syrup (${p.malt.toFixed(2)}%): ${w.maltGrams.toFixed(1)}g\n`;
            if (p.oil > 0) text += `• Oil (${p.oil.toFixed(2)}%): ${w.oilGrams.toFixed(1)}g\n`;
            text += `• Yeast (${p.yeast.toFixed(2)}%): ${w.yeastGrams.toFixed(2)}g\n`;
            text += `• Total Batch Target: ${w.totalBatchGrams.toFixed(1)}g\n`;

            if (meta.preferment) {
                const pref = meta.preferment;
                text += `\n🥣 PRE-FERMENT (${pref.type.toUpperCase()} - ${pref.pct}% of flour):\n`;
                text += `• Flour: ${pref.prefFlourGrams.toFixed(1)}g\n`;
                text += `• Water: ${pref.prefWaterGrams.toFixed(1)}g (${pref.type === 'poolish' ? '100%' : '50%'} hydration)\n`;
                text += `• Yeast: ${pref.prefYeastGrams.toFixed(2)}g\n`;
                text += `\n🥣 MAIN DOUGH MIX (Day of):\n`;
                text += `• Mature ${pref.type.toUpperCase()}: All of above\n`;
                text += `• Remaining Flour: ${pref.mainFlourGrams.toFixed(1)}g\n`;
                text += `• Remaining Water: ${pref.mainWaterGrams.toFixed(1)}g\n`;
                text += `• Salt: ${w.saltGrams.toFixed(1)}g\n`;
                if (pref.mainYeastGrams > 0.05) text += `• Additional Yeast: ${pref.mainYeastGrams.toFixed(2)}g\n`;
                if (w.oilGrams > 0) text += `• Oil: ${w.oilGrams.toFixed(1)}g\n`;
                if (w.sugarGrams > 0) text += `• Sugar: ${w.sugarGrams.toFixed(1)}g\n`;
            }

            navigator.clipboard.writeText(text).then(() => {
                this.showToast("📋 Recipe copied to clipboard!", "success");
            }).catch(() => {
                this.showToast("Failed to copy recipe.", "error");
            });
        }

        showToast(msg, type = "info") {
            const toast = this.dom.toast;
            if (!toast) return;

            toast.textContent = msg;
            toast.className = `toast-popup toast-${type} toast-show`;

            clearTimeout(this.toastTimer);
            this.toastTimer = setTimeout(() => {
                toast.classList.remove("toast-show");
            }, 3000);
        }
    }

    // Auto-bootstrap on DOM ready
    window.addEventListener("DOMContentLoaded", () => {
        window.PizzaApp.instance = new App();
        window.PizzaApp.instance.init();
    });

})(window);

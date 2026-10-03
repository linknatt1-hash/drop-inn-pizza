/**
 * TheDropInn Pizza Lab - Flour Inventory & Custom Flour Modal
 * Supports categorized grouping (00 Flours, Bread Flours, AP Flours),
 * category "Toggle All" controls, search filter, and custom flour entry.
 */
(function(window) {
    'use strict';

    window.PizzaApp = window.PizzaApp || {};
    window.PizzaApp.ui = window.PizzaApp.ui || {};

    const CATEGORIES = [
        { id: "00", title: "00 Flours (Fine Milled / Pizza)" },
        { id: "bread", title: "Bread Flours (High Protein)" },
        { id: "ap", title: "All-Purpose Flours" }
    ];

    const InventoryModal = {
        init: function(containerId, modalId) {
            this.containerId = containerId;
            this.modalId = modalId;
            this.searchTerm = "";
            this.bindModalEvents();
        },

        render: function(flourList, checkedIds, activeFlourId) {
            const container = document.getElementById(this.containerId);
            if (!container) return;

            const filtered = flourList.filter(f => {
                if (!this.searchTerm) return true;
                const term = this.searchTerm.toLowerCase();
                return (
                    f.name.toLowerCase().includes(term) ||
                    f.brand.toLowerCase().includes(term) ||
                    (f.notes && f.notes.toLowerCase().includes(term))
                );
            });

            // Group by category
            let categoriesHtml = "";

            CATEGORIES.forEach(cat => {
                const catFlours = filtered.filter(f => (f.category || "00") === cat.id);
                if (catFlours.length === 0) return;

                const itemsHtml = catFlours.map(f => {
                    const isChecked = checkedIds.includes(f.id);
                    const isSystemSelected = f.id === activeFlourId;
                    const isCustom = f.id.startsWith("custom_");

                    return `
                        <label class="flour-item-card ${isChecked ? 'item-checked' : ''} ${isSystemSelected ? 'item-active-match' : ''}">
                            <div class="flour-check-col">
                                <input type="checkbox" value="${f.id}" data-category="${cat.id}" ${isChecked ? 'checked' : ''} onchange="window.PizzaApp.state.store.toggleFlour('${f.id}')">
                            </div>
                            <div class="flour-info-col">
                                <div class="flour-name-row">
                                    <span class="flour-brand-name"><strong>${f.brand}</strong> - ${f.name}</span>
                                    ${isSystemSelected ? '<span class="active-badge">Active Match</span>' : ''}
                                    ${isCustom ? `<button type="button" class="btn-delete-flour" onclick="event.preventDefault(); window.PizzaApp.ui.inventoryModal.deleteFlour('${f.id}')" title="Delete custom flour">🗑️</button>` : ''}
                                </div>
                                <div class="flour-specs-text">
                                    Protein: <strong>${f.protein}%</strong> | Ash: ${f.ash}% 
                                    ${f.w > 0 ? `| W: <strong>${f.w}</strong>` : ''} 
                                    ${f.malted ? '<span class="malted-tag">Malted</span>' : '<span class="unmalted-tag">Unmalted</span>'}
                                </div>
                            </div>
                        </label>
                    `;
                }).join("");

                categoriesHtml += `
                    <div class="flour-category-group">
                        <div class="flour-category-header">
                            <div class="flour-category-title">${cat.title}</div>
                            <button type="button" class="toggle-cat-btn" onclick="window.PizzaApp.ui.inventoryModal.toggleCategory('${cat.id}')">Toggle All</button>
                        </div>
                        <div class="category-items-list">
                            ${itemsHtml}
                        </div>
                    </div>
                `;
            });

            container.innerHTML = `
                <div class="inventory-controls-bar">
                    <input type="text" id="flourSearchInput" class="flour-search-box" placeholder="🔍 Search flour or brand..." value="${this.searchTerm}">
                    <div class="inventory-quick-actions">
                        <button type="button" class="btn-text-action" id="btnSelectAllFlours">Select All</button>
                        <span class="action-divider">|</span>
                        <button type="button" class="btn-text-action" id="btnResetFlours">Defaults</button>
                        <span class="action-divider">|</span>
                        <button type="button" class="btn-text-action highlight-btn" id="btnOpenAddFlourModal">+ Add Flour</button>
                    </div>
                </div>
                <div class="flours-scroll-list">
                    ${categoriesHtml || '<div class="no-results-msg">No flours match your search.</div>'}
                </div>
            `;

            // Bind search listener
            const searchInput = document.getElementById("flourSearchInput");
            if (searchInput) {
                searchInput.addEventListener("input", (e) => {
                    this.searchTerm = e.target.value;
                    const flours = window.PizzaApp.data.flours.getAllFlours();
                    const state = window.PizzaApp.state.store.getState();
                    this.render(flours, state.flourInventory, activeFlourId);
                });
            }

            // Quick actions
            const btnAll = document.getElementById("btnSelectAllFlours");
            if (btnAll) {
                btnAll.addEventListener("click", () => {
                    const allIds = window.PizzaApp.data.flours.getAllFlours().map(f => f.id);
                    window.PizzaApp.state.store.setState({ flourInventory: allIds });
                });
            }

            const btnReset = document.getElementById("btnResetFlours");
            if (btnReset) {
                btnReset.addEventListener("click", () => {
                    window.PizzaApp.state.store.setState({ flourInventory: [...window.PizzaApp.data.flours.DEFAULT_CHECKED_IDS] });
                });
            }

            const btnAdd = document.getElementById("btnOpenAddFlourModal");
            if (btnAdd) {
                btnAdd.addEventListener("click", () => this.openModal());
            }
        },

        toggleCategory: function(catId) {
            const allFlours = window.PizzaApp.data.flours.getAllFlours();
            const catFlourIds = allFlours.filter(f => (f.category || "00") === catId).map(f => f.id);
            const store = window.PizzaApp.state.store;
            const currentInv = store.getState().flourInventory;

            const allCatChecked = catFlourIds.every(id => currentInv.includes(id));
            let newInv;

            if (allCatChecked) {
                // Uncheck all in this category
                newInv = currentInv.filter(id => !catFlourIds.includes(id));
                if (newInv.length === 0) {
                    newInv = [...window.PizzaApp.data.flours.DEFAULT_CHECKED_IDS];
                }
            } else {
                // Check all in this category
                newInv = Array.from(new Set([...currentInv, ...catFlourIds]));
            }

            store.setState({ flourInventory: newInv });
        },

        bindModalEvents: function() {
            const modal = document.getElementById(this.modalId);
            if (!modal) return;

            const closeBtn = modal.querySelector(".modal-close-btn");
            if (closeBtn) {
                closeBtn.addEventListener("click", () => this.closeModal());
            }

            const cancelBtn = modal.querySelector("#btnCancelAddFlour");
            if (cancelBtn) {
                cancelBtn.addEventListener("click", () => this.closeModal());
            }

            modal.addEventListener("click", (e) => {
                if (e.target === modal) this.closeModal();
            });

            const form = document.getElementById("addFlourForm");
            if (form) {
                form.addEventListener("submit", (e) => {
                    e.preventDefault();
                    this.handleCreateFlour(form);
                });
            }
        },

        openModal: function() {
            const modal = document.getElementById(this.modalId);
            if (modal) {
                modal.classList.add("modal-open");
                const firstInput = modal.querySelector("input");
                if (firstInput) firstInput.focus();
            }
        },

        closeModal: function() {
            const modal = document.getElementById(this.modalId);
            if (modal) {
                modal.classList.remove("modal-open");
                const form = document.getElementById("addFlourForm");
                if (form) form.reset();
            }
        },

        handleCreateFlour: function(form) {
            const brand = form.flourBrand.value.trim();
            const name = form.flourName.value.trim();
            const protein = parseFloat(form.flourProtein.value);
            const ash = parseFloat(form.flourAsh.value) || 0.50;
            const w = parseInt(form.flourW.value, 10) || 280;
            const malted = form.flourMalted.checked;
            const notes = form.flourNotes.value.trim();

            if (!brand || !name || isNaN(protein)) {
                alert("Please provide at least a brand, flour name, and protein percentage.");
                return;
            }

            const newFlour = window.PizzaApp.data.flours.addCustomFlour({
                brand,
                name,
                protein,
                ash,
                w,
                malted,
                notes
            });

            const store = window.PizzaApp.state.store;
            const currentInv = store.getState().flourInventory;
            store.setState({ flourInventory: [...currentInv, newFlour.id] });

            this.closeModal();
        },

        deleteFlour: function(id) {
            if (confirm("Are you sure you want to delete this custom flour?")) {
                window.PizzaApp.data.flours.removeCustomFlour(id);
                const store = window.PizzaApp.state.store;
                const currentInv = store.getState().flourInventory.filter(fId => fId !== id);
                store.setState({ flourInventory: currentInv.length > 0 ? currentInv : ["cm_00_tg"] });
            }
        }
    };

    window.PizzaApp.ui.inventoryModal = InventoryModal;

})(window);

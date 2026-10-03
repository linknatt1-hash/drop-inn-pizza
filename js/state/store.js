/**
 * TheDropInn Pizza Lab - Reactive State Store
 * Centralizes user input state, parameters, subscriptions, and localStorage persistence.
 */
(function(window) {
    'use strict';

    window.PizzaApp = window.PizzaApp || {};
    window.PizzaApp.state = window.PizzaApp.state || {};

    const STORAGE_KEY = "pizza_calculator_state_v3";

    const DEFAULT_STATE = {
        style: "neapolitan", // 'neapolitan' | 'tavern' | 'detroit' | 'ny' | 'focaccia'
        flourInventory: ["cm_00_tg", "cm_bread_org", "cm_ap_org"],
        ovenType: "pizza",
        maxTemp: "1000",
        stoneType: "thick_stone",
        yeastType: "ADY",
        altitude: "high",
        startDateOffset: 0,
        cookingDateOffset: 2,
        prefermentType: "none", // 'none' | 'poolish' | 'biga'
        prefermentPct: 20,      // 20 | 30 | 40 | 50
        detroitStartTime: 11,
        detroitBakeTime: 18,
        diameter: "12",
        ballCount: 3,
        activeTab: "formula",
        completedSteps: []
    };

    function loadSavedState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { ...DEFAULT_STATE };
            const parsed = JSON.parse(raw);
            return {
                ...DEFAULT_STATE,
                ...parsed,
                flourInventory: Array.isArray(parsed.flourInventory) && parsed.flourInventory.length > 0 
                    ? parsed.flourInventory 
                    : DEFAULT_STATE.flourInventory,
                completedSteps: Array.isArray(parsed.completedSteps) ? parsed.completedSteps : []
            };
        } catch (e) {
            console.warn("Failed to read state from localStorage", e);
            return { ...DEFAULT_STATE };
        }
    }

    function saveState(state) {
        try {
            const toSave = {
                style: state.style,
                flourInventory: state.flourInventory,
                ovenType: state.ovenType,
                maxTemp: state.maxTemp,
                stoneType: state.stoneType,
                yeastType: state.yeastType,
                altitude: state.altitude,
                startDateOffset: state.startDateOffset,
                cookingDateOffset: state.cookingDateOffset,
                prefermentType: state.prefermentType,
                prefermentPct: state.prefermentPct,
                diameter: state.diameter,
                ballCount: state.ballCount,
                detroitStartTime: state.detroitStartTime,
                detroitBakeTime: state.detroitBakeTime,
                completedSteps: state.completedSteps
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch (e) {
            console.warn("Failed to persist state", e);
        }
    }

    class Store {
        constructor() {
            this.state = loadSavedState();
            this.listeners = [];
        }

        getState() {
            return { ...this.state };
        }

        setState(updates, skipPersist = false) {
            this.state = { ...this.state, ...updates };
            if (!skipPersist) {
                saveState(this.state);
            }
            this.notify();
        }

        subscribe(listener) {
            this.listeners.push(listener);
            return () => {
                this.listeners = this.listeners.filter(l => l !== listener);
            };
        }

        notify() {
            const currentState = this.getState();
            this.listeners.forEach(listener => {
                try {
                    listener(currentState);
                } catch (e) {
                    console.error("Store listener error", e);
                }
            });
        }

        toggleFlour(flourId) {
            const inv = [...this.state.flourInventory];
            const idx = inv.indexOf(flourId);
            if (idx > -1) {
                if (inv.length > 1) {
                    inv.splice(idx, 1);
                }
            } else {
                inv.push(flourId);
            }
            this.setState({ flourInventory: inv });
        }

        toggleStep(stepId) {
            const steps = [...this.state.completedSteps];
            const idx = steps.indexOf(stepId);
            if (idx > -1) {
                steps.splice(idx, 1);
            } else {
                steps.push(stepId);
            }
            this.setState({ completedSteps: steps });
        }

        resetDefaults() {
            this.state = { ...DEFAULT_STATE };
            saveState(this.state);
            this.notify();
        }
    }

    window.PizzaApp.state.store = new Store();

})(window);

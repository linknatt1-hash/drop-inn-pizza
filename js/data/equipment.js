/**
 * TheDropInn Pizza Lab - Equipment & Thermal Mass Profiles
 */
(function(window) {
    'use strict';

    window.PizzaApp = window.PizzaApp || {};
    window.PizzaApp.data = window.PizzaApp.data || {};

    const EQUIPMENT = {
        ovens: [
            {
                id: "pizza",
                name: "High-Heat Pizza Oven (Gozney/Ooni, 900°F+)",
                category: "specialty",
                temps: [
                    { value: "1000", label: "1000°F+ (Live Flame)" }
                ],
                stones: [
                    { id: "thick_stone", name: "Thick Refractory / Biscotto Pizza Stone", conductivity: "moderate", recommended: true }
                ]
            },
            {
                id: "home",
                name: "Home Oven (Standard Bake)",
                category: "home",
                temps: [
                    { value: "550", label: "550°F (Max Standard)" },
                    { value: "525", label: "525°F" },
                    { value: "500", label: "500°F" },
                    { value: "475", label: "475°F" },
                    { value: "450", label: "450°F" }
                ],
                stones: [
                    { id: "steel_14", name: "1/4\" Baking Steel (High Heat Transfer)", conductivity: "ultra-high", recommended: true },
                    { id: "steel_18", name: "1/8\" Baking Steel (Fast Recovery)", conductivity: "high" },
                    { id: "standard_stone", name: "Standard Cordierite Pizza Stone", conductivity: "moderate" }
                ]
            },
            {
                id: "convection",
                name: "Home Oven (Convection/Fan)",
                category: "home",
                temps: [
                    { value: "550", label: "550°F Convection" },
                    { value: "525", label: "525°F Convection" },
                    { value: "500", label: "500°F Convection" },
                    { value: "475", label: "475°F Convection" },
                    { value: "450", label: "450°F Convection" }
                ],
                stones: [
                    { id: "steel_14", name: "1/4\" Baking Steel", conductivity: "ultra-high", recommended: true },
                    { id: "steel_18", name: "1/8\" Baking Steel", conductivity: "high" },
                    { id: "standard_stone", name: "Standard Pizza Stone", conductivity: "moderate" }
                ]
            }
        ],

        getAvailableOvensForStyle: function(style) {
            // Remove high-heat pizza oven if Detroit or Focaccia style is selected
            if (style === "detroit" || style === "focaccia") {
                return this.ovens.filter(o => o.id !== "pizza");
            }
            return this.ovens;
        },

        getOvenById: function(ovenId) {
            return this.ovens.find(o => o.id === ovenId) || this.ovens[0];
        }
    };

    window.PizzaApp.data.equipment = EQUIPMENT;

})(window);

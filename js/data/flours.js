/**
 * TheDropInn Pizza Lab - Flour Database
 * Contains built-in flours categorized into 00, Bread, and AP flours,
 * with W-values, protein %, ash %, and style-specific suitability scores.
 */
(function(window) {
    'use strict';

    window.PizzaApp = window.PizzaApp || {};
    window.PizzaApp.data = window.PizzaApp.data || {};

    const BUILTIN_FLOURS = [
        // 00 Flours
        { 
            id: "cm_00_norm", 
            category: "00", 
            brand: "Central Milling", 
            name: "Organic Type 00 Normal Flour", 
            protein: 11.5, 
            ash: 0.55, 
            w: 290, 
            neo_score: 9, 
            tav_score: 4, 
            det_score: 6, 
            ny_score: 5, 
            foc_score: 5, 
            notes: "Variety: Organic Hard Red Winter Wheat. Treatment: None." 
        },
        { 
            id: "cm_00_tg", 
            category: "00", 
            brand: "Central Milling", 
            name: "Tony Gemignani 'California Artisan' 00", 
            protein: 15.0, 
            ash: 0.55, 
            w: 395, 
            neo_score: 10, 
            tav_score: 3, 
            det_score: 7, 
            ny_score: 6, 
            foc_score: 6, 
            notes: "High protein backbone. Treatment: Ascorbic Acid, Vital Wheat Gluten, Malted." 
        },
        { 
            id: "cap_00_piz", 
            category: "00", 
            brand: "Antimo Caputo", 
            name: "Pizzeria 00 (Blue Bag)", 
            protein: 12.5, 
            ash: 0.50, 
            w: 260, 
            neo_score: 8, 
            tav_score: 2, 
            det_score: 5, 
            ny_score: 4, 
            foc_score: 4, 
            notes: "The gold standard for wood-fired Neapolitan. High elasticity." 
        },
        { 
            id: "cap_00_chf", 
            category: "00", 
            brand: "Antimo Caputo", 
            name: "Chef/Cuoco 00 (Red Bag)", 
            protein: 13.0, 
            ash: 0.50, 
            w: 320, 
            neo_score: 7, 
            tav_score: 3, 
            det_score: 6, 
            ny_score: 5, 
            foc_score: 5, 
            notes: "Stronger gluten matrix, perfect for longer slow ferments." 
        },
        { 
            id: "ka_00", 
            category: "00", 
            brand: "King Arthur", 
            name: "00 Pizza Flour", 
            protein: 11.5, 
            ash: 0.50, 
            w: 260, 
            neo_score: 6, 
            tav_score: 4, 
            det_score: 6, 
            ny_score: 5, 
            foc_score: 5, 
            notes: "Domestic 00, optimized for high heat ovens." 
        },
        
        // Bread Flours
        { 
            id: "cm_bread_org", 
            category: "bread", 
            brand: "Central Milling", 
            name: "Organic Bread Flour", 
            protein: 11.5, 
            ash: 0.60, 
            w: 300, 
            neo_score: 6, 
            tav_score: 6, 
            det_score: 10, 
            ny_score: 10, 
            foc_score: 10, 
            notes: "Varieties: Organic Hard Red Winter & Hard Red Spring Wheat. Malted." 
        },
        { 
            id: "cm_bread_ow", 
            category: "bread", 
            brand: "Central Milling", 
            name: "Old-World Bread Flour (T80)", 
            protein: 12.5, 
            ash: 0.80, 
            w: 320, 
            neo_score: 5, 
            tav_score: 4, 
            det_score: 9, 
            ny_score: 9, 
            foc_score: 9, 
            notes: "Variety: Organic Hard Red Spring Wheat. High ash profile. Auto-blends 20% in NY style!" 
        },
        { 
            id: "ka_bread", 
            category: "bread", 
            brand: "King Arthur", 
            name: "Bread Flour", 
            protein: 12.7, 
            ash: 0.50, 
            w: 330, 
            neo_score: 7, 
            tav_score: 5, 
            det_score: 8, 
            ny_score: 8, 
            foc_score: 8, 
            notes: "Excellent unbleached spring wheat structural flour." 
        },
        { 
            id: "brm_bread", 
            category: "bread", 
            brand: "Bob's Red Mill", 
            name: "Artisan Bread Flour", 
            protein: 12.5, 
            ash: 0.52, 
            w: 320, 
            neo_score: 7, 
            tav_score: 5, 
            det_score: 7, 
            ny_score: 7, 
            foc_score: 7, 
            notes: "Malted barley flour enhanced structural matrix." 
        },
        
        // AP Flours
        { 
            id: "cm_ap_org", 
            category: "ap", 
            brand: "Central Milling", 
            name: "Organic AP", 
            protein: 10.5, 
            ash: 0.55, 
            w: 220, 
            neo_score: 4, 
            tav_score: 10, 
            det_score: 5, 
            ny_score: 5, 
            foc_score: 5, 
            notes: "Treatment: Malted with Organic Malted Barley Flour." 
        },
        { 
            id: "ka_ap", 
            category: "ap", 
            brand: "King Arthur", 
            name: "All-Purpose Flour", 
            protein: 11.7, 
            ash: 0.48, 
            w: 250, 
            neo_score: 5, 
            tav_score: 8, 
            det_score: 6, 
            ny_score: 6, 
            foc_score: 6, 
            notes: "Consistent unbleached hard red winter wheat profile." 
        }, 
        { 
            id: "brm_ap", 
            category: "ap", 
            brand: "Bob's Red Mill", 
            name: "All-Purpose Flour", 
            protein: 11.8, 
            ash: 0.50, 
            w: 250, 
            neo_score: 6, 
            tav_score: 7, 
            det_score: 6, 
            ny_score: 6, 
            foc_score: 6, 
            notes: "Unbleached premium baking flour baseline." 
        },
        { 
            id: "ks_ap", 
            category: "ap", 
            brand: "Kirkland Signature", 
            name: "Organic AP Flour", 
            protein: 11.5, 
            ash: 0.50, 
            w: 240, 
            neo_score: 5, 
            tav_score: 9, 
            det_score: 5, 
            ny_score: 5, 
            foc_score: 5, 
            notes: "Reliable bulk AP flour, great for tender tavern crusts." 
        }
    ];

    const DEFAULT_CHECKED_IDS = ["cm_00_tg", "cm_bread_org", "cm_ap_org"];
    const CUSTOM_FLOURS_STORAGE_KEY = "pizza_calc_custom_flours_v2";

    function getCustomFlours() {
        try {
            const raw = localStorage.getItem(CUSTOM_FLOURS_STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.warn("Could not read custom flours from localStorage", e);
            return [];
        }
    }

    function saveCustomFlours(flours) {
        try {
            localStorage.setItem(CUSTOM_FLOURS_STORAGE_KEY, JSON.stringify(flours));
        } catch (e) {
            console.warn("Could not save custom flours to localStorage", e);
        }
    }

    function getAllFlours() {
        return [...BUILTIN_FLOURS, ...getCustomFlours()];
    }

    function addCustomFlour(flour) {
        const custom = getCustomFlours();
        const id = 'custom_' + Date.now();
        const protein = parseFloat(flour.protein) || 12.0;
        const w = parseInt(flour.w, 10) || 270;
        const newFlour = {
            id,
            category: flour.category || (protein >= 13 ? "bread" : (protein >= 12 ? "00" : "ap")),
            brand: flour.brand || "Custom",
            name: flour.name || "Custom Flour",
            protein: protein,
            ash: parseFloat(flour.ash) || 0.50,
            w: w,
            malted: !!flour.malted,
            neo_score: w >= 280 ? 8 : 5,
            tav_score: protein <= 11.8 ? 9 : 5,
            det_score: protein >= 12.5 ? 9 : 6,
            ny_score: protein >= 12.5 ? 9 : 6,
            foc_score: protein >= 12.5 ? 9 : 6,
            notes: flour.notes || "User custom flour entry."
        };
        custom.push(newFlour);
        saveCustomFlours(custom);
        return newFlour;
    }

    function removeCustomFlour(id) {
        const custom = getCustomFlours().filter(f => f.id !== id);
        saveCustomFlours(custom);
    }

    window.PizzaApp.data.flours = {
        BUILTIN_FLOURS,
        DEFAULT_CHECKED_IDS,
        getAllFlours,
        addCustomFlour,
        removeCustomFlour
    };

})(window);

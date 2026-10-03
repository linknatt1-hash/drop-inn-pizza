/**
 * TheDropInn Pizza Lab - Flour Matching Engine
 * Selects the optimal flour for any of the 5 styles based on W-values,
 * protein capacity, and style suitability scores.
 */
(function(window) {
    'use strict';

    window.PizzaApp = window.PizzaApp || {};
    window.PizzaApp.engine = window.PizzaApp.engine || {};

    const FlourMatcher = {
        getStyleScore: function(flour, style) {
            let scoreKey;
            if (style === "neapolitan") scoreKey = "neo_score";
            else if (style === "tavern") scoreKey = "tav_score";
            else if (style === "detroit") scoreKey = "det_score";
            else if (style === "ny") scoreKey = "ny_score";
            else if (style === "focaccia") scoreKey = "foc_score";
            else scoreKey = `${style}_score`;

            if (typeof flour[scoreKey] === 'number') {
                return flour[scoreKey];
            }
            if (flour.scores && typeof flour.scores[style] === 'number') {
                return flour.scores[style];
            }
            return 5;
        },

        findBestMatch: function(checkedIds, allFlours, style) {
            if (!checkedIds || checkedIds.length === 0) {
                return {
                    success: false,
                    error: "Please check at least one flour in your inventory setup to process."
                };
            }

            const candidateFlours = allFlours.filter(f => checkedIds.includes(f.id));
            if (candidateFlours.length === 0) {
                return {
                    success: false,
                    error: "None of the selected flour IDs match available database flours."
                };
            }

            let bestFlour = null;
            let highestScore = -Infinity;

            candidateFlours.forEach(flour => {
                const score = this.getStyleScore(flour, style);
                if (score > highestScore) {
                    highestScore = score;
                    bestFlour = flour;
                }
            });

            return {
                success: true,
                flour: bestFlour,
                score: highestScore
            };
        }
    };

    window.PizzaApp.engine.flourMatcher = FlourMatcher;

})(window);

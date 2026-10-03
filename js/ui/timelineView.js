/**
 * Intelligent Pizza Dough Calculator - Timeline View Component
 * Renders the calendar-synced execution schedule with interactive step completion checkboxes,
 * phase timeline indicators, and progress tracking.
 */
(function(window) {
    'use strict';

    window.PizzaApp = window.PizzaApp || {};
    window.PizzaApp.ui = window.PizzaApp.ui || {};

    const TimelineView = {
        render: function(timelineData, completedSteps, containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            if (!timelineData || timelineData.length === 0) {
                container.innerHTML = `<div class="p-4 text-muted">Complete calculation parameters to view workflow execution timeline.</div>`;
                return;
            }

            // Calculate total steps and completed count
            let totalSteps = 0;
            let finishedCount = 0;

            timelineData.forEach(day => {
                day.steps.forEach(step => {
                    totalSteps++;
                    if (completedSteps && completedSteps.includes(step.stepId)) {
                        finishedCount++;
                    }
                });
            });

            const percentComplete = totalSteps > 0 ? Math.round((finishedCount / totalSteps) * 100) : 0;

            const progressHtml = `
                <div class="timeline-progress-bar-card">
                    <div class="timeline-progress-meta">
                        <span class="timeline-progress-label">Fermentation & Bake Progress</span>
                        <span class="timeline-progress-counter">${finishedCount} of ${totalSteps} steps completed (${percentComplete}%)</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${percentComplete}%;"></div>
                    </div>
                </div>
            `;

            const daysHtml = timelineData.map(dayGroup => {
                const stepsHtml = dayGroup.steps.map(step => {
                    const isDone = completedSteps && completedSteps.includes(step.stepId);
                    return `
                        <div class="timeline-step-card ${isDone ? 'step-completed' : ''}" data-step-id="${step.stepId}">
                            <div class="step-checkbox-wrap">
                                <input type="checkbox" id="${step.stepId}" class="step-checkbox" ${isDone ? 'checked' : ''} onchange="window.PizzaApp.state.store.toggleStep('${step.stepId}')">
                            </div>
                            <div class="step-content">
                                <div class="step-meta-row">
                                    <span class="step-phase-tag">${step.phase}</span>
                                    <span class="step-time-badge">⏰ ${step.time}</span>
                                </div>
                                <h4 class="step-title">${step.title}</h4>
                                <p class="step-text">${step.description}</p>
                            </div>
                        </div>
                    `;
                }).join("");

                return `
                    <div class="day-timeline-group">
                        <div class="day-timeline-header">
                            <span class="day-icon">🗓️</span>
                            <span class="day-title-text">${dayGroup.dayLabel}</span>
                        </div>
                        <div class="day-steps-list">
                            ${stepsHtml}
                        </div>
                    </div>
                `;
            }).join("");

            container.innerHTML = `
                <div class="timeline-wrapper">
                    ${progressHtml}
                    <div class="timeline-steps-container">
                        ${daysHtml}
                    </div>
                </div>
            `;
        }
    };

    window.PizzaApp.ui.timelineView = TimelineView;

})(window);

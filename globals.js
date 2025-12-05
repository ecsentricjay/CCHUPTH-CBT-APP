// globals.js - Global variables and functions

// Global variables
window.liveMonitoringInterval = null;
window.allResults = [];
window.allStudents = [];
window.allQuestions = [];
window.currentExaminer = null;
window.currentFilters = {};
window.currentQuestionFilters = {};

// Global utility functions
window.showAlert = function(elementId, message, type = 'error') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="alert alert-${type}">
                ${message}
            </div>
        `;
        setTimeout(() => {
            element.innerHTML = '';
        }, 5000);
    }
};

// Add this to your index.html after config.js
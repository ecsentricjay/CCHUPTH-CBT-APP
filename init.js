// init.js - Initialize the application (UPDATED)

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Main initialization function
function initializeApp() {
    // Add enhanced styles first
    if (typeof Components.addEnhancedStyles === 'function') {
        Components.addEnhancedStyles();
    }
    
    // Render all components
    renderComponents();
    
    // Set up navigation
    setupNavigation();
    
    // Check if user is already logged in
    checkAuthStatus();
    
    // Bind button handlers after a short delay
    setTimeout(bindButtonHandlers, 500);
}

// Render all HTML components
function renderComponents() {
    // Render sidebar
    const sidebarContainer = document.getElementById('sidebarComponent');
    if (sidebarContainer) {
        sidebarContainer.innerHTML = Components.sidebar();
    }
    
    // Render header
    const headerContainer = document.getElementById('headerComponent');
    if (headerContainer) {
        headerContainer.innerHTML = Components.header();
    }
    
    // Render dashboard section
    const dashboardContainer = document.getElementById('dashboardSection');
    if (dashboardContainer) {
        dashboardContainer.innerHTML = Components.dashboardSection();
    }
    
    // Render students section
    const studentsContainer = document.getElementById('studentsSection');
    if (studentsContainer) {
        studentsContainer.innerHTML = Components.studentsSection();
    }
    
    // Render courses section
    const coursesContainer = document.getElementById('coursesSection');
    if (coursesContainer) {
        coursesContainer.innerHTML = Components.coursesSection();
    }
    
     // Render questions section
    const questionsContainer = document.getElementById('questionsSection');
    if (questionsContainer) {
        questionsContainer.innerHTML = Components.questionsSection();
    }
    
    // ADD THIS: Render subjective questions section
    const subjectiveQuestionsContainer = document.getElementById('subjectiveQuestionsSection');
    if (subjectiveQuestionsContainer) {
        subjectiveQuestionsContainer.innerHTML = Components.subjectiveQuestionsSection();
    }
    
    // Render results section
    const resultsContainer = document.getElementById('resultsSection');
    if (resultsContainer) {
        resultsContainer.innerHTML = Components.resultsSection();
    }

    // Render footer
    const footerContainer = document.getElementById('footerComponent');
    if (footerContainer) {
        footerContainer.innerHTML = Components.footer();
    }
    
    // Render all modals
    const modalsContainer = document.getElementById('modalsContainer');
    if (modalsContainer) {
        modalsContainer.innerHTML = Components.modals();
    }
}

// Set up navigation between sections
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            navigateToSection(section);
        });
    });
}

// init.js - Update navigateToSection function

// Navigate to a specific section
function navigateToSection(sectionName) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked nav item
    const clickedItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (clickedItem) {
        clickedItem.classList.add('active');
    }
    
    // Hide all content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update page title
    const pageTitles = {
        dashboard: 'Dashboard',
        students: 'Student Management',
        courses: 'Course Management',
        questions: 'Question Bank',
        subjectiveQuestions: 'Subjective Questions',  // ADD THIS
        results: 'Results & Analytics'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = pageTitles[sectionName] || 'Dashboard';
    }
    
    // Load data for the section
    loadSectionData(sectionName);
}

// Update loadSectionData function in init.js
function loadSectionData(section) {
    // Wait a bit for DOM elements to be fully rendered
    setTimeout(() => {
        switch(section) {
            case 'dashboard':
                if (typeof loadDashboardStats === 'function') {
                    loadDashboardStats();
                }
                if (typeof loadDashboardData === 'function') {
                    loadDashboardData();
                }
                break;
            case 'students':
                if (typeof loadStudents === 'function') {
                    loadStudents();
                }
                break;
            case 'courses':
                if (typeof loadCourses === 'function') {
                    loadCourses();
                }
                break;
            case 'questions':
                if (typeof loadQuestions === 'function') {
                    loadQuestions();
                }
                if (typeof loadQuestionFilterOptions === 'function') {
                    loadQuestionFilterOptions();
                }
                break;
            case 'subjectiveQuestions':
                if (typeof loadSubjectiveQuestions === 'function') {
                    loadSubjectiveQuestions();
                }
                if (typeof loadSubjectiveFilterOptions === 'function') {
                    loadSubjectiveFilterOptions();
                }
                break;
            case 'results':
                if (typeof loadResults === 'function') {
                    loadResults();
                }
                break;
        }
    }, 200); // 200ms delay to ensure DOM is ready
}

// Check authentication status on page load
function checkAuthStatus() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    
    if (isLoggedIn === 'true') {
        // User is logged in, show dashboard
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainDashboard').classList.remove('hidden');
        
        // Load initial data
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
    } else {
        // User is not logged in, show login screen
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainDashboard').classList.add('hidden');
    }
}

// Bind button handlers manually
function bindButtonHandlers() {
    console.log('Binding button handlers...');
    
    // Add Student buttons
    const addStudentBtns = document.querySelectorAll('button[onclick*="openAddStudentModal"], .btn-primary:contains("Add Student")');
    addStudentBtns.forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Add student button clicked');
            openAddStudentModal();
        };
    });
    
    // Bulk Upload Students buttons
    const bulkUploadBtns = document.querySelectorAll('button[onclick*="openBulkUploadStudentsModal"], .btn-secondary:contains("Bulk Upload")');
    bulkUploadBtns.forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Bulk upload button clicked');
            openBulkUploadStudentsModal();
        };
    });
    
    // Add Course buttons
    const addCourseBtns = document.querySelectorAll('button[onclick*="openAddCourseModal"]');
    addCourseBtns.forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            openAddCourseModal();
        };
    });
    
    // Add Question buttons
    const addQuestionBtns = document.querySelectorAll('button[onclick*="openAddQuestionModal"]');
    addQuestionBtns.forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            openAddQuestionModal();
        };
    });
    
    // Bulk Upload Questions buttons
    const bulkQuestionBtns = document.querySelectorAll('button[onclick*="openBulkUploadQuestionsModal"]');
    bulkQuestionBtns.forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            openBulkUploadQuestionsModal();
        };
    });
    
    // Live Monitoring buttons
    const liveMonitoringBtns = document.querySelectorAll('button[onclick*="startLiveMonitoring"]');
    liveMonitoringBtns.forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            startLiveMonitoring();
        };
    });
    
    // Close buttons in modals
    const closeBtns = document.querySelectorAll('.close-btn');
    closeBtns.forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        };
    });
    
    console.log('Button handlers bound successfully');
}

// Export functions to global scope
window.initializeApp = initializeApp;
window.navigateToSection = navigateToSection;
window.bindButtonHandlers = bindButtonHandlers;
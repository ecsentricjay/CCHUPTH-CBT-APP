// dashboard.js - Updated version

// Use global liveMonitoringInterval instead of declaring our own
if (typeof window.liveMonitoringInterval === 'undefined') {
    window.liveMonitoringInterval = null;
}

// Check authentication status
async function checkAuth() {
    const isLoggedIn = localStorage.getItem('cbt_admin_logged_in') === 'true' || 
                      sessionStorage.getItem('adminLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        window.location.href = '#login';
        showLoginScreen(true);
        return false;
    }
    return true;
}

// Load all dashboard statistics
async function loadDashboardData() {
    if (!await checkAuth()) return;
    
    try {
        await Promise.all([
            updateStudentCount(),
            updateCourseCount(),
            updateQuestionCount(),
            updateExamCount()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('dashboardAlert', 'Failed to load dashboard data', 'error');
    }
}

// Update student count
async function updateStudentCount() {
    try {
        const { count, error } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        
        const countElement = document.getElementById('totalStudents');
        if (countElement) {
            countElement.textContent = count || 0;
        }
    } catch (error) {
        console.error('Error getting student count:', error);
        const countElement = document.getElementById('totalStudents');
        if (countElement) countElement.textContent = '0';
    }
}

// Update course count
async function updateCourseCount() {
    try {
        const { count, error } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        
        const countElement = document.getElementById('totalCourses');
        if (countElement) {
            countElement.textContent = count || 0;
        }
    } catch (error) {
        console.error('Error getting course count:', error);
        const countElement = document.getElementById('totalCourses');
        if (countElement) countElement.textContent = '0';
    }
}

// Update question count (now shows both objective and subjective)
async function updateQuestionCount() {
    try {
        // Get objective questions count
        const { count: objectiveCount, error: objectiveError } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true });
        
        if (objectiveError) {
            console.error('Error getting objective questions count:', objectiveError);
        }
        
        // Get subjective questions count
        const { count: subjectiveCount, error: subjectiveError } = await supabase
            .from('subjective_questions')
            .select('*', { count: 'exact', head: true });
        
        if (subjectiveError) {
            console.error('Error getting subjective questions count:', subjectiveError);
        }
        
        const totalQuestions = (objectiveCount || 0) + (subjectiveCount || 0);
        
        const countElement = document.getElementById('totalQuestions');
        if (countElement) {
            countElement.textContent = totalQuestions.toString();
            countElement.title = `Objective: ${objectiveCount || 0} | Subjective: ${subjectiveCount || 0}`;
            countElement.style.cursor = 'help';
        }
        
    } catch (error) {
        console.error('Error getting question count:', error);
        const countElement = document.getElementById('totalQuestions');
        if (countElement) countElement.textContent = '0';
    }
}

// Update exam count (completed exams)
async function updateExamCount() {
    try {
        const { count, error } = await supabase
            .from('exam_results')
            .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        
        const countElement = document.getElementById('totalExams');
        if (countElement) {
            countElement.textContent = count || 0;
        }
    } catch (error) {
        console.error('Error getting exam count:', error);
        const countElement = document.getElementById('totalExams');
        if (countElement) countElement.textContent = '0';
    }
}

// dashboard.js - Fix the loadFilterOptions function

// Load course options for filters
async function loadFilterOptions() {
    try {
        const { data: courses, error } = await supabase
            .from('courses')
            .select('id, course_code, course_title')  // FIXED: Changed from 'code, title'
            .order('course_code');  // FIXED: Changed from 'code'
        
        if (error) throw error;
        
        // Update course filter in results section
        const filterCourse = document.getElementById('filterCourse');
        if (filterCourse) {
            filterCourse.innerHTML = '<option value="">All Courses</option>' + 
                courses.map(course => `<option value="${course.id}">${course.course_code} - ${course.course_title}</option>`).join('');
        }
        
        // Update course dropdown in add question modal
        const questionCourse = document.getElementById('questionCourse');
        if (questionCourse) {
            questionCourse.innerHTML = '<option value="">-- Select Course --</option>' + 
                courses.map(course => `<option value="${course.id}">${course.course_code} - ${course.course_title}</option>`).join('');
        }
        
        // Update course dropdown in bulk upload questions modal
        const bulkQuestionCourse = document.getElementById('bulkQuestionCourse');
        if (bulkQuestionCourse) {
            bulkQuestionCourse.innerHTML = '<option value="">-- Select Course --</option>' + 
                courses.map(course => `<option value="${course.id}">${course.course_code} - ${course.course_title}</option>`).join('');
        }
        
        // Update question filter course dropdown
        const filterQuestionCourse = document.getElementById('filterQuestionCourse');
        if (filterQuestionCourse) {
            filterQuestionCourse.innerHTML = '<option value="">All Courses</option>' + 
                courses.map(course => `<option value="${course.id}">${course.course_code} - ${course.course_title}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

// Navigation setup
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all nav items
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all content sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show the selected section
            const sectionId = this.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.add('active');
                
                // Update page title
                const titles = {
                    'dashboard': 'Dashboard',
                    'students': 'Student Management',
                    'courses': 'Course Management',
                    'questions': 'Question Bank',
                    'results': 'Results & Analytics'
                };
                
                const pageTitle = document.getElementById('pageTitle');
                if (pageTitle && titles[sectionId]) {
                    pageTitle.textContent = titles[sectionId];
                }
                
                // Load data for the section
                switch(sectionId) {
                    case 'dashboard':
                        loadDashboardData();
                        break;
                    case 'students':
                        if (typeof loadStudents === 'function') loadStudents();
                        break;
                    case 'courses':
                        if (typeof loadCourses === 'function') loadCourses();
                        break;
                    case 'questions':
                        if (typeof loadQuestions === 'function') loadQuestions();
                        if (typeof loadQuestionFilterOptions === 'function') loadQuestionFilterOptions();
                        break;
                    case 'results':
                        if (typeof loadResults === 'function') loadResults();
                        break;
                }
            }
        });
    });
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Setup navigation
    setupNavigation();
    
    // Check authentication and load dashboard if logged in
    const isLoggedIn = localStorage.getItem('cbt_admin_logged_in') === 'true' || 
                      sessionStorage.getItem('adminLoggedIn') === 'true';
    
    if (isLoggedIn) {
        loadDashboardData();
        loadFilterOptions();
    }
    
    // Setup quick action buttons
    setupQuickActions();
});

// Setup quick action buttons
function setupQuickActions() {
    // These are now handled by bindButtonHandlers in init.js
    // Keeping this function for backward compatibility
}

// Show/Hide login screen
function showLoginScreen(show) {
    const loginScreen = document.getElementById('loginScreen');
    const mainDashboard = document.getElementById('mainDashboard');
    
    if (show) {
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainDashboard) mainDashboard.classList.add('hidden');
    } else {
        if (loginScreen) loginScreen.style.display = 'none';
        if (mainDashboard) mainDashboard.classList.remove('hidden');
        loadDashboardData();
    }
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        // Load necessary data for the modal
        if (modalId === 'addQuestionModal' || modalId === 'bulkUploadQuestionsModal') {
            loadFilterOptions(); // Ensure course options are loaded
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        // Clear any forms in the modal
        const form = modal.querySelector('form');
        if (form) form.reset();
        // Clear any alerts in the modal
        const alertId = modalId.replace('Modal', 'Alert');
        const alertDiv = document.getElementById(alertId);
        if (alertDiv) alertDiv.innerHTML = '';
    }
}

// Export functions for use in other modules
window.dashboard = {
    loadDashboardData,
    updateStudentCount,
    updateCourseCount,
    updateQuestionCount,
    updateExamCount,
    loadFilterOptions,
    showLoginScreen,
    openModal,
    closeModal
};

// Also export to window for direct access
window.loadDashboardData = loadDashboardData;
window.loadFilterOptions = loadFilterOptions;
// Add these lines at the VERY END of dashboard.js:
if (typeof startLiveMonitoring !== 'undefined') {
    window.startLiveMonitoring = startLiveMonitoring;
}
if (typeof stopLiveMonitoring !== 'undefined') {
    window.stopLiveMonitoring = stopLiveMonitoring;
}
console.log("Dashboard functions exported to window");
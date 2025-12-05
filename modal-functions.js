// modal-functions.js - All modal-related functions

// Modal management functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        
        // Load necessary data for specific modals
        if (modalId === 'addQuestionModal' || modalId === 'bulkUploadQuestionsModal') {
            loadFilterOptions(); // Ensure course options are loaded
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        
        // Clear any forms in the modal
        const form = modal.querySelector('form');
        if (form) form.reset();
        
        // Clear any alerts in the modal
        const alertId = modalId.replace('Modal', 'Alert');
        const alertDiv = document.getElementById(alertId);
        if (alertDiv) alertDiv.innerHTML = '';
        
        // Reset any edit states
        if (modalId === 'addStudentModal') {
            modal.removeAttribute('data-edit-id');
            const submitBtn = modal.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Add Student';
        }
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target.id);
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            closeModal(activeModal.id);
        }
    }
});

// Specific modal openers
function openAddStudentModal() {
    console.log('Opening add student modal');
    openModal('addStudentModal');
}

function openAddCourseModal() {
    openModal('addCourseModal');
}

function openAddQuestionModal() {
    openModal('addQuestionModal');
}

function openBulkUploadStudentsModal() {
    console.log('Opening bulk upload students modal');
    openModal('bulkUploadStudentsModal');
}

function openBulkUploadQuestionsModal() {
    openModal('bulkUploadQuestionsModal');
}

function openCourseSettingsModal(courseId, course) {
    // Populate the form with course data
    document.getElementById('settingsCourseId').value = courseId;
    document.getElementById('settingsCourseCode').value = course.course_code;
    document.getElementById('settingsCourseTitle').value = course.course_title;
    document.getElementById('settingsDuration').value = course.duration_minutes;
    document.getElementById('settingsMaxAttempts').value = course.max_attempts || 3;
    document.getElementById('settingsShowPassMark').checked = course.show_pass_mark !== false;
    document.getElementById('settingsShowImmediateResult').checked = course.show_immediate_result !== false;
    
    openModal('courseSettingsModal');
}


// Export all functions to global scope
window.openModal = openModal;
window.closeModal = closeModal;
window.openAddStudentModal = openAddStudentModal;
window.openAddCourseModal = openAddCourseModal;
window.openAddQuestionModal = openAddQuestionModal;
window.openBulkUploadStudentsModal = openBulkUploadStudentsModal;
window.openBulkUploadQuestionsModal = openBulkUploadQuestionsModal;
window.openCourseSettingsModal = openCourseSettingsModal
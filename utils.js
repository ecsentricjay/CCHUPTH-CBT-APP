// utils.js

// Show alert message
function showAlert(elementId, message, type = 'info') {
    const alertDiv = document.getElementById(elementId);
    if (!alertDiv) return;
    
    const colors = {
        success: '#d4edda',
        error: '#f8d7da', 
        warning: '#fff3cd',
        info: '#d1ecf1'
    };
    
    const textColors = {
        success: '#155724',
        error: '#721c24',
        warning: '#856404',
        info: '#0c5460'
    };
    
    alertDiv.innerHTML = `
        <div style="
            padding: 1rem;
            margin-bottom: 1rem;
            border-radius: 8px;
            background: ${colors[type] || colors.info};
            color: ${textColors[type] || textColors.info};
            border: 1px solid ${colors[type] || colors.info};
        ">
            <strong>${type.toUpperCase()}:</strong> ${message}
        </div>
    `;
    
    // Auto-remove alert after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            alertDiv.innerHTML = '';
        }, 5000);
    }
}

window.showAlert = showAlert;

// Close modals when clicking outside
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Format time
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Calculate percentage
function calculatePercentage(correct, total) {
    if (total === 0) return 0;
    return ((correct / total) * 100).toFixed(1);
}

// Generate random ID
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Validate email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Sanitize input
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Export results to CSV
async function exportResultsToCSV() {
    try {
        const { data, error } = await supabase
            .from('exam_results')
            .select(`
                *,
                students (matric_number, full_name, department),
                courses (course_code, course_title)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Create CSV content
        let csv = 'Matric Number,Student Name,Department,Course Code,Course Title,Score (%),Correct Answers,Total Questions,Date\n';
        
        data.forEach(result => {
            const date = new Date(result.created_at).toLocaleDateString('en-GB');
            csv += `${result.students.matric_number},${result.students.full_name},${result.students.department},${result.courses.course_code},${result.courses.course_title},${result.score.toFixed(1)},${result.correct_answers},${result.total_questions},${date}\n`;
        });
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exam_results_' + new Date().toISOString().split('T')[0] + '.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting results:', error);
        alert('Error exporting results');
    }
}

// Print result
function printResult(resultId) {
    window.print();
}
// students_enhanced.js - Enhanced version with delete all and filter features

let allStudents = [];
let currentFilters = {};

// Load all students with optional filters
async function loadStudents(filters = {}) {
    try {
        currentFilters = filters;
        
        let query = supabase
            .from('students')
            .select('*');
        
        // Apply filters if specified
        if (filters.level) {
            query = query.eq('level', filters.level);
        }
        
        if (filters.department) {
            query = query.eq('department', filters.department);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allStudents = data;
        
        const tbody = document.getElementById('studentsTable');
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No students found</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(student => `
            <tr>
                <td>${student.matric_number}</td>
                <td>${student.full_name}</td>
                <td>${student.email}</td>
                <td>${student.department}</td>
                <td>${student.level || 'N/A'}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-sm btn-view" onclick="viewStudentAttempts('${student.id}')">View Attempts</button>
                        <button class="btn btn-sm btn-edit" onclick="editStudent('${student.id}')">Edit</button>
                        <button class="btn btn-sm btn-delete" onclick="deleteStudent('${student.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Update filter options
        updateFilterOptions(data);
        
        // Update filtered students count
        document.getElementById('filteredStudentsCount').textContent = data.length;
    } catch (error) {
        console.error('Error loading students:', error);
        const tbody = document.getElementById('studentsTable');
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #f44336;">Error loading students</td></tr>';
    }
}

// Update filter dropdowns with unique values
function updateFilterOptions(students) {
    // Get unique departments
    const departments = [...new Set(students.map(s => s.department).filter(Boolean))];
    const levels = [...new Set(students.map(s => s.level).filter(Boolean))];
    
    // Update department filter
    const deptFilter = document.getElementById('filterDepartment');
    if (deptFilter) {
        deptFilter.innerHTML = '<option value="">All Departments</option>' + 
            departments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
    }
    
    // Update level filter
    const levelFilter = document.getElementById('filterLevel');
    if (levelFilter) {
        levelFilter.innerHTML = '<option value="">All Levels</option>' + 
            levels.map(level => `<option value="${level}">${level}</option>`).join('');
    }
}

// Apply student filters
function applyStudentFilters() {
    const department = document.getElementById('filterDepartment').value;
    const level = document.getElementById('filterLevel').value;
    
    const filters = {};
    if (department) filters.department = department;
    if (level) filters.level = level;
    
    loadStudents(filters);
}

// Clear student filters
function clearStudentFilters() {
    document.getElementById('filterDepartment').value = '';
    document.getElementById('filterLevel').value = '';
    loadStudents();
}

// Delete a single student
async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student?\n\nThis will also delete all their exam records!')) {
        return;
    }
    
    try {
        // Get student info for confirmation
        const { data: student, error: fetchError } = await supabase
            .from('students')
            .select('matric_number, full_name')
            .eq('id', id)
            .single();
        
        if (fetchError) throw fetchError;
        
        const finalConfirmation = confirm(`Delete student:\n${student.matric_number} - ${student.full_name}\n\nThis action cannot be undone!`);
        
        if (!finalConfirmation) {
            return;
        }
        
        // Delete the student
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        alert('Student deleted successfully!');
        
        // Reload students
        loadStudents(currentFilters);
        
        // Update dashboard
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
        
    } catch (error) {
        console.error('Error deleting student:', error);
        alert('Error deleting student: ' + error.message);
    }
}

// Edit student function (basic version)
async function editStudent(id) {
    try {
        const { data: student, error } = await supabase
            .from('students')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // For now, just alert with the details
        // You can create a proper edit modal later
        alert(`Edit student:\n\nMatric: ${student.matric_number}\nName: ${student.full_name}\nEmail: ${student.email}\n\nEdit functionality to be implemented.`);
        
    } catch (error) {
        console.error('Error fetching student for edit:', error);
        alert('Error loading student for editing');
    }
}

// View student attempts
async function viewStudentAttempts(id) {
    try {
        // Get student info
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('matric_number, full_name')
            .eq('id', id)
            .single();
        
        if (studentError) throw studentError;
        
        // Get student's exam attempts
        const { data: attempts, error: attemptsError } = await supabase
            .from('exam_attempts')
            .select(`
                *,
                courses (course_code, course_title)
            `)
            .eq('student_id', id);
        
        if (attemptsError) throw attemptsError;
        
        // Get student's exam results
        const { data: results, error: resultsError } = await supabase
            .from('exam_results')
            .select(`
                *,
                courses (course_code, course_title)
            `)
            .eq('student_id', id)
            .order('created_at', { ascending: false });
        
        if (resultsError) throw resultsError;
        
        let attemptsText = `Student: ${student.matric_number} - ${student.full_name}\n\n`;
        
        if (attempts && attempts.length > 0) {
            attemptsText += '📊 Exam Attempts:\n';
            attempts.forEach(attempt => {
                attemptsText += `• ${attempt.courses?.course_code || 'Unknown'}: ${attempt.attempts_used} attempts (Last: ${attempt.last_attempt_at ? new Date(attempt.last_attempt_at).toLocaleDateString() : 'Never'})\n`;
            });
        } else {
            attemptsText += 'No exam attempts yet.\n';
        }
        
        attemptsText += '\n📈 Exam Results:\n';
        
        if (results && results.length > 0) {
            results.forEach((result, index) => {
                attemptsText += `${index + 1}. ${result.courses?.course_code || 'Unknown'}: ${result.score}% (${result.correct_answers}/${result.total_questions}) on ${new Date(result.created_at).toLocaleDateString()}\n`;
            });
        } else {
            attemptsText += 'No exam results yet.\n';
        }
        
        alert(attemptsText);
        
    } catch (error) {
        console.error('Error viewing student attempts:', error);
        alert('Error loading student attempts');
    }
}

// Delete all students - FIXED VERSION
async function deleteAllStudents() {
    if (!confirm('⚠️ DANGER: Are you sure you want to delete ALL students?\n\nThis will also delete all their exam records and cannot be undone!')) {
        return;
    }
    
    const confirmation = prompt('Type "DELETE ALL" to confirm:');
    if (confirmation !== 'DELETE ALL') {
        alert('Deletion cancelled.');
        return;
    }
    
    try {
        // Get all student IDs first
        const { data: allStudentIds, error: fetchError } = await supabase
            .from('students')
            .select('id, matric_number');
        
        if (fetchError) throw fetchError;
        
        if (allStudentIds.length === 0) {
            alert('No students to delete.');
            return;
        }
        
        // Show warning with count
        if (!confirm(`You are about to delete ${allStudentIds.length} students.\n\nThis includes:\n• ${allStudentIds.length} student records\n• All their exam attempts\n• All their exam results\n• All their exam sessions\n\nFinal warning: This cannot be undone!\n\nClick OK to proceed or Cancel to stop.`)) {
            return;
        }
        
        // Delete in smaller batches to avoid timeout
        const batchSize = 20;
        let deletedCount = 0;
        
        for (let i = 0; i < allStudentIds.length; i += batchSize) {
            const batch = allStudentIds.slice(i, i + batchSize);
            const batchIds = batch.map(s => s.id);
            
            const { error: deleteError } = await supabase
                .from('students')
                .delete()
                .in('id', batchIds);
            
            if (deleteError) throw deleteError;
            
            deletedCount += batch.length;
        }
        
        alert(`✅ Successfully deleted ${deletedCount} students!\n\nAll associated exam records have also been deleted.`);
        
        // Reload data
        loadStudents();
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
    } catch (error) {
        console.error('Error deleting all students:', error);
        alert('Error deleting students: ' + error.message);
    }
}

// Delete filtered students
async function deleteFilteredStudents() {
    if (allStudents.length === 0) {
        alert('No students to delete.');
        return;
    }
    
    const filteredStudents = allStudents;
    let confirmMessage = `Delete ${filteredStudents.length} student(s)?\n\n`;
    
    // Show some examples
    const examples = filteredStudents.slice(0, 3).map(s => `• ${s.matric_number} - ${s.full_name}`).join('\n');
    if (filteredStudents.length > 3) {
        confirmMessage += examples + '\n• ... and ' + (filteredStudents.length - 3) + ' more\n\n';
    } else {
        confirmMessage += examples + '\n\n';
    }
    
    confirmMessage += 'This action cannot be undone!';
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    const finalConfirmation = prompt(`Type "DELETE ${filteredStudents.length}" to confirm:`);
    if (finalConfirmation !== `DELETE ${filteredStudents.length}`) {
        alert('Deletion cancelled.');
        return;
    }
    
    try {
        const studentIds = filteredStudents.map(s => s.id);
        
        // Delete in batches to avoid timeout
        const batchSize = 50;
        let deletedCount = 0;
        
        for (let i = 0; i < studentIds.length; i += batchSize) {
            const batch = studentIds.slice(i, i + batchSize);
            
            const { error } = await supabase
                .from('students')
                .delete()
                .in('id', batch);
            
            if (error) throw error;
            
            deletedCount += batch.length;
        }
        
        alert(`Successfully deleted ${deletedCount} students!`);
        loadStudents(currentFilters);
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
    } catch (error) {
        console.error('Error deleting filtered students:', error);
        alert('Error deleting students: ' + error.message);
    }
}

// Export filtered students to CSV
async function exportFilteredStudents() {
    if (allStudents.length === 0) {
        alert('No students to export.');
        return;
    }
    
    const studentsToExport = allStudents;
    
    let csv = 'Matric Number,Full Name,Email,Department,Level,Date Added\n';
    
    studentsToExport.forEach(student => {
        const date = new Date(student.created_at).toLocaleDateString('en-GB');
        csv += `${student.matric_number},${student.full_name},${student.email},${student.department},${student.level || 'N/A'},${date}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_export_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Download CSV template for bulk student upload
function downloadStudentTemplate() {
    const csvContent = `Matric Number,Full Name,Email,Department,Level
2021/12345,John Doe,john@example.com,Computer Science,100
2021/12346,Jane Smith,jane@example.com,Mathematics,200
2021/12347,Bob Johnson,bob@example.com,Physics,300
2021/12348,Alice Williams,alice@example.com,Chemistry,400
2021/12349,Charlie Brown,charlie@example.com,Biology,500

Instructions:
1. Fill in your student data below the example rows
2. Save as CSV file
3. Make sure columns are in the exact order above
4. Do not modify the header row
5. Matric numbers and emails must be unique`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_bulk_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Export functions to window
window.loadStudents = loadStudents;
window.applyStudentFilters = applyStudentFilters;
window.clearStudentFilters = clearStudentFilters;
window.deleteStudent = deleteStudent;
window.editStudent = editStudent;
window.viewStudentAttempts = viewStudentAttempts;
window.deleteAllStudents = deleteAllStudents;
window.deleteFilteredStudents = deleteFilteredStudents;
window.exportFilteredStudents = exportFilteredStudents;
window.downloadStudentTemplate = downloadStudentTemplate;
// questions_enhanced.js - Enhanced version with delete all and filter features

let allQuestions = [];
let currentQuestionFilters = {};

// Load all questions with optional filters
async function loadQuestions(filters = {}) {
    try {
        currentQuestionFilters = filters;
        
        // Wait for DOM element to exist
        const tbody = document.getElementById('questionsTable');
        if (!tbody) {
            console.warn('questionsTable not found yet, retrying...');
            setTimeout(() => loadQuestions(filters), 500);
            return;
        }
        
        let query = supabase
            .from('questions')
            .select(`
                *,
                courses (course_code, course_title)
            `);
        
        // Apply filters if specified
        if (filters.courseId) {
            query = query.eq('course_id', filters.courseId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allQuestions = data;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">No questions found</td></tr>';
            const countElement = document.getElementById('filteredQuestionsCount');
            if (countElement) countElement.textContent = '0';
            return;
        }
        
        tbody.innerHTML = data.map(question => {
            const options = JSON.parse(question.options);
            const correctIndex = question.correct_answer;
            
            return `
            <tr>
                <td>${question.courses?.course_code || 'Unknown'}</td>
                <td>${question.question_text.substring(0, 50)}...</td>
                <td>${options.length} options</td>
                <td>Correct: ${String.fromCharCode(65 + correctIndex)}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-sm btn-view" onclick="viewQuestion('${question.id}')">View</button>
                        <button class="btn btn-sm btn-edit" onclick="editQuestion('${question.id}')">Edit</button>
                        <button class="btn btn-sm btn-delete" onclick="deleteQuestion('${question.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `}).join('');
        
        // Update question count
        const countElement = document.getElementById('filteredQuestionsCount');
        if (countElement) countElement.textContent = data.length;
    } catch (error) {
        console.error('Error loading questions:', error);
        const tbody = document.getElementById('questionsTable');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #f44336;">Error loading questions</td></tr>';
        }
    }
}

// Load course filter options
async function loadQuestionFilterOptions() {
    try {
        const { data: courses, error } = await supabase
            .from('courses')
            .select('id, course_code, course_title')
            .order('course_code');
        
        if (error) throw error;
        
        const courseFilter = document.getElementById('filterQuestionCourse');
        if (courseFilter) {
            courseFilter.innerHTML = '<option value="">All Courses</option>' + 
                courses.map(course => `<option value="${course.id}">${course.course_code} - ${course.course_title}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading question filter options:', error);
    }
}

// Apply question filters
function applyQuestionFilters() {
    const courseId = document.getElementById('filterQuestionCourse').value;
    
    const filters = {};
    if (courseId) filters.courseId = courseId;
    
    loadQuestions(filters);
}

// Clear question filters
function clearQuestionFilters() {
    document.getElementById('filterQuestionCourse').value = '';
    loadQuestions();
}

// Delete a single question
async function deleteQuestion(id) {
    if (!confirm('Are you sure you want to delete this question?')) {
        return;
    }
    
    try {
        // First get the question to get course_id for updating count
        const { data: question, error: fetchError } = await supabase
            .from('questions')
            .select('course_id')
            .eq('id', id)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Delete the question
        const { error } = await supabase
            .from('questions')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        alert('Question deleted successfully!');
        
        // Reload questions
        loadQuestions(currentQuestionFilters);
        
        // Update course question count
        if (question.course_id) {
            await updateCourseQuestionCount(question.course_id);
        }
        
        // Update dashboard
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
        
    } catch (error) {
        console.error('Error deleting question:', error);
        alert('Error deleting question: ' + error.message);
    }
}

// Helper function to update course question count
async function updateCourseQuestionCount(courseId) {
    try {
        const { count, error } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', courseId);
        
        if (error) throw error;
        
        // Update the course total_questions field
        const { error: updateError } = await supabase
            .from('courses')
            .update({ total_questions: count || 0 })
            .eq('id', courseId);
        
        if (updateError) throw updateError;
        
    } catch (error) {
        console.error('Error updating course question count:', error);
    }
}

// Delete all questions
async function deleteAllQuestions() {
    if (!confirm('⚠️ DANGER: Are you sure you want to delete ALL questions?\n\nThis action cannot be undone!')) {
        return;
    }
    
    const confirmation = prompt('Type "DELETE ALL QUESTIONS" to confirm:');
    if (confirmation !== 'DELETE ALL QUESTIONS') {
        alert('Deletion cancelled.');
        return;
    }
    
    try {
        // Get all course IDs that have questions
        const { data: coursesWithQuestions, error: courseError } = await supabase
            .from('questions')
            .select('course_id')
            .order('course_id');
        
        if (courseError) throw courseError;
        
        if (!coursesWithQuestions || coursesWithQuestions.length === 0) {
            alert('No questions to delete.');
            return;
        }
        
        // Delete all questions using a different approach
        // Get all question IDs first
        const { data: allQuestionIds, error: fetchError } = await supabase
            .from('questions')
            .select('id');
        
        if (fetchError) throw fetchError;
        
        if (allQuestionIds.length === 0) {
            alert('No questions to delete.');
            return;
        }
        
        // Delete in smaller batches to avoid timeout
        const batchSize = 20;
        let deletedCount = 0;
        
        for (let i = 0; i < allQuestionIds.length; i += batchSize) {
            const batch = allQuestionIds.slice(i, i + batchSize);
            const batchIds = batch.map(q => q.id);
            
            const { error: deleteError } = await supabase
                .from('questions')
                .delete()
                .in('id', batchIds);
            
            if (deleteError) throw deleteError;
            
            deletedCount += batch.length;
        }
        
        // Reset all course question counts to 0
        const uniqueCourseIds = [...new Set(coursesWithQuestions.map(q => q.course_id))];
        
        for (const courseId of uniqueCourseIds) {
            await supabase
                .from('courses')
                .update({ total_questions: 0 })
                .eq('id', courseId);
        }
        
        alert(`Successfully deleted ${deletedCount} questions!`);
        loadQuestions();
        loadCourses();
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
    } catch (error) {
        console.error('Error deleting all questions:', error);
        alert('Error deleting questions: ' + error.message);
    }
}

// Delete filtered questions
async function deleteFilteredQuestions() {
    if (allQuestions.length === 0) {
        alert('No questions to delete.');
        return;
    }
    
    const filteredQuestions = allQuestions;
    const courseName = currentQuestionFilters.courseId ? 
        document.querySelector(`#filterQuestionCourse option[value="${currentQuestionFilters.courseId}"]`)?.textContent : 
        'All Courses';
    
    let confirmMessage = `Delete ${filteredQuestions.length} question(s) from ${courseName}?\n\n`;
    confirmMessage += 'This action cannot be undone!';
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    const finalConfirmation = prompt(`Type "DELETE ${filteredQuestions.length}" to confirm:`);
    if (finalConfirmation !== `DELETE ${filteredQuestions.length}`) {
        alert('Deletion cancelled.');
        return;
    }
    
    try {
        const questionIds = filteredQuestions.map(q => q.id);
        
        // Delete in batches
        const batchSize = 50;
        let deletedCount = 0;
        
        for (let i = 0; i < questionIds.length; i += batchSize) {
            const batch = questionIds.slice(i, i + batchSize);
            
            const { error } = await supabase
                .from('questions')
                .delete()
                .in('id', batch);
            
            if (error) throw error;
            
            deletedCount += batch.length;
        }
        
        // Update course question counts
        const affectedCourseIds = [...new Set(filteredQuestions.map(q => q.course_id))];
        
        for (const courseId of affectedCourseIds) {
            await updateCourseQuestionCount(courseId);
        }
        
        alert(`Successfully deleted ${deletedCount} questions!`);
        loadQuestions(currentQuestionFilters);
        loadCourses(); // Update course question counts
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
    } catch (error) {
        console.error('Error deleting filtered questions:', error);
        alert('Error deleting questions: ' + error.message);
    }
}

// Export filtered questions to CSV
async function exportFilteredQuestions() {
    if (allQuestions.length === 0) {
        alert('No questions to export.');
        return;
    }
    
    const questionsToExport = allQuestions;
    
    let csv = 'Course Code,Question,Option A,Option B,Option C,Option D,Correct Answer\n';
    
    questionsToExport.forEach(question => {
        const options = JSON.parse(question.options);
        const correctAnswer = String.fromCharCode(65 + question.correct_answer);
        
        csv += `${question.courses?.course_code || 'Unknown'},"${question.question_text.replace(/"/g, '""')}","${options[0]?.text || ''}","${options[1]?.text || ''}","${options[2]?.text || ''}","${options[3]?.text || ''}",${correctAnswer}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_export_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Download CSV template for bulk question upload
function downloadQuestionTemplate() {
    const csvContent = `Question,Option A,Option B,Option C,Option D,Correct Answer
What is the capital of France?,Paris,London,Berlin,Madrid,A
Which planet is known as the Red Planet?,Venus,Mars,Jupiter,Saturn,B
What is 2+2?,1,2,3,4,D
Who wrote "Romeo and Juliet"?,Charles Dickens,William Shakespeare,Mark Twain,Jane Austen,B
What is the chemical symbol for water?,H2O,CO2,O2,NaCl,A

Instructions:
1. Fill in your question data below the example rows
2. Save as CSV file
3. Make sure columns are in the exact order above
4. Do not modify the header row
5. Correct Answer must be A, B, C, or D (uppercase)
6. Questions will be added to the selected course`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question_bulk_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Edit question function (basic version)
async function editQuestion(id) {
    try {
        const { data: question, error } = await supabase
            .from('questions')
            .select(`
                *,
                courses (course_code, course_title)
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // For now, just alert with the details
        // You can create a proper edit modal later
        alert(`Edit question:\n\nID: ${id}\nQuestion: ${question.question_text}\n\nEdit functionality to be implemented.`);
        
    } catch (error) {
        console.error('Error fetching question for edit:', error);
        alert('Error loading question for editing');
    }
}

// Enhanced view question function
async function viewQuestion(id) {
    try {
        const { data, error } = await supabase
            .from('questions')
            .select(`
                *,
                courses (course_code, course_title)
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        const options = JSON.parse(data.options);
        const correctAnswer = String.fromCharCode(65 + data.correct_answer);
        
        let optionsText = '';
        options.forEach((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            optionsText += `${letter}. ${opt.text} ${letter === correctAnswer ? '✅ (Correct)' : ''}\n`;
        });
        
        const details = `
📚 Question Details
━━━━━━━━━━━━━━━━━━━━━━
Course: ${data.courses?.course_code || 'Unknown'} - ${data.courses?.course_title || ''}

Question:
${data.question_text}

Options:
${optionsText}

Correct Answer: ${correctAnswer}

ID: ${data.id}
Created: ${new Date(data.created_at).toLocaleString('en-GB')}
        `;
        
        alert(details);
    } catch (error) {
        console.error('Error viewing question:', error);
        alert('Error loading question details');
    }
}

// Export functions to window
window.loadQuestions = loadQuestions;
window.loadQuestionFilterOptions = loadQuestionFilterOptions;
window.applyQuestionFilters = applyQuestionFilters;
window.clearQuestionFilters = clearQuestionFilters;
window.deleteQuestion = deleteQuestion;
window.deleteAllQuestions = deleteAllQuestions;
window.deleteFilteredQuestions = deleteFilteredQuestions;
window.exportFilteredQuestions = exportFilteredQuestions;
window.downloadQuestionTemplate = downloadQuestionTemplate;
window.editQuestion = editQuestion;
window.viewQuestion = viewQuestion;
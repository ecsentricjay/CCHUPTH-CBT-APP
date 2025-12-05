// results.js - UPDATED with filters

let allResults = []; // Store all results for filtering

// Load all exam results with optional filters
async function loadResults(filters = {}) {
    try {
        console.log('=== LOAD RESULTS CALLED ===');
        console.log('Received filters:', filters);
        
        let query = supabase
            .from('exam_results')
            .select(`
                *,
                students (matric_number, full_name, level),
                courses (course_code, course_title)
            `);
        
        // Apply course filter at database level if provided
        if (filters.courseId && filters.courseId !== '') {
            query = query.eq('course_id', filters.courseId);
            console.log('✅ Applying course filter at DB level:', filters.courseId);
        } else {
            console.log('❌ No course filter applied');
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allResults = data || [];
        
        // Apply level filter on the client side if provided
        let filteredResults = allResults;
        if (filters.level && filters.level !== '') {
            console.log('✅ Applying level filter:', filters.level);
            console.log('Total results before level filter:', filteredResults.length);
            
            filteredResults = allResults.filter(result => {
                // Handle null/undefined cases
                if (!result.students) {
                    console.log('⚠️ Result has no student data:', result.id);
                    return false;
                }
                
                const studentLevel = String(result.students.level);
                const filterLevel = String(filters.level);
                
                console.log(`Comparing: Student level "${studentLevel}" with filter "${filterLevel}"`);
                
                return studentLevel === filterLevel;
            });
            
            console.log('Results after level filter:', filteredResults.length);
        } else {
            console.log('❌ No level filter applied - showing all results for selected course');
        }
        
        console.log('=== FILTERING SUMMARY ===');
        console.log('Filters applied:', filters);
        console.log('Results after DB query:', allResults.length);
        console.log('Results after client filtering:', filteredResults.length);
        
        if (filteredResults.length > 0) {
            console.log('First 3 filtered results:');
            filteredResults.slice(0, 3).forEach((result, index) => {
                console.log(`${index + 1}. ID: ${result.id}, Course: ${result.courses?.course_code}, Level: ${result.students?.level}`);
            });
        }
        
        displayResults(filteredResults);
        
        // Update filter count
        const countElement = document.getElementById('filteredResultsCount');
        if (countElement) {
            countElement.textContent = filteredResults.length;
        }
        
    } catch (error) {
        console.error('Error loading results:', error);
        const tbody = document.getElementById('resultsTable');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #f44336;">Error loading results</td></tr>';
        }
    }
}

// Apply result filters
function applyResultFilters() {
    console.log('=== APPLY FILTERS CALLED ===');
    
    const courseSelect = document.getElementById('filterCourse');
    const levelSelect = document.getElementById('resultFilterLevel');
    
    // Get current values
    const courseId = courseSelect?.value;
    const level = levelSelect?.value;
    
    console.log('Course select element:', courseSelect);
    console.log('Level select element:', levelSelect);
    console.log('Course ID value:', courseId);
    console.log('Level value:', level);
    
    // Debug: Show all level options
    if (levelSelect) {
        console.log('Level select options:');
        Array.from(levelSelect.options).forEach((opt, i) => {
            console.log(`  ${i}: value="${opt.value}", text="${opt.text}", selected=${opt.selected}`);
        });
    }
    
    const filters = {};
    if (courseId && courseId !== '') filters.courseId = courseId;
    if (level && level !== '') filters.level = level;
    
    console.log('Final filters to apply:', filters);
    loadResults(filters);
}

// Clear result filters
function clearResultFilters() {
    console.log('=== CLEARING FILTERS ===');
    
    const courseFilter = document.getElementById('filterCourse');
    const levelFilter = document.getElementById('resultFilterLevel');
    
    console.log('Before clear - Course value:', courseFilter?.value);
    console.log('Before clear - Level value:', levelFilter?.value);
    
    if (courseFilter) {
        courseFilter.value = '';
        console.log('Course filter cleared');
    }
    if (levelFilter) {
        levelFilter.value = '';
        console.log('Level filter cleared');
    }
    
    console.log('After clear - Course value:', courseFilter?.value);
    console.log('After clear - Level value:', levelFilter?.value);
    
    loadResults();
}

// FIXED: Display results in table with proper subjective data
function displayResults(results) {
    const tbody = document.getElementById('resultsTable');
    
    if (!tbody) {
        console.error('resultsTable tbody not found!');
        return;
    }
    
    if (!results || results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">No exam results found</td></tr>';
        const countElement = document.getElementById('filteredResultsCount');
        if (countElement) countElement.textContent = '0';
        return;
    }
    
    console.log('Displaying', results.length, 'results');
    
    tbody.innerHTML = results.map(result => {
        const date = new Date(result.created_at).toLocaleDateString('en-GB');
        
        // FIXED: Safely get scores with proper fallbacks
        const objectiveScore = result.objective_score !== null && result.objective_score !== undefined ? 
            result.objective_score : result.score || 0;
        
        const subjectiveScore = result.subjective_score || 0;
        const finalScore = result.final_score !== null && result.final_score !== undefined ? 
            result.final_score : objectiveScore;
        
        const scoreColor = finalScore >= 70 ? '#4caf50' : finalScore >= 50 ? '#ff9800' : '#f44336';
        
        // FIXED: Check if there are subjective questions
        const totalSubjective = result.total_subjective_questions || 0;
        const hasSubjective = totalSubjective > 0;
        
        return `
        <tr>
            <td>${result.students?.matric_number || 'N/A'}</td>
            <td>${result.students?.full_name || 'Unknown'}</td>
            <td>${result.students?.level || 'N/A'}</td>
            <td>${result.courses?.course_code || 'N/A'}</td>
            <td>
                <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                    <strong style="color: ${scoreColor}; font-size: 1.1rem;">
                        ${finalScore.toFixed(1)}%
                    </strong>
                    ${hasSubjective ? `
                        <div style="font-size: 0.8rem; color: #666; line-height: 1.3;">
                            <div>📝 Objective: ${objectiveScore.toFixed(1)}%</div>
                            <div>✏️ Subjective: ${subjectiveScore > 0 ? subjectiveScore.toFixed(1) + '%' : 
                                '<span style="color: #ff9800;">Pending</span>'}</div>
                        </div>
                    ` : `
                        <small style="color: #666;">(${result.correct_answers || 0}/${result.total_questions || 0})</small>
                    `}
                </div>
            </td>
            <td>${date}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-view" onclick="viewResultDetails('${result.id}')">
                        View Details
                    </button>
                    ${hasSubjective ? `
                        <button class="btn btn-sm btn-edit" onclick="gradeSubjectiveAnswers('${result.session_id}')" 
                                style="background: #ff9800; border-color: #ff9800;">
                            Grade Essays
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `}).join('');
    
    // Update result count
    const countElement = document.getElementById('filteredResultsCount');
    if (countElement) {
        countElement.textContent = results.length;
    }
}

// Load filter options
async function loadFilterOptions() {
    try {
        // Load courses for filter
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('id, course_code, course_title')
            .order('course_code');
        
        if (coursesError) throw coursesError;
        
        const courseSelect = document.getElementById('filterCourse');
        courseSelect.innerHTML = '<option value="">All Courses</option>' +
            courses.map(course => 
                `<option value="${course.id}">${course.course_code} - ${course.course_title}</option>`
            ).join('');
        
        // Load levels for filter (you can customize these)
        const levelSelect = document.getElementById('resultFilterLevel');
        if (levelSelect) {
            levelSelect.innerHTML = `
                <option value="">All Levels</option>
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
                <option value="500">500 Level</option>
            `;
            
            console.log('✅ Level filter options loaded');
        } else {
            console.error('❌ Level select element (resultFilterLevel) not found!');
        }
        
        console.log('✅ Filter options loaded');
        
    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

// Print filtered results
function printFilteredResults() {
    const courseId = document.getElementById('filterCourse').value;
    const level = document.getElementById('resultFilterLevel').value;
    
    console.log('Print with filters - Course:', courseId, 'Level:', level);
    
    // Start with all results and apply current filters
    let filteredResults = allResults;
    
    if (courseId && courseId !== '') {
        filteredResults = filteredResults.filter(r => r.course_id === courseId);
    }
    
    if (level && level !== '') {
        filteredResults = filteredResults.filter(r => {
            if (!r.students) return false;
            return String(r.students.level) === String(level);
        });
    }
    
    if (filteredResults.length === 0) {
        alert('No results to print');
        return;
    }
    
    // Create printable HTML
    const courseName = courseId ? 
        document.querySelector(`#filterCourse option[value="${courseId}"]`).textContent : 
        'All Courses';
    const levelName = level ? `${level} Level` : 'All Levels';
    
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
        <html>
        <head>
            <title>Exam Results Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { text-align: center; color: #333; }
                .info { text-align: center; margin-bottom: 20px; color: #666; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
                th { background: #667eea; color: white; }
                tr:nth-child(even) { background: #f9f9f9; }
                .pass { color: #4caf50; font-weight: bold; }
                .fail { color: #f44336; font-weight: bold; }
                .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
            </style>
        </head>
        <body>
            <h1>📊 Exam Results Report</h1>
            <div class="info">
                <strong>Course:</strong> ${courseName}<br>
                <strong>Level:</strong> ${levelName}<br>
                <strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}<br>
                <strong>Total Results:</strong> ${filteredResults.length}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>S/N</th>
                        <th>Matric Number</th>
                        <th>Student Name</th>
                        <th>Level</th>
                        <th>Course</th>
                        <th>Score (%)</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredResults.map((result, index) => {
                        const isPassed = result.score >= 50;
                        const date = new Date(result.created_at).toLocaleDateString('en-GB');
                        return `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${result.students.matric_number}</td>
                            <td>${result.students.full_name}</td>
                            <td>${result.students.level || 'N/A'}</td>
                            <td>${result.courses.course_code}</td>
                            <td class="${isPassed ? 'pass' : 'fail'}">${result.score.toFixed(1)}%</td>
                            <td class="${isPassed ? 'pass' : 'fail'}">${isPassed ? 'PASS' : 'FAIL'}</td>
                            <td>${date}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <div class="footer">
                Generated by CBT Exam System on ${new Date().toLocaleString('en-GB')}
            </div>
            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Export filtered results to CSV
function exportFilteredResults() {
    const courseId = document.getElementById('filterCourse').value;
    const level = document.getElementById('resultFilterLevel').value;
    
    console.log('Export with filters - Course:', courseId, 'Level:', level);
    
    // Start with all results and apply current filters
    let filteredResults = allResults;
    
    if (courseId && courseId !== '') {
        filteredResults = filteredResults.filter(r => r.course_id === courseId);
    }
    
    if (level && level !== '') {
        filteredResults = filteredResults.filter(r => {
            if (!r.students) return false;
            return String(r.students.level) === String(level);
        });
    }
    
    if (filteredResults.length === 0) {
        alert('No results to export');
        return;
    }
    
    // Create CSV content
    let csv = 'S/N,Matric Number,Student Name,Level,Course Code,Course Title,Score (%),Correct Answers,Total Questions,Status,Date\n';
    
    filteredResults.forEach((result, index) => {
        const date = new Date(result.created_at).toLocaleDateString('en-GB');
        const status = result.score >= 50 ? 'PASS' : 'FAIL';
        csv += `${index + 1},${result.students.matric_number},${result.students.full_name},${result.students.level || 'N/A'},${result.courses.course_code},${result.courses.course_title},${result.score.toFixed(1)},${result.correct_answers},${result.total_questions},${status},${date}\n`;
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exam_results_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Load active exams
async function loadActiveExams() {
    try {
        const { data, error } = await supabase
            .from('exam_sessions')
            .select(`
                *,
                students (matric_number, full_name, level),
                courses (course_code, course_title)
            `)
            .eq('status', 'in_progress')
            .order('start_time', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('activeExamsContainer');
        
        if (data.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No active exams at the moment</p>';
            return;
        }
        
        container.innerHTML = data.map(session => {
            const startTime = new Date(session.start_time);
            const elapsed = Math.floor((new Date() - startTime) / 60000); // minutes
            const remaining = session.duration_minutes - elapsed;
            
            return `
            <div style="padding: 1rem; border: 2px solid #e0e0e0; border-radius: 10px; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${session.students.full_name}</strong> (${session.students.matric_number})<br>
                        <span style="color: #666;">${session.courses.course_code} - ${session.courses.course_title}</span><br>
                        <span style="color: #999; font-size: 0.9rem;">Level: ${session.students.level || 'N/A'}</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.2rem; font-weight: bold; color: ${remaining < 10 ? '#f44336' : '#667eea'};">
                            ${remaining} min left
                        </div>
                        <div style="font-size: 0.9rem; color: #999;">
                            Started: ${startTime.toLocaleTimeString('en-GB')}
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        
        // Update count
        document.getElementById('activeExamsCount').textContent = data.length;
    } catch (error) {
        console.error('Error loading active exams:', error);
    }
}

// FIXED: View detailed result with subjective information
async function viewResultDetails(id) {
    try {
        const { data, error } = await supabase
            .from('exam_results')
            .select(`
                *,
                students (matric_number, full_name, department, level),
                courses (course_code, course_title),
                exam_sessions (start_time, end_time)
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        const timeTaken = data.time_taken || 0;
        const hasSubjective = (data.total_subjective_questions || 0) > 0;
        
        // FIXED: Get scores with proper fallbacks
        const objectiveScore = data.objective_score !== null && data.objective_score !== undefined ? 
            data.objective_score : data.score || 0;
        const subjectiveScore = data.subjective_score || 0;
        const finalScore = data.final_score !== null && data.final_score !== undefined ? 
            data.final_score : objectiveScore;
        
        // Build details string
        let details = `
📊 Exam Result Details
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Student: ${data.students?.full_name || 'Unknown'}
Matric No: ${data.students?.matric_number || 'N/A'}
Department: ${data.students?.department || 'N/A'}
Level: ${data.students?.level || 'N/A'}

Course: ${data.courses?.course_code || 'N/A'} - ${data.courses?.course_title || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

        if (hasSubjective) {
            details += `
📝 PERFORMANCE BREAKDOWN:

Final Score: ${finalScore.toFixed(1)}%
${finalScore >= 50 ? '✅ PASSED' : '❌ FAILED'}

Objective Section:
  • Score: ${objectiveScore.toFixed(1)}%
  • Correct: ${data.correct_answers || 0}/${data.total_questions || 0} questions

Subjective Section:
  • Questions Answered: ${data.subjective_questions_answered || 0}/${data.total_subjective_questions || 0}
  • Marks Obtained: ${(data.subjective_marks_obtained || 0).toFixed(1)}/${data.total_subjective_marks || 0}
  • Score: ${subjectiveScore > 0 ? subjectiveScore.toFixed(1) + '%' : 'Pending Evaluation'}
  ${data.auto_graded_subjective > 0 ? `• Auto-graded: ${data.auto_graded_subjective} questions` : ''}
`;
        } else {
            details += `
📝 PERFORMANCE:

Score: ${objectiveScore.toFixed(1)}%
Status: ${objectiveScore >= 50 ? '✅ PASSED' : '❌ FAILED'}

Correct: ${data.correct_answers || 0}
Wrong: ${(data.total_questions || 0) - (data.correct_answers || 0)}
Total Questions: ${data.total_questions || 0}
`;
        }

        details += `
Time Taken: ${timeTaken} minutes

Date: ${new Date(data.created_at).toLocaleString('en-GB')}
        `;
        
        alert(details);
    } catch (error) {
        console.error('Error viewing result:', error);
        alert('Error loading result details');
    }
}

// FIXED: Add function to grade subjective answers (shortcut to grading interface)
async function gradeSubjectiveAnswers(sessionId) {
    try {
        // Get subjective answers for this session
        const { data: answers, error } = await supabase
            .from('subjective_answers')
            .select(`
                *,
                subjective_questions (
                    id,
                    question_text,
                    marks
                )
            `)
            .eq('session_id', sessionId);
        
        if (error) throw error;
        
        if (!answers || answers.length === 0) {
            alert('No subjective answers found for this exam session.');
            return;
        }
        
        // Get unique question IDs
        const questionIds = [...new Set(answers.map(a => a.question_id))];
        
        if (questionIds.length === 1) {
            // If only one question, open grading directly
            if (typeof viewSubjectiveAnswers === 'function') {
                viewSubjectiveAnswers(questionIds[0]);
            } else {
                alert('Please navigate to Subjective Questions section to grade answers.');
            }
        } else {
            // Multiple questions - show list
            const questionsList = answers.map((a, i) => 
                `${i + 1}. ${a.subjective_questions.question_text.substring(0, 60)}...`
            ).join('\n');
            
            alert(`This exam has ${questionIds.length} subjective questions:\n\n${questionsList}\n\nPlease navigate to the Subjective Questions section to grade each question.`);
        }
        
    } catch (error) {
        console.error('Error loading subjective answers:', error);
        alert('Error loading subjective answers: ' + error.message);
    }
}

// Delete all results
async function deleteAllResults() {
    if (!confirm('⚠️ DANGER: Are you sure you want to delete ALL exam results?\n\nThis action cannot be undone!')) {
        return;
    }
    
    const confirmation = prompt('Type "DELETE ALL RESULTS" to confirm:');
    if (confirmation !== 'DELETE ALL RESULTS') {
        alert('Deletion cancelled.');
        return;
    }
    
    try {
        // Get count first
        const { count, error: countError } = await supabase
            .from('exam_results')
            .select('*', { count: 'exact', head: true });
        
        if (countError) throw countError;
        
        if (count === 0) {
            alert('No results to delete.');
            return;
        }
        
        // Delete all results
        const { error } = await supabase
            .from('exam_results')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (error) throw error;
        
        alert(`Successfully deleted ${count} exam results!`);
        
        // Reload results and dashboard
        loadResults();
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
        
    } catch (error) {
        console.error('Error deleting all results:', error);
        alert('Error deleting results: ' + error.message);
    }
}

// Delete filtered results
async function deleteFilteredResults() {
    if (allResults.length === 0) {
        alert('No results to delete.');
        return;
    }
    
    const courseId = document.getElementById('filterCourse').value;
    const level = document.getElementById('resultFilterLevel').value;
    
    console.log('Delete with filters - Course:', courseId, 'Level:', level);
    
    let filteredResults = allResults;
    
    if (courseId && courseId !== '') {
        filteredResults = filteredResults.filter(r => r.course_id === courseId);
    }
    
    if (level && level !== '') {
        filteredResults = filteredResults.filter(r => {
            if (!r.students) return false;
            return String(r.students.level) === String(level);
        });
    }
    
    if (filteredResults.length === 0) {
        alert('No results match the current filters.');
        return;
    }
    
    const courseName = courseId ? 
        document.querySelector(`#filterCourse option[value="${courseId}"]`)?.textContent : 
        'All Courses';
    const levelName = level ? `${level} Level` : 'All Levels';
    
    let confirmMessage = `Delete ${filteredResults.length} exam result(s)?\n\n`;
    confirmMessage += `Course: ${courseName}\n`;
    confirmMessage += `Level: ${levelName}\n\n`;
    confirmMessage += 'This action cannot be undone!';
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    const finalConfirmation = prompt(`Type "DELETE ${filteredResults.length}" to confirm:`);
    if (finalConfirmation !== `DELETE ${filteredResults.length}`) {
        alert('Deletion cancelled.');
        return;
    }
    
    try {
        const resultIds = filteredResults.map(r => r.id);
        
        // Delete in batches
        const batchSize = 50;
        let deletedCount = 0;
        
        for (let i = 0; i < resultIds.length; i += batchSize) {
            const batch = resultIds.slice(i, i + batchSize);
            
            const { error } = await supabase
                .from('exam_results')
                .delete()
                .in('id', batch);
            
            if (error) throw error;
            
            deletedCount += batch.length;
        }
        
        alert(`Successfully deleted ${deletedCount} exam results!`);
        
        // Reload results
        loadResults();
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
        
    } catch (error) {
        console.error('Error deleting filtered results:', error);
        alert('Error deleting results: ' + error.message);
    }
}

// Export functions
window.deleteAllResults = deleteAllResults;
window.deleteFilteredResults = deleteFilteredResults;
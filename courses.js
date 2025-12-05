// courses.js - UPDATED with new toggles

// Load all courses
async function loadCourses() {
    try {
        // Wait for DOM element to exist
        const tbody = document.getElementById('coursesTable');
        if (!tbody) {
            console.warn('coursesTable not found yet, retrying...');
            setTimeout(loadCourses, 500);
            return;
        }

        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">No courses added yet</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(course => `
            <tr>
                <td>${course.course_code}</td>
                <td>${course.course_title}</td>
                <td>${course.duration_minutes}</td>
                <td>${course.total_questions || 0}</td>
                <td>${course.max_attempts || 3}</td>
                <td>
                    <span style="color: ${course.is_active ? '#4caf50' : '#f44336'};">
                        ${course.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div style="font-size: 0.85rem;">
                        <div style="margin-bottom: 0.3rem;">
                            Pass Mark: ${course.show_pass_mark ? '✅ Visible' : '❌ Hidden'}
                        </div>
                        <div>
                            Results: ${course.show_immediate_result ? '✅ Immediate' : '❌ Hidden'}
                        </div>
                    </div>
                </td>
                <td>
                    <div class="action-btns" style="flex-direction: column; gap: 0.3rem;">
                        <button class="btn btn-sm btn-edit" onclick="openCourseSettingsModal('${course.id}', ${JSON.stringify(course).replace(/"/g, '&quot;')})">⚙️ Settings</button>
                        <button class="btn btn-sm btn-edit" onclick="toggleCourseStatus('${course.id}', ${!course.is_active})">
                            ${course.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="btn btn-sm btn-delete" onclick="deleteCourse('${course.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Update course dropdown in question modal
        updateCourseDropdown(data);
    } catch (error) {
        console.error('Error loading courses:', error);
        const tbody = document.getElementById('coursesTable');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #f44336;">Error loading courses</td></tr>`;
        }
    }
}

// Open course settings modal
function openCourseSettingsModal(courseId, course) {
    document.getElementById('settingsCourseId').value = courseId;
    document.getElementById('settingsCourseCode').value = course.course_code;
    document.getElementById('settingsCourseTitle').value = course.course_title;
    document.getElementById('settingsDuration').value = course.duration_minutes;
    document.getElementById('settingsMaxAttempts').value = course.max_attempts || 3;
    document.getElementById('settingsShowPassMark').checked = course.show_pass_mark !== false;
    document.getElementById('settingsShowImmediateResult').checked = course.show_immediate_result !== false;
    
    document.getElementById('courseSettingsModal').classList.add('active');
}

// Update course settings
async function updateCourseSettings(event) {
    event.preventDefault();
    
    const courseId = document.getElementById('settingsCourseId').value;
    const settings = {
        course_code: document.getElementById('settingsCourseCode').value,
        course_title: document.getElementById('settingsCourseTitle').value,
        duration_minutes: parseInt(document.getElementById('settingsDuration').value),
        max_attempts: parseInt(document.getElementById('settingsMaxAttempts').value),
        show_pass_mark: document.getElementById('settingsShowPassMark').checked,
        show_immediate_result: document.getElementById('settingsShowImmediateResult').checked
    };
    
    try {
        const { error } = await supabase
            .from('courses')
            .update(settings)
            .eq('id', courseId);
        
        if (error) throw error;
        
        showAlert('courseSettingsAlert', 'Course settings updated successfully!', 'success');
        
        setTimeout(() => {
            closeModal('courseSettingsModal');
            loadCourses();
        }, 1500);
    } catch (error) {
        console.error('Error updating course settings:', error);
        showAlert('courseSettingsAlert', 'Error: ' + error.message, 'error');
    }
}

// Add new course (updated)
async function addCourse(event) {
    event.preventDefault();
    
    const courseData = {
        course_code: document.getElementById('courseCode').value,
        course_title: document.getElementById('courseTitle').value,
        duration_minutes: parseInt(document.getElementById('courseDuration').value),
        max_attempts: parseInt(document.getElementById('courseMaxAttempts').value) || 3,
        show_pass_mark: document.getElementById('courseShowPassMark').checked,
        show_immediate_result: document.getElementById('courseShowImmediateResult').checked,
        is_active: true
    };
    
    try {
        const { data, error } = await supabase
            .from('courses')
            .insert([courseData])
            .select();
        
        if (error) throw error;
        
        showAlert('courseAlert', 'Course added successfully!', 'success');
        
        setTimeout(() => {
            closeModal('addCourseModal');
            loadCourses();
            loadDashboardData();
            // Reset form
            document.getElementById('courseCode').value = '';
            document.getElementById('courseTitle').value = '';
            document.getElementById('courseDuration').value = '60';
            document.getElementById('courseMaxAttempts').value = '3';
            document.getElementById('courseShowPassMark').checked = true;
            document.getElementById('courseShowImmediateResult').checked = true;
        }, 1500);
    } catch (error) {
        console.error('Error adding course:', error);
        showAlert('courseAlert', 'Error: ' + error.message, 'error');
    }
}

// Toggle course status
async function toggleCourseStatus(id, newStatus) {
    try {
        const { error } = await supabase
            .from('courses')
            .update({ is_active: newStatus })
            .eq('id', id);
        
        if (error) throw error;
        
        loadCourses();
    } catch (error) {
        console.error('Error updating course:', error);
    }
}

// Delete course
async function deleteCourse(id) {
    if (!confirm('Are you sure? This will also delete all associated questions.')) return;
    
    try {
        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        loadCourses();
        loadDashboardData();
    } catch (error) {
        console.error('Error deleting course:', error);
        alert('Error deleting course');
    }
}

// Update course dropdown in question modal
function updateCourseDropdown(courses) {
    const select = document.getElementById('questionCourse');
    const bulkSelect = document.getElementById('bulkQuestionCourse');
    const options = '<option value="">-- Select Course --</option>' +
        courses.filter(c => c.is_active).map(course => 
            `<option value="${course.id}">${course.course_code} - ${course.course_title}</option>`
        ).join('');
    
    select.innerHTML = options;
    if (bulkSelect) bulkSelect.innerHTML = options;
}

function openAddCourseModal() {
    document.getElementById('addCourseModal').classList.add('active');
}

// Bulk upload questions via CSV
async function bulkUploadQuestions(event) {
    event.preventDefault();
    
    const courseId = document.getElementById('bulkQuestionCourse').value;
    const fileInput = document.getElementById('questionsCSV');
    
    if (!courseId) {
        showAlert('bulkQuestionAlert', 'Please select a course first', 'error');
        return;
    }
    
    if (!fileInput.files[0]) {
        showAlert('bulkQuestionAlert', 'Please select a CSV file', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            
            // Skip header row
            const dataLines = lines.slice(1);
            
            const questionsToInsert = [];
            
            for (let line of dataLines) {
                // Parse CSV (handles commas in quotes)
                const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                
                if (parts && parts.length >= 6) {
                    const questionText = parts[0].replace(/^"|"$/g, '');
                    const optionA = parts[1].replace(/^"|"$/g, '');
                    const optionB = parts[2].replace(/^"|"$/g, '');
                    const optionC = parts[3].replace(/^"|"$/g, '');
                    const optionD = parts[4].replace(/^"|"$/g, '');
                    const correctAnswer = parts[5].trim().toUpperCase();
                    
                    const correctIndex = {'A': 0, 'B': 1, 'C': 2, 'D': 3}[correctAnswer];
                    
                    if (correctIndex === undefined) continue;
                    
                    const options = [
                        { text: optionA, is_correct: correctIndex === 0 },
                        { text: optionB, is_correct: correctIndex === 1 },
                        { text: optionC, is_correct: correctIndex === 2 },
                        { text: optionD, is_correct: correctIndex === 3 }
                    ];
                    
                    questionsToInsert.push({
                        course_id: courseId,
                        question_text: questionText,
                        options: JSON.stringify(options),
                        correct_answer: correctIndex
                    });
                }
            }
            
            if (questionsToInsert.length === 0) {
                showAlert('bulkQuestionAlert', 'No valid questions found in CSV', 'error');
                return;
            }
            
            // Insert all questions
            const { data, error } = await supabase
                .from('questions')
                .insert(questionsToInsert);
            
            if (error) throw error;
            
            showAlert('bulkQuestionAlert', `Successfully uploaded ${questionsToInsert.length} questions!`, 'success');
            
            setTimeout(() => {
                closeModal('bulkUploadQuestionsModal');
                loadQuestions();
                loadCourses();
                loadDashboardData();
                fileInput.value = '';
            }, 2000);
        } catch (error) {
            console.error('Error uploading questions:', error);
            showAlert('bulkQuestionAlert', 'Error: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file);
}

// Download CSV template for questions
function downloadQuestionTemplate() {
    const csv = 'Question,Option A,Option B,Option C,Option D,Correct Answer\n' +
                '"What is 2+2?","3","4","5","6","B"\n' +
                '"What is the capital of Nigeria?","Lagos","Abuja","Kano","Ibadan","B"';
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

function openBulkUploadQuestionsModal() {
    document.getElementById('bulkUploadQuestionsModal').classList.add('active');
}
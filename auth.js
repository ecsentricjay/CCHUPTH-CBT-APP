// auth.js - Updated version

// Admin Login
async function adminLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        // Query admin_users table
        const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('username', username)
            .single();
        
        if (error || !data) {
            showAlert('loginAlert', 'Invalid username or password', 'error');
            return;
        }
        
        // In production, use proper password hashing (bcrypt)
        // For now, simple check (NOT SECURE - just for demo)
        if (password === 'admin123') {
            sessionStorage.setItem('admin', JSON.stringify(data));
            sessionStorage.setItem('adminLoggedIn', 'true');
            
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('mainDashboard').classList.remove('hidden');
            
            // Update admin name
            const adminNameElement = document.getElementById('adminName');
            if (adminNameElement) {
                adminNameElement.textContent = data.full_name || 'Admin';
            }
            
            // Initialize the app
            if (typeof initializeApp === 'function') {
                initializeApp();
            }
            
            // Load dashboard data if function exists
            if (typeof loadDashboardData === 'function') {
                loadDashboardData();
            } else if (typeof loadDashboardStats === 'function') {
                loadDashboardStats();
            } else {
                // Try to load dashboard data from dashboard module
                if (window.dashboard && typeof window.dashboard.loadDashboardData === 'function') {
                    window.dashboard.loadDashboardData();
                }
            }
        } else {
            showAlert('loginAlert', 'Invalid username or password', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('loginAlert', 'Login failed. Please try again.', 'error');
    }
}

// Logout
function logout() {
    // Clear all intervals
    if (window.liveMonitoringInterval) {
        clearInterval(window.liveMonitoringInterval);
        window.liveMonitoringInterval = null;
    }
    
    // Clear session storage
    sessionStorage.removeItem('admin');
    sessionStorage.removeItem('adminLoggedIn');
    
    // Reset UI
    document.getElementById('mainDashboard').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    
    // Clear any modals
    document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Check if admin is logged in
function checkAuth() {
    const admin = sessionStorage.getItem('admin');
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    
    if (admin && isLoggedIn) {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainDashboard').classList.remove('hidden');
        
        try {
            const adminData = JSON.parse(admin);
            const adminNameElement = document.getElementById('adminName');
            if (adminNameElement) {
                adminNameElement.textContent = adminData.full_name || 'Admin';
            }
        } catch (e) {
            console.error('Error parsing admin data:', e);
        }
        
        // Initialize the app
        if (typeof initializeApp === 'function') {
            initializeApp();
        }
        
        // Load dashboard data
        setTimeout(() => {
            if (typeof loadDashboardData === 'function') {
                loadDashboardData();
            } else if (typeof loadDashboardStats === 'function') {
                loadDashboardStats();
            }
        }, 100);
    }
}

// Add to the end of auth.js:

// Add Student function
// Alternative version with safer duplicate check
async function addStudent(event) {
    event.preventDefault();
    
    try {
        const matricNumber = document.getElementById('studentMatric').value.trim();
        const fullName = document.getElementById('studentName').value.trim();
        const email = document.getElementById('studentEmail').value.trim();
        const department = document.getElementById('studentDept').value.trim();
        const level = document.getElementById('studentLevel').value;
        
        // Basic validation
        if (!matricNumber || !fullName || !email || !department || !level) {
            showAlert('studentAlert', 'All fields are required', 'error');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert('studentAlert', 'Please enter a valid email address', 'error');
            return;
        }
        
        // Check for duplicates using a safer query (select all fields that RLS allows)
        const { data: existingStudents, error: checkError } = await supabase
            .from('students')
            .select('*')
            .or(`matric_number.eq.${matricNumber},email.eq.${email}`);
        
        if (checkError) {
            console.warn('Duplicate check failed, proceeding anyway:', checkError);
            // Continue despite the error - the INSERT will fail if duplicates exist
        } else if (existingStudents && existingStudents.length > 0) {
            // Check which field caused the duplicate
            const duplicateMatric = existingStudents.find(s => s.matric_number === matricNumber);
            const duplicateEmail = existingStudents.find(s => s.email === email);
            
            if (duplicateMatric) {
                showAlert('studentAlert', `Matric number "${matricNumber}" already exists`, 'error');
                return;
            }
            if (duplicateEmail) {
                showAlert('studentAlert', `Email "${email}" is already registered`, 'error');
                return;
            }
        }
        
        // Insert the student
        const { data, error } = await supabase
            .from('students')
            .insert([{
                matric_number: matricNumber,
                full_name: fullName,
                email: email,
                department: department,
                level: level
            }])
            .select();
        
        if (error) {
            console.error('Error adding student:', error);
            if (error.code === '23505') {
                // PostgreSQL duplicate key error
                showAlert('studentAlert', 'This student already exists in the system', 'error');
            } else {
                showAlert('studentAlert', 'Error adding student: ' + error.message, 'error');
            }
            return;
        }
        
        showAlert('studentAlert', 'Student added successfully!', 'success');
        
        // Clear form after successful submission
        setTimeout(() => {
            document.getElementById('addStudentModal').querySelector('form').reset();
            
            // Close modal after 1.5 seconds
            setTimeout(() => {
                closeModal('addStudentModal');
            }, 1500);
        }, 500);
        
        // Reload students list and update dashboard
        setTimeout(() => {
            if (typeof loadStudents === 'function') {
                loadStudents();
            }
            if (typeof loadDashboardData === 'function') {
                loadDashboardData();
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error adding student:', error);
        showAlert('studentAlert', 'An unexpected error occurred: ' + error.message, 'error');
    }
}

// Bulk Upload Students function
async function bulkUploadStudents(event) {
    event.preventDefault();
    
    try {
        const fileInput = document.getElementById('studentsCSV');
        const file = fileInput.files[0];
        
        if (!file) {
            showAlert('bulkStudentAlert', 'Please select a CSV file', 'error');
            return;
        }
        
        const text = await file.text();
        const lines = text.trim().split('\n');
        
        if (lines.length < 2) {
            showAlert('bulkStudentAlert', 'CSV file is empty or invalid', 'error');
            return;
        }
        
        const students = [];
        const errors = [];
        
        // Skip header row (line 0)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const parts = line.split(',').map(part => part.trim());
            
            if (parts.length < 5) {
                errors.push(`Line ${i + 1}: Not enough columns (expected 5, got ${parts.length})`);
                continue;
            }
            
            const [matricNumber, fullName, email, department, level] = parts;
            
            // Basic validation
            if (!matricNumber || !fullName || !email || !department || !level) {
                errors.push(`Line ${i + 1}: Missing required fields`);
                continue;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                errors.push(`Line ${i + 1}: Invalid email format "${email}"`);
                continue;
            }
            
            students.push({
                matric_number: matricNumber,
                full_name: fullName,
                email: email,
                department: department,
                level: level
            });
        }
        
        if (students.length === 0) {
            showAlert('bulkStudentAlert', 'No valid student records found in CSV', 'error');
            return;
        }
        
        // Upload in batches to avoid timeout
        const batchSize = 10;
        let successCount = 0;
        let insertedStudents = [];
        
        for (let i = 0; i < students.length; i += batchSize) {
            const batch = students.slice(i, i + batchSize);
            
            const { data: batchData, error } = await supabase
                .from('students')
                .insert(batch)
                .select();
            
            if (error) {
                console.error('Batch upload error:', error);
                errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`);
                continue;
            }
            
            successCount += batch.length;
            if (batchData) {
                insertedStudents = [...insertedStudents, ...batchData];
            }
        }
        
        let message = `Successfully added ${successCount} students.`;
        if (errors.length > 0) {
            message += `\n\n${errors.length} error(s) occurred:\n${errors.slice(0, 5).join('\n')}`;
            if (errors.length > 5) {
                message += `\n... and ${errors.length - 5} more errors`;
            }
        }
        
        showAlert('bulkStudentAlert', message, errors.length > 0 ? 'warning' : 'success');
        
        // Clear file input
        fileInput.value = '';
        
        // Reload data after successful upload
        if (successCount > 0) {
            setTimeout(() => {
                closeModal('bulkUploadStudentsModal');
                
                if (typeof loadStudents === 'function') {
                    loadStudents();
                }
                if (typeof loadDashboardData === 'function') {
                    loadDashboardData();
                }
            }, 2000);
        }
        
    } catch (error) {
        console.error('Error in bulk upload:', error);
        showAlert('bulkStudentAlert', 'Error processing CSV file: ' + error.message, 'error');
    }
}

// Add Course function (since you might need this too)
// Updated addCourse function
async function addCourse(event) {
    event.preventDefault();
    
    try {
        const courseCode = document.getElementById('courseCode').value.trim();
        const courseTitle = document.getElementById('courseTitle').value.trim();
        const duration = parseInt(document.getElementById('courseDuration').value);
        const maxAttempts = parseInt(document.getElementById('courseMaxAttempts').value);
        const showPassMark = document.getElementById('courseShowPassMark').checked;
        const showImmediateResult = document.getElementById('courseShowImmediateResult').checked;
        
        if (!courseCode || !courseTitle || !duration) {
            showAlert('courseAlert', 'Please fill all required fields', 'error');
            return;
        }
        
        // Try to insert directly
        const { data, error } = await supabase
            .from('courses')
            .insert([{
                course_code: courseCode,
                course_title: courseTitle,
                duration_minutes: duration,
                max_attempts: maxAttempts,
                show_pass_mark: showPassMark,
                show_immediate_result: showImmediateResult,
                is_active: true
            }])
            .select();
        
        if (error) {
            console.error('Error adding course:', error);
            
            if (error.code === '23505') {
                // PostgreSQL duplicate key error
                showAlert('courseAlert', `Course code "${courseCode}" already exists`, 'error');
            } else {
                showAlert('courseAlert', 'Error adding course: ' + error.message, 'error');
            }
            return;
        }
        
        showAlert('courseAlert', 'Course added successfully!', 'success');
        
        // Clear form and close modal
        setTimeout(() => {
            document.getElementById('addCourseModal').querySelector('form').reset();
            
            setTimeout(() => {
                closeModal('addCourseModal');
                
                // Reload courses and update dashboard
                if (typeof loadCourses === 'function') {
                    loadCourses();
                }
                if (typeof loadDashboardData === 'function') {
                    loadDashboardData();
                }
                if (typeof loadFilterOptions === 'function') {
                    loadFilterOptions();
                }
            }, 1500);
        }, 500);
        
    } catch (error) {
        console.error('Error adding course:', error);
        showAlert('courseAlert', 'An unexpected error occurred', 'error');
    }
}
// Add Question function
async function addQuestion(event) {
    event.preventDefault();
    
    try {
        const courseId = document.getElementById('questionCourse').value;
        const questionText = document.getElementById('questionText').value.trim();
        const optionElements = document.querySelectorAll('#questionOptions input[type="text"]');
        const correctRadio = document.querySelector('input[name="correct"]:checked');
        
        if (!courseId) {
            showAlert('questionAlert', 'Please select a course', 'error');
            return;
        }
        
        if (!questionText) {
            showAlert('questionAlert', 'Please enter the question text', 'error');
            return;
        }
        
        const options = [];
        for (let i = 0; i < optionElements.length; i++) {
            const optionText = optionElements[i].value.trim();
            if (!optionText) {
                showAlert('questionAlert', `Please fill all options (Option ${String.fromCharCode(65 + i)})`, 'error');
                return;
            }
            options.push({ text: optionText });
        }
        
        if (!correctRadio) {
            showAlert('questionAlert', 'Please select the correct answer', 'error');
            return;
        }
        
        const correctAnswer = parseInt(correctRadio.value);
        
        const { data, error } = await supabase
            .from('questions')
            .insert([{
                course_id: courseId,
                question_text: questionText,
                options: JSON.stringify(options),
                correct_answer: correctAnswer
            }])
            .select();
        
        if (error) {
            console.error('Error adding question:', error);
            showAlert('questionAlert', 'Error adding question: ' + error.message, 'error');
            return;
        }
        
        showAlert('questionAlert', 'Question added successfully!', 'success');
        
        // Clear form after successful submission
        setTimeout(() => {
            document.getElementById('addQuestionModal').querySelector('form').reset();
            
            setTimeout(() => {
                closeModal('addQuestionModal');
                
                // Reload questions and update dashboard
                if (typeof loadQuestions === 'function') {
                    loadQuestions();
                }
                if (typeof loadDashboardData === 'function') {
                    loadDashboardData();
                }
            }, 1500);
        }, 500);
        
    } catch (error) {
        console.error('Error adding question:', error);
        showAlert('questionAlert', 'An unexpected error occurred', 'error');
    }
}

// Updated export section at the end of auth.js:
window.adminLogin = adminLogin;
window.logout = logout;
window.checkAuth = checkAuth;
window.addStudent = addStudent;
window.bulkUploadStudents = bulkUploadStudents;
window.addCourse = addCourse;
window.addQuestion = addQuestion;
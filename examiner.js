// examiner.js - Examiner Portal Logic

let currentExaminer = null;
let liveMonitoringInterval = null;
let allResults = [];

// Examiner Login
async function examinerLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const { data, error } = await supabase
            .from('examiners')
            .select('*')
            .eq('username', username)
            .single();
        
        if (error || !data) {
            showAlert('loginAlert', 'Invalid username or password', 'error');
            return;
        }
        
        // Simple password check (use proper hashing in production)
        if (password === data.password_hash) {
            currentExaminer = data;
            sessionStorage.setItem('examiner', JSON.stringify(data));
            
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('mainDashboard').classList.remove('hidden');
            document.getElementById('examinerName').textContent = data.full_name;
            
            loadDashboardData();
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
    sessionStorage.removeItem('examiner');
    currentExaminer = null;
    
    if (liveMonitoringInterval) {
        clearInterval(liveMonitoringInterval);
        liveMonitoringInterval = null;
    }
    
    document.getElementById('mainDashboard').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        await Promise.all([
            updateStudentCount(),
            updateActiveExamsCount(),
            updateExamsTodayCount(),
            updateTotalResultsCount()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Update Student Count
async function updateStudentCount() {
    try {
        const { count, error } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        
        document.getElementById('totalStudents').textContent = count || 0;
    } catch (error) {
        console.error('Error getting student count:', error);
        document.getElementById('totalStudents').textContent = '0';
    }
}

// Update Active Exams Count
async function updateActiveExamsCount() {
    try {
        const { count, error } = await supabase
            .from('exam_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'in_progress');
        
        if (error) throw error;
        
        document.getElementById('activeExams').textContent = count || 0;
    } catch (error) {
        console.error('Error getting active exams count:', error);
        document.getElementById('activeExams').textContent = '0';
    }
}

// Update Exams Today Count
async function updateExamsTodayCount() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count, error } = await supabase
            .from('exam_results')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());
        
        if (error) throw error;
        
        document.getElementById('examsToday').textContent = count || 0;
    } catch (error) {
        console.error('Error getting exams today count:', error);
        document.getElementById('examsToday').textContent = '0';
    }
}

// Update Total Results Count
async function updateTotalResultsCount() {
    try {
        const { count, error } = await supabase
            .from('exam_results')
            .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        
        document.getElementById('totalResults').textContent = count || 0;
    } catch (error) {
        console.error('Error getting total results count:', error);
        document.getElementById('totalResults').textContent = '0';
    }
}

// Load All Students
async function loadStudents() {
    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
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
                        <button class="btn btn-sm btn-view" onclick="viewStudentDetails('${student.id}')">View Details</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

// View Student Details
async function viewStudentDetails(studentId) {
    try {
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single();
        
        if (studentError) throw studentError;
        
        const { data: results, error: resultsError } = await supabase
            .from('exam_results')
            .select(`
                *,
                courses (course_code, course_title)
            `)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });
        
        if (resultsError) throw resultsError;
        
        const modalContent = document.getElementById('studentDetailsContent');
        modalContent.innerHTML = `
            <div style="margin-bottom: 1.5rem;">
                <h3 style="color: #11998e; margin-bottom: 1rem;">Student Information</h3>
                <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px;">
                    <p style="margin-bottom: 0.5rem;"><strong>Matric Number:</strong> ${student.matric_number}</p>
                    <p style="margin-bottom: 0.5rem;"><strong>Full Name:</strong> ${student.full_name}</p>
                    <p style="margin-bottom: 0.5rem;"><strong>Email:</strong> ${student.email}</p>
                    <p style="margin-bottom: 0.5rem;"><strong>Department:</strong> ${student.department}</p>
                    <p><strong>Level:</strong> ${student.level || 'N/A'}</p>
                </div>
            </div>
            
            <div>
                <h3 style="color: #11998e; margin-bottom: 1rem;">Exam History</h3>
                ${results.length === 0 ? 
                    '<p style="color: #999; text-align: center; padding: 2rem;">No exams taken yet</p>' :
                    `<div style="max-height: 400px; overflow-y: auto;">
                        ${results.map(result => {
                            const date = new Date(result.created_at).toLocaleDateString('en-GB');
                            const isPassed = result.score >= 50;
                            return `
                                <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                        <strong>${result.courses.course_code}</strong>
                                        <span style="color: ${isPassed ? '#4caf50' : '#f44336'}; font-weight: bold;">
                                            ${result.score.toFixed(1)}%
                                        </span>
                                    </div>
                                    <p style="font-size: 0.9rem; color: #666; margin-bottom: 0.3rem;">
                                        ${result.courses.course_title}
                                    </p>
                                    <p style="font-size: 0.85rem; color: #999;">
                                        Score: ${result.correct_answers}/${result.total_questions} | 
                                        Date: ${date} | 
                                        Status: ${isPassed ? '✅ Passed' : '❌ Failed'}
                                    </p>
                                </div>
                            `;
                        }).join('')}
                    </div>`
                }
            </div>
        `;
        
        document.getElementById('studentDetailsModal').classList.add('active');
    } catch (error) {
        console.error('Error viewing student details:', error);
        alert('Error loading student details');
    }
}

// Load Live Monitoring
async function loadLiveMonitoring() {
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
        
        const container = document.getElementById('liveExamsContainer');
        const countElement = document.getElementById('liveActiveCount');
        
        countElement.textContent = data.length;
        
        if (data.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No active exams at the moment</p>';
            return;
        }
        
        container.innerHTML = data.map(session => {
            const startTime = new Date(session.start_time);
            const now = new Date();
            const elapsed = Math.floor((now - startTime) / 60000); // minutes
            const remaining = session.duration_minutes - elapsed;
            
            let timerClass = '';
            if (remaining <= 5) timerClass = 'danger';
            else if (remaining <= 10) timerClass = 'warning';
            
            return `
                <div class="live-exam-card">
                    <div class="live-exam-header">
                        <div>
                            <strong style="font-size: 1.1rem;">${session.students.full_name}</strong>
                            <p style="color: #666; margin-top: 0.3rem; font-size: 0.9rem;">
                                ${session.students.matric_number} | Level: ${session.students.level || 'N/A'}
                            </p>
                            <p style="color: #11998e; margin-top: 0.3rem; font-weight: 500;">
                                ${session.courses.course_code} - ${session.courses.course_title}
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <div class="live-timer ${timerClass}">
                                ${remaining} min
                            </div>
                            <p style="font-size: 0.85rem; color: #999; margin-top: 0.5rem;">
                                Time Remaining
                            </p>
                        </div>
                    </div>
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e0e0e0;">
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; font-size: 0.9rem;">
                            <div>
                                <strong>Started:</strong><br>
                                ${startTime.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}
                            </div>
                            <div>
                                <strong>Duration:</strong><br>
                                ${session.duration_minutes} minutes
                            </div>
                            <div>
                                <strong>Elapsed:</strong><br>
                                ${elapsed} minutes
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading live monitoring:', error);
        const container = document.getElementById('liveExamsContainer');
        container.innerHTML = '<p style="text-align: center; color: #f44336; padding: 2rem;">Error loading active exams</p>';
    }
}

// Load Results
async function loadResults(filters = {}) {
    try {
        let query = supabase
            .from('exam_results')
            .select(`
                *,
                students (matric_number, full_name, level),
                courses (course_code, course_title)
            `);
        
        if (filters.courseId) {
            query = query.eq('course_id', filters.courseId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allResults = data;
        
        let filteredResults = data;
        if (filters.level) {
            filteredResults = data.filter(result => result.students.level === filters.level);
        }
        
        displayResults(filteredResults);
        await loadFilterOptions();
    } catch (error) {
        console.error('Error loading results:', error);
    }
}

// Display Results
function displayResults(results) {
    const tbody = document.getElementById('resultsTable');
    
    if (results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">No exam results found</td></tr>';
        return;
    }
    
    tbody.innerHTML = results.map(result => {
        const date = new Date(result.created_at).toLocaleDateString('en-GB');
        const scoreColor = result.score >= 70 ? '#4caf50' : result.score >= 50 ? '#ff9800' : '#f44336';
        
        return `
        <tr>
            <td>${result.students.matric_number}</td>
            <td>${result.students.full_name}</td>
            <td>${result.students.level || 'N/A'}</td>
            <td>${result.courses.course_code}</td>
            <td>
                <strong style="color: ${scoreColor};">
                    ${result.score.toFixed(1)}% (${result.correct_answers}/${result.total_questions})
                </strong>
            </td>
            <td>${date}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-view" onclick="viewResultDetails('${result.id}')">View Details</button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
    
    document.getElementById('filteredResultsCount').textContent = results.length;
}

// Load Filter Options
async function loadFilterOptions() {
    try {
        const { data: courses, error } = await supabase
            .from('courses')
            .select('id, course_code, course_title')
            .order('course_code');
        
        if (error) throw error;
        
        const courseSelect = document.getElementById('filterCourse');
        courseSelect.innerHTML = '<option value="">All Courses</option>' +
            courses.map(course => 
                `<option value="${course.id}">${course.course_code} - ${course.course_title}</option>`
            ).join('');
    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

// Apply Result Filters
function applyResultFilters() {
    const courseId = document.getElementById('filterCourse').value;
    const level = document.getElementById('filterLevel').value;
    
    const filters = {};
    if (courseId) filters.courseId = courseId;
    if (level) filters.level = level;
    
    loadResults(filters);
}

// Clear Result Filters
function clearResultFilters() {
    document.getElementById('filterCourse').value = '';
    document.getElementById('filterLevel').value = '';
    loadResults();
}

// View Result Details
async function viewResultDetails(resultId) {
    try {
        const { data, error } = await supabase
            .from('exam_results')
            .select(`
                *,
                students (matric_number, full_name, department, level),
                courses (course_code, course_title)
            `)
            .eq('id', resultId)
            .single();
        
        if (error) throw error;
        
        const isPassed = data.score >= 50;
        const date = new Date(data.created_at).toLocaleString('en-GB');
        
        const modalContent = document.getElementById('resultDetailsContent');
        modalContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="font-size: 3rem; font-weight: bold; color: ${isPassed ? '#4caf50' : '#f44336'};">
                    ${data.score.toFixed(1)}%
                </div>
                <p style="font-size: 1.2rem; color: #666; margin-top: 0.5rem;">
                    ${isPassed ? '✅ Passed' : '❌ Failed'}
                </p>
            </div>
            
            <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
                <h3 style="margin-bottom: 1rem; color: #333;">Student Information</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div>
                        <p style="color: #666; font-size: 0.9rem;">Name</p>
                        <p style="font-weight: 600;">${data.students.full_name}</p>
                    </div>
                    <div>
                        <p style="color: #666; font-size: 0.9rem;">Matric Number</p>
                        <p style="font-weight: 600;">${data.students.matric_number}</p>
                    </div>
                    <div>
                        <p style="color: #666; font-size: 0.9rem;">Department</p>
                        <p style="font-weight: 600;">${data.students.department}</p>
                    </div>
                    <div>
                        <p style="color: #666; font-size: 0.9rem;">Level</p>
                        <p style="font-weight: 600;">${data.students.level || 'N/A'}</p>
                    </div>
                </div>
            </div>
            
            <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
                <h3 style="margin-bottom: 1rem; color: #333;">Exam Details</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div>
                        <p style="color: #666; font-size: 0.9rem;">Course</p>
                        <p style="font-weight: 600;">${data.courses.course_code}</p>
                    </div>
                    <div>
                        <p style="color: #666; font-size: 0.9rem;">Course Title</p>
                        <p style="font-weight: 600;">${data.courses.course_title}</p>
                    </div>
                    <div>
                        <p style="color: #666; font-size: 0.9rem;">Total Questions</p>
                        <p style="font-weight: 600;">${data.total_questions}</p>
                    </div>
                    <div>
                        <p style="color: #666; font-size: 0.9rem;">Correct Answers</p>
                        <p style="font-weight: 600; color: #4caf50;">${data.correct_answers}</p>
                    </div>
                    <div>
                        <p style="color: #666; font-size: 0.9rem;">Wrong Answers</p>
                        <p style="font-weight: 600; color: #f44336;">${data.total_questions - data.correct_answers}</p>
                    </div>
                    <div>
                        <p style="color: #666; font-size: 0.9rem;">Time Taken</p>
                        <p style="font-weight: 600;">${data.time_taken || 'N/A'} minutes</p>
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <p style="color: #666; font-size: 0.9rem;">Date Submitted</p>
                        <p style="font-weight: 600;">${date}</p>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('resultDetailsModal').classList.add('active');
    } catch (error) {
        console.error('Error viewing result details:', error);
        alert('Error loading result details');
    }
}

// Print Filtered Results
function printFilteredResults() {
    const courseId = document.getElementById('filterCourse').value;
    const level = document.getElementById('filterLevel').value;
    
    let filteredResults = allResults;
    
    if (courseId) {
        filteredResults = filteredResults.filter(r => r.course_id === courseId);
    }
    
    if (level) {
        filteredResults = filteredResults.filter(r => r.students.level === level);
    }
    
    if (filteredResults.length === 0) {
        alert('No results to print');
        return;
    }
    
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
                th { background: #11998e; color: white; }
                tr:nth-child(even) { background: #f9f9f9; }
                .pass { color: #4caf50; font-weight: bold; }
                .fail { color: #f44336; font-weight: bold; }
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

// Export Filtered Results
function exportFilteredResults() {
    const courseId = document.getElementById('filterCourse').value;
    const level = document.getElementById('filterLevel').value;
    
    let filteredResults = allResults;
    
    if (courseId) {
        filteredResults = filteredResults.filter(r => r.course_id === courseId);
    }
    
    if (level) {
        filteredResults = filteredResults.filter(r => r.students.level === level);
    }
    
    if (filteredResults.length === 0) {
        alert('No results to export');
        return;
    }
    
    let csv = 'S/N,Matric Number,Student Name,Level,Course Code,Course Title,Score (%),Correct Answers,Total Questions,Status,Date\n';
    
    filteredResults.forEach((result, index) => {
        const date = new Date(result.created_at).toLocaleDateString('en-GB');
        const status = result.score >= 50 ? 'PASS' : 'FAIL';
        csv += `${index + 1},${result.students.matric_number},${result.students.full_name},${result.students.level || 'N/A'},${result.courses.course_code},${result.courses.course_title},${result.score.toFixed(1)},${result.correct_answers},${result.total_questions},${status},${date}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exam_results_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Close Modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Show Alert
function showAlert(elementId, message, type) {
    const alertDiv = document.getElementById(elementId);
    alertDiv.innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;
    
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 3000);
}

// Switch Section
function switchSection(sectionName) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionName).classList.add('active');
    
    const titles = {
        'dashboard': 'Dashboard',
        'students': 'Student Management',
        'live-monitoring': 'Live Exam Monitoring',
        'results': 'Exam Results'
    };
    
    document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';
    
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'students':
            loadStudents();
            break;
        case 'live-monitoring':
            loadLiveMonitoring();
            if (liveMonitoringInterval) clearInterval(liveMonitoringInterval);
            liveMonitoringInterval = setInterval(loadLiveMonitoring, 10000);
            break;
        case 'results':
            loadResults();
            if (liveMonitoringInterval) {
                clearInterval(liveMonitoringInterval);
                liveMonitoringInterval = null;
            }
            break;
    }
}

// Navigation Setup
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        const section = this.getAttribute('data-section');
        switchSection(section);
    });
});

// Check Auth on Load
window.addEventListener('load', function() {
    const examiner = sessionStorage.getItem('examiner');
    if (examiner) {
        currentExaminer = JSON.parse(examiner);
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainDashboard').classList.remove('hidden');
        document.getElementById('examinerName').textContent = currentExaminer.full_name;
        loadDashboardData();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (liveMonitoringInterval) {
        clearInterval(liveMonitoringInterval);
    }
});
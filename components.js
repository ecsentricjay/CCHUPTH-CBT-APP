// components.js - HTML Component Templates (UPDATED with enhanced features)

const Components = {
    // Sidebar Component
    
    // Update the sidebar component
    sidebar: () => `
        <div class="sidebar">
            <div class="logo-container">
                <div class="logo-content">
                    <img src="assets/school-logo.png" alt="School Logo" class="school-logo">
                    <div class="logo-text">
                        <h2>CCHUPTH CBT</h2>
                        <small>Admin Dashboard</small>
                    </div>
                </div>
            </div>
            <div class="nav-item active" data-section="dashboard">
                <span class="nav-icon">📊</span>
                <span>Dashboard</span>
            </div>
            <div class="nav-item" data-section="students">
                <span class="nav-icon">👨‍🎓</span>
                <span>Students</span>
            </div>
            <div class="nav-item" data-section="courses">
                <span class="nav-icon">📚</span>
                <span>Courses</span>
            </div>
            <div class="nav-item" data-section="questions">
                <span class="nav-icon">❓</span>
                <span>Objective Questions</span>
            </div>
            <div class="nav-item" data-section="subjectiveQuestions">
                <span class="nav-icon">📝</span>
                <span>Subjective Questions</span>
            </div>
            <div class="nav-item" data-section="results">
                <span class="nav-icon">📈</span>
                <span>Results & Analytics</span>
            </div>
            <button class="logout-btn" onclick="logout()">Logout</button>
        
            <!-- Add footer to sidebar -->
            <div class="sidebar-footer">
                <div style="color: #666; font-size: 0.8rem; text-align: center; padding: 1rem;">
                    <div style="margin-bottom: 0.5rem; font-weight: 600;">
                        College of Community Health<br>
                        University of Port Harcourt
                    </div>
                    <div style="border-top: 1px solid #e0e0e0; padding-top: 0.5rem; font-size: 0.7rem;">
                        Copyright © Jugo Tech Solutions<br>
                        📞 09129562739
                    </div>
                </div>
            </div>
        </div>
    `,

    // Header Component
    header: () => `
        <div class="header">
            <h1 id="pageTitle">Dashboard</h1>
            <div class="admin-info">
                <div class="admin-avatar">AD</div>
                <span id="adminName">Admin</span>
            </div>
        </div>
    `,

    // Dashboard Section
    dashboardSection: () => `
        <div class="content-section active" id="dashboard">
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total Students</h3>
                    <div class="stat-value" id="totalStudents">0</div>
                    <div class="stat-trend">↑ Active</div>
                </div>
                <div class="stat-card">
                    <h3>Total Courses</h3>
                    <div class="stat-value" id="totalCourses">0</div>
                    <div class="stat-trend">Available</div>
                </div>
                <div class="stat-card">
                    <h3>Total Questions</h3>
                    <div class="stat-value" id="totalQuestions">0</div>
                    <div class="stat-trend">In Question Bank</div>
                </div>
                <div class="stat-card">
                    <h3>Exams Taken</h3>
                    <div class="stat-value" id="totalExams">0</div>
                    <div class="stat-trend">All Time</div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h2>Quick Actions</h2>
                </div>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="openAddStudentModal()">+ Add Student</button>
                    <button class="btn btn-primary" onclick="openAddCourseModal()">+ Add Course</button>
                    <button class="btn btn-primary" onclick="openAddQuestionModal()">+ Add Question</button>
                    <button class="btn btn-secondary" onclick="startLiveMonitoring()">🔴 Live Monitoring</button>
                </div>
            </div>
        </div>
    `,

    // Students Section (UPDATED with filters and bulk actions)
    studentsSection: () => `
        <div class="content-section" id="students">
            <div class="card">
                <div class="card-header">
                    <h2>Student Management</h2>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-primary" onclick="openAddStudentModal()">+ Add Student</button>
                        <button class="btn btn-secondary" onclick="openBulkUploadStudentsModal()">📤 Bulk Upload</button>
                    </div>
                </div>
                
                <!-- Filters -->
                <div class="filter-section">
                    <h3>🔍 Filter Students</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Department</label>
                            <select id="filterDepartment" class="form-control">
                                <option value="">All Departments</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Level</label>
                            <select id="resultFilterLevel" class="form-control">
                                <option value="">All Levels</option>
                                <option value="100">100 Level</option>
                                <option value="200">200 Level</option>
                                <option value="300">300 Level</option>
                                <option value="400">400 Level</option>
                                <option value="500">500 Level</option>
                            </select>
                        </div>
                        <div style="display: flex; align-items: flex-end; gap: 0.5rem;">
                            <button class="btn btn-primary" onclick="applyStudentFilters()" style="flex: 1;">Apply Filters</button>
                            <button class="btn btn-secondary" onclick="clearStudentFilters()" style="flex: 1;">Clear</button>
                        </div>
                    </div>
                    <div style="margin-top: 1rem; color: #666; font-size: 0.9rem;">
                        <strong>Showing:</strong> <span id="filteredStudentsCount">0</span> students
                    </div>
                </div>
                
                <!-- Bulk Actions -->
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #e9ecef;">
                    <h4 style="margin-bottom: 0.5rem; color: #333;">Bulk Actions</h4>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn btn-secondary" onclick="exportFilteredStudents()">📥 Export CSV</button>
                        <button class="btn btn-danger" onclick="deleteFilteredStudents()" style="background: #dc3545; border-color: #dc3545;">
                            🗑️ Delete Filtered Students
                        </button>
                        <button class="btn btn-danger" onclick="deleteAllStudents()" style="background: #721c24; border-color: #721c24;">
                            ⚠️ Delete ALL Students
                        </button>
                    </div>
                    <small style="color: #999; display: block; margin-top: 0.5rem;">
                        Note: Deleting students will also remove all their exam records.
                    </small>
                </div>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Matric Number</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Level</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="studentsTable">
                            <tr><td colspan="6" class="loading">Loading students...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,

    // Courses Section
    coursesSection: () => `
        <div class="content-section" id="courses">
            <div class="card">
                <div class="card-header">
                    <h2>Course Management</h2>
                    <button class="btn btn-primary" onclick="openAddCourseModal()">+ Add Course</button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Course Code</th>
                                <th>Course Title</th>
                                <th>Duration (mins)</th>
                                <th>Total Questions</th>
                                <th>Max Attempts</th>
                                <th>Status</th>
                                <th>Display Settings</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="coursesTable">
                            <tr><td colspan="8" class="loading">Loading courses...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,

    // Questions Section (UPDATED with filters and bulk actions)
    questionsSection: () => `
        <div class="content-section" id="questions">
            <div class="card">
                <div class="card-header">
                    <h2>Question Bank</h2>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-primary" onclick="openAddQuestionModal()">+ Add Question</button>
                        <button class="btn btn-secondary" onclick="openBulkUploadQuestionsModal()">📤 Bulk Upload</button>
                    </div>
                </div>
                
                <!-- Filters -->
                <div class="filter-section">
                    <h3>🔍 Filter Questions</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Course</label>
                            <select id="filterQuestionCourse" class="form-control">
                                <option value="">All Courses</option>
                            </select>
                        </div>
                        <div style="display: flex; align-items: flex-end; gap: 0.5rem;">
                            <button class="btn btn-primary" onclick="applyQuestionFilters()" style="flex: 1;">Apply Filters</button>
                            <button class="btn btn-secondary" onclick="clearQuestionFilters()" style="flex: 1;">Clear</button>
                        </div>
                    </div>
                    <div style="margin-top: 1rem; color: #666; font-size: 0.9rem;">
                        <strong>Showing:</strong> <span id="filteredQuestionsCount">0</span> questions
                    </div>
                </div>
                
                <!-- Bulk Actions -->
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #e9ecef;">
                    <h4 style="margin-bottom: 0.5rem; color: #333;">Bulk Actions</h4>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn btn-secondary" onclick="exportFilteredQuestions()">📥 Export CSV</button>
                        <button class="btn btn-danger" onclick="deleteFilteredQuestions()" style="background: #dc3545; border-color: #dc3545;">
                            🗑️ Delete Filtered Questions
                        </button>
                        <button class="btn btn-danger" onclick="deleteAllQuestions()" style="background: #721c24; border-color: #721c24;">
                            ⚠️ Delete ALL Questions
                        </button>
                    </div>
                    <small style="color: #999; display: block; margin-top: 0.5rem;">
                        Note: Deleting questions cannot be undone.
                    </small>
                </div>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Question</th>
                                <th>Options</th>
                                <th>Correct Answer</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="questionsTable">
                            <tr><td colspan="5" class="loading">Loading questions...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    // Add this new component to your Components object in components.js
    subjectiveQuestionsSection: () => `
        <div class="content-section" id="subjectiveQuestions">
            <div class="card">
                <div class="card-header">
                    <h2><i class="fas fa-edit"></i> Subjective Questions Bank</h2>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-primary" onclick="openAddSubjectiveQuestionModal()">
                            <i class="fas fa-plus"></i> Add Subjective Question
                        </button>
                        <button class="btn btn-secondary" onclick="openBulkUploadSubjectiveQuestionsModal()">
                            <i class="fas fa-file-upload"></i> Bulk Upload
                        </button>
                    </div>
                </div>
            
                <!-- Filters -->
                <div class="filter-section">
                    <h3><i class="fas fa-filter"></i> Filter Subjective Questions</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Course</label>
                            <select id="filterSubjectiveCourse" class="form-control">
                                <option value="">All Courses</option>
                            </select>
                        </div>
                        <div style="display: flex; align-items: flex-end; gap: 0.5rem;">
                            <button class="btn btn-primary" onclick="applySubjectiveFilters()" style="flex: 1;">
                                Apply Filters
                            </button>
                            <button class="btn btn-secondary" onclick="clearSubjectiveFilters()" style="flex: 1;">
                                Clear
                            </button>
                        </div>
                    </div>
                    <div style="margin-top: 1rem; color: #666; font-size: 0.9rem;">
                        <strong>Showing:</strong> <span id="filteredSubjectiveQuestionsCount">0</span> subjective questions
                    </div>
                </div>
            
                <!-- Bulk Actions -->
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #e9ecef;">
                    <h4 style="margin-bottom: 0.5rem; color: #333;"><i class="fas fa-bolt"></i> Bulk Actions</h4>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn btn-secondary" onclick="exportSubjectiveQuestions()">
                            <i class="fas fa-download"></i> Export CSV
                        </button>
                        <button class="btn btn-danger" onclick="deleteFilteredSubjectiveQuestions()" style="background: #dc3545; border-color: #dc3545;">
                            <i class="fas fa-trash"></i> Delete Filtered Questions
                        </button>
                        <button class="btn btn-danger" onclick="deleteAllSubjectiveQuestions()" style="background: #721c24; border-color: #721c24;">
                            <i class="fas fa-exclamation-triangle"></i> Delete ALL Subjective Questions
                        </button>
                    </div>
                    <small style="color: #999; display: block; margin-top: 0.5rem;">
                        Note: Deleting subjective questions will also remove all student answers to these questions.
                    </small>
                </div>
            
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Question</th>
                                <th>Max Words</th>
                                <th>Marks</th>
                                <th>Date Added</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="subjectiveQuestionsTable">
                            <tr><td colspan="6" class="loading">Loading subjective questions...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,

    // Also add these modals to your Components.modals() function:
    addSubjectiveQuestionModal: () => `
        <div class="modal" id="addSubjectiveQuestionModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-edit"></i> Add Subjective Question</h2>
                    <button class="close-btn" onclick="closeModal('addSubjectiveQuestionModal')">&times;</button>
                </div>
                <div id="subjectiveAlert"></div>
                <form onsubmit="addSubjectiveQuestion(event)">
                    <div class="form-group">
                        <label><i class="fas fa-book"></i> Select Course</label>
                        <select class="form-control" required id="subjectiveCourse">
                            <option value="">-- Select Course --</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-question-circle"></i> Question Text</label>
                        <textarea class="form-control" id="subjectiveQuestionText" rows="6" required 
                                placeholder="Enter the essay question here..."></textarea>
                    </div>
                
                    <!-- Grading Type Selection -->
                    <div class="form-group">
                        <label><i class="fas fa-robot"></i> Grading Method</label>
                        <select class="form-control" id="subjectiveGradingType" onchange="toggleGradingType()" required>
                            <option value="manual">Manual Grading Only</option>
                            <option value="auto">Auto-Grading</option>
                            <option value="mixed">Mixed (Auto + Manual)</option>
                        </select>
                        <small style="color: #666;">
                            • Manual: Instructor grades manually<br>
                            • Auto: System auto-grades using keywords and similarity<br>
                            • Mixed: Auto-grading with instructor review
                        </small>
                    </div>
                
                    <!-- Auto-Grading Fields (initially hidden) -->
                    <div id="autoGradingFields" style="display: none; background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <div class="form-group">
                            <label><i class="fas fa-check-circle"></i> Expected Answer (for auto-grading)</label>
                            <textarea class="form-control" id="expectedAnswer" rows="4" 
                                    placeholder="Provide a model answer for auto-grading comparison..."></textarea>
                            <small style="color: #666;">Used for text similarity comparison</small>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-key"></i> Keywords (comma-separated)</label>
                            <input type="text" class="form-control" id="keywords" 
                                placeholder="diagnosis, symptoms, treatment, prognosis">
                            <small style="color: #666;">Important terms students should include</small>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label><i class="fas fa-percentage"></i> Keyword Weightage (%)</label>
                                <input type="range" class="form-control" id="keywordWeightage" min="0" max="100" value="60">
                                <div style="text-align: center; font-size: 0.9rem;">
                                    <span id="weightageValue">60%</span> of score from keywords
                                </div>
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-font"></i> Minimum Word Count</label>
                                <input type="number" class="form-control" id="minWordCount" value="50" min="10">
                            </div>
                        </div>
                    </div>
                
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label><i class="fas fa-font"></i> Maximum Words</label>
                            <input type="number" class="form-control" id="subjectiveMaxWords" value="500" min="50" max="2000">
                            <small style="color: #666;">Recommended: 200-500 words</small>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-star"></i> Marks</label>
                            <input type="number" class="form-control" id="subjectiveMarks" value="10" min="1" max="100">
                            <small style="color: #666;">Total marks for this question</small>
                        </div>
                    </div>
                
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Add Subjective Question
                    </button>
                </form>
            </div>
        </div>
    `,
    bulkUploadSubjectiveQuestionsModal: () => `
        <div class="modal" id="bulkUploadSubjectiveQuestionsModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-file-upload"></i> Bulk Upload Subjective Questions</h2>
                    <button class="close-btn" onclick="closeModal('bulkUploadSubjectiveQuestionsModal')">&times;</button>
                </div>
                <div id="bulkSubjectiveAlert"></div>
            
                <div class="info-box">
                    <strong><i class="fas fa-info-circle"></i> CSV Format:</strong><br>
                    Question, Max Words, Marks<br>
                    <small>Max Words and Marks are optional (default: 500 words, 10 marks)</small>
                    <br><br>
                    <strong>Example:</strong><br>
                    <code style="font-size: 0.9rem; color: #666;">
                    "Explain the diagnosis process for chronic symptoms.",500,15<br>
                    "Discuss ethical considerations in community health.",300,10<br>
                    "Describe preventive medicine in modern healthcare.",400,12
                    </code>
                </div>
            
                <button class="btn btn-secondary" onclick="downloadSubjectiveTemplate()" style="margin-bottom: 1rem; width: 100%;">
                    <i class="fas fa-download"></i> Download CSV Template
                </button>
            
                <form onsubmit="bulkUploadSubjectiveQuestions(event)">
                    <div class="form-group">
                        <label><i class="fas fa-book"></i> Select Course</label>
                        <select class="form-control" required id="bulkSubjectiveCourse">
                            <option value="">-- Select Course --</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-file-csv"></i> Select CSV File</label>
                        <input type="file" id="subjectiveQuestionsCSV" class="form-control" accept=".csv" required>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-upload"></i> Upload Subjective Questions
                    </button>
                </form>
            </div>
        </div>
    `,

    // Results Section
    resultsSection: () => `
        <div class="content-section" id="results">
            <div class="card">
                <div class="card-header">
                    <h2>Exam Results & Analytics</h2>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-primary" onclick="startLiveMonitoring()">🔴 Live Monitoring</button>
                        <button class="btn btn-secondary" onclick="printFilteredResults()">🖨️ Print</button>
                        <button class="btn btn-secondary" onclick="exportFilteredResults()">📥 Export CSV</button>
                    </div>
                </div>
                
                <!-- Filters -->
                <div class="filter-section">
                    <h3>🔍 Filter Results</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Course</label>
                            <select id="filterCourse" class="form-control">
                                <option value="">All Courses</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Level</label>
                            <select id="resultFilterLevel" class="form-control">
                                <option value="">All Levels</option>
                                <option value="100">100 Level</option>
                                <option value="200">200 Level</option>
                                <option value="300">300 Level</option>
                                <option value="400">400 Level</option>
                                <option value="500">500 Level</option>
                            </select>
                        </div>
                        <div style="display: flex; align-items: flex-end; gap: 0.5rem;">
                            <button class="btn btn-primary" onclick="applyResultFilters()" style="flex: 1;">Apply Filters</button>
                            <button class="btn btn-secondary" onclick="clearResultFilters()" style="flex: 1;">Clear</button>
                        </div>
                    </div>
                    <div style="margin-top: 1rem; color: #666; font-size: 0.9rem;">
                        <strong>Showing:</strong> <span id="filteredResultsCount">0</span> results
                    </div>
                </div>

                <!-- Bulk Actions -->
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #e9ecef;">
                    <h4 style="margin-bottom: 0.5rem; color: #333;">⚡ Bulk Actions</h4>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn btn-danger" onclick="deleteFilteredResults()" style="background: #dc3545; border-color: #dc3545;">
                            🗑️ Delete Filtered Results
                        </button>
                        <button class="btn btn-danger" onclick="deleteAllResults()" style="background: #721c24; border-color: #721c24;">
                            ⚠️ Delete ALL Results
                        </button>
                    </div>
                    <small style="color: #999; display: block; margin-top: 0.5rem;">
                        Note: Deleting results cannot be undone. Use with caution.
                    </small>
                </div>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Matric Number</th>
                                <th>Student Name</th>
                                <th>Level</th>
                                <th>Course</th>
                                <th>Score (%)</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="resultsTable">
                            <tr><td colspan="7" class="loading">Loading results...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,

    // All Modals
    modals: () => `
        ${Components.addStudentModal()}
        ${Components.addCourseModal()}
        ${Components.courseSettingsModal()}
        ${Components.addQuestionModal()}
        ${Components.bulkUploadStudentsModal()}
        ${Components.bulkUploadQuestionsModal()}
        ${Components.studentAttemptsModal()}
        ${Components.liveMonitoringModal()}
        ${Components.addSubjectiveQuestionModal()}  <!-- ADD THIS -->
        ${Components.bulkUploadSubjectiveQuestionsModal()}  <!-- ADD THIS -->
    `,

    // Add Student Modal
    addStudentModal: () => `
        <div class="modal" id="addStudentModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add New Student</h2>
                    <button class="close-btn" onclick="closeModal('addStudentModal')">&times;</button>
                </div>
                <div id="studentAlert"></div>
                <form onsubmit="event.preventDefault(); addStudent(event);">
                    <div class="form-group">
                        <label>Matric Number</label>
                        <input type="text" id="studentMatric" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="studentName" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="studentEmail" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Department</label>
                        <input type="text" id="studentDept" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Level</label>
                        <select id="studentLevel" class="form-control" required>
                            <option value="">-- Select Level --</option>
                            <option value="100">100 Level</option>
                            <option value="200">200 Level</option>
                            <option value="300">300 Level</option>
                            <option value="400">400 Level</option>
                            <option value="500">500 Level</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Add Student</button>
                </form>
            </div>
        </div>
    `,

    // Add Course Modal
    addCourseModal: () => `
        <div class="modal" id="addCourseModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add New Course</h2>
                    <button class="close-btn" onclick="closeModal('addCourseModal')">&times;</button>
                </div>
                <div id="courseAlert"></div>
                <form onsubmit="addCourse(event)">
                    <div class="form-group">
                        <label>Course Code</label>
                        <input type="text" id="courseCode" class="form-control" placeholder="e.g. CSC101" required>
                    </div>
                    <div class="form-group">
                        <label>Course Title</label>
                        <input type="text" id="courseTitle" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Exam Duration (minutes)</label>
                        <input type="number" id="courseDuration" class="form-control" value="60" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>Maximum Attempts</label>
                        <input type="number" id="courseMaxAttempts" class="form-control" value="3" min="1" required>
                    </div>
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" id="courseShowPassMark" style="width: auto; cursor: pointer;" checked>
                            <span>Show Pass Mark to Students (50%)</span>
                        </label>
                    </div>
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" id="courseShowImmediateResult" style="width: auto; cursor: pointer;" checked>
                            <span>Show Results Immediately After Submission</span>
                        </label>
                    </div>
                    <button type="submit" class="btn btn-primary">Add Course</button>
                </form>
            </div>
        </div>
    `,

    // Course Settings Modal
    courseSettingsModal: () => `
        <div class="modal" id="courseSettingsModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Course Settings</h2>
                    <button class="close-btn" onclick="closeModal('courseSettingsModal')">&times;</button>
                </div>
                <div id="courseSettingsAlert"></div>
                <form onsubmit="updateCourseSettings(event)">
                    <input type="hidden" id="settingsCourseId">
                    
                    <div class="form-group">
                        <label>Course Code</label>
                        <input type="text" id="settingsCourseCode" class="form-control" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Course Title</label>
                        <input type="text" id="settingsCourseTitle" class="form-control" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Exam Duration (minutes)</label>
                        <input type="number" id="settingsDuration" class="form-control" min="1" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Maximum Attempts</label>
                        <input type="number" id="settingsMaxAttempts" class="form-control" min="1" required>
                    </div>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" id="settingsShowPassMark" style="width: auto; cursor: pointer;">
                            <span>Show Pass Mark to Students (50%)</span>
                        </label>
                        <small style="color: #999; display: block; margin-top: 0.3rem;">
                            Students will see the passing score before starting the exam
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" id="settingsShowImmediateResult" style="width: auto; cursor: pointer;">
                            <span>Show Results Immediately After Submission</span>
                        </label>
                        <small style="color: #999; display: block; margin-top: 0.3rem;">
                            Students will see their score right after submitting. If unchecked, only admins can see results.
                        </small>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Update Settings</button>
                </form>
            </div>
        </div>
    `,

    // Add Question Modal
    addQuestionModal: () => `
        <div class="modal" id="addQuestionModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add New Question</h2>
                    <button class="close-btn" onclick="closeModal('addQuestionModal')">&times;</button>
                </div>
                <div id="questionAlert"></div>
                <form onsubmit="addQuestion(event)">
                    <div class="form-group">
                        <label>Select Course</label>
                        <select class="form-control" required id="questionCourse">
                            <option value="">-- Select Course --</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Question</label>
                        <textarea class="form-control" id="questionText" rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Options (Select the correct answer)</label>
                        <div class="question-options" id="questionOptions">
                            <div class="option-group">
                                <input type="radio" name="correct" value="0" required>
                                <input type="text" class="form-control" placeholder="Option A" required>
                            </div>
                            <div class="option-group">
                                <input type="radio" name="correct" value="1">
                                <input type="text" class="form-control" placeholder="Option B" required>
                            </div>
                            <div class="option-group">
                                <input type="radio" name="correct" value="2">
                                <input type="text" class="form-control" placeholder="Option C" required>
                            </div>
                            <div class="option-group">
                                <input type="radio" name="correct" value="3">
                                <input type="text" class="form-control" placeholder="Option D" required>
                            </div>
                        </div>
                        <small style="color: #999; display: block; margin-top: 0.5rem;">Click the radio button next to the correct answer</small>
                    </div>
                    <button type="submit" class="btn btn-primary">Add Question</button>
                </form>
            </div>
        </div>
    `,

    // Bulk Upload Students Modal
    bulkUploadStudentsModal: () => `
        <div class="modal" id="bulkUploadStudentsModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Bulk Upload Students</h2>
                    <button class="close-btn" onclick="closeModal('bulkUploadStudentsModal')">&times;</button>
                </div>
                <div id="bulkStudentAlert"></div>
                
                <div class="info-box">
                    <strong>📋 CSV Format:</strong><br>
                    Matric Number, Full Name, Email, Department, Level<br>
                    <small>Example: 2021/12345, John Doe, john@example.com, Computer Science, 100</small>
                </div>
                
                <button class="btn btn-secondary" onclick="downloadStudentTemplate()" style="margin-bottom: 1rem; width: 100%;">
                    📥 Download CSV Template
                </button>
                
                <form onsubmit="bulkUploadStudents(event)">
                    <div class="form-group">
                        <label>Select CSV File</label>
                        <input type="file" id="studentsCSV" class="form-control" accept=".csv" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Upload Students</button>
                </form>
            </div>
        </div>
    `,

    // Bulk Upload Questions Modal
    bulkUploadQuestionsModal: () => `
        <div class="modal" id="bulkUploadQuestionsModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Bulk Upload Questions</h2>
                    <button class="close-btn" onclick="closeModal('bulkUploadQuestionsModal')">&times;</button>
                </div>
                <div id="bulkQuestionAlert"></div>
                
                <div class="info-box">
                    <strong>📋 CSV Format:</strong><br>
                    Question, Option A, Option B, Option C, Option D, Correct Answer<br>
                    <small>Correct Answer should be A, B, C, or D</small>
                </div>
                
                <button class="btn btn-secondary" onclick="downloadQuestionTemplate()" style="margin-bottom: 1rem; width: 100%;">
                    📥 Download CSV Template
                </button>
                
                <form onsubmit="bulkUploadQuestions(event)">
                    <div class="form-group">
                        <label>Select Course</label>
                        <select class="form-control" required id="bulkQuestionCourse">
                            <option value="">-- Select Course --</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Select CSV File</label>
                        <input type="file" id="questionsCSV" class="form-control" accept=".csv" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Upload Questions</button>
                </form>
            </div>
        </div>
    `,

    // Student Attempts Modal
    studentAttemptsModal: () => `
        <div class="modal" id="studentAttemptsModal">
            <div class="modal-content" id="studentAttemptsModalContent">
                <!-- Content will be loaded dynamically -->
            </div>
        </div>
    `,

    // Live Monitoring Modal
    liveMonitoringModal: () => `
        <div class="modal" id="liveMonitoringModal">
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2>🔴 Live Exam Monitoring</h2>
                    <button class="close-btn" onclick="stopLiveMonitoring()">&times;</button>
                </div>
                
                <div style="background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: center;">
                    <strong>Active Exams:</strong> <span id="activeExamsCount">0</span><br>
                    <small>Refreshes every 10 seconds</small>
                </div>
                
                <div id="activeExamsContainer" style="max-height: 500px; overflow-y: auto;">
                    <!-- Active exams will be loaded here -->
                </div>
            </div>
        </div>
    `,

    // Add a footer component
    footer: () => `
        <div class="main-footer">
            <div class="footer-content">
                <div class="school-info">
                    College of Community Health, University of Port Harcourt
                </div>
                <div class="copyright">
                    Copyright © 2025 Jugo Tech Solutions
                </div>
                <div class="contact">
                    <i class="fas fa-phone"></i> 09129562739
                    <span style="margin: 0 10px;">•</span>
                    <i class="fas fa-envelope"></i> jugotech@example.com
                    <span style="margin: 0 10px;">•</span>
                    <i class="fas fa-map-marker-alt"></i> Port Harcourt, Nigeria
                </div>
            </div>
        </div>
    `,

    // Additional CSS for enhanced features
    enhancedStyles: () => `
        <style>
            /* Enhanced button styles for danger actions */
            .btn-danger {
                background: linear-gradient(135deg, #dc3545, #c82333) !important;
                color: white !important;
                border: none !important;
            }
            
            .btn-danger:hover {
                background: linear-gradient(135deg, #c82333, #bd2130) !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 5px 15px rgba(220, 53, 69, 0.4) !important;
            }
            
            .btn-danger:disabled {
                background: #6c757d !important;
                cursor: not-allowed !important;
                opacity: 0.6 !important;
            }
            
            /* Warning button for extreme actions */
            .btn-warning {
                background: linear-gradient(135deg, #721c24, #491217) !important;
                color: white !important;
                border: none !important;
            }
            
            .btn-warning:hover {
                background: linear-gradient(135deg, #491217, #3a0e12) !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 5px 15px rgba(114, 28, 36, 0.4) !important;
            }
            
            /* Enhanced filter section */
            .filter-section {
                background: #f8f9fa;
                padding: 1.5rem;
                border-radius: 10px;
                margin-bottom: 1.5rem;
                border: 1px solid #e9ecef;
            }
            
            .filter-section h3 {
                color: #333;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .filter-section h3:before {
                content: "🔍";
                font-size: 1.2rem;
            }
            
            /* Bulk actions section */
            .bulk-actions-section {
                background: #fff3cd;
                border: 2px solid #ffc107;
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1rem;
            }
            
            .bulk-actions-section h4 {
                color: #856404;
                margin-bottom: 0.5rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .bulk-actions-section h4:before {
                content: "⚡";
            }
            
            /* Loading animation */
            .loading {
                text-align: center;
                padding: 2rem;
                color: #999;
                position: relative;
            }
            
            .loading:after {
                content: "";
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-left: 10px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Enhanced table styles */
            th.sortable {
                cursor: pointer;
                position: relative;
            }
            
            th.sortable:hover {
                background: #e9ecef;
            }
            
            th.sortable:after {
                content: "↕";
                position: absolute;
                right: 10px;
                opacity: 0.5;
                font-size: 0.8rem;
            }
            
            th.sortable.asc:after {
                content: "↑";
                opacity: 1;
            }
            
            th.sortable.desc:after {
                content: "↓";
                opacity: 1;
            }
            
            /* Status indicators */
            .status-active {
                display: inline-block;
                padding: 0.2rem 0.5rem;
                border-radius: 4px;
                font-size: 0.85rem;
                font-weight: 600;
                background: #d4edda;
                color: #155724;
            }
            
            .status-inactive {
                display: inline-block;
                padding: 0.2rem 0.5rem;
                border-radius: 4px;
                font-size: 0.85rem;
                font-weight: 600;
                background: #f8d7da;
                color: #721c24;
            }
            
            .status-pending {
                display: inline-block;
                padding: 0.2rem 0.5rem;
                border-radius: 4px;
                font-size: 0.85rem;
                font-weight: 600;
                background: #fff3cd;
                color: #856404;
            }
            
            /* Action button enhancements */
            .action-btns {
                display: flex;
                gap: 0.3rem;
                flex-wrap: wrap;
            }
            
            .action-btns .btn-sm {
                padding: 0.3rem 0.6rem;
                font-size: 0.8rem;
                min-width: 60px;
                text-align: center;
            }
            
            /* Info box for instructions */
            .info-box {
                background: #d1ecf1;
                border: 1px solid #bee5eb;
                color: #0c5460;
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1.5rem;
                font-size: 0.9rem;
            }
            
            .info-box strong {
                color: #0c5460;
            }
            
            .info-box small {
                color: #0c5460;
                opacity: 0.8;
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                .filter-section > div {
                    grid-template-columns: 1fr !important;
                }
                
                .action-btns {
                    flex-direction: column;
                }
                
                .action-btns .btn-sm {
                    width: 100%;
                }
                
                .bulk-actions-section > div {
                    flex-direction: column;
                }
                
                .bulk-actions-section button {
                    width: 100%;
                }
            }
            
            /* Confirmation dialog styles */
            .confirmation-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .confirmation-dialog {
                background: white;
                border-radius: 15px;
                padding: 2rem;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            }
            
            .confirmation-dialog h3 {
                color: #f44336;
                margin-bottom: 1rem;
            }
            
            .confirmation-dialog p {
                margin-bottom: 1.5rem;
                color: #666;
                line-height: 1.5;
            }
            
            .confirmation-dialog .danger-text {
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                color: #721c24;
                padding: 1rem;
                border-radius: 8px;
                margin: 1rem 0;
                font-weight: bold;
            }
            
            .confirmation-dialog input[type="text"] {
                width: 100%;
                padding: 0.8rem;
                border: 2px solid #f44336;
                border-radius: 8px;
                margin: 1rem 0;
                font-size: 1rem;
            }
            
            .confirmation-dialog .button-group {
                display: flex;
                gap: 1rem;
                margin-top: 1.5rem;
            }
            
            .confirmation-dialog .button-group button {
                flex: 1;
            }

            /* Updated logo styles */
           .logo-container {
                padding: 1.5rem 1rem;
                border-bottom: 1px solid #e0e0e0;
                margin-bottom: 1rem;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
        
            .logo-content {
                display: flex;
                align-items: center;
            }
        
            .school-logo {
                height: 50px;
                width: auto;
                max-width: 50px;
                object-fit: contain;
                margin-right: 15px;
                background: white;
                padding: 8px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
        
            .logo-text h2 {
                font-size: 1.3rem;
                margin: 0;
                font-weight: 700;
                color: white;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
        
            .logo-text small {
                color: rgba(255, 255, 255, 0.9);
                font-size: 0.85rem;
                display: block;
                margin-top: 3px;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            }
        
            /* Sidebar footer styles */
            .sidebar-footer {
                margin-top: auto;
                padding: 1rem;
                border-top: 1px solid #e0e0e0;
                background: rgba(255, 255, 255, 0.05);
            }
        
            /* Main content footer styles */
            .main-footer {
                margin-top: 3rem;
                padding: 1.5rem;
                text-align: center;
                color: #666;
                font-size: 0.9rem;
                border-top: 1px solid #e0e0e0;
                background: #f8f9fa;
            }
        
            .main-footer .footer-content {
                max-width: 800px;
                margin: 0 auto;
            }
        
            .main-footer .school-info {
                font-weight: 600;
                margin-bottom: 0.5rem;
                color: #333;
            }
        
            .main-footer .copyright {
                font-size: 0.8rem;
                color: #888;
                border-top: 1px solid #e0e0e0;
                padding-top: 0.5rem;
                margin-top: 0.5rem;
            }
        
            .main-footer .contact {
                font-size: 0.85rem;
                color: #666;
                margin-top: 0.3rem;
            }
        
            .main-footer .contact i {
                margin-right: 0.3rem;
                color: #667eea;
            }
        
            /* Responsive footer */
            @media (max-width: 768px) {
                .main-footer {
                    padding: 1rem;
                    font-size: 0.8rem;
                }
            
                .main-footer .school-info {
                    font-size: 0.9rem;
                }
            
                .main-footer .copyright {
                    font-size: 0.75rem;
                }
            }
        </style>
    `,
    
    // Add enhanced styles to document head
    addEnhancedStyles: () => {
        if (!document.getElementById('enhanced-styles')) {
            const styleElement = document.createElement('div');
            styleElement.id = 'enhanced-styles';
            styleElement.innerHTML = Components.enhancedStyles();
            document.head.appendChild(styleElement);
        }
    }
};
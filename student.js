// student.js - COMPLETE VERSION with all functions

// Global state
let currentStudent = null;
let selectedCourse = null;
let examQuestions = [];
let currentQuestionIndex = 0;
let studentAnswers = {};
let examTimer = null;

// Student Login Function
async function studentLogin(event) {
    if (event) event.preventDefault();
    
    try {
        const matricNumber = document.getElementById('matricNumber').value.trim();
        
        if (!matricNumber) {
            showAlert('loginAlert', 'Please enter your matriculation number', 'error');
            return;
        }
        
        // Query students table
        const { data: student, error } = await supabase
            .from('students')
            .select('*')
            .eq('matric_number', matricNumber)
            .single();
        
        if (error || !student) {
            showAlert('loginAlert', 'Invalid matriculation number. Please check and try again.', 'error');
            return;
        }
        
        // Store student data
        currentStudent = student;
        sessionStorage.setItem('student', JSON.stringify(student));
        sessionStorage.setItem('studentLoggedIn', 'true');
        
        // Hide login screen, show course selection
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('courseSelectionScreen').classList.remove('hidden');
        
        // Update student info
        document.getElementById('studentName').textContent = student.full_name;
        document.getElementById('studentMatric').textContent = student.matric_number;
        document.getElementById('studentDept').textContent = student.department;
        
        // Load available courses
        await loadAvailableCourses();
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert('loginAlert', 'Login failed. Please try again.', 'error');
    }
}

// Load Available Courses
async function loadAvailableCourses() {
    try {
        const student = JSON.parse(sessionStorage.getItem('student'));
        
        // Get all active courses
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .eq('is_active', true)
            .order('course_code');
        
        if (coursesError) throw coursesError;
        
        if (!courses || courses.length === 0) {
            document.getElementById('courseGrid').innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #999;">
                    <i class="fas fa-book" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>No courses available at the moment.</p>
                </div>
            `;
            return;
        }
        
        // Get student's exam attempts for each course
        const { data: attempts, error: attemptsError } = await supabase
            .from('exam_attempts')
            .select('*')
            .eq('student_id', student.id);
        
        if (attemptsError) {
            console.warn('Error loading attempts:', attemptsError);
        }
        
        // Create attempts map
        const attemptsMap = {};
        if (attempts) {
            attempts.forEach(attempt => {
                attemptsMap[attempt.course_id] = attempt;
            });
        }
        
        // Get question counts for each course
        const coursesWithCounts = await Promise.all(courses.map(async (course) => {
            const { count: objectiveCount } = await supabase
                .from('questions')
                .select('*', { count: 'exact', head: true })
                .eq('course_id', course.id);
            
            const { count: subjectiveCount } = await supabase
                .from('subjective_questions')
                .select('*', { count: 'exact', head: true })
                .eq('course_id', course.id);
            
            return {
                ...course,
                objectiveCount: objectiveCount || 0,
                subjectiveCount: subjectiveCount || 0,
                totalQuestions: (objectiveCount || 0) + (subjectiveCount || 0)
            };
        }));
        
        // Render courses
        const courseGrid = document.getElementById('courseGrid');
        courseGrid.innerHTML = coursesWithCounts.map(course => {
            const attempt = attemptsMap[course.id];
            const attemptsUsed = attempt ? attempt.attempts_used : 0;
            const maxAttempts = course.max_attempts || 3;
            const attemptsLeft = maxAttempts - attemptsUsed;
            const isDisabled = attemptsLeft <= 0;
            
            return `
                <div class="course-card ${isDisabled ? 'disabled' : ''}" 
                     ${!isDisabled ? `onclick="selectCourse('${course.id}', ${JSON.stringify(course).replace(/"/g, '&quot;')})"` : ''}>
                    <h3>${course.course_code}</h3>
                    <p><strong>${course.course_title}</strong></p>
                    <p><i class="fas fa-clock"></i> Duration: ${course.duration_minutes} minutes</p>
                    <p><i class="fas fa-question-circle"></i> Questions: ${course.totalQuestions} (${course.objectiveCount} Obj + ${course.subjectiveCount} Subj)</p>
                    <p style="color: ${isDisabled ? '#f44336' : '#4caf50'};">
                        <i class="fas fa-redo"></i> 
                        ${isDisabled ? 'No attempts left' : `${attemptsLeft} attempt(s) remaining`}
                    </p>
                    ${isDisabled ? 
                        '<p style="color: #f44336; font-size: 0.85rem;">Contact your instructor for more attempts</p>' : 
                        '<p style="color: #667eea; font-size: 0.9rem;"><i class="fas fa-arrow-right"></i> Click to start</p>'
                    }
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading courses:', error);
        showAlert('courseAlert', 'Error loading courses. Please refresh the page.', 'error');
    }
}

// Select Course
async function selectCourse(courseId, course) {
    try {
        const student = JSON.parse(sessionStorage.getItem('student'));
        
        // Store selected course
        selectedCourse = course;
        sessionStorage.setItem('selectedCourse', JSON.stringify(course));
        
        // Hide course selection, show instructions
        document.getElementById('courseSelectionScreen').classList.add('hidden');
        document.getElementById('instructionsScreen').classList.remove('hidden');
        
        // Update exam info
        document.getElementById('examCourseTitle').textContent = `${course.course_code} - ${course.course_title}`;
        document.getElementById('studentNameExam').textContent = student.full_name;
        document.getElementById('studentMatricExam').textContent = student.matric_number;
        
        // Update question count
        document.getElementById('totalQuestionsInfo').textContent = course.totalQuestions || 0;
        document.getElementById('durationInfo').textContent = `${course.duration_minutes} mins`;
        
        // Show/hide passing score based on course settings
        const passingScoreDiv = document.getElementById('passingScoreDiv');
        if (passingScoreDiv) {
            if (course.show_pass_mark !== false) {
                passingScoreDiv.style.display = 'block';
            } else {
                passingScoreDiv.style.display = 'none';
            }
        }
        
        // Store subjective question count for later use
        sessionStorage.setItem('hasSubjectiveQuestions', course.subjectiveCount > 0 ? 'true' : 'false');
        
    } catch (error) {
        console.error('Error selecting course:', error);
        alert('Error loading course. Please try again.');
    }
}

// Back to Courses
function backToCourses() {
    // Clear exam data
    sessionStorage.removeItem('selectedCourse');
    sessionStorage.removeItem('examQuestions');
    sessionStorage.removeItem('objectiveAnswers');
    sessionStorage.removeItem('subjectiveAnswers');
    sessionStorage.removeItem('currentQuestionIndex');
    sessionStorage.removeItem('examStartTime');
    sessionStorage.removeItem('timeLeft');
    sessionStorage.removeItem('examSessionId');
    sessionStorage.removeItem('examResult');
    sessionStorage.removeItem('hasSubjectiveQuestions');
    
    // Clear timers
    if (examTimer) {
        clearInterval(examTimer);
        examTimer = null;
    }
    
    const timerInterval = sessionStorage.getItem('sharedTimerInterval');
    if (timerInterval) clearInterval(timerInterval);
    
    const combinedTimer = sessionStorage.getItem('combinedTimerInterval');
    if (combinedTimer) clearInterval(combinedTimer);
    
    // Hide all screens, show course selection
    document.querySelectorAll('.card > div').forEach(screen => {
        if (!screen.id.includes('Screen')) return;
        screen.classList.add('hidden');
    });
    document.getElementById('courseSelectionScreen').classList.remove('hidden');
    
    // Reload courses
    loadAvailableCourses();
}

// Logout
function logout() {
    // Clear all session data
    sessionStorage.clear();
    
    // Clear timers
    if (examTimer) {
        clearInterval(examTimer);
        examTimer = null;
    }
    
    const timerInterval = sessionStorage.getItem('sharedTimerInterval');
    if (timerInterval) clearInterval(timerInterval);
    
    const combinedTimer = sessionStorage.getItem('combinedTimerInterval');
    if (combinedTimer) clearInterval(combinedTimer);
    
    // Reset state
    currentStudent = null;
    selectedCourse = null;
    examQuestions = [];
    currentQuestionIndex = 0;
    studentAnswers = {};
    
    // Hide all screens
    document.querySelectorAll('.card > div').forEach(screen => {
        if (!screen.id.includes('Screen')) return;
        screen.classList.add('hidden');
    });
    
    // Show login screen
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
        loginScreen.classList.remove('hidden');
    }
    
    // FIXED: Clear and reset the login form
    const matricInput = document.getElementById('matricNumber');
    if (matricInput) {
        matricInput.value = '';
        // Force focus to trigger any event listeners
        setTimeout(() => {
            matricInput.focus();
        }, 100);
    }
    
    // Clear any alerts
    const loginAlert = document.getElementById('loginAlert');
    if (loginAlert) {
        loginAlert.innerHTML = '';
    }
    
    // FIXED: Force a complete page reload to ensure clean state
    setTimeout(() => {
        window.location.reload();
    }, 100);
}

// FINAL FIX: Save objective answer WITHOUT upsert to avoid 400 error
async function saveObjectiveAnswer(questionIndex, answer) {
    try {
        const sessionId = sessionStorage.getItem('examSessionId');
        const questions = JSON.parse(sessionStorage.getItem('examQuestions'));
        const question = questions[questionIndex];
        
        if (!sessionId || !question || !question.options) return;
        
        const isCorrect = answer === question.correct_answer;
        
        // SIMPLE APPROACH: Just check and update/insert without upsert
        const { data: existingAnswer, error: checkError } = await supabase
            .from('student_answers')
            .select('id')
            .eq('session_id', sessionId)
            .eq('question_id', question.id)
            .maybeSingle();
        
        if (existingAnswer) {
            // Update existing
            await supabase
                .from('student_answers')
                .update({
                    selected_answer: answer,
                    is_correct: isCorrect,
                    answered_at: new Date().toISOString()
                })
                .eq('id', existingAnswer.id);
        } else {
            // Insert new
            await supabase
                .from('student_answers')
                .insert({
                    session_id: sessionId,
                    question_id: question.id,
                    selected_answer: answer,
                    is_correct: isCorrect,
                    answered_at: new Date().toISOString()
                });
        }
        
    } catch (error) {
        console.error('Error saving answer:', error);
        // Don't throw - allow exam to continue even if save fails
    }
}
// Show Alert Function
function showAlert(elementId, message, type = 'error') {
    const element = document.getElementById(elementId);
    if (element) {
        const alertClass = type === 'success' ? 'alert-success' : 
                          type === 'warning' ? 'alert-info' : 'alert-error';
        
        element.innerHTML = `
            <div class="alert ${alertClass}">
                ${message}
            </div>
        `;
        
        // Auto-remove alert after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                element.innerHTML = '';
            }, 5000);
        }
    }
}

// Check if student is already logged in
function checkStudentAuth() {
    const student = sessionStorage.getItem('student');
    const isLoggedIn = sessionStorage.getItem('studentLoggedIn') === 'true';
    
    if (student && isLoggedIn) {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('courseSelectionScreen').classList.remove('hidden');
        
        try {
            const studentData = JSON.parse(student);
            document.getElementById('studentName').textContent = studentData.full_name;
            document.getElementById('studentMatric').textContent = studentData.matric_number;
            document.getElementById('studentDept').textContent = studentData.department;
            
            // Load courses
            loadAvailableCourses();
        } catch (e) {
            console.error('Error parsing student data:', e);
            logout();
        }
    }
}

// Start Exam - Combined Interface
async function startExam() {
    try {
        const student = JSON.parse(sessionStorage.getItem('student'));
        const course = JSON.parse(sessionStorage.getItem('selectedCourse'));
        
        // Check if student has exceeded maximum attempts
        const { data: attempts, error: attemptsError } = await supabase
            .from('exam_attempts')
            .select('*')
            .eq('student_id', student.id)
            .eq('course_id', course.id)
            .maybeSingle();
        
        // Check max attempts
        if (attempts && !attemptsError) {
            const maxAttempts = course.max_attempts || 3;
            if (attempts.attempts_used >= maxAttempts) {
                alert(`You have used all ${maxAttempts} attempts for this course. Please contact your instructor.`);
                return;
            }
        }
        
        // Load BOTH objective and subjective questions
        const [objectiveData, subjectiveData] = await Promise.all([
            supabase.from('questions').select('*').eq('course_id', course.id),
            supabase.from('subjective_questions').select('*').eq('course_id', course.id)
        ]);
        
        if (objectiveData.error) throw objectiveData.error;
        if (subjectiveData.error) throw subjectiveData.error;
        
        let allQuestions = [...(objectiveData.data || []), ...(subjectiveData.data || [])];
        
        if (allQuestions.length === 0) {
            alert('No questions available for this course. Please contact your instructor.');
            return;
        }
        
        // Shuffle questions for fairness
        allQuestions = allQuestions.sort(() => Math.random() - 0.5);
        
        // Create exam session
        const { data: session, error: sessionError } = await supabase
            .from('exam_sessions')
            .insert({
                student_id: student.id,
                course_id: course.id,
                duration_minutes: course.duration_minutes,
                status: 'in_progress'
            })
            .select()
            .single();
        
        if (sessionError) throw sessionError;
        
        // Store session ID and questions
        sessionStorage.setItem('examSessionId', session.id);
        sessionStorage.setItem('examQuestions', JSON.stringify(allQuestions));
        sessionStorage.setItem('currentQuestionIndex', '0');
        sessionStorage.setItem('objectiveAnswers', JSON.stringify({}));
        sessionStorage.setItem('subjectiveAnswers', JSON.stringify({}));
        sessionStorage.setItem('examStartTime', Date.now().toString());
        
        // Update exam attempts count
        if (attempts && !attemptsError) {
            await supabase
                .from('exam_attempts')
                .update({
                    attempts_used: attempts.attempts_used + 1,
                    last_attempt_at: new Date().toISOString()
                })
                .eq('student_id', student.id)
                .eq('course_id', course.id);
        } else {
            await supabase
                .from('exam_attempts')
                .insert({
                    student_id: student.id,
                    course_id: course.id,
                    attempts_used: 1,
                    last_attempt_at: new Date().toISOString()
                });
        }
        
        // Switch to combined exam screen
        document.getElementById('instructionsScreen').classList.add('hidden');
        document.getElementById('combinedExamScreen').classList.remove('hidden');
        
        // Display exam info
        document.getElementById('combinedExamCourse').textContent = `${course.course_code} - ${course.course_title}`;
        document.getElementById('combinedExamStudentName').textContent = student.full_name;
        document.getElementById('combinedExamStudentMatric').textContent = student.matric_number;
        
        // Initialize combined exam
        initializeCombinedExam();
        
    } catch (error) {
        console.error('Error starting exam:', error);
        alert('Error starting exam. Please try again.');
    }
}

// Initialize combined exam
function initializeCombinedExam() {
    // Load first question
    loadCombinedQuestion(0);
    
    // Setup question navigator
    setupCombinedQuestionNavigator();
    
    // Start timer
    startCombinedTimer();
    
    // Update progress bar
    updateCombinedProgressBar();
}

// Load a specific question in combined interface
function loadCombinedQuestion(index) {
    const questions = JSON.parse(sessionStorage.getItem('examQuestions'));
    const objectiveAnswers = JSON.parse(sessionStorage.getItem('objectiveAnswers'));
    const subjectiveAnswers = JSON.parse(sessionStorage.getItem('subjectiveAnswers'));
    
    if (index >= 0 && index < questions.length) {
        sessionStorage.setItem('currentQuestionIndex', index.toString());
        const question = questions[index];
        
        const questionContainer = document.getElementById('combinedQuestionContainer');
        
        // Check if it's an objective or subjective question
        if (question.options) {
            // Objective question
            const options = JSON.parse(question.options);
            const isSelected = objectiveAnswers[index] !== undefined;
            const selectedAnswer = objectiveAnswers[index];
            
            questionContainer.innerHTML = `
                <div class="question-card">
                    <span class="question-number">
                        Question ${index + 1} of ${questions.length} (Objective)
                    </span>
                    <div class="question-text">${question.question_text}</div>
                    <div class="options">
                        ${options.map((option, optionIndex) => {
                            const isThisSelected = isSelected && selectedAnswer === optionIndex;
                            const letter = String.fromCharCode(65 + optionIndex);
                            return `
                            <div class="option ${isThisSelected ? 'selected' : ''}" onclick="selectCombinedOption(${optionIndex})">
                                <input type="radio" name="answer" value="${optionIndex}" ${isThisSelected ? 'checked' : ''}>
                                <label>${letter}. ${option.text}</label>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        } else {
            // Subjective question
            const answer = subjectiveAnswers[question.id] || '';
            questionContainer.innerHTML = `
                <div class="question-card">
                    <span class="question-number">
                        Question ${index + 1} of ${questions.length} (Essay)
                    </span>
                    
                    <h3 style="color: #2c3e50; margin-bottom: 1rem;">
                        ${question.question_text}
                    </h3>
                    
                    ${question.instructions ? `
                        <div style="background: #f0f7ff; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #667eea;">
                            <strong><i class="fas fa-info-circle"></i> Instructions:</strong>
                            <p style="margin: 0.5rem 0 0 0; color: #555;">${question.instructions}</p>
                        </div>
                    ` : ''}
                    
                    <div class="form-group">
                        <label>Your Answer:</label>
                        <textarea 
                            id="combinedSubjectiveAnswer" 
                            class="form-control" 
                            rows="10" 
                            placeholder="Type your answer here..." 
                            style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;"
                            oninput="updateCombinedSubjectiveAnswer(this.value)"
                        >${answer}</textarea>
                        
                        <div style="margin-top: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                            <span id="wordCount" style="color: #666; font-size: 0.85rem;">
                                Words: ${answer.trim().split(/\s+/).filter(w => w.length > 0).length}
                            </span>
                            <span id="charCount" style="color: #666; font-size: 0.85rem;">
                                Characters: ${answer.length}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Update navigation buttons
        updateCombinedNavigationButtons(index, questions.length);
        
        // Update question navigator
        updateCombinedQuestionNavigator(index);
    }
}

// Select objective option in combined interface
function selectCombinedOption(optionIndex) {
    const currentIndex = parseInt(sessionStorage.getItem('currentQuestionIndex'));
    const answers = JSON.parse(sessionStorage.getItem('objectiveAnswers'));
    
    answers[currentIndex] = optionIndex;
    sessionStorage.setItem('objectiveAnswers', JSON.stringify(answers));
    
    // Save answer to database
    saveObjectiveAnswer(currentIndex, optionIndex);
    
    // Reload question
    loadCombinedQuestion(currentIndex);
    
    // Update question navigator
    updateCombinedQuestionNavigator(currentIndex);
    updateCombinedProgressBar();
}

// Update subjective answer in combined interface
function updateCombinedSubjectiveAnswer(answer) {
    const currentIndex = parseInt(sessionStorage.getItem('currentQuestionIndex'));
    const questions = JSON.parse(sessionStorage.getItem('examQuestions'));
    const question = questions[currentIndex];
    const answers = JSON.parse(sessionStorage.getItem('subjectiveAnswers'));
    
    answers[question.id] = answer;
    sessionStorage.setItem('subjectiveAnswers', JSON.stringify(answers));
    
    // Update word count
    const words = answer.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const charCount = answer.length;
    
    const wordCountElement = document.getElementById('wordCount');
    const charCountElement = document.getElementById('charCount');
    
    if (wordCountElement) wordCountElement.textContent = `Words: ${wordCount}`;
    if (charCountElement) charCountElement.textContent = `Characters: ${charCount}`;
    
    // Update question navigator
    updateCombinedQuestionNavigator(currentIndex);
    updateCombinedProgressBar();
}

// Setup question navigator for combined interface
function setupCombinedQuestionNavigator() {
    const questions = JSON.parse(sessionStorage.getItem('examQuestions'));
    const navigator = document.getElementById('combinedQuestionNavigator');
    
    navigator.innerHTML = '';
    
    for (let i = 0; i < questions.length; i++) {
        const button = document.createElement('div');
        button.className = 'nav-question-btn';
        button.textContent = i + 1;
        button.onclick = () => navigateToCombinedQuestion(i);
        navigator.appendChild(button);
    }
    
    updateCombinedQuestionNavigator(0);
}

// Update question navigator for combined interface
function updateCombinedQuestionNavigator(currentIndex) {
    const buttons = document.querySelectorAll('#combinedQuestionNavigator .nav-question-btn');
    const objectiveAnswers = JSON.parse(sessionStorage.getItem('objectiveAnswers'));
    const subjectiveAnswers = JSON.parse(sessionStorage.getItem('subjectiveAnswers'));
    const questions = JSON.parse(sessionStorage.getItem('examQuestions'));
    
    buttons.forEach((button, index) => {
        button.classList.remove('current', 'answered');
        
        if (index === currentIndex) {
            button.classList.add('current');
        }
        
        // Check if answered
        const question = questions[index];
        let isAnswered = false;
        
        if (question.options) {
            // Objective question
            isAnswered = objectiveAnswers[index] !== undefined;
        } else {
            // Subjective question
            isAnswered = subjectiveAnswers[question.id] !== undefined && 
                         subjectiveAnswers[question.id].trim().length > 0;
        }
        
        if (isAnswered) {
            button.classList.add('answered');
        }
    });
}

// Navigate to specific question in combined interface
function navigateToCombinedQuestion(index) {
    loadCombinedQuestion(index);
}

// Update navigation buttons for combined interface
function updateCombinedNavigationButtons(currentIndex, totalQuestions) {
    const prevBtn = document.getElementById('combinedPrevBtn');
    const nextBtn = document.getElementById('combinedNextBtn');
    const submitBtn = document.getElementById('combinedSubmitBtn');
    
    if (!prevBtn || !nextBtn || !submitBtn) return;
    
    prevBtn.disabled = currentIndex === 0;
    
    if (currentIndex === totalQuestions - 1) {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }
}

// Previous question in combined interface
function previousCombinedQuestion() {
    const currentIndex = parseInt(sessionStorage.getItem('currentQuestionIndex'));
    if (currentIndex > 0) {
        loadCombinedQuestion(currentIndex - 1);
    }
}

// Next question in combined interface
function nextCombinedQuestion() {
    const currentIndex = parseInt(sessionStorage.getItem('currentQuestionIndex'));
    const questions = JSON.parse(sessionStorage.getItem('examQuestions'));
    
    if (currentIndex < questions.length - 1) {
        loadCombinedQuestion(currentIndex + 1);
    }
}

// Start timer for combined interface
function startCombinedTimer() {
    const course = JSON.parse(sessionStorage.getItem('selectedCourse'));
    const duration = course.duration_minutes * 60;
    let timeLeft = parseInt(sessionStorage.getItem('timeLeft') || duration.toString());
    
    const timerDisplay = document.getElementById('combinedTimerDisplay');
    
    // Clear existing timer
    const existingTimer = sessionStorage.getItem('combinedTimerInterval');
    if (existingTimer) clearInterval(existingTimer);
    
    const timer = setInterval(() => {
        timeLeft--;
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 300) {
                timerDisplay.classList.add('danger');
                timerDisplay.classList.remove('warning');
            } else if (timeLeft <= 600) {
                timerDisplay.classList.add('warning');
                timerDisplay.classList.remove('danger');
            }
        }
        
        sessionStorage.setItem('timeLeft', timeLeft.toString());
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            submitCombinedExam(true);
        }
        
        sessionStorage.setItem('combinedTimerInterval', timer);
    }, 1000);
}

// Update progress bar for combined interface
function updateCombinedProgressBar() {
    const questions = JSON.parse(sessionStorage.getItem('examQuestions'));
    const objectiveAnswers = JSON.parse(sessionStorage.getItem('objectiveAnswers'));
    const subjectiveAnswers = JSON.parse(sessionStorage.getItem('subjectiveAnswers'));
    
    if (!questions) return;
    
    let answeredCount = Object.keys(objectiveAnswers).length;
    
    // Count subjective answers
    questions.forEach((question, index) => {
        if (!question.options) {
            // Subjective question
            if (subjectiveAnswers[question.id] && subjectiveAnswers[question.id].trim().length > 0) {
                answeredCount++;
            }
        }
    });
    
    const progress = (answeredCount / questions.length) * 100;
    
    const progressBar = document.getElementById('combinedProgressBar');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
}

// Confirm submit for combined interface
function confirmCombinedSubmit() {
    const questions = JSON.parse(sessionStorage.getItem('examQuestions'));
    const objectiveAnswers = JSON.parse(sessionStorage.getItem('objectiveAnswers'));
    const subjectiveAnswers = JSON.parse(sessionStorage.getItem('subjectiveAnswers'));
    
    let objectiveAnswered = Object.keys(objectiveAnswers).length;
    let subjectiveAnswered = 0;
    
    // Count subjective answers
    questions.forEach(question => {
        if (!question.options && subjectiveAnswers[question.id] && subjectiveAnswers[question.id].trim().length > 0) {
            subjectiveAnswered++;
        }
    });
    
    const totalAnswered = objectiveAnswered + subjectiveAnswered;
    
    let message = `You have answered ${totalAnswered} out of ${questions.length} questions.\n\n`;
    message += `- Objective: ${objectiveAnswered} answered\n`;
    message += `- Subjective: ${subjectiveAnswered} answered\n\n`;
    
    if (totalAnswered < questions.length) {
        message += `You still have ${questions.length - totalAnswered} unanswered questions.\n\n`;
    }
    
    message += 'Are you sure you want to submit your exam?';
    
    if (confirm(message)) {
        submitCombinedExam();
    }
}

// FIXED: Submit combined exam with proper subjective counting
async function submitCombinedExam(isAutoSubmit = false) {
    try {
        // Clear timer
        const timerInterval = sessionStorage.getItem('combinedTimerInterval');
        if (timerInterval) clearInterval(timerInterval);
        
        const student = JSON.parse(sessionStorage.getItem('student'));
        const course = JSON.parse(sessionStorage.getItem('selectedCourse'));
        const questions = JSON.parse(sessionStorage.getItem('examQuestions'));
        const objectiveAnswers = JSON.parse(sessionStorage.getItem('objectiveAnswers'));
        const subjectiveAnswers = JSON.parse(sessionStorage.getItem('subjectiveAnswers'));
        const sessionId = sessionStorage.getItem('examSessionId');
        
        // Separate questions
        let objectiveQuestions = [];
        let subjectiveQuestions = [];
        
        questions.forEach((question, index) => {
            if (question.options) {
                objectiveQuestions.push({ question, index });
            } else {
                subjectiveQuestions.push(question);
            }
        });
        
        // Calculate objective score
        let correctAnswers = 0;
        objectiveQuestions.forEach(({ question, index }) => {
            const selectedAnswer = objectiveAnswers[index];
            if (selectedAnswer !== undefined && selectedAnswer === question.correct_answer) {
                correctAnswers++;
            }
        });
        
        const objectiveScore = objectiveQuestions.length > 0 ? 
            (correctAnswers / objectiveQuestions.length) * 100 : 0;
        
        // Count subjective answers
        const subjectiveAnswered = Object.keys(subjectiveAnswers).filter(questionId => {
            const answer = subjectiveAnswers[questionId];
            return answer && answer.trim().length > 0;
        }).length;
        
        // Calculate total subjective marks
        let totalSubjectiveMarks = 0;
        subjectiveQuestions.forEach(q => {
            totalSubjectiveMarks += (q.marks || 10);
        });
        
        const startTime = parseInt(sessionStorage.getItem('examStartTime'));
        const timeTaken = Math.floor((Date.now() - startTime) / 60000);
        
        // Update exam session
        await supabase
            .from('exam_sessions')
            .update({
                end_time: new Date().toISOString(),
                status: 'completed'
            })
            .eq('id', sessionId);
        
        // Save subjective answers FIRST (before result)
        const subjectiveAnswerRecords = [];
        for (const [questionId, answer] of Object.entries(subjectiveAnswers)) {
            if (answer && answer.trim().length > 0) {
                const wordCount = answer.trim().split(/\s+/).filter(w => w.length > 0).length;
                subjectiveAnswerRecords.push({
                    session_id: sessionId,
                    question_id: questionId,
                    answer_text: answer,
                    word_count: wordCount,
                    submitted_at: new Date().toISOString()
                });
            }
        }
        
        let autoGradedCount = 0;
        let totalSubjectiveScore = 0;
        let totalSubjectiveMarksObtained = 0;
        
        if (subjectiveAnswerRecords.length > 0) {
            const { data: savedAnswers, error: subjError } = await supabase
                .from('subjective_answers')
                .insert(subjectiveAnswerRecords)
                .select();
            
            if (subjError) {
                console.error('Error saving subjective answers:', subjError);
            } else if (savedAnswers) {
                // AUTO-GRADE subjective answers immediately
                for (const savedAnswer of savedAnswers) {
                    const question = subjectiveQuestions.find(q => q.id === savedAnswer.question_id);
                    
                    if (question && question.grading_type !== 'manual') {
                        // Auto-grade this answer
                        const gradingResult = await autoGradeSubjectiveAnswer(
                            savedAnswer.answer_text, 
                            question
                        );
                        
                        if (gradingResult) {
                            // Calculate marks obtained
                            const marksObtained = (gradingResult.auto_score / 100) * (question.marks || 10);
                            totalSubjectiveMarksObtained += marksObtained;
                            autoGradedCount++;
                            
                            // Update the answer with auto-grade
                            await supabase
                                .from('subjective_answers')
                                .update({
                                    auto_score: gradingResult.auto_score,
                                    keywords_found: gradingResult.keywords_found,
                                    similarity_score: gradingResult.similarity_score,
                                    graded_at: new Date().toISOString()
                                })
                                .eq('id', savedAnswer.id);
                        }
                    }
                }
                
                // Calculate subjective score percentage
                if (totalSubjectiveMarks > 0) {
                    totalSubjectiveScore = (totalSubjectiveMarksObtained / totalSubjectiveMarks) * 100;
                }
            }
        }
        
        // Calculate final score (weighted average if both types exist)
        let finalScore = objectiveScore;
        if (objectiveQuestions.length > 0 && subjectiveQuestions.length > 0) {
            const objectiveWeight = objectiveQuestions.length / questions.length;
            const subjectiveWeight = subjectiveQuestions.length / questions.length;
            finalScore = (objectiveScore * objectiveWeight) + (totalSubjectiveScore * subjectiveWeight);
        } else if (subjectiveQuestions.length > 0 && objectiveQuestions.length === 0) {
            finalScore = totalSubjectiveScore;
        }
        
        // Insert exam result
        const { data: result, error: resultError } = await supabase
            .from('exam_results')
            .insert({
                session_id: sessionId,
                student_id: student.id,
                course_id: course.id,
                // Objective data
                score: objectiveScore,
                objective_score: objectiveScore,
                correct_answers: correctAnswers,
                total_questions: objectiveQuestions.length,
                // Subjective data
                subjective_questions_answered: subjectiveAnswered,
                total_subjective_questions: subjectiveQuestions.length,
                total_subjective_marks: totalSubjectiveMarks,
                subjective_marks_obtained: totalSubjectiveMarksObtained,
                subjective_score: totalSubjectiveScore,
                auto_graded_subjective: autoGradedCount,
                // Final score
                final_score: finalScore,
                time_taken: timeTaken
            })
            .select()
            .single();
        
        if (resultError) {
            console.error('Error inserting result:', resultError);
            throw resultError;
        }
        
        // Save objective answers (without upsert to avoid 400 error)
        for (const [index, answer] of Object.entries(objectiveAnswers)) {
            const questionData = objectiveQuestions.find(q => q.index == index);
            if (questionData) {
                const { question } = questionData;
                
                // Check if exists first
                const { data: existing } = await supabase
                    .from('student_answers')
                    .select('id')
                    .eq('session_id', sessionId)
                    .eq('question_id', question.id)
                    .maybeSingle();
                
                if (!existing) {
                    await supabase
                        .from('student_answers')
                        .insert({
                            session_id: sessionId,
                            question_id: question.id,
                            selected_answer: answer,
                            is_correct: answer === question.correct_answer
                        });
                }
            }
        }
        
        // Store result
        sessionStorage.setItem('examResult', JSON.stringify({
            ...result,
            student: student,
            course: course
        }));
        
        // Clear exam data
        sessionStorage.removeItem('examQuestions');
        sessionStorage.removeItem('objectiveAnswers');
        sessionStorage.removeItem('subjectiveAnswers');
        sessionStorage.removeItem('currentQuestionIndex');
        sessionStorage.removeItem('examStartTime');
        sessionStorage.removeItem('timeLeft');
        sessionStorage.removeItem('combinedTimerInterval');
        sessionStorage.removeItem('examSessionId');
        
        // Show results
        showCombinedResults(
            result, 
            student, 
            course, 
            objectiveQuestions.length, 
            correctAnswers, 
            subjectiveAnswered, 
            timeTaken,
            subjectiveQuestions.length,
            totalSubjectiveMarks
        );
        
    } catch (error) {
        console.error('❌ Error submitting exam:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        alert('Error submitting exam. Please contact administrator.\n\nError: ' + error.message);
    }
}


// Debug function - call this to check if all result elements exist
function checkResultElements() {
    console.log('=== CHECKING RESULT ELEMENTS ===');
    const elements = [
        'resultsScreen',
        'resultScore',
        'resultMessage',
        'resultPassMark',
        'resultCourse',
        'resultTotal',
        'resultCorrect',
        'resultWrong',
        'resultPercentage',
        'resultTime'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}:`, element ? '✓ Found' : '❌ NOT FOUND');
    });
    
    const resultDetails = document.querySelector('.result-details');
    console.log('result-details:', resultDetails ? '✓ Found' : '❌ NOT FOUND');
}


// Add auto-grading function
async function autoGradeSubjectiveAnswer(answerText, question) {
    try {
        if (!question.grading_type || question.grading_type === 'manual') {
            return null;
        }
        
        let score = 0;
        const keywordsFound = [];
        
        // 1. Check word count
        const wordCount = answerText.trim().split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount < (question.min_word_count || 50)) {
            return { 
                auto_score: 0, 
                keywords_found: [], 
                similarity_score: 0,
                reason: 'Insufficient word count' 
            };
        }
        
        // 2. Keyword matching
        if (question.keywords && Array.isArray(question.keywords) && question.keywords.length > 0) {
            const keywordWeight = question.keyword_weightage || 60;
            const answerLower = answerText.toLowerCase();
            
            question.keywords.forEach(keyword => {
                const keywordLower = keyword.toLowerCase();
                if (answerLower.includes(keywordLower)) {
                    keywordsFound.push(keyword);
                }
            });
            
            const keywordPercentage = keywordsFound.length / question.keywords.length;
            score += (keywordPercentage * keywordWeight);
        }
        
        // 3. Text similarity (simple cosine similarity)
        let similarityScore = 0;
        if (question.expected_answer) {
            const similarityWeight = 100 - (question.keyword_weightage || 60);
            if (similarityWeight > 0) {
                similarityScore = calculateTextSimilarity(answerText, question.expected_answer);
                score += (similarityScore * similarityWeight);
            }
        }
        
        // Cap score at 100%
        score = Math.min(score, 100);
        
        return {
            auto_score: parseFloat(score.toFixed(2)),
            keywords_found: keywordsFound,
            similarity_score: parseFloat((similarityScore * 100).toFixed(2))
        };
    } catch (error) {
        console.error('Error in auto-grading:', error);
        return null;
    }
}

// Simple text similarity (cosine similarity)
function calculateTextSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const allWords = [...new Set([...words1, ...words2])];
    const vec1 = allWords.map(word => words1.filter(w => w === word).length);
    const vec2 = allWords.map(word => words2.filter(w => w === word).length);
    
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
}

// FIXED: Simplified version with extensive logging
function showCombinedResults(
    result, 
    student, 
    course, 
    totalObjective, 
    correctAnswers, 
    subjectiveAnswered, 
    timeTaken,
    totalSubjective = 0,
    totalSubjectiveMarks = 0
) {
    console.log('==========================================');
    console.log('SHOWING RESULTS - START');
    console.log('==========================================');
    console.log('Parameters received:');
    console.log('- result:', result);
    console.log('- student:', student);
    console.log('- course:', course);
    console.log('- totalObjective:', totalObjective);
    console.log('- correctAnswers:', correctAnswers);
    console.log('- subjectiveAnswered:', subjectiveAnswered);
    console.log('- timeTaken:', timeTaken);
    console.log('- totalSubjective:', totalSubjective);
    console.log('- totalSubjectiveMarks:', totalSubjectiveMarks);
    
    // Step 1: Hide all exam screens
    console.log('Step 1: Hiding exam screens...');
    const screensToHide = ['combinedExamScreen', 'examScreen', 'subjectiveScreen'];
    screensToHide.forEach(screenId => {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('hidden');
            console.log(`  ✓ Hidden ${screenId}`);
        } else {
            console.log(`  ⚠️ ${screenId} not found`);
        }
    });
    
    // Step 2: Check if we should show results or confirmation
    console.log('Step 2: Checking show_immediate_result setting...');
    console.log('  show_immediate_result:', course.show_immediate_result);
    
    if (course.show_immediate_result === false) {
        console.log('  → Results hidden, showing confirmation screen');
        
        const confirmationScreen = document.getElementById('submissionConfirmationScreen');
        if (!confirmationScreen) {
            console.error('  ❌ submissionConfirmationScreen NOT FOUND!');
            alert('Error: Confirmation screen not found. Please refresh and try again.');
            return;
        }
        
        confirmationScreen.classList.remove('hidden');
        
        const confirmStudent = document.getElementById('confirmationStudent');
        const confirmCourse = document.getElementById('confirmationCourse');
        
        if (confirmStudent) confirmStudent.textContent = `${student.full_name} (${student.matric_number})`;
        if (confirmCourse) confirmCourse.textContent = `${course.course_code} - ${course.course_title}`;
        
        console.log('  ✓ Confirmation screen displayed');
        console.log('==========================================');
        console.log('SHOWING RESULTS - END (CONFIRMATION)');
        console.log('==========================================');
        return;
    }
    
    
    // Step 3: Show results screen
    console.log('Step 3: Showing results screen...');
    const resultsScreen = document.getElementById('resultsScreen');

    if (!resultsScreen) {
        console.error('  ❌ resultsScreen NOT FOUND!');
        alert('CRITICAL ERROR: Results screen not found!\n\nPlease check student.html file.');
        return;
    }

    console.log('  ✓ resultsScreen found');

    // Force show the container first
    const container = document.querySelector('.container');
    if (container) {
        container.style.display = 'flex';
        container.style.opacity = '1';
        console.log('  ✓ Container forced visible');
    }

    // Force remove hidden class and make visible
    resultsScreen.classList.remove('hidden');
    resultsScreen.style.display = 'block';
    resultsScreen.style.visibility = 'visible';
    resultsScreen.style.opacity = '1';
    resultsScreen.style.position = 'relative';
    resultsScreen.style.zIndex = '999';

    console.log('  ✓ resultsScreen visibility forced');

    // Check if it's actually visible
    setTimeout(() => {
        const computedStyle = window.getComputedStyle(resultsScreen);
        console.log('  Final opacity:', computedStyle.opacity);
        console.log('  Final display:', computedStyle.display);
    }, 50);
    
    // Step 4: Calculate scores
    console.log('Step 4: Calculating scores...');
    const wrongAnswers = totalObjective - correctAnswers;
    const objectiveScore = result.objective_score !== null && result.objective_score !== undefined ? 
        result.objective_score : result.score || 0;
    
    console.log('  Wrong answers:', wrongAnswers);
    console.log('  Objective score:', objectiveScore);
    
    // Step 5: Update all result elements
    console.log('Step 5: Updating result elements...');
    
    const elements = {
        resultScore: `${parseFloat(objectiveScore).toFixed(1)}%`,
        resultCourse: `${course.course_code} - ${course.course_title}`,
        resultTotal: totalObjective.toString(),
        resultCorrect: correctAnswers.toString(),
        resultWrong: wrongAnswers.toString(),
        resultPercentage: `${parseFloat(objectiveScore).toFixed(1)}%`,
        resultTime: `${timeTaken} minutes`
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            console.log(`  ✓ ${id} = "${value}"`);
        } else {
            console.error(`  ❌ ${id} NOT FOUND!`);
        }
    }
    
    // Update score element class
    const scoreElement = document.getElementById('resultScore');
    if (scoreElement) {
        scoreElement.className = objectiveScore >= 50 ? 'result-score pass' : 'result-score fail';
        console.log('  ✓ resultScore class updated');
    }
    
    // Update message
    const messageElement = document.getElementById('resultMessage');
    if (messageElement) {
        if (totalSubjective > 0) {
            messageElement.innerHTML = objectiveScore >= 50 ?
                `<div style="color: #4caf50;">Congratulations! You passed the objective section! 🎉</div>
                 <div style="color: #ff9800; font-size: 0.95rem;">Your subjective answers (${subjectiveAnswered}/${totalSubjective}) are being evaluated.</div>` :
                `<div style="color: #f44336;">Keep studying! Your objective score needs improvement. 📚</div>
                 <div style="color: #ff9800; font-size: 0.95rem;">Your subjective answers (${subjectiveAnswered}/${totalSubjective}) are being evaluated.</div>`;
        } else {
            messageElement.textContent = objectiveScore >= 50 ? 
                'Congratulations! You have passed the exam. 🎉' : 
                'You did not pass this time. Keep studying! 📚';
        }
        console.log('  ✓ resultMessage updated');
    } else {
        console.error('  ❌ resultMessage NOT FOUND!');
    }
    
    // Update pass mark
    const passMarkElement = document.getElementById('resultPassMark');
    if (passMarkElement) {
        if (course.show_pass_mark !== false) {
            passMarkElement.textContent = 'Pass Mark: 50%';
            passMarkElement.style.display = 'block';
        } else {
            passMarkElement.style.display = 'none';
        }
        console.log('  ✓ resultPassMark updated');
    }
    
    // Add subjective info if needed
    if (totalSubjective > 0) {
        console.log('Step 6: Adding subjective info...');
        const resultDetails = document.querySelector('.result-details');
        if (resultDetails) {
            // Remove existing rows
            const existingSubj = resultDetails.querySelector('[data-subjective-row]');
            const existingNote = resultDetails.querySelector('[data-note-row]');
            if (existingSubj) existingSubj.remove();
            if (existingNote) existingNote.remove();
            
            // Add new rows
            const subjectiveRow = document.createElement('div');
            subjectiveRow.className = 'result-row';
            subjectiveRow.setAttribute('data-subjective-row', 'true');
            subjectiveRow.innerHTML = `
                <span>Essay Questions:</span>
                <span style="color: #ff9800;">
                    <strong>${subjectiveAnswered}/${totalSubjective}</strong> answered
                    <br><small style="color: #666;">(Worth ${totalSubjectiveMarks} marks - Pending evaluation)</small>
                </span>
            `;
            resultDetails.appendChild(subjectiveRow);
            
            const noteRow = document.createElement('div');
            noteRow.className = 'result-row';
            noteRow.setAttribute('data-note-row', 'true');
            noteRow.style.cssText = 'border-top: 2px solid #e0e0e0; padding-top: 0.5rem; margin-top: 0.5rem;';
            noteRow.innerHTML = `
                <span style="font-weight: bold;">Note:</span>
                <span style="color: #666; font-size: 0.9rem;">Your final score will be calculated after subjective evaluation</span>
            `;
            resultDetails.appendChild(noteRow);
            
            console.log('  ✓ Subjective info added');
        } else {
            console.error('  ❌ .result-details NOT FOUND!');
        }
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('  ✓ Scrolled to top');
    
    console.log('==========================================');
    console.log('SHOWING RESULTS - END (SUCCESS)');
    console.log('==========================================');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkStudentAuth();
    
    // Bind enter key on matric number field
    const matricInput = document.getElementById('matricNumber');
    if (matricInput) {
        matricInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                studentLogin();
            }
        });
    }
});

// Export all functions to window
window.studentLogin = studentLogin;
window.loadAvailableCourses = loadAvailableCourses;
window.selectCourse = selectCourse;
window.backToCourses = backToCourses;
window.logout = logout;
window.saveObjectiveAnswer = saveObjectiveAnswer;
window.startExam = startExam;
window.selectCombinedOption = selectCombinedOption;
window.updateCombinedSubjectiveAnswer = updateCombinedSubjectiveAnswer;
window.previousCombinedQuestion = previousCombinedQuestion;
window.nextCombinedQuestion = nextCombinedQuestion;
window.navigateToCombinedQuestion = navigateToCombinedQuestion;
window.confirmCombinedSubmit = confirmCombinedSubmit;
window.submitCombinedExam = submitCombinedExam;
window.showCombinedResults = showCombinedResults;
window.autoGradeSubjectiveAnswer = autoGradeSubjectiveAnswer;
window.calculateTextSimilarity = calculateTextSimilarity;
// Export for debugging
window.checkResultElements = checkResultElements;
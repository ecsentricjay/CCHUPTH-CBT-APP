// subjective.js - FIXED VERSION with shared timer and proper navigation

const SubjectiveQuestions = {
    questions: [],
    currentQuestion: 0,
    studentAnswers: {},
    
    // Initialize with course ID - FIXED VERSION
    async init(courseId) {
        try {
            // Load subjective questions for the course
            // Try ordering by question_number first, fall back to created_at
            const { data, error } = await supabase
                .from('subjective_questions')
                .select('*')
                .eq('course_id', courseId);
            
            if (error) throw error;
            
            this.questions = data || [];
            
            // Sort questions - try by question_number, then by created_at
            this.questions.sort((a, b) => {
                if (a.question_number !== undefined && b.question_number !== undefined) {
                    return a.question_number - b.question_number;
                }
                // Fallback to created_at
                return new Date(a.created_at || 0) - new Date(b.created_at || 0);
            });
            
            // Add question_number based on array index if column doesn't exist
            this.questions = this.questions.map((question, index) => ({
                ...question,
                question_number: question.question_number || index + 1
            }));
            
            // Load existing answers from session storage if any
            this.studentAnswers = JSON.parse(sessionStorage.getItem('subjectiveAnswers') || '{}');
            
            // Store in session storage
            sessionStorage.setItem('subjectiveQuestions', JSON.stringify(this.questions));
            
            console.log(`✅ Loaded ${this.questions.length} subjective questions`);
            return true;
        } catch (error) {
            console.error('Error loading subjective questions:', error);
            this.questions = [];
            return false;
        }
    },
    
    // Load from session storage
    loadFromSession() {
        try {
            const storedQuestions = sessionStorage.getItem('subjectiveQuestions');
            if (storedQuestions) {
                this.questions = JSON.parse(storedQuestions);
                this.studentAnswers = JSON.parse(sessionStorage.getItem('subjectiveAnswers') || '{}');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error loading from session:', error);
            return false;
        }
    },
    
    // Check if there are subjective questions
    hasSubjectiveQuestions() {
        return this.questions && this.questions.length > 0;
    },
    
    // Render subjective section - FIXED WITH PROPER NAVIGATION
    renderSubjectiveSection() {
        const container = document.getElementById('subjectiveContainer');
        if (!container) return;
        
        if (this.questions.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <h3>No Essay/Subjective Questions</h3>
                    <p>Proceeding to results...</p>
                    <button class="btn btn-primary" onclick="SubjectiveQuestions.completeSubjective()">
                        Continue to Results
                    </button>
                </div>
            `;
            return;
        }
        
        // Clear container first
        container.innerHTML = '';
        
        // Show current question
        this.renderQuestion();
        
        // Add navigation buttons
        this.addNavigationButtons();
        
        // Update navigation buttons
        this.updateNavigationButtons();
        
        // START SHARED TIMER - Use the same timer from objective section
        this.startSharedTimer();
    },
    
    // Start shared timer (continues from objective section)
    startSharedTimer() {
        // Get remaining time from session storage
        const timeLeft = parseInt(sessionStorage.getItem('timeLeft') || '0');
        
        if (timeLeft <= 0) {
            // Time is up, auto-submit
            setTimeout(() => {
                this.autoSubmit();
            }, 1000);
            return;
        }
        
        const timerDisplay = document.getElementById('subjectiveTimerDisplay');
        if (!timerDisplay) return;
        
        // Clear any existing timer
        const existingTimer = sessionStorage.getItem('sharedTimerInterval');
        if (existingTimer) {
            clearInterval(existingTimer);
        }
        
        // Start shared timer
        const timer = setInterval(() => {
            const currentTimeLeft = parseInt(sessionStorage.getItem('timeLeft') || timeLeft.toString());
            const newTimeLeft = currentTimeLeft - 1;
            
            sessionStorage.setItem('timeLeft', newTimeLeft.toString());
            
            const minutes = Math.floor(newTimeLeft / 60);
            const seconds = newTimeLeft % 60;
            
            // Update both timer displays if they exist
            const allTimerDisplays = document.querySelectorAll('.timer-value');
            allTimerDisplays.forEach(display => {
                display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                // Change color based on time
                display.className = 'timer-value';
                if (newTimeLeft <= 300) { // 5 minutes
                    display.classList.add('danger');
                } else if (newTimeLeft <= 600) { // 10 minutes
                    display.classList.add('warning');
                }
            });
            
            // Auto-submit when time is up
            if (newTimeLeft <= 0) {
                clearInterval(timer);
                this.autoSubmit();
            }
        }, 1000);
        
        // Store timer reference
        sessionStorage.setItem('sharedTimerInterval', timer);
        
        // Update timer display immediately
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },
    
    // Auto-submit when time runs out
    autoSubmit() {
        console.log('⏰ Time is up! Auto-submitting subjective section...');
        this.completeSubjective();
    },
    
    // Add navigation buttons
    addNavigationButtons() {
        const container = document.getElementById('subjectiveContainer');
        if (!container) return;
        
        const navButtons = document.createElement('div');
        navButtons.className = 'navigation-buttons';
        navButtons.style.marginTop = '2rem';
        navButtons.innerHTML = `
            <button class="btn btn-secondary" id="prevSubjectiveBtn" onclick="SubjectiveQuestions.previousQuestion()">
                <i class="fas fa-arrow-left"></i> Previous
            </button>
            <button class="btn btn-primary" id="nextSubjectiveBtn" onclick="SubjectiveQuestions.nextQuestion()">
                Next <i class="fas fa-arrow-right"></i>
            </button>
            <button class="btn btn-success" id="submitSubjectiveBtn" onclick="SubjectiveQuestions.confirmComplete()">
                <i class="fas fa-paper-plane"></i> Complete Examination
            </button>
        `;
        
        // Add question navigator
        const questionNav = this.createQuestionNavigator();
        container.appendChild(questionNav);
        
        container.appendChild(navButtons);
    },
    
    // Create question navigator
    createQuestionNavigator() {
        const navContainer = document.createElement('div');
        navContainer.style.marginBottom = '1.5rem';
        navContainer.style.padding = '1rem';
        navContainer.style.backgroundColor = '#f5f5f5';
        navContainer.style.borderRadius = '10px';
        
        navContainer.innerHTML = `
            <h4 style="margin-bottom: 1rem; color: #333;">
                <i class="fas fa-list-ol"></i> Question Navigator
            </h4>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem;" id="subjectiveQuestionNavigator">
                <!-- Question buttons will be added here -->
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 1rem; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 20px; height: 20px; border: 2px solid #e0e0e0; border-radius: 4px;"></div>
                    <span style="font-size: 0.9rem; color: #666;">Not Answered</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 20px; height: 20px; background: #4caf50; border: 2px solid #4caf50; border-radius: 4px;"></div>
                    <span style="font-size: 0.9rem; color: #666;">Answered</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 20px; height: 20px; background: #667eea; border: 2px solid #667eea; border-radius: 4px;"></div>
                    <span style="font-size: 0.9rem; color: #666;">Current</span>
                </div>
            </div>
        `;
        
        // Add question buttons
        setTimeout(() => {
            this.updateQuestionNavigator();
        }, 100);
        
        return navContainer;
    },
    
    // Update question navigator
    updateQuestionNavigator() {
        const navigator = document.getElementById('subjectiveQuestionNavigator');
        if (!navigator || this.questions.length === 0) return;
        
        navigator.innerHTML = '';
        
        for (let i = 0; i < this.questions.length; i++) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'nav-question-btn';
            button.textContent = i + 1;
            button.onclick = () => this.navigateToQuestion(i);
            
            // Style the button
            button.style.cssText = `
                width: 40px;
                height: 40px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s;
                background: white;
                color: #666;
            `;
            
            // Check if answered
            const question = this.questions[i];
            if (this.studentAnswers[question.id]) {
                button.style.background = '#4caf50';
                button.style.color = 'white';
                button.style.borderColor = '#4caf50';
            }
            
            // Check if current
            if (i === this.currentQuestion) {
                button.style.background = '#667eea';
                button.style.color = 'white';
                button.style.borderColor = '#667eea';
            }
            
            navigator.appendChild(button);
        }
    },
    
    // Navigate to specific question
    navigateToQuestion(index) {
        if (index >= 0 && index < this.questions.length) {
            this.currentQuestion = index;
            this.renderQuestion();
            this.updateNavigationButtons();
            this.updateQuestionNavigator();
        }
    },
    
    // Render current question
    renderQuestion() {
        const container = document.getElementById('subjectiveContainer');
        if (!container || this.questions.length === 0) return;
        
        const question = this.questions[this.currentQuestion];
        const answer = this.studentAnswers[question.id] || '';
        
        // Create question HTML
        const questionHTML = `
            <div class="question-card">
                <span class="question-number" style="display: inline-block; background: #667eea; color: white; padding: 0.3rem 0.8rem; border-radius: 5px; font-size: 0.9rem; margin-bottom: 1rem;">
                    Essay Question ${this.currentQuestion + 1} of ${this.questions.length}
                </span>
                
                <h3 style="color: #2c3e50; margin-bottom: 1rem; font-size: 1.2rem;">
                    ${question.question_text}
                </h3>
                
                ${question.instructions ? `
                    <div style="background: #f0f7ff; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #667eea;">
                        <strong><i class="fas fa-info-circle"></i> Instructions:</strong>
                        <p style="margin: 0.5rem 0 0 0; color: #555;">${question.instructions}</p>
                    </div>
                ` : ''}
                
                <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                    ${question.max_words ? `
                        <div style="padding: 0.5rem 1rem; background: #e8f5e8; border-radius: 5px; font-size: 0.9rem;">
                            <i class="fas fa-keyboard"></i> <strong>Max Words:</strong> ${question.max_words}
                        </div>
                    ` : ''}
                    
                    ${question.max_marks ? `
                        <div style="padding: 0.5rem 1rem; background: #e3f2fd; border-radius: 5px; font-size: 0.9rem;">
                            <i class="fas fa-star"></i> <strong>Max Marks:</strong> ${question.max_marks}
                        </div>
                    ` : ''}
                </div>
                
                <div class="form-group">
                    <label style="display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500;">
                        <i class="fas fa-edit"></i> Your Answer:
                    </label>
                    <textarea 
                        id="subjectiveAnswer" 
                        class="form-control" 
                        rows="10" 
                        placeholder="Type your detailed answer here..." 
                        style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 1rem; border: 2px solid #e0e0e0; border-radius: 10px; width: 100%; font-size: 1rem; resize: vertical;"
                        oninput="SubjectiveQuestions.updateAnswer(this.value)"
                    >${answer}</textarea>
                    
                    <div style="margin-top: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                        <span id="wordCount" style="color: #666; font-size: 0.85rem;">
                            <i class="fas fa-font"></i> Words: 0
                        </span>
                        <span id="charCount" style="color: #666; font-size: 0.85rem;">
                            <i class="fas fa-keyboard"></i> Characters: 0
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        // Insert at the beginning of container
        container.insertAdjacentHTML('afterbegin', questionHTML);
        
        // Initialize word and character count
        this.updateCounts(answer);
    },
    
    // Update answer
    updateAnswer(answer) {
        if (this.questions.length === 0) return;
        
        const question = this.questions[this.currentQuestion];
        this.studentAnswers[question.id] = answer;
        
        // Save to session storage
        sessionStorage.setItem('subjectiveAnswers', JSON.stringify(this.studentAnswers));
        
        // Update counts
        this.updateCounts(answer);
        
        // Update question navigator
        this.updateQuestionNavigator();
    },
    
    // Update word and character counts
    updateCounts(text) {
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        const wordCount = words.length;
        const charCount = text.length;
        
        const wordCountElement = document.getElementById('wordCount');
        const charCountElement = document.getElementById('charCount');
        
        if (wordCountElement) {
            wordCountElement.textContent = `Words: ${wordCount}`;
            
            // Check word limit if exists
            const question = this.questions[this.currentQuestion];
            if (question && question.max_words && wordCount > question.max_words) {
                wordCountElement.style.color = '#f44336';
                wordCountElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Words: ${wordCount} (Exceeded ${question.max_words} words)`;
            } else {
                wordCountElement.style.color = '#666';
                wordCountElement.innerHTML = `<i class="fas fa-font"></i> Words: ${wordCount}`;
            }
        }
        
        if (charCountElement) {
            charCountElement.textContent = `Characters: ${charCount}`;
            charCountElement.innerHTML = `<i class="fas fa-keyboard"></i> Characters: ${charCount}`;
        }
    },
    
    // Previous question
    previousQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.reRenderQuestion();
        }
    },
    
    // Next question
    nextQuestion() {
        if (this.currentQuestion < this.questions.length - 1) {
            this.currentQuestion++;
            this.reRenderQuestion();
        }
    },
    
    // Re-render question (clears and re-renders)
    reRenderQuestion() {
        const container = document.getElementById('subjectiveContainer');
        if (!container) return;
        
        // Remove existing question content (keep navigation buttons)
        const questionCards = container.querySelectorAll('.question-card');
        questionCards.forEach(card => card.remove());
        
        // Re-render question
        this.renderQuestion();
        
        // Update navigation buttons
        this.updateNavigationButtons();
        
        // Update question navigator
        this.updateQuestionNavigator();
    },
    
    // Update navigation buttons
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevSubjectiveBtn');
        const nextBtn = document.getElementById('nextSubjectiveBtn');
        const submitBtn = document.getElementById('submitSubjectiveBtn');
        
        if (!prevBtn || !nextBtn || !submitBtn) return;
        
        // Previous button
        prevBtn.disabled = this.currentQuestion === 0;
        
        // Next/Submit button
        if (this.currentQuestion === this.questions.length - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
        }
    },
    
    // Confirm completion
    confirmComplete() {
        const answeredCount = Object.keys(this.studentAnswers).length;
        const totalQuestions = this.questions.length;
        
        // Calculate time left
        const timeLeft = parseInt(sessionStorage.getItem('timeLeft') || '0');
        const timeLeftMinutes = Math.floor(timeLeft / 60);
        
        let message = `You have answered ${answeredCount} out of ${totalQuestions} subjective questions.\n\n`;
        
        if (answeredCount < totalQuestions) {
            message += `You still have ${totalQuestions - answeredCount} unanswered questions.\n\n`;
        }
        
        message += `Time remaining: ${timeLeftMinutes} minutes\n\n`;
        message += 'Are you sure you want to complete the examination?';
        
        if (confirm(message)) {
            this.completeSubjective();
        }
    },
    
    // Complete subjective section
    async completeSubjective() {
        try {
            // Clear shared timer
            const timerInterval = sessionStorage.getItem('sharedTimerInterval');
            if (timerInterval) {
                clearInterval(timerInterval);
                sessionStorage.removeItem('sharedTimerInterval');
            }
            
            const result = JSON.parse(sessionStorage.getItem('examResult'));
            if (!result) {
                console.error('No exam result found');
                this.showResultScreen();
                return;
            }
            
            const answeredCount = Object.keys(this.studentAnswers).length;
            
            console.log('📝 Subjective answers to save:', this.studentAnswers);
            
            // Save subjective answers to database if table exists
            try {
                const answersToSave = Object.entries(this.studentAnswers).map(([questionId, answer]) => ({
                    session_id: result.session_id,
                    question_id: questionId,
                    answer_text: answer,
                    answered_at: new Date().toISOString()
                }));
                
                if (answersToSave.length > 0) {
                    const { error: saveError } = await supabase
                        .from('subjective_answers')
                        .insert(answersToSave);
                    
                    if (saveError) {
                        console.warn('Could not save subjective answers:', saveError);
                    }
                }
            } catch (saveError) {
                console.warn('Error saving subjective answers:', saveError);
            }
            
            // Update exam result with subjective info
            await this.updateExamResult(result.id, answeredCount);
            
            // Show result screen
            this.showResultScreen(answeredCount);
            
        } catch (error) {
            console.error('Error completing subjective section:', error);
            this.showResultScreen(Object.keys(this.studentAnswers).length);
        }
    },
    
    // Update exam result in database
    async updateExamResult(resultId, subjectiveAnsweredCount) {
        try {
            // Prepare update data
            const updateData = {
                subjective_questions_answered: subjectiveAnsweredCount,
                total_subjective_questions: this.questions.length,
                updated_at: new Date().toISOString()
            };
            
            // Update the exam result
            const { error } = await supabase
                .from('exam_results')
                .update(updateData)
                .eq('id', resultId);
            
            if (error) {
                console.warn('Error updating exam result:', error);
            }
            
        } catch (error) {
            console.warn('Non-critical error in updateExamResult:', error);
        }
    },
    
    // Show result screen
    async showResultScreen(subjectiveAnsweredCount = 0) {
        try {
            // Hide subjective screen
            document.getElementById('subjectiveScreen').classList.add('hidden');
            
            // Get result data
            const result = JSON.parse(sessionStorage.getItem('examResult'));
            if (!result) {
                // Show generic completion screen
                document.getElementById('submissionConfirmationScreen').classList.remove('hidden');
                return;
            }
            
            const student = JSON.parse(sessionStorage.getItem('student'));
            const course = JSON.parse(sessionStorage.getItem('selectedCourse'));
            
            // Clear all timers from session storage
            sessionStorage.removeItem('sharedTimerInterval');
            sessionStorage.removeItem('timeLeft');
            
            // Show appropriate screen based on course settings
            if (course.show_immediate_result !== false) {
                // Show results screen
                document.getElementById('resultsScreen').classList.remove('hidden');
                
                // Calculate values for display
                const totalQuestions = result.total_questions || 0;
                const correctAnswers = result.correct_answers || 0;
                const timeTaken = result.time_taken || 0;
                const wrongAnswers = totalQuestions - correctAnswers;
                const scoreToShow = result.final_score || result.score || 0;
                
                // Display results
                const scoreElement = document.getElementById('resultScore');
                scoreElement.textContent = `${parseFloat(scoreToShow).toFixed(1)}%`;
                scoreElement.className = scoreToShow >= 50 ? 'result-score pass' : 'result-score fail';
                
                // Display message
                const messageElement = document.getElementById('resultMessage');
                if (subjectiveAnsweredCount > 0) {
                    if (scoreToShow >= 50) {
                        messageElement.textContent = 'Objective section passed! Subjective evaluation pending. 📝';
                    } else {
                        messageElement.textContent = 'Keep studying! Subjective evaluation pending. 📝';
                    }
                } else {
                    if (scoreToShow >= 50) {
                        messageElement.textContent = 'Congratulations! You have passed the exam. 🎉';
                    } else {
                        messageElement.textContent = 'You did not pass this time. Keep studying! 📚';
                    }
                }
                
                // Display details
                document.getElementById('resultCourse').textContent = `${course.course_code} - ${course.course_title}`;
                document.getElementById('resultTotal').textContent = totalQuestions;
                document.getElementById('resultCorrect').textContent = correctAnswers;
                document.getElementById('resultWrong').textContent = wrongAnswers;
                document.getElementById('resultPercentage').textContent = `${parseFloat(scoreToShow).toFixed(1)}%`;
                document.getElementById('resultTime').textContent = `${timeTaken} minutes`;
                
                // Add subjective info if applicable
                if (subjectiveAnsweredCount > 0) {
                    const resultDetails = document.querySelector('.result-details');
                    if (resultDetails) {
                        const subjectiveRow = document.createElement('div');
                        subjectiveRow.className = 'result-row';
                        subjectiveRow.innerHTML = `
                            <span>Subjective Questions:</span>
                            <span style="color: #ff9800;">${subjectiveAnsweredCount}/${this.questions.length || 0} answered (Pending Evaluation)</span>
                        `;
                        resultDetails.appendChild(subjectiveRow);
                    }
                }
                
            } else {
                // Show submission confirmation screen
                document.getElementById('submissionConfirmationScreen').classList.remove('hidden');
                
                // Display confirmation details
                document.getElementById('confirmationStudent').textContent = `${student.full_name} (${student.matric_number})`;
                document.getElementById('confirmationCourse').textContent = `${course.course_code} - ${course.course_title}`;
            }
            
            // Clear session storage
            sessionStorage.removeItem('subjectiveQuestions');
            sessionStorage.removeItem('subjectiveAnswers');
            
        } catch (error) {
            console.error('Error showing result screen:', error);
            document.getElementById('subjectiveScreen').classList.add('hidden');
            document.getElementById('submissionConfirmationScreen').classList.remove('hidden');
        }
    }
};

// Export to window
window.SubjectiveQuestions = SubjectiveQuestions;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the subjective screen
    const subjectiveScreen = document.getElementById('subjectiveScreen');
    if (subjectiveScreen && !subjectiveScreen.classList.contains('hidden')) {
        SubjectiveQuestions.loadFromSession();
        SubjectiveQuestions.renderSubjectiveSection();
    }
});
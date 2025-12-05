// subjective-admin.js - FIXED VERSION with better error handling

let allSubjectiveQuestions = [];
let currentSubjectiveFilters = {};
let tableExists = false;
let tableCheckAttempts = 0;
const MAX_CHECK_ATTEMPTS = 3;

// Enhanced table check with retry logic
async function checkTableExists() {
    try {
        console.log(`Checking if subjective_questions table exists (attempt ${tableCheckAttempts + 1}/${MAX_CHECK_ATTEMPTS})...`);
        
        // Try a simple query
        const { data, error } = await supabase
            .from('subjective_questions')
            .select('id')
            .limit(1);
        
        if (error) {
            console.error('Table check error:', error);
            
            // Check for specific cache error
            if (error.code === 'PGRST205' || error.message.includes('schema cache')) {
                console.warn('⚠️ Table exists but not in schema cache. Attempting alternative check...');
                
                // Try alternative: check if we can select from the table with a different approach
                const { data: testData, error: testError } = await supabase
                    .rpc('check_table_exists', { table_name: 'subjective_questions' })
                    .maybeSingle();
                
                if (testError) {
                    console.error('Alternative check also failed:', testError);
                    tableCheckAttempts++;
                    
                    if (tableCheckAttempts < MAX_CHECK_ATTEMPTS) {
                        // Retry after delay
                        console.log('Retrying in 2 seconds...');
                        setTimeout(() => checkTableExists(), 2000);
                        return false;
                    }
                    
                    tableExists = false;
                    return false;
                }
            }
            
            // If table doesn't exist
            if (error.code === 'PGRST204' || error.message.includes('does not exist')) {
                console.error('❌ Table does not exist or is not accessible');
                tableExists = false;
                return false;
            }
            
            throw error;
        }
        
        tableExists = true;
        tableCheckAttempts = 0;
        console.log('✅ Table exists and is accessible');
        return true;
        
    } catch (error) {
        console.error('Error checking table:', error);
        tableExists = false;
        return false;
    }
}

// Show improved table not found error with instructions
function showTableNotFoundError() {
    const tbody = document.getElementById('subjectiveQuestionsTable');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem;">
                    <div style="max-width: 600px; margin: 0 auto;">
                        <i class="fas fa-database" style="font-size: 3rem; color: #ff9800; margin-bottom: 1rem;"></i>
                        <h3 style="color: #333; margin-bottom: 1rem;">Subjective Questions Table Not Found in Cache</h3>
                        <p style="color: #666; margin-bottom: 1.5rem;">
                            The table exists in your database but needs to be refreshed in Supabase's schema cache.
                        </p>
                        
                        <div style="background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: left;">
                            <strong>📋 Quick Fix Steps:</strong>
                            <ol style="margin: 0.5rem 0 0 1.5rem; padding: 0;">
                                <li>Go to your Supabase Dashboard</li>
                                <li>Navigate to <strong>Settings → API</strong></li>
                                <li>Scroll down and click <strong>"Reload Schema"</strong> or <strong>"Generate Types"</strong></li>
                                <li>Wait 1-2 minutes</li>
                                <li>Click the refresh button below</li>
                            </ol>
                        </div>
                        
                        <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
                            <button class="btn btn-primary" onclick="retryLoadSubjectiveQuestions()">
                                <i class="fas fa-sync"></i> Retry Loading
                            </button>
                            <button class="btn btn-secondary" onclick="openSupabaseDashboard()">
                                <i class="fas fa-external-link-alt"></i> Open Supabase Dashboard
                            </button>
                            <button class="btn btn-secondary" onclick="showManualTableCreation()">
                                <i class="fas fa-code"></i> Show SQL to Create Table
                            </button>
                        </div>
                        
                        <p style="color: #999; font-size: 0.85rem; margin-top: 1.5rem;">
                            Error Code: PGRST205 - Schema cache needs refresh
                        </p>
                    </div>
                </td>
            </tr>
        `;
    }
    updateQuestionCount('Cache Error');
}

// Retry loading with fresh check
async function retryLoadSubjectiveQuestions() {
    tableCheckAttempts = 0;
    const tbody = document.getElementById('subjectiveQuestionsTable');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #667eea;"></i>
                    <p style="margin-top: 1rem; color: #666;">Checking table availability...</p>
                </td>
            </tr>
        `;
    }
    
    setTimeout(async () => {
        const exists = await checkTableExists();
        if (exists) {
            await loadSubjectiveQuestions();
        } else {
            showTableNotFoundError();
        }
    }, 500);
}

// Open Supabase dashboard in new tab
function openSupabaseDashboard() {
    const supabaseUrl = 'https://btuevxqfcceeitmtfrna.supabase.co';
    window.open(`${supabaseUrl.replace('.supabase.co', '')}.supabase.co`, '_blank');
}

// Show manual table creation SQL
function showManualTableCreation() {
    const sql = `-- SQL to create subjective_questions table
CREATE TABLE IF NOT EXISTS public.subjective_questions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    course_id uuid,
    question_text text NOT NULL,
    max_words integer DEFAULT 500,
    marks integer DEFAULT 10,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT subjective_questions_pkey PRIMARY KEY (id),
    CONSTRAINT subjective_questions_course_id_fkey 
        FOREIGN KEY (course_id) 
        REFERENCES public.courses(id) 
        ON DELETE CASCADE
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subjective_questions_course_id 
    ON public.subjective_questions(course_id);

-- Enable Row Level Security
ALTER TABLE public.subjective_questions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed)
CREATE POLICY "Enable all access for subjective_questions" 
    ON public.subjective_questions 
    FOR ALL 
    USING (true);

-- Create subjective_answers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subjective_answers (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    session_id uuid,
    question_id uuid,
    answer_text text NOT NULL,
    word_count integer,
    submitted_at timestamp with time zone DEFAULT now(),
    CONSTRAINT subjective_answers_pkey PRIMARY KEY (id),
    CONSTRAINT subjective_answers_question_id_fkey 
        FOREIGN KEY (question_id) 
        REFERENCES public.subjective_questions(id) 
        ON DELETE CASCADE,
    CONSTRAINT subjective_answers_session_id_fkey 
        FOREIGN KEY (session_id) 
        REFERENCES public.exam_sessions(id) 
        ON DELETE CASCADE
);

-- Enable RLS for subjective_answers
ALTER TABLE public.subjective_answers ENABLE ROW LEVEL SECURITY;

-- Create policy for subjective_answers
CREATE POLICY "Enable all access for subjective_answers" 
    ON public.subjective_answers 
    FOR ALL 
    USING (true);`;

    // Create modal to show SQL
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    
    modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 10px; max-width: 800px; max-height: 80vh; overflow-y: auto; width: 90%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0;">SQL Table Creation Script</h3>
                <button onclick="this.closest('div[style*=fixed]').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            <p style="color: #666; margin-bottom: 1rem;">
                Copy and run this SQL in your Supabase SQL Editor:
            </p>
            <pre style="background: #f5f5f5; padding: 1rem; border-radius: 5px; overflow-x: auto; font-size: 0.85rem;">${sql}</pre>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button class="btn btn-primary" onclick="navigator.clipboard.writeText(\`${sql.replace(/`/g, '\\`')}\`); alert('SQL copied to clipboard!');">
                    <i class="fas fa-copy"></i> Copy SQL
                </button>
                <button class="btn btn-secondary" onclick="window.open('https://supabase.com/dashboard/project/btuevxqfcceeitmtfrna/sql/new', '_blank')">
                    <i class="fas fa-external-link-alt"></i> Open SQL Editor
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Load subjective questions with improved error handling
async function loadSubjectiveQuestions(filters = {}) {
    try {
        console.log('Loading subjective questions...');
        currentSubjectiveFilters = filters;
        
        // Check if table exists first
        if (!tableExists) {
            const exists = await checkTableExists();
            if (!exists) {
                showTableNotFoundError();
                return;
            }
        }
        
        let query = supabase
            .from('subjective_questions')
            .select(`
                *,
                courses (
                    course_code,
                    course_title
                )
            `)
            .order('created_at', { ascending: false });
        
        // Apply filters if specified
        if (filters.courseId) {
            query = query.eq('course_id', filters.courseId);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Supabase error:', error);
            
            // Handle cache error specifically
            if (error.code === 'PGRST205' || error.message.includes('schema cache')) {
                tableExists = false;
                showTableNotFoundError();
                return;
            }
            
            throw error;
        }
        
        console.log(`✅ Loaded ${data?.length || 0} subjective questions`);
        allSubjectiveQuestions = data || [];
        
        // Render table
        await renderSubjectiveQuestionsTable(data);
        
    } catch (error) {
        console.error('Error loading subjective questions:', error);
        showLoadError(error);
    }
}

// Show load error
function showLoadError(error) {
    const tbody = document.getElementById('subjectiveQuestionsTable');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #f44336; padding: 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <br>
                    Error loading subjective questions
                    <br>
                    <small style="color: #666;">${error.message || 'Database error'}</small>
                    <br><br>
                    <button class="btn btn-sm btn-primary" onclick="retryLoadSubjectiveQuestions()">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </td>
            </tr>
        `;
    }
    updateQuestionCount('Error');
}

// Update question count
function updateQuestionCount(count) {
    const countElement = document.getElementById('filteredSubjectiveQuestionsCount');
    if (countElement) {
        if (typeof count === 'number') {
            countElement.textContent = count.toString();
            countElement.style.color = '';
        } else {
            countElement.textContent = count || '0';
            countElement.style.color = '#ff9800';
        }
    }
}

// Render the table
async function renderSubjectiveQuestionsTable(questions) {
    const tbody = document.getElementById('subjectiveQuestionsTable');
    if (!tbody) {
        console.warn('subjectiveQuestionsTable not found yet, retrying...');
        setTimeout(() => renderSubjectiveQuestionsTable(questions), 500);
        return;
    }
    
    if (!questions || questions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #999; padding: 2rem;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <br>
                    No subjective questions found
                    <br><br>
                    <button class="btn btn-sm btn-primary" onclick="openAddSubjectiveQuestionModal()">
                        <i class="fas fa-plus"></i> Add First Question
                    </button>
                </td>
            </tr>
        `;
        updateQuestionCount(0);
        return;
    }
    
    tbody.innerHTML = questions.map(question => {
        const preview = question.question_text?.length > 60 
            ? question.question_text.substring(0, 60) + '...' 
            : question.question_text || '';
        
        const courseCode = question.courses?.course_code || 'Unknown';
        
        const date = question.created_at 
            ? new Date(question.created_at).toLocaleDateString('en-GB')
            : 'N/A';
        
        return `
            <tr>
                <td>${courseCode}</td>
                <td title="${question.question_text || ''}">${preview}</td>
                <td style="text-align: center;">${question.max_words || 500}</td>
                <td style="text-align: center;">${question.marks || 10}</td>
                <td>${date}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-sm btn-view" onclick="viewSubjectiveQuestion('${question.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-edit" onclick="editSubjectiveQuestion('${question.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-delete" onclick="deleteSubjectiveQuestion('${question.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    updateQuestionCount(questions.length);
}

// Load course information
async function loadCourseInfoForQuestions(questions) {
    try {
        if (!questions || questions.length === 0) {
            return questions || [];
        }
        
        // Get unique course IDs
        const courseIds = [...new Set(questions.map(q => q.course_id).filter(id => id))];
        
        if (courseIds.length === 0) {
            return questions.map(q => ({ ...q, courseCode: 'Unknown' }));
        }
        
        // Load courses
        const { data: courses, error } = await supabase
            .from('courses')
            .select('id, course_code')
            .in('id', courseIds);
        
        if (error) {
            console.warn('Error loading courses:', error);
            return questions.map(q => ({ ...q, courseCode: 'Unknown' }));
        }
        
        // Create course map
        const courseMap = {};
        courses.forEach(course => {
            courseMap[course.id] = course.course_code;
        });
        
        // Add course code to questions
        return questions.map(q => ({
            ...q,
            courseCode: courseMap[q.course_id] || 'Unknown'
        }));
        
    } catch (error) {
        console.error('Error loading course info:', error);
        return questions.map(q => ({ ...q, courseCode: 'Unknown' }));
    }
}

// Load filter options
async function loadSubjectiveFilterOptions() {
    try {
        const { data: courses, error } = await supabase
            .from('courses')
            .select('id, course_code, course_title')
            .order('course_code');
        
        if (error) throw error;
        
        // Update subjective course filter
        const subjectiveFilter = document.getElementById('filterSubjectiveCourse');
        if (subjectiveFilter) {
            subjectiveFilter.innerHTML = '<option value="">All Courses</option>' + 
                (courses?.map(course => 
                    `<option value="${course.id}">${course.course_code} - ${course.course_title}</option>`
                ).join('') || '');
        }
        
        // Update subjective course dropdown in add modal
        const subjectiveCourseSelect = document.getElementById('subjectiveCourse');
        if (subjectiveCourseSelect) {
            subjectiveCourseSelect.innerHTML = '<option value="">-- Select Course --</option>' + 
                (courses?.map(course => 
                    `<option value="${course.id}">${course.course_code} - ${course.course_title}</option>`
                ).join('') || '');
        }
        
        // Update subjective course dropdown in bulk upload modal
        const bulkSubjectiveCourseSelect = document.getElementById('bulkSubjectiveCourse');
        if (bulkSubjectiveCourseSelect) {
            bulkSubjectiveCourseSelect.innerHTML = '<option value="">-- Select Course --</option>' + 
                (courses?.map(course => 
                    `<option value="${course.id}">${course.course_code} - ${course.course_title}</option>`
                ).join('') || '');
        }
        
    } catch (error) {
        console.error('Error loading subjective filter options:', error);
    }
}

// Apply filters
function applySubjectiveFilters() {
    const courseId = document.getElementById('filterSubjectiveCourse')?.value;
    const filters = {};
    if (courseId) filters.courseId = courseId;
    loadSubjectiveQuestions(filters);
}

// Clear filters
function clearSubjectiveFilters() {
    const filterElement = document.getElementById('filterSubjectiveCourse');
    if (filterElement) {
        filterElement.value = '';
    }
    loadSubjectiveQuestions();
}

// Updated addSubjectiveQuestion function
async function addSubjectiveQuestion(event) {
    if (event) event.preventDefault();
    
    try {
        const courseId = document.getElementById('subjectiveCourse')?.value;
        const questionText = document.getElementById('subjectiveQuestionText')?.value.trim();
        const maxWords = parseInt(document.getElementById('subjectiveMaxWords')?.value) || 500;
        const marks = parseInt(document.getElementById('subjectiveMarks')?.value) || 10;
        const gradingType = document.getElementById('subjectiveGradingType')?.value || 'manual';
        
        // Auto-grading fields
        const expectedAnswer = document.getElementById('expectedAnswer')?.value.trim();
        const keywordsInput = document.getElementById('keywords')?.value.trim();
        const keywordWeightage = parseInt(document.getElementById('keywordWeightage')?.value) || 60;
        
        if (!courseId) {
            showAlert('subjectiveAlert', 'Please select a course', 'error');
            return;
        }
        
        if (!questionText) {
            showAlert('subjectiveAlert', 'Please enter the question text', 'error');
            return;
        }
        
        // Validate auto-grading fields if auto-grading is selected
        if ((gradingType === 'auto' || gradingType === 'mixed') && !expectedAnswer) {
            showAlert('subjectiveAlert', 'Please provide an expected answer for auto-grading', 'error');
            return;
        }
        
        // Parse keywords
        let keywords = [];
        if (keywordsInput) {
            keywords = keywordsInput.split(',').map(k => k.trim()).filter(k => k.length > 0);
        }
        
        const questionData = {
            course_id: courseId,
            question_text: questionText,
            max_words: maxWords,
            marks: marks,
            grading_type: gradingType,
            keyword_weightage: keywordWeightage,
            min_word_count: parseInt(document.getElementById('minWordCount')?.value) || 50
        };
        
        // Add auto-grading fields only if needed
        if (gradingType !== 'manual') {
            questionData.expected_answer = expectedAnswer;
            questionData.keywords = keywords;
        }
        
        const { data, error } = await supabase
            .from('subjective_questions')
            .insert([questionData])
            .select();
        
        if (error) {
            showAlert('subjectiveAlert', 'Error adding question: ' + error.message, 'error');
            return;
        }
        
        showAlert('subjectiveAlert', 'Question added successfully!', 'success');
        
        setTimeout(() => {
            closeModal('addSubjectiveQuestionModal');
            loadSubjectiveQuestions(currentSubjectiveFilters);
            document.getElementById('subjectiveQuestionText').value = '';
        }, 1500);
        
    } catch (error) {
        console.error('Error adding question:', error);
        showAlert('subjectiveAlert', 'An unexpected error occurred', 'error');
    }
}

// View subjective question
async function viewSubjectiveQuestion(id) {
    try {
        const { data, error } = await supabase
            .from('subjective_questions')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        alert(`
📝 Question Details
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Question:
${data.question_text}

Settings:
• Maximum Words: ${data.max_words || 500}
• Marks: ${data.marks || 10}
• Created: ${new Date(data.created_at).toLocaleDateString()}

ID: ${data.id}
        `);
        
    } catch (error) {
        console.error('Error viewing question:', error);
        alert('Error loading question details');
    }
}


// Updated editSubjectiveQuestion function
async function editSubjectiveQuestion(id) {
    try {
        const { data, error } = await supabase
            .from('subjective_questions')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Populate form
        document.getElementById('subjectiveCourse').value = data.course_id;
        document.getElementById('subjectiveQuestionText').value = data.question_text;
        document.getElementById('subjectiveMaxWords').value = data.max_words || 500;
        document.getElementById('subjectiveMarks').value = data.marks || 10;
        document.getElementById('subjectiveGradingType').value = data.grading_type || 'manual';
        
        // Populate auto-grading fields
        if (data.expected_answer) {
            document.getElementById('expectedAnswer').value = data.expected_answer;
        }
        if (data.keywords) {
            document.getElementById('keywords').value = Array.isArray(data.keywords) ? 
                data.keywords.join(', ') : data.keywords;
        }
        document.getElementById('keywordWeightage').value = data.keyword_weightage || 60;
        document.getElementById('minWordCount').value = data.min_word_count || 50;
        
        // Toggle auto-grading fields visibility
        toggleGradingType();
        
        // ... (rest of edit function remains the same) ...
        
    } catch (error) {
        console.error('Error loading question for edit:', error);
        alert('Error loading question');
    }
}

// Auto-grade a single answer
async function autoGradeAnswer(answerText, question) {
    // Same implementation as in student.js
    try {
        if (!question.grading_type || question.grading_type === 'manual') {
            return null;
        }
        
        let score = 0;
        const keywordsFound = [];
        
        const wordCount = answerText.trim().split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount < (question.min_word_count || 50)) {
            return { 
                auto_score: 0, 
                keywords_found: [], 
                similarity_score: 0
            };
        }
        
        if (question.keywords && Array.isArray(question.keywords) && question.keywords.length > 0) {
            const keywordWeight = question.keyword_weightage || 60;
            const answerLower = answerText.toLowerCase();
            
            question.keywords.forEach(keyword => {
                if (answerLower.includes(keyword.toLowerCase())) {
                    keywordsFound.push(keyword);
                }
            });
            
            const keywordPercentage = keywordsFound.length / question.keywords.length;
            score += (keywordPercentage * keywordWeight);
        }
        
        let similarityScore = 0;
        if (question.expected_answer) {
            const similarityWeight = 100 - (question.keyword_weightage || 60);
            if (similarityWeight > 0) {
                similarityScore = calculateTextSimilarity(answerText, question.expected_answer);
                score += (similarityScore * similarityWeight);
            }
        }
        
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

// Simple text similarity calculation (cosine similarity)
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

// Update subjective question
async function updateSubjectiveQuestion(event, id) {
    if (event) event.preventDefault();
    
    try {
        const courseId = document.getElementById('subjectiveCourse')?.value;
        const questionText = document.getElementById('subjectiveQuestionText')?.value.trim();
        const maxWords = parseInt(document.getElementById('subjectiveMaxWords')?.value) || 500;
        const marks = parseInt(document.getElementById('subjectiveMarks')?.value) || 10;
        
        if (!courseId) {
            showAlert('subjectiveAlert', 'Please select a course', 'error');
            return;
        }
        
        if (!questionText) {
            showAlert('subjectiveAlert', 'Please enter the question text', 'error');
            return;
        }
        
        const { error } = await supabase
            .from('subjective_questions')
            .update({
                course_id: courseId,
                question_text: questionText,
                max_words: maxWords,
                marks: marks,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        
        if (error) throw error;
        
        showAlert('subjectiveAlert', 'Question updated successfully!', 'success');
        
        setTimeout(() => {
            closeModal('addSubjectiveQuestionModal');
            loadSubjectiveQuestions(currentSubjectiveFilters);
            resetSubjectiveForm();
        }, 1500);
        
    } catch (error) {
        console.error('Error updating question:', error);
        showAlert('subjectiveAlert', 'Error updating question', 'error');
    }
}

// Delete subjective question
async function deleteSubjectiveQuestion(id) {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
        const { error } = await supabase
            .from('subjective_questions')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        alert('Question deleted successfully!');
        loadSubjectiveQuestions(currentSubjectiveFilters);
        
    } catch (error) {
        console.error('Error deleting question:', error);
        alert('Error deleting question');
    }
}

// Reset form
function resetSubjectiveForm() {
    const submitBtn = document.querySelector('#addSubjectiveQuestionModal button[type="submit"]');
    const modalTitle = document.querySelector('#addSubjectiveQuestionModal .modal-title');
    
    if (submitBtn) {
        submitBtn.textContent = 'Add Subjective Question';
        submitBtn.onclick = function(e) {
            e.preventDefault();
            addSubjectiveQuestion(e);
        };
    }
    
    if (modalTitle) {
        modalTitle.textContent = 'Add Subjective Question';
    }
    
    const modal = document.getElementById('addSubjectiveQuestionModal');
    if (modal) {
        modal.removeAttribute('data-edit-id');
    }
    
    document.getElementById('subjectiveQuestionText').value = '';
    document.getElementById('subjectiveMaxWords').value = '500';
    document.getElementById('subjectiveMarks').value = '10';
}

// Update bulk upload parsing
async function bulkUploadSubjectiveQuestions(event) {
    if (event) event.preventDefault();
    
    const courseId = document.getElementById('bulkSubjectiveCourse')?.value;
    const fileInput = document.getElementById('subjectiveQuestionsCSV');
    
    if (!courseId) {
        showAlert('bulkSubjectiveAlert', 'Please select a course', 'error');
        return;
    }
    
    if (!fileInput?.files[0]) {
        showAlert('bulkSubjectiveAlert', 'Please select a CSV file', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            
            // Skip header
            const dataLines = lines.slice(1);
            const questions = [];
            
            for (let i = 0; i < dataLines.length; i++) {
                const line = dataLines[i];
                // Parse CSV with quotes
                const parts = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
                
                if (parts.length >= 1) {
                    const questionText = parts[0].replace(/^"|"$/g, '');
                    const maxWords = parts.length >= 2 ? parseInt(parts[1]) || 500 : 500;
                    const marks = parts.length >= 3 ? parseInt(parts[2]) || 10 : 10;
                    const gradingType = parts.length >= 4 ? parts[3].replace(/^"|"$/g, '').toLowerCase() : 'manual';
                    const expectedAnswer = parts.length >= 5 ? parts[4].replace(/^"|"$/g, '') : '';
                    const keywords = parts.length >= 6 ? 
                        parts[5].replace(/^"|"$/g, '').split(',').map(k => k.trim()).filter(k => k) : [];
                    const keywordWeightage = parts.length >= 7 ? parseInt(parts[6]) || 60 : 60;
                    const minWordCount = parts.length >= 8 ? parseInt(parts[7]) || 50 : 50;
                    
                    if (questionText) {
                        questions.push({
                            course_id: courseId,
                            question_text: questionText,
                            max_words: maxWords,
                            marks: marks,
                            grading_type: gradingType,
                            expected_answer: expectedAnswer,
                            keywords: keywords,
                            keyword_weightage: keywordWeightage,
                            min_word_count: minWordCount
                        });
                    }
                }
            }
            
            if (questions.length === 0) {
                showAlert('bulkSubjectiveAlert', 'No valid questions found', 'error');
                return;
            }
            
            const { error } = await supabase
                .from('subjective_questions')
                .insert(questions);
            
            if (error) throw error;
            
            showAlert('bulkSubjectiveAlert', `Successfully uploaded ${questions.length} questions!`, 'success');
            
            setTimeout(() => {
                closeModal('bulkUploadSubjectiveQuestionsModal');
                loadSubjectiveQuestions();
                fileInput.value = '';
            }, 2000);
            
        } catch (error) {
            console.error('Error uploading questions:', error);
            showAlert('bulkSubjectiveAlert', 'Error: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file);
}

// Update downloadSubjectiveTemplate function in subjective-admin.js
function downloadSubjectiveTemplate() {
    const csvContent = `Question,Max Words,Marks,Grading Type,Expected Answer,Keywords,Keyword Weightage,Min Word Count
"Explain the diagnosis process for a patient with chronic symptoms.",500,15,auto,"Diagnosis involves history taking, physical examination, and diagnostic tests. The process includes...","diagnosis, symptoms, physical examination, tests, treatment",60,100
"Discuss the ethical considerations in community health interventions.",300,10,mixed,"Ethical considerations include autonomy, beneficence, non-maleficence, and justice. Community health...","ethics, autonomy, beneficence, justice, community",70,80
"Describe the role of preventive medicine in modern healthcare.",400,12,manual,"Preventive medicine focuses on disease prevention rather than treatment. It includes...","",0,50`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subjective_questions_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Export questions
async function exportSubjectiveQuestions() {
    if (!allSubjectiveQuestions || allSubjectiveQuestions.length === 0) {
        alert('No questions to export');
        return;
    }
    
    const questionsWithCourses = await loadCourseInfoForQuestions(allSubjectiveQuestions);
    
    let csv = 'Course Code,Question,Max Words,Marks,Date\n';
    
    questionsWithCourses.forEach(q => {
        const date = q.created_at ? new Date(q.created_at).toLocaleDateString('en-GB') : '';
        csv += `${q.courseCode},"${q.question_text?.replace(/"/g, '""') || ''}",${q.max_words || 500},${q.marks || 10},${date}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subjective_questions_export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Refresh Supabase cache
function refreshSupabaseCache() {
    alert('Please go to your Supabase dashboard → Settings → API → Generate types to refresh the schema cache.');
    console.log('Refresh Supabase schema cache by:');
    console.log('1. Go to Supabase dashboard');
    console.log('2. Settings → API');
    console.log('3. Click "Generate types" button');
    console.log('4. Wait 1-2 minutes');
}

// Open modals
function openAddSubjectiveQuestionModal() {
    resetSubjectiveForm();
    
    // Load courses if needed
    if (document.getElementById('subjectiveCourse').options.length <= 1) {
        loadSubjectiveFilterOptions();
    }
    
    openModal('addSubjectiveQuestionModal');
}

function openBulkUploadSubjectiveQuestionsModal() {
    // Load courses if needed
    if (document.getElementById('bulkSubjectiveCourse').options.length <= 1) {
        loadSubjectiveFilterOptions();
    }
    
    openModal('bulkUploadSubjectiveQuestionsModal');
}


// Function to toggle grading type in modal
function toggleGradingType() {
    const gradingType = document.getElementById('subjectiveGradingType')?.value;
    const autoGradingFields = document.getElementById('autoGradingFields');
    
    if (autoGradingFields) {
        if (gradingType === 'auto' || gradingType === 'mixed') {
            autoGradingFields.style.display = 'block';
        } else {
            autoGradingFields.style.display = 'none';
        }
    }
}

// Bulk auto-grade all answers for a question
async function bulkAutoGrade(questionId) {
    if (!confirm('Auto-grade all answers for this question? This will overwrite existing auto-scores.')) {
        return;
    }
    
    try {
        // Get the question
        const { data: question, error: qError } = await supabase
            .from('subjective_questions')
            .select('*')
            .eq('id', questionId)
            .single();
        
        if (qError) throw qError;
        
        if (question.grading_type === 'manual') {
            alert('This question is set for manual grading only');
            return;
        }
        
        // Get all answers for this question
        const { data: answers, error: aError } = await supabase
            .from('subjective_answers')
            .select('*')
            .eq('question_id', questionId);
        
        if (aError) throw aError;
        
        if (!answers || answers.length === 0) {
            alert('No answers found for this question');
            return;
        }
        
        let gradedCount = 0;
        
        // Grade each answer
        for (const answer of answers) {
            const gradingResult = await autoGradeAnswer(answer.answer_text, question);
            
            if (gradingResult) {
                const { error: updateError } = await supabase
                    .from('subjective_answers')
                    .update({
                        auto_score: gradingResult.auto_score,
                        keywords_found: gradingResult.keywords_found,
                        word_count: gradingResult.word_count,
                        graded_at: new Date().toISOString()
                    })
                    .eq('id', answer.id);
                
                if (!updateError) gradedCount++;
            }
        }
        
        alert(`Auto-graded ${gradedCount} answers for question`);
        
    } catch (error) {
        console.error('Error in bulk auto-grade:', error);
        alert('Error auto-grading answers');
    }
}

// Update downloadSubjectiveTemplate function in subjective-admin.js
function downloadSubjectiveTemplate() {
    const csvContent = `Question,Max Words,Marks,Grading Type,Expected Answer,Keywords,Keyword Weightage,Min Word Count
"Explain the diagnosis process for a patient with chronic symptoms.",500,15,auto,"Diagnosis involves history taking, physical examination, and diagnostic tests. The process includes...","diagnosis, symptoms, physical examination, tests, treatment",60,100
"Discuss the ethical considerations in community health interventions.",300,10,mixed,"Ethical considerations include autonomy, beneficence, non-maleficence, and justice. Community health...","ethics, autonomy, beneficence, justice, community",70,80
"Describe the role of preventive medicine in modern healthcare.",400,12,manual,"Preventive medicine focuses on disease prevention rather than treatment. It includes...","",0,50`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subjective_questions_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Export questions
async function exportSubjectiveQuestions() {
    if (!allSubjectiveQuestions || allSubjectiveQuestions.length === 0) {
        alert('No questions to export');
        return;
    }
    
    const questionsWithCourses = await loadCourseInfoForQuestions(allSubjectiveQuestions);
    
    let csv = 'Course Code,Question,Max Words,Marks,Date\n';
    
    questionsWithCourses.forEach(q => {
        const date = q.created_at ? new Date(q.created_at).toLocaleDateString('en-GB') : '';
        csv += `${q.courseCode},"${q.question_text?.replace(/"/g, '""') || ''}",${q.max_words || 500},${q.marks || 10},${date}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subjective_questions_export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Refresh Supabase cache
function refreshSupabaseCache() {
    alert('Please go to your Supabase dashboard → Settings → API → Generate types to refresh the schema cache.');
    console.log('Refresh Supabase schema cache by:');
    console.log('1. Go to Supabase dashboard');
    console.log('2. Settings → API');
    console.log('3. Click "Generate types" button');
    console.log('4. Wait 1-2 minutes');
}

// Open modals
function openAddSubjectiveQuestionModal() {
    resetSubjectiveForm();
    
    // Load courses if needed
    if (document.getElementById('subjectiveCourse').options.length <= 1) {
        loadSubjectiveFilterOptions();
    }
    
    openModal('addSubjectiveQuestionModal');
}

function openBulkUploadSubjectiveQuestionsModal() {
    // Load courses if needed
    if (document.getElementById('bulkSubjectiveCourse').options.length <= 1) {
        loadSubjectiveFilterOptions();
    }
    
    openModal('bulkUploadSubjectiveQuestionsModal');
}


// Function to toggle grading type in modal
function toggleGradingType() {
    const gradingType = document.getElementById('subjectiveGradingType')?.value;
    const autoGradingFields = document.getElementById('autoGradingFields');
    
    if (autoGradingFields) {
        if (gradingType === 'auto' || gradingType === 'mixed') {
            autoGradingFields.style.display = 'block';
        } else {
            autoGradingFields.style.display = 'none';
        }
    }
}

// Recalculate exam scores after grading
async function recalculateExamScores(answerId) {
    try {
        // Get the answer's session
        const { data: answer, error: ansError } = await supabase
            .from('subjective_answers')
            .select('session_id, question_id, final_score')
            .eq('id', answerId)
            .single();
        
        if (ansError) throw ansError;
        
        // Get all subjective answers for this session
        const { data: allAnswers, error: allError } = await supabase
            .from('subjective_answers')
            .select('*, subjective_questions(marks)')
            .eq('session_id', answer.session_id);
        
        if (allError) throw allError;
        
        // Calculate total subjective marks obtained
        let marksObtained = 0;
        let totalMarks = 0;
        let gradedCount = 0;
        
        allAnswers.forEach(ans => {
            const questionMarks = ans.subjective_questions?.marks || 10;
            totalMarks += questionMarks;
            
            if (ans.final_score !== null && ans.final_score !== undefined) {
                marksObtained += ans.final_score;
                gradedCount++;
            } else if (ans.auto_score !== null && ans.auto_score !== undefined) {
                marksObtained += (ans.auto_score / 100) * questionMarks;
                gradedCount++;
            }
        });
        
        const subjectiveScore = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;
        
        // Get exam result
        const { data: examResult, error: resultError } = await supabase
            .from('exam_results')
            .select('*')
            .eq('session_id', answer.session_id)
            .single();
        
        if (resultError) throw resultError;
        
        // Calculate new final score
        const objectiveScore = examResult.objective_score || examResult.score || 0;
        const objectiveCount = examResult.total_questions || 0;
        const subjectiveCount = examResult.total_subjective_questions || 0;
        const totalQuestions = objectiveCount + subjectiveCount;
        
        let finalScore = objectiveScore;
        if (totalQuestions > 0) {
            const objectiveWeight = objectiveCount / totalQuestions;
            const subjectiveWeight = subjectiveCount / totalQuestions;
            finalScore = (objectiveScore * objectiveWeight) + (subjectiveScore * subjectiveWeight);
        }
        
        // Update exam result
        await supabase
            .from('exam_results')
            .update({
                subjective_marks_obtained: marksObtained,
                subjective_score: subjectiveScore,
                final_score: finalScore,
                updated_at: new Date().toISOString()
            })
            .eq('session_id', answer.session_id);
        
    } catch (error) {
        console.error('Error recalculating scores:', error);
    }
}


async function bulkAutoGradeAnswers(questionId) {
    if (!confirm('Auto-grade all answers for this question?')) return;
    
    try {
        // Get question
        const { data: question, error: qError } = await supabase
            .from('subjective_questions')
            .select('*')
            .eq('id', questionId)
            .single();
        
        if (qError) throw qError;
        
        if (question.grading_type === 'manual') {
            alert('This question is set for manual grading only');
            return;
        }
        
        // Get all answers
        const { data: answers, error: aError } = await supabase
            .from('subjective_answers')
            .select('*')
            .eq('question_id', questionId);
        
        if (aError) throw aError;
        
        if (!answers || answers.length === 0) {
            alert('No answers to grade');
            return;
        }
        
        let gradedCount = 0;
        
        for (const answer of answers) {
            const result = await autoGradeAnswer(answer.answer_text, question);
            
            if (result) {
                await supabase
                    .from('subjective_answers')
                    .update({
                        auto_score: result.auto_score,
                        keywords_found: result.keywords_found,
                        similarity_score: result.similarity_score,
                        graded_at: new Date().toISOString()
                    })
                    .eq('id', answer.id);
                
                await recalculateExamScores(answer.id);
                gradedCount++;
            }
        }
        
        alert(`Auto-graded ${gradedCount} answers`);
        
        // Reload the modal
        document.querySelector('div[style*="position: fixed"]')?.remove();
        viewSubjectiveAnswers(questionId);
        
    } catch (error) {
        console.error('Error in bulk auto-grade:', error);
        alert('Error: ' + error.message);
    }
}

// FIXED: View and grade subjective answers
// Function to view and grade subjective answers (for admin)
async function viewSubjectiveAnswers(questionId) {
    try {
        // Get the question first
        const { data: question, error: qError } = await supabase
            .from('subjective_questions')
            .select('*')
            .eq('id', questionId)
            .single();
        
        if (qError) throw qError;
        
        // Get all answers for this question with student info
        // FIXED: Use correct relationship path through exam_sessions only
        const { data: answers, error } = await supabase
            .from('subjective_answers')
            .select(`
                *,
                exam_sessions!inner (
                    id,
                    created_at,
                    students (matric_number, full_name, level)
                )
            `)
            .eq('question_id', questionId)
            .order('submitted_at', { ascending: false });
        
        if (error) throw error;
        
        // Optionally fetch exam results separately if needed
        let examResults = {};
        if (answers && answers.length > 0) {
            const sessionIds = answers.map(a => a.session_id).filter(Boolean);
            if (sessionIds.length > 0) {
                const { data: results } = await supabase
                    .from('exam_results')
                    .select('session_id, score, objective_score, final_score')
                    .in('session_id', sessionIds);
                
                if (results) {
                    results.forEach(r => {
                        examResults[r.session_id] = r;
                    });
                }
            }
        }
        
        // Create modal for viewing and grading answers
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;';
        
        const totalMarks = question.marks || 10;
        
        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 10px; max-width: 900px; max-height: 90vh; overflow-y: auto; width: 95%;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 0.5rem 0;">📝 Grade Subjective Answers</h3>
                        <div style="color: #666; font-size: 0.9rem; margin-bottom: 0.5rem;">
                            <strong>Question:</strong> ${question.question_text.substring(0, 100)}${question.question_text.length > 100 ? '...' : ''}
                        </div>
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                            <span style="background: #e3f2fd; color: #1976d2; padding: 0.3rem 0.8rem; border-radius: 4px; font-size: 0.85rem;">
                                Grading: ${question.grading_type || 'manual'}
                            </span>
                            <span style="background: #f3e5f5; color: #7b1fa2; padding: 0.3rem 0.8rem; border-radius: 4px; font-size: 0.85rem;">
                                Marks: ${totalMarks}
                            </span>
                            <span style="background: #e8f5e8; color: #388e3c; padding: 0.3rem 0.8rem; border-radius: 4px; font-size: 0.85rem;">
                                Answers: ${answers.length}
                            </span>
                        </div>
                    </div>
                    <button onclick="this.closest('div[style*=fixed]').remove()" 
                            style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">&times;</button>
                </div>
                
                ${answers.length === 0 ? `
                    <div style="text-align: center; padding: 3rem; color: #999;">
                        <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <p>No answers submitted yet</p>
                    </div>
                ` : `
                    <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <button onclick="bulkAutoGrade('${questionId}')" 
                                    style="background: #4caf50; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">
                                <i class="fas fa-robot"></i> Auto-Grade All
                            </button>
                            <button onclick="exportAnswersToCSV('${questionId}')" 
                                    style="background: #2196f3; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 4px; cursor: pointer; font-size: 0.9rem; margin-left: 0.5rem;">
                                <i class="fas fa-download"></i> Export CSV
                            </button>
                        </div>
                        <div style="color: #666; font-size: 0.9rem;">
                            Showing ${answers.length} answer(s)
                        </div>
                    </div>
                    
                    <div id="answersContainer" style="max-height: 500px; overflow-y: auto;">
                        ${answers.map((answer, index) => {
                            // FIXED: Access student through exam_sessions
                            const student = answer.exam_sessions?.students;
                            const examResult = examResults[answer.session_id];
                            const maxScore = totalMarks;
                            const currentScore = answer.final_score !== null ? answer.final_score : 
                                                (answer.auto_score !== null ? (answer.auto_score / 100) * maxScore : 0);
                            
                            return `
                                <div style="border: 1px solid ${answer.final_score !== null ? '#4caf50' : '#e0e0e0'}; 
                                            border-left: 4px solid ${answer.final_score !== null ? '#4caf50' : (answer.auto_score !== null ? '#ff9800' : '#9e9e9e')}; 
                                            border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; 
                                            background: ${answer.final_score !== null ? '#f8fff8' : '#fff'}">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap;">
                                        <div>
                                            <div style="font-weight: bold; font-size: 1.1rem; color: #333;">
                                                ${student?.full_name || 'Unknown Student'}
                                            </div>
                                            <div style="color: #666; font-size: 0.9rem; margin-top: 0.2rem;">
                                                ${student?.matric_number || 'N/A'} • Level ${student?.level || 'N/A'}
                                            </div>
                                            ${examResult ? `
                                                <div style="color: #888; font-size: 0.85rem; margin-top: 0.3rem;">
                                                    Exam Score: ${examResult.final_score || examResult.score || 0}%
                                                </div>
                                            ` : ''}
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="font-size: 1.5rem; font-weight: bold; color: #333;">
                                                ${currentScore.toFixed(1)}<span style="font-size: 1rem; color: #666;">/${maxScore}</span>
                                            </div>
                                            <div style="color: #666; font-size: 0.8rem; margin-top: 0.2rem;">
                                                ${answer.final_score !== null ? 
                                                    `<span style="color: #4caf50;"><i class="fas fa-check"></i> Manually Graded</span>` :
                                                    answer.auto_score !== null ? 
                                                    `<span style="color: #ff9800;"><i class="fas fa-robot"></i> Auto: ${answer.auto_score}%</span>` :
                                                    `<span style="color: #9e9e9e;"><i class="fas fa-clock"></i> Not Graded</span>`
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style="margin-bottom: 1rem;">
                                        <div style="font-weight: bold; color: #666; margin-bottom: 0.5rem;">Answer:</div>
                                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 5px; white-space: pre-wrap; line-height: 1.5; max-height: 200px; overflow-y: auto;">
                                            ${answer.answer_text.replace(/\n/g, '<br>')}
                                        </div>
                                        <div style="display: flex; justify-content: space-between; color: #666; font-size: 0.85rem; margin-top: 0.5rem;">
                                            <span>Words: ${answer.word_count || 'N/A'}</span>
                                            <span>Submitted: ${new Date(answer.submitted_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    
                                    ${answer.keywords_found && answer.keywords_found.length > 0 ? `
                                        <div style="margin-bottom: 1rem;">
                                            <div style="font-weight: bold; color: #666; margin-bottom: 0.5rem;">Keywords Found:</div>
                                            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                                                ${answer.keywords_found.map(keyword => `
                                                    <span style="background: #e3f2fd; color: #1976d2; padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.85rem;">
                                                        ${keyword}
                                                    </span>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    <div style="display: flex; gap: 1rem; align-items: center; margin-top: 1rem;">
                                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                                            <input type="number" id="score_${answer.id}" 
                                                   value="${currentScore.toFixed(1)}" 
                                                   min="0" max="${maxScore}" step="0.5"
                                                   style="width: 80px; padding: 0.5rem; border: 2px solid #ddd; border-radius: 4px; font-size: 1rem;"
                                                   onchange="updateScoreColor('${answer.id}', this.value, ${maxScore})">
                                            <span style="color: #666;">/ ${maxScore}</span>
                                        </div>
                                        <button onclick="saveManualGrade('${answer.id}', document.getElementById('score_${answer.id}').value, ${maxScore})" 
                                                style="background: #4caf50; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">
                                            <i class="fas fa-save"></i> Save Grade
                                        </button>
                                        <button onclick="applyAutoGrade('${answer.id}', '${questionId}')" 
                                                style="background: #ff9800; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">
                                            <i class="fas fa-robot"></i> Auto-Grade
                                        </button>
                                        <button onclick="viewAnswerDetails('${answer.id}')" 
                                                style="background: #2196f3; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">
                                            <i class="fas fa-search"></i> Details
                                        </button>
                                    </div>
                                    
                                    <div style="margin-top: 0.5rem;">
                                        <textarea id="notes_${answer.id}" 
                                                  placeholder="Grading notes (optional)" 
                                                  style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem; min-height: 60px;"
                                                  onchange="saveGradingNotes('${answer.id}', this.value)">${answer.grading_notes || ''}</textarea>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add color update for score inputs
        answers.forEach(answer => {
            const input = document.getElementById(`score_${answer.id}`);
            if (input) {
                updateScoreColor(answer.id, input.value, totalMarks);
            }
        });
        
    } catch (error) {
        console.error('Error loading subjective answers:', error);
        alert('Error loading answers: ' + error.message);
    }
}

// Helper function to update input color based on score
function updateScoreColor(answerId, score, maxScore) {
    const input = document.getElementById(`score_${answerId}`);
    if (!input) return;
    
    const percentage = (parseFloat(score) / maxScore) * 100;
    
    if (percentage >= 70) {
        input.style.borderColor = '#4caf50';
        input.style.backgroundColor = '#f8fff8';
    } else if (percentage >= 50) {
        input.style.borderColor = '#ff9800';
        input.style.backgroundColor = '#fff8f0';
    } else {
        input.style.borderColor = '#f44336';
        input.style.backgroundColor = '#fff8f8';
    }
}

// Function to save manual grade
// FIXED: Save manual grade and update exam result
async function saveManualGrade(answerId, score, maxScore, questionId) {
    try {
        const scoreValue = parseFloat(score);
        if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > maxScore) {
            alert(`Please enter a valid score between 0 and ${maxScore}`);
            return;
        }
        
        const notes = document.getElementById(`notes_${answerId}`)?.value || '';
        
        // Update the answer
        const { error } = await supabase
            .from('subjective_answers')
            .update({
                final_score: scoreValue,
                graded_at: new Date().toISOString(),
                grading_notes: notes
            })
            .eq('id', answerId);
        
        if (error) throw error;
        
        // Recalculate exam result scores
        await recalculateExamScores(answerId);
        
        // Update UI
        const answerDiv = document.getElementById(`score_${answerId}`)?.closest('div[style*="border:"]');
        if (answerDiv) {
            answerDiv.style.borderColor = '#4caf50';
            answerDiv.style.borderLeftColor = '#4caf50';
            answerDiv.style.backgroundColor = '#f8fff8';
        }
        
        showTempMessage(`Grade saved: ${scoreValue}/${maxScore}`, 'success');
        
    } catch (error) {
        console.error('Error saving grade:', error);
        alert('Error saving grade: ' + error.message);
    }
}

// Function to apply auto-grade to single answer
async function applyAutoGrade(answerId, questionId) {
    try {
        // Get the question
        const { data: question, error: qError } = await supabase
            .from('subjective_questions')
            .select('*')
            .eq('id', questionId)
            .single();
        
        if (qError) throw qError;
        
        // Get the answer
        const { data: answer, error: aError } = await supabase
            .from('subjective_answers')
            .select('*')
            .eq('id', answerId)
            .single();
        
        if (aError) throw aError;
        
        // Auto-grade the answer
        const gradingResult = await autoGradeAnswer(answer.answer_text, question);
        
        if (gradingResult) {
            const { error: updateError } = await supabase
                .from('subjective_answers')
                .update({
                    auto_score: gradingResult.auto_score,
                    keywords_found: gradingResult.keywords_found,
                    word_count: gradingResult.word_count,
                    graded_at: new Date().toISOString()
                })
                .eq('id', answerId);
            
            if (updateError) throw updateError;
            
            // Update the input field
            const maxScore = question.marks || 10;
            const autoScore = (gradingResult.auto_score / 100) * maxScore;
            const input = document.getElementById(`score_${answerId}`);
            if (input) {
                input.value = autoScore.toFixed(1);
                updateScoreColor(answerId, autoScore, maxScore);
            }
            
            // Show success message
            showTempMessage(`Auto-graded: ${gradingResult.auto_score}% = ${autoScore.toFixed(1)}/${maxScore}`, 'success');
            
            // Update keywords display
            const keywordsContainer = input?.closest('div[style*="border:"]')?.querySelector('[style*="display: flex; flex-wrap: wrap;"]');
            if (keywordsContainer && gradingResult.keywords_found.length > 0) {
                keywordsContainer.innerHTML = gradingResult.keywords_found.map(keyword => `
                    <span style="background: #e3f2fd; color: #1976d2; padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.85rem;">
                        ${keyword}
                    </span>
                `).join('');
            }
        }
        
    } catch (error) {
        console.error('Error applying auto-grade:', error);
        alert('Error auto-grading answer: ' + error.message);
    }
}

// Function to save grading notes
async function saveGradingNotes(answerId, notes) {
    try {
        const { error } = await supabase
            .from('subjective_answers')
            .update({
                grading_notes: notes
            })
            .eq('id', answerId);
        
        if (error) throw error;
        
        console.log('Notes saved for answer', answerId);
    } catch (error) {
        console.error('Error saving notes:', error);
    }
}

// Function to view answer details
async function viewAnswerDetails(answerId) {
    try {
        const { data: answer, error } = await supabase
            .from('subjective_answers')
            .select(`
                *,
                subjective_questions (question_text, expected_answer, keywords, marks),
                students (full_name, matric_number)
            `)
            .eq('id', answerId)
            .single();
        
        if (error) throw error;
        
        const question = answer.subjective_questions;
        const maxScore = question.marks || 10;
        const currentScore = answer.final_score !== null ? answer.final_score : 
                            (answer.auto_score !== null ? (answer.auto_score / 100) * maxScore : 0);
        
        const detailsHTML = `
            <div style="padding: 1rem;">
                <h4 style="margin-bottom: 1rem; color: #333;">Answer Details</h4>
                
                <div style="margin-bottom: 1rem;">
                    <strong>Student:</strong> ${answer.students.full_name} (${answer.students.matric_number})
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <strong>Question:</strong>
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 5px; margin-top: 0.5rem;">
                        ${question.question_text}
                    </div>
                </div>
                
                ${question.expected_answer ? `
                    <div style="margin-bottom: 1rem;">
                        <strong>Expected Answer:</strong>
                        <div style="background: #e8f5e8; padding: 1rem; border-radius: 5px; margin-top: 0.5rem;">
                            ${question.expected_answer}
                        </div>
                    </div>
                ` : ''}
                
                <div style="margin-bottom: 1rem;">
                    <strong>Student's Answer:</strong>
                    <div style="background: #f0f7ff; padding: 1rem; border-radius: 5px; margin-top: 0.5rem; white-space: pre-wrap;">
                        ${answer.answer_text}
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <strong>Word Count:</strong> ${answer.word_count || 'N/A'}
                    </div>
                    <div>
                        <strong>Submitted:</strong> ${new Date(answer.submitted_at).toLocaleString()}
                    </div>
                    <div>
                        <strong>Auto Score:</strong> ${answer.auto_score !== null ? `${answer.auto_score}%` : 'Not graded'}
                    </div>
                    <div>
                        <strong>Final Score:</strong> ${answer.final_score !== null ? `${answer.final_score}/${maxScore}` : 'Not set'}
                    </div>
                </div>
                
                ${question.keywords && question.keywords.length > 0 ? `
                    <div style="margin-bottom: 1rem;">
                        <strong>Expected Keywords:</strong>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                            ${question.keywords.map(keyword => {
                                const isFound = answer.keywords_found && answer.keywords_found.includes(keyword);
                                return `
                                    <span style="background: ${isFound ? '#4caf50' : '#f44336'}; 
                                             color: white; padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.85rem;">
                                        ${keyword} ${isFound ? '✓' : '✗'}
                                    </span>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${answer.grading_notes ? `
                    <div style="margin-bottom: 1rem;">
                        <strong>Grading Notes:</strong>
                        <div style="background: #fff3cd; padding: 1rem; border-radius: 5px; margin-top: 0.5rem;">
                            ${answer.grading_notes}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        alert(detailsHTML);
        
    } catch (error) {
        console.error('Error viewing answer details:', error);
        alert('Error loading answer details');
    }
}

// Function to export answers to CSV
async function exportAnswersToCSV(questionId) {
    try {
        const { data: answers, error } = await supabase
            .from('subjective_answers')
            .select(`
                *,
                students (matric_number, full_name, level),
                subjective_questions (question_text, marks)
            `)
            .eq('question_id', questionId);
        
        if (error) throw error;
        
        if (!answers || answers.length === 0) {
            alert('No answers to export');
            return;
        }
        
        // Create CSV content
        let csv = 'Matric Number,Student Name,Level,Answer,Word Count,Auto Score (%),Final Score/Max,Keywords Found,Grading Notes,Submitted Date\n';
        
        answers.forEach(answer => {
            const student = answer.students;
            const question = answer.subjective_questions;
            const maxScore = question.marks || 10;
            const finalScore = answer.final_score !== null ? `${answer.final_score}/${maxScore}` : 'Not graded';
            
            csv += `"${student.matric_number || ''}","${student.full_name || ''}","${student.level || ''}",`;
            csv += `"${(answer.answer_text || '').replace(/"/g, '""')}",`;
            csv += `${answer.word_count || ''},`;
            csv += `${answer.auto_score || ''},`;
            csv += `"${finalScore}",`;
            csv += `"${Array.isArray(answer.keywords_found) ? answer.keywords_found.join(', ') : ''}",`;
            csv += `"${(answer.grading_notes || '').replace(/"/g, '""')}",`;
            csv += `${new Date(answer.submitted_at).toLocaleString()}\n`;
        });
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `subjective_answers_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Error exporting answers:', error);
        alert('Error exporting answers');
    }
}

// Helper function to show temporary messages
function showTempMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#4caf50' : '#f44336'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10001;
        font-weight: 500;
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        document.body.removeChild(messageDiv);
    }, 3000);
}

// Also need to update the viewSubjectiveQuestion function to include grading panel
async function viewSubjectiveQuestion(id) {
    try {
        const { data, error } = await supabase
            .from('subjective_questions')
            .select('*, courses(course_code, course_title)')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Create a more detailed view with grading options
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;';
        
        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 10px; max-width: 800px; max-height: 80vh; overflow-y: auto; width: 90%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0;">📝 Question Details</h3>
                    <button onclick="this.closest('div[style*=fixed]').remove()" 
                            style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <div style="color: #666; font-size: 0.9rem; margin-bottom: 0.5rem;">
                        <strong>Course:</strong> ${data.courses?.course_code || 'Unknown'}
                    </div>
                    <div style="color: #333; font-size: 1.1rem; line-height: 1.5; margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                        ${data.question_text}
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <strong>Max Words:</strong> ${data.max_words || 500}
                        </div>
                        <div>
                            <strong>Marks:</strong> ${data.marks || 10}
                        </div>
                        <div>
                            <strong>Grading Type:</strong> 
                            <span style="background: ${data.grading_type === 'auto' ? '#4caf50' : 
                                                       data.grading_type === 'mixed' ? '#2196f3' : '#ff9800'}; 
                                       color: white; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.85rem; margin-left: 0.5rem;">
                                ${data.grading_type || 'manual'}
                            </span>
                        </div>
                        <div>
                            <strong>Created:</strong> ${new Date(data.created_at).toLocaleDateString()}
                        </div>
                    </div>
                    
                    ${data.grading_type !== 'manual' ? `
                        <div style="background: #e8f5e8; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            <strong>Auto-Grading Settings:</strong>
                            <div style="margin-top: 0.5rem;">
                                <div>• Keyword Weightage: ${data.keyword_weightage || 60}%</div>
                                ${data.min_word_count ? `<div>• Min Word Count: ${data.min_word_count}</div>` : ''}
                                ${data.keywords && data.keywords.length > 0 ? 
                                    `<div>• Keywords: ${Array.isArray(data.keywords) ? data.keywords.join(', ') : data.keywords}</div>` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button onclick="viewSubjectiveAnswers('${id}')" 
                            style="background: #667eea; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 4px; cursor: pointer; font-size: 1rem;">
                        <i class="fas fa-graduation-cap"></i> Grade Answers
                    </button>
                    <button onclick="editSubjectiveQuestion('${id}')" 
                            style="background: #ff9800; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 4px; cursor: pointer; font-size: 1rem;">
                        <i class="fas fa-edit"></i> Edit Question
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Error viewing question:', error);
        alert('Error loading question details');
    }
}

// Don't forget to export the new functions at the end of subjective-admin.js
window.viewSubjectiveAnswers = viewSubjectiveAnswers;
window.saveManualGrade = saveManualGrade;
window.applyAutoGrade = applyAutoGrade;
window.saveGradingNotes = saveGradingNotes;
window.viewAnswerDetails = viewAnswerDetails;
window.exportAnswersToCSV = exportAnswersToCSV;
window.showTempMessage = showTempMessage;
// The viewSubjectiveQuestion function is already exported

// Export functions
window.loadSubjectiveQuestions = loadSubjectiveQuestions;
window.loadSubjectiveFilterOptions = loadSubjectiveFilterOptions;
window.applySubjectiveFilters = applySubjectiveFilters;
window.clearSubjectiveFilters = clearSubjectiveFilters;
window.addSubjectiveQuestion = addSubjectiveQuestion;
window.viewSubjectiveQuestion = viewSubjectiveQuestion;
window.editSubjectiveQuestion = editSubjectiveQuestion;
window.deleteSubjectiveQuestion = deleteSubjectiveQuestion;
window.bulkUploadSubjectiveQuestions = bulkUploadSubjectiveQuestions;
window.downloadSubjectiveTemplate = downloadSubjectiveTemplate;
window.exportSubjectiveQuestions = exportSubjectiveQuestions;
window.openAddSubjectiveQuestionModal = openAddSubjectiveQuestionModal;
window.openBulkUploadSubjectiveQuestionsModal = openBulkUploadSubjectiveQuestionsModal;
window.refreshSupabaseCache = refreshSupabaseCache;
window.retryLoadSubjectiveQuestions = retryLoadSubjectiveQuestions;
window.openSupabaseDashboard = openSupabaseDashboard;
window.showManualTableCreation = showManualTableCreation;
// Export new functions
window.toggleGradingType = toggleGradingType;
window.bulkAutoGrade = bulkAutoGrade;
window.recalculateExamScores = recalculateExamScores;
window.autoGradeAnswer = autoGradeAnswer;
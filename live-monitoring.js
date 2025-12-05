// live-monitoring.js - Dedicated live monitoring functions

// Start live monitoring
function startLiveMonitoring() {
    openModal('liveMonitoringModal');
    updateActiveExams();
    
    // Start auto-refresh every 10 seconds
    if (window.liveMonitoringInterval) {
        clearInterval(window.liveMonitoringInterval);
    }
    
    window.liveMonitoringInterval = setInterval(updateActiveExams, 10000);
}

// Stop live monitoring
function stopLiveMonitoring() {
    if (window.liveMonitoringInterval) {
        clearInterval(window.liveMonitoringInterval);
        window.liveMonitoringInterval = null;
    }
    closeModal('liveMonitoringModal');
}

// Update active exams display
// Update active exams display
async function updateActiveExams() {
    try {
        const now = new Date();
        
        // Query for exams with status 'in_progress' or recently completed
        const { data: allSessions, error } = await supabase
            .from('exam_sessions')
            .select(`
                *,
                students!exam_sessions_student_id_fkey(matric_number, full_name),
                courses!exam_sessions_course_id_fkey(course_code, course_title)
            `)
            .eq('status', 'in_progress')
            .order('start_time', { ascending: false });
        
        if (error) {
            console.error('Detailed error:', error);
            throw error;
        }
        
        // Filter out expired exams and auto-complete them
        const activeExams = [];
        const toComplete = [];
        
        if (allSessions) {
            for (const exam of allSessions) {
                const startTime = new Date(exam.start_time);
                const elapsedMinutes = Math.floor((now - startTime) / (1000 * 60));
                const duration = exam.duration_minutes || 60;
                
                // If exam time has expired by more than 5 minutes, mark for completion
                if (elapsedMinutes > duration + 5) {
                    toComplete.push(exam.id);
                } else {
                    activeExams.push(exam);
                }
            }
        }
        
        // Auto-complete expired sessions
        if (toComplete.length > 0) {
            console.log(`Auto-completing ${toComplete.length} expired exam sessions...`);
            const { error: updateError } = await supabase
                .from('exam_sessions')
                .update({
                    status: 'completed',
                    end_time: now.toISOString()
                })
                .in('id', toComplete);
            
            if (updateError) {
                console.error('Error auto-completing sessions:', updateError);
            }
        }
        
        const countElement = document.getElementById('activeExamsCount');
        const container = document.getElementById('activeExamsContainer');
        
        if (countElement) {
            countElement.textContent = activeExams?.length || 0;
        }
        
        if (container) {
            if (activeExams && activeExams.length > 0) {
                container.innerHTML = activeExams.map(exam => {
                    const startTime = new Date(exam.start_time);
                    const elapsedMinutes = Math.floor((now - startTime) / (1000 * 60));
                    const duration = exam.duration_minutes || 60;
                    const remaining = duration - elapsedMinutes;
                    
                    // Access data with proper references
                    const studentName = exam.students?.full_name || 'Unknown';
                    const matricNumber = exam.students?.matric_number || 'N/A';
                    const courseCode = exam.courses?.course_code || 'Unknown Course';
                    const courseTitle = exam.courses?.course_title || '';
                    
                    // Calculate progress percentage
                    const progressPercentage = Math.min((elapsedMinutes / duration) * 100, 100);
                    
                    // Determine progress color
                    let progressColor;
                    if (remaining < 0) {
                        progressColor = '#f44336'; // Red for overdue
                    } else if (remaining < duration * 0.2) {
                        progressColor = '#ff9800'; // Orange for <20%
                    } else {
                        progressColor = '#667eea'; // Blue for normal
                    }
                    
                    // Format time nicely
                    const formattedStartTime = startTime.toLocaleTimeString([], {
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true
                    });
                    
                    return `
                        <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <div>
                                    <strong style="font-size: 1.1rem;">${studentName}</strong>
                                    <div style="font-size: 0.85rem; color: #666; margin-top: 0.2rem;">${matricNumber}</div>
                                </div>
                                <div style="text-align: right;">
                                    <span style="color: #4caf50; font-weight: 600; font-size: 1rem;">${courseCode}</span>
                                    <div style="font-size: 0.85rem; color: #666; margin-top: 0.2rem;">${courseTitle}</div>
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; font-size: 0.9rem; margin-bottom: 1rem;">
                                <div style="background: white; padding: 0.5rem; border-radius: 4px; border: 1px solid #e0e0e0;">
                                    <div style="font-size: 0.8rem; color: #777; margin-bottom: 0.2rem;">Started</div>
                                    <strong style="color: #333;">${formattedStartTime}</strong>
                                </div>
                                <div style="background: white; padding: 0.5rem; border-radius: 4px; border: 1px solid #e0e0e0;">
                                    <div style="font-size: 0.8rem; color: #777; margin-bottom: 0.2rem;">Elapsed</div>
                                    <strong style="color: #333;">${elapsedMinutes} min</strong>
                                </div>
                                <div style="background: white; padding: 0.5rem; border-radius: 4px; border: 1px solid #e0e0e0;">
                                    <div style="font-size: 0.8rem; color: #777; margin-bottom: 0.2rem;">Duration</div>
                                    <strong style="color: #333;">${duration} min</strong>
                                </div>
                            </div>
                            
                            <div style="margin-top: 0.5rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                                    <div style="font-size: 0.85rem; color: #666;">
                                        <strong>Progress:</strong> ${Math.min(elapsedMinutes, duration)}/${duration} minutes
                                    </div>
                                    <div style="font-size: 0.85rem; color: #666;">
                                        ${Math.round(progressPercentage)}%
                                    </div>
                                </div>
                                
                                <div style="background: #e9ecef; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem;">
                                    <div style="background: ${progressColor}; 
                                        height: 100%; width: ${progressPercentage}%; 
                                        transition: width 0.5s ease;"></div>
                                </div>
                                
                                ${remaining < 0 ? 
                                    `<div style="background: #ffebee; color: #c62828; padding: 0.4rem; border-radius: 4px; font-size: 0.85rem; text-align: center; border: 1px solid #ffcdd2;">
                                        <strong>⚠️ OVERDUE</strong> - Exam should have ended ${Math.abs(remaining)} minutes ago
                                    </div>` 
                                    : 
                                    remaining < duration * 0.2 ? 
                                    `<div style="background: #fff3e0; color: #ef6c00; padding: 0.4rem; border-radius: 4px; font-size: 0.85rem; text-align: center; border: 1px solid #ffe0b2;">
                                        <strong>⚠️ WARNING</strong> - Exam ending soon (${remaining} min left)
                                    </div>`
                                    : ''
                                }
                            </div>
                            
                            <div style="margin-top: 0.8rem; padding-top: 0.8rem; border-top: 1px dashed #ddd; font-size: 0.8rem; color: #888; display: flex; justify-content: space-between;">
                                <div>Session ID: ${exam.id.substring(0, 8)}...</div>
                                <div>Status: <span style="color: #2196f3; font-weight: 500;">${exam.status}</span></div>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                container.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: #999;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
                        <h3 style="color: #666; margin-bottom: 0.5rem;">No Active Exams</h3>
                        <p style="color: #888; max-width: 300px; margin: 0 auto;">
                            There are currently no students taking exams.
                        </p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error updating active exams:', error);
        const container = document.getElementById('activeExamsContainer');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #f44336;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                    <h3 style="color: #d32f2f; margin-bottom: 1rem;">Connection Error</h3>
                    <p style="color: #666; margin-bottom: 1.5rem;">
                        Unable to load active exams. Please check your connection.
                    </p>
                    <button onclick="updateActiveExams()" style="margin-top: 1.5rem; padding: 0.6rem 1.5rem; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry Connection
                    </button>
                </div>
            `;
        }
    }
}

// Debug function to check table structure
async function debugExamSessionsTable() {
    try {
        console.log('🔍 Debugging exam_sessions table structure...');
        
        // Get sample data
        const { data: sampleRows, error } = await supabase
            .from('exam_sessions')
            .select('*')
            .limit(3);
        
        if (error) {
            console.error('Error getting sample data:', error);
            return;
        }
        
        console.log('📊 Sample exam sessions:', sampleRows);
        
        // Get all status values
        const { data: allStatuses, error: statusError } = await supabase
            .from('exam_sessions')
            .select('status')
            .order('status');
        
        if (!statusError && allStatuses) {
            const uniqueStatuses = [...new Set(allStatuses.map(s => s.status))];
            console.log('🏷️ Available status values:', uniqueStatuses);
        }
        
        // Count exams by status
        const { data: statusCounts, error: countError } = await supabase
            .from('exam_sessions')
            .select('status')
            .order('status');
        
        if (!countError && statusCounts) {
            const counts = {};
            statusCounts.forEach(item => {
                counts[item.status] = (counts[item.status] || 0) + 1;
            });
            console.log('📈 Exams by status:', counts);
        }
        
        // Check current active exams
        const { data: activeNow, error: activeError } = await supabase
            .from('exam_sessions')
            .select('*, students(matric_number), courses(course_code)')
            .eq('status', 'in_progress');
        
        if (!activeError) {
            console.log(`👥 Currently active exams (in_progress): ${activeNow?.length || 0}`);
            if (activeNow && activeNow.length > 0) {
                console.log('Active exams details:', activeNow.map(exam => ({
                    id: exam.id,
                    student: exam.students?.matric_number,
                    course: exam.courses?.course_code,
                    start_time: exam.start_time,
                    duration: exam.duration_minutes
                })));
            }
        }
        
    } catch (error) {
        console.error('❌ Debug error:', error);
    }
}

// Function to manually refresh active exams
function refreshLiveMonitoring() {
    updateActiveExams();
    showAlert('liveMonitoringAlert', 'Live monitoring refreshed', 'success', 2000);
}

// Function to clear all alerts in live monitoring modal
function clearLiveMonitoringAlerts() {
    const alertDiv = document.getElementById('liveMonitoringAlert');
    if (alertDiv) {
        alertDiv.innerHTML = '';
    }
}

// Export functions
window.startLiveMonitoring = startLiveMonitoring;
window.stopLiveMonitoring = stopLiveMonitoring;
window.updateActiveExams = updateActiveExams;
window.debugExamSessionsTable = debugExamSessionsTable;
window.refreshLiveMonitoring = refreshLiveMonitoring;
window.clearLiveMonitoringAlerts = clearLiveMonitoringAlerts;

console.log("✅ Live monitoring functions exported to window");
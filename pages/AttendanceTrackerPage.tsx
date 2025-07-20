import React, { useState, useEffect, useMemo, FC, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Course } from '../types';
import * as attendanceService from '../services/attendanceService';
import { Button, Input, Modal, Alert } from '../components/UIElements';
import { PlusIcon, TrashIcon, CheckBadgeIcon, ChartPieIcon, XMarkIcon } from '../components/VibrantIcons';
import { useNavigate } from 'react-router-dom';
import LoadingIndicator from '../components/LoadingIndicator';

const COURSE_COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#6366F1", "#D946EF"];

const toISODateString = (date: Date) => date.toISOString().split('T')[0];

const HexagonGraph: FC<{ courses: Course[] }> = ({ courses }) => {
    const size = 300;
    const center = size / 2;
    const radius = size * 0.4;
    
    const particles = useMemo(() => Array.from({ length: 30 }).map(() => ({
        cx: center + (Math.random() - 0.5) * radius * 1.8,
        cy: center + (Math.random() - 0.5) * radius * 1.8,
        r: Math.random() * 1.5 + 0.5,
        delay: `${Math.random() * 5}s`,
        duration: `${Math.random() * 5 + 5}s`,
        tx: (Math.random() - 0.5) * 50,
        ty: (Math.random() - 0.5) * 50,
    })), [center, radius]);

    const dataPoints = useMemo(() => {
        if (!Array.isArray(courses)) return [];
        return courses.slice(0, 6).map((course, i) => {
            const attendedDays = course.attendedDays || [];
            const missedDays = course.missedDays || [];
            const totalTracked = attendedDays.length + missedDays.length;
            const attendancePercentage = totalTracked > 0 ? (attendedDays.length / totalTracked) : 0;
            const angle = Math.PI / 3 * i - Math.PI / 2;
            const x = center + radius * attendancePercentage * Math.cos(angle);
            const y = center + radius * attendancePercentage * Math.sin(angle);
            return { x, y, color: course.color || '#8B5CF6', id: course.id };
        });
    }, [courses, center, radius]);
    
    const pointsString = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

    const axisPoints = useMemo(() => {
        return Array.from({ length: 6 }).map((_, i) => {
            const angle = Math.PI / 3 * i - Math.PI / 2;
            return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
        });
    }, [center, radius]);

    return (
        <div className="relative flex justify-center items-center p-4">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
                <defs>
                    <radialGradient id="hex-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(0, 255, 255, 0.3)" />
                        <stop offset="100%" stopColor="rgba(0, 255, 255, 0)" />
                    </radialGradient>
                     <filter id="neon-glow-hex" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <g className="animate-rotate-gradient" style={{ transformOrigin: `${center}px ${center}px` }}>
                     <circle cx={center} cy={center} r={radius * 1.1} fill="url(#hex-glow)" />
                </g>
                {particles.map((p, i) => (
                    <circle key={i} cx={p.cx} cy={p.cy} r={p.r} className="fill-cyan-300/70 animate-float-particle"
                        style={{ '--delay': p.delay, '--duration': p.duration, '--tx': `${p.tx}px`, '--ty': `${p.ty}px` } as React.CSSProperties} />
                ))}

                {[0.25, 0.5, 0.75, 1].map(scale => (
                    <polygon key={scale} points={axisPoints.map(p => `${center + (p.x - center) * scale},${center + (p.y - center) * scale}`).join(' ')} className="fill-transparent stroke-cyan-500/20" strokeWidth="1" />
                ))}
                {axisPoints.map((p, i) => <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} className="stroke-cyan-500/20" strokeWidth="1" />)}
                {pointsString && <polygon points={pointsString} className="fill-cyan-400/10" stroke="#00FFFF" strokeWidth="2" style={{ filter: 'url(#neon-glow-hex)' }} />}
                {dataPoints.map((p) => <circle key={p.id} cx={p.x} cy={p.y} r="5" fill={p.color} className="stroke-slate-900" strokeWidth="2" style={{ filter: 'url(#neon-glow-hex)' }} />)}
                {courses.slice(0, 6).map((course, i) => {
                    const angle = Math.PI / 3 * i - Math.PI / 2;
                    const x = center + (radius + 25) * Math.cos(angle);
                    const y = center + (radius + 25) * Math.sin(angle);
                    return (<text key={course.id} x={x} y={y} textAnchor="middle" alignmentBaseline="middle" className="text-xs font-semibold fill-cyan-300 animate-fade-in" style={{animationDelay: `${i*100}ms`}}>{course.name}</text>);
                })}
            </svg>
        </div>
    );
};

const MonthlyCalendar: FC<{
  displayDate: Date;
  attendedDays: Set<string>;
  missedDays: Set<string>;
  onDayClick: (date: string, status: 'attended' | 'missed' | 'clear') => void;
  color: string;
}> = ({ displayDate, attendedDays, missedDays, onDayClick, color }) => {
    const [animationKey, setAnimationKey] = useState(0);
    useEffect(() => { setAnimationKey(k => k + 1); }, [displayDate]);

    const calendarGrid = useMemo(() => {
        const year = displayDate.getFullYear();
        const month = displayDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const grid: (Date | null)[][] = [];
        let dayCounter = 1;
        for (let i = 0; i < 6; i++) {
            if (dayCounter > daysInMonth) break;
            const week: (Date | null)[] = [];
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDayOfMonth) week.push(null);
                else if (dayCounter <= daysInMonth) { week.push(new Date(year, month, dayCounter)); dayCounter++; }
                else week.push(null);
            }
            grid.push(week);
        }
        return grid;
    }, [displayDate]);

    const today = new Date();
    const todayString = toISODateString(today);

    const handleInteraction = (dateString: string, isFuture: boolean) => {
        if (isFuture) return;
        
        // Determine current status and cycle through: unmarked → attended → missed → unmarked
        let newStatus: 'attended' | 'missed' | 'clear';
        if (attendedDays.has(dateString)) {
            newStatus = 'missed';
        } else if (missedDays.has(dateString)) {
            newStatus = 'clear';
        } else {
            newStatus = 'attended';
        }
        
        onDayClick(dateString, newStatus);
    };

    return (
        <div key={animationKey} className="animate-fade-in">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-cyan-400/80 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-x-1 gap-y-2" style={{ perspective: '800px' }}>
                {calendarGrid.flat().map((date, index) => {
                    if (!date) return <div key={`empty-${index}`} />;
                    const dateString = toISODateString(date);
                    const isFuture = date > today && dateString !== todayString;
                    const isToday = dateString === todayString;
                    const isAttended = attendedDays.has(dateString);
                    const isMissed = missedDays.has(dateString);

                    let baseClass = "relative w-full aspect-square flex items-center justify-center transition-transform duration-300 ease-out focus:outline-none rounded-full group";
                    let innerClass = "absolute inset-0 rounded-full transition-all duration-300";
                    let dayNumberClass = "z-10 font-bold";
                    let style: React.CSSProperties = {};
                    
                    if (isFuture) {
                        baseClass += " cursor-not-allowed";
                        innerClass += " bg-slate-800/50";
                        dayNumberClass += " text-slate-600";
                    } else {
                        baseClass += " cursor-pointer [transform-style:preserve-3d] hover:scale-110 hover:[transform:rotateY(15deg)_rotateX(10deg)]";
                        if (isAttended) {
                            innerClass += " animate-pulse-glow-green";
                            style = { '--glow-color': color, background: color } as React.CSSProperties;
                            dayNumberClass += " text-white mix-blend-plus-lighter";
                        } else if (isMissed) {
                            innerClass += " animate-pulse-glow-red bg-red-900";
                            dayNumberClass += " text-white/90";
                        } else { 
                            innerClass += ` bg-slate-700/70 relative overflow-hidden group-hover:bg-slate-600/70 after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-full after:bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.1),transparent)] after:translate-x-[-100%] after:animate-tilt-shimmer`;
                            dayNumberClass += " text-slate-200";
                        }
                    }

                    if (isToday) baseClass += ` ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400`;

                    return (
                        <button key={dateString} onClick={() => handleInteraction(dateString, isFuture)} className={baseClass} disabled={isFuture} aria-label={`Mark attendance for ${date.toDateString()}`}>
                            <div className={innerClass} style={style}></div>
                            {isMissed && <XMarkIcon className="w-6 h-6 z-20 text-white/80" />}
                            <span className={dayNumberClass}>{date.getDate()}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};


const AttendanceTrackerPage: FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [newCourseName, setNewCourseName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [displayDate, setDisplayDate] = useState(new Date());
    const [displayedCourseIds, setDisplayedCourseIds] = useState<Set<string>>(new Set());
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

    const fetchCourses = useCallback(async () => {
        if (!user) return;
        
        setIsLoading(true);
        setError('');
        
        try {
            console.log('🔍 Fetching courses for user:', user.id);
            const courses = await attendanceService.getCourses();
            console.log('📚 API response - courses:', courses);
            
            // Validate the response is an array
            if (!Array.isArray(courses)) {
                console.error('❌ Invalid courses response:', {
                    type: typeof courses,
                    value: courses
                });
                throw new Error('Invalid response: courses data is not an array');
            }
            
            // Additional validation to ensure each item looks like a course
            const validCourses = courses.filter(course => {
                return course && typeof course === 'object' && 
                       typeof course.id === 'string' && 
                       typeof course.name === 'string';
            });
            
            if (validCourses.length !== courses.length) {
                console.warn(`⚠️ Filtered out ${courses.length - validCourses.length} invalid course objects`);
            }
            
            // Validate each course has required properties and provide defaults
            const validatedCourses: Course[] = validCourses.map((course, index) => {
                // At this point we know course is valid from the filter above
                return {
                    id: course.id,
                    name: course.name,
                    color: course.color || COURSE_COLORS[index % COURSE_COLORS.length],
                    attendedDays: Array.isArray(course.attendedDays) ? course.attendedDays : [],
                    missedDays: Array.isArray(course.missedDays) ? course.missedDays : []
                };
            });
            
            console.log('✅ Validated courses:', validatedCourses);
            
            setCourses(validatedCourses);
            
            // Auto-select first course if none selected
            if (!selectedCourseId && validatedCourses.length > 0) {
                setSelectedCourseId(validatedCourses[0].id);
            }
            
            // Auto-display first 6 courses if none displayed
            if (validatedCourses.length > 0 && displayedCourseIds.size === 0) {
                setDisplayedCourseIds(new Set(validatedCourses.slice(0, 6).map(c => c.id)));
            }
            
        } catch (error: any) {
            console.error('❌ Failed to fetch courses:', error);
            
            // Enhanced error handling based on different error types
            let errorMessage = 'Failed to load courses';
            if (error.statusCode === 401) {
                errorMessage = 'Authentication required. Please login again.';
            } else if (error.statusCode === 403) {
                errorMessage = 'Access denied. You may not have permission to view courses.';
            } else if (error.statusCode === 404) {
                errorMessage = 'Attendance service not found. Please check server status.';
            } else if (error.statusCode >= 500) {
                errorMessage = 'Server error. Please try again later.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setError(errorMessage);
            setCourses([]); // Reset to empty array on error
            
        } finally {
            setIsLoading(false);
        }
    }, [user, selectedCourseId, displayedCourseIds.size]);
    
    useEffect(() => {
        document.body.classList.add('futuristic-theme');
        
        if (user) {
            fetchCourses().catch(error => {
                console.error('❌ Error in fetchCourses:', error);
                // Error is already handled in fetchCourses
            });
            
            console.log('✅ Attendance Tracker: User authenticated', {
                userId: user.id,
                email: user.email,
                name: user.fullName
            });
        } else {
            setIsLoading(false);
            console.log('❌ Attendance Tracker: No user found, authentication required');
        }
        
        return () => document.body.classList.remove('futuristic-theme');
    }, [user, fetchCourses]);

    const handleAddCourse = async () => {
        const courseName = newCourseName.trim();
        if (!courseName) return;
        
        // Optimistic update - temporarily add course to UI
        const tempId = `temp-${Date.now()}`;
        const newColor = COURSE_COLORS[courses.length % COURSE_COLORS.length];
        const optimisticCourse: Course = {
            id: tempId,
            name: courseName,
            color: newColor,
            attendedDays: [],
            missedDays: []
        };
        
        // Update UI immediately
        setCourses(prev => [...prev, optimisticCourse]);
        if (displayedCourseIds.size < 6) {
            setDisplayedCourseIds(prev => new Set(prev).add(tempId));
        }
        if (!selectedCourseId) {
            setSelectedCourseId(tempId);
        }
        setNewCourseName(''); // Clear input immediately
        
        try {
            console.log('➕ Creating course:', courseName);
            const createdCourse = await attendanceService.addCourse(courseName, newColor);
            console.log('✅ Course created successfully:', createdCourse);
            
            // Replace optimistic course with real course from server
            setCourses(prev => prev.map(course => 
                course.id === tempId ? createdCourse : course
            ));
            
            // Update references to the new real ID
            setDisplayedCourseIds(prev => {
                const newIds = new Set(prev);
                if (newIds.has(tempId)) {
                    newIds.delete(tempId);
                    newIds.add(createdCourse.id);
                }
                return newIds;
            });
            
            if (selectedCourseId === tempId) {
                setSelectedCourseId(createdCourse.id);
            }
            
        } catch (error: any) {
            console.error('❌ Failed to create course:', error);
            
            // Rollback optimistic update
            setCourses(prev => prev.filter(course => course.id !== tempId));
            setDisplayedCourseIds(prev => {
                const newIds = new Set(prev);
                newIds.delete(tempId);
                return newIds;
            });
            
            if (selectedCourseId === tempId) {
                setSelectedCourseId(courses.length > 0 ? courses[0].id : null);
            }
            
            // Restore input value since creation failed
            setNewCourseName(courseName);
            
            // Handle different error types
            let errorMessage = 'Failed to create course';
            
            if (error.statusCode === 401) {
                errorMessage = 'Authentication required. Please login again.';
            } else if (error.statusCode === 403) {
                errorMessage = 'Access denied. You may not have permission to create courses.';
            } else if (error.statusCode === 409) {
                errorMessage = `Course name "${courseName}" already exists. Please choose a different name.`;
            } else if (error.statusCode === 400) {
                errorMessage = error.message || 'Invalid course data provided.';
            } else if (error.statusCode >= 500) {
                errorMessage = 'Server error. Please try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            console.log(`💡 User-friendly error message: "${errorMessage}"`);
            setError(errorMessage);
        }
    };
    
    const confirmDeleteCourse = async () => {
        if (!courseToDelete || deleteConfirmationText !== courseToDelete.name) return;
        
        const courseToDeleteId = courseToDelete.id;
        const originalCourses = [...courses];
        const originalDisplayedCourseIds = new Set(displayedCourseIds);
        const originalSelectedCourseId = selectedCourseId;
        
        // Optimistic update - immediately remove from UI
        const remainingCourses = courses.filter(c => c.id !== courseToDeleteId);
        setCourses(remainingCourses);
        
        setDisplayedCourseIds(prev => {
            const newIds = new Set(prev);
            newIds.delete(courseToDeleteId);
            return newIds;
        });
        
        if (selectedCourseId === courseToDeleteId) {
            setSelectedCourseId(remainingCourses.length > 0 ? remainingCourses[0].id : null);
        }
        
        // Close modal immediately
        setCourseToDelete(null);
        setDeleteConfirmationText('');
        
        try {
            console.log('🗑️ Deleting course:', courseToDeleteId);
            await attendanceService.deleteCourse(courseToDeleteId);
            console.log('✅ Course deleted successfully');
            
            // Success - optimistic update was correct, no need to change anything
            
        } catch (error: any) {
            console.error('❌ Failed to delete course:', error);
            
            // Rollback optimistic update
            setCourses(originalCourses);
            setDisplayedCourseIds(originalDisplayedCourseIds);
            setSelectedCourseId(originalSelectedCourseId);
            
            // Handle different error types
            let errorMessage = 'Failed to delete course';
            if (error.statusCode === 401) {
                errorMessage = 'Authentication required. Please login again.';
            } else if (error.statusCode === 403) {
                errorMessage = 'Access denied. You may not have permission to delete courses.';
            } else if (error.statusCode === 404) {
                errorMessage = 'Course not found. It may have already been deleted.';
            } else if (error.statusCode >= 500) {
                errorMessage = 'Server error. Please try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setError(errorMessage);
        }
    };

    const handleDayInteraction = async (dateString: string, status: 'attended' | 'missed' | 'clear') => {
        if (!selectedCourseId) return;
        
        const courseIndex = courses.findIndex(c => c.id === selectedCourseId);
        if (courseIndex === -1) return;
        
        const currentCourse = courses[courseIndex];
        
        // Optimistic update - immediately update UI
        const updatedCourse: Course = {
            ...currentCourse,
            attendedDays: [...currentCourse.attendedDays],
            missedDays: [...currentCourse.missedDays]
        };
        
        // Apply the change optimistically
        if (status === 'attended') {
            updatedCourse.attendedDays = [...updatedCourse.attendedDays.filter(d => d !== dateString), dateString];
            updatedCourse.missedDays = updatedCourse.missedDays.filter(d => d !== dateString);
        } else if (status === 'missed') {
            updatedCourse.missedDays = [...updatedCourse.missedDays.filter(d => d !== dateString), dateString];
            updatedCourse.attendedDays = updatedCourse.attendedDays.filter(d => d !== dateString);
        } else { // clear
            updatedCourse.attendedDays = updatedCourse.attendedDays.filter(d => d !== dateString);
            updatedCourse.missedDays = updatedCourse.missedDays.filter(d => d !== dateString);
        }
        
        // Update UI immediately
        setCourses(prevCourses => 
            prevCourses.map(course => 
                course.id === selectedCourseId ? updatedCourse : course
            )
        );
        
        try {
            console.log('📅 Marking attendance:', {
                courseId: selectedCourseId,
                date: dateString,
                status: status
            });
            
            const serverUpdatedCourse = await attendanceService.markAttendance(selectedCourseId, dateString, status);
            console.log('✅ Attendance marked successfully:', serverUpdatedCourse);
            
            // Replace optimistic update with server response
            setCourses(prevCourses => 
                prevCourses.map(course => 
                    course.id === selectedCourseId ? serverUpdatedCourse : course
                )
            );
            
        } catch (error: any) {
            console.error('❌ Failed to mark attendance:', error);
            
            // Rollback optimistic update
            setCourses(prevCourses => 
                prevCourses.map(course => 
                    course.id === selectedCourseId ? currentCourse : course
                )
            );
            
            // Handle different error types
            let errorMessage = 'Failed to mark attendance';
            if (error.statusCode === 401) {
                errorMessage = 'Authentication required. Please login again.';
            } else if (error.statusCode === 403) {
                errorMessage = 'Access denied. You may not have permission to modify attendance.';
            } else if (error.statusCode === 404) {
                errorMessage = 'Course not found. It may have been deleted.';
            } else if (error.statusCode >= 500) {
                errorMessage = 'Server error. Please try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setError(errorMessage);
        }
    };
    
    const selectedCourse = useMemo(() => {
        if (!Array.isArray(courses) || courses.length === 0) return null;
        return courses.find(c => c.id === selectedCourseId) || null;
    }, [courses, selectedCourseId]);
    
    const displayedCourses = useMemo(() => {
        if (!Array.isArray(courses)) return [];
        return courses.filter(c => displayedCourseIds.has(c.id));
    }, [courses, displayedCourseIds]);

    if (isLoading) return <LoadingIndicator message="Initializing Attendance Matrix..." />;
    if (!user) return (
        <div className="text-center p-8 bg-slate-900/50 rounded-xl">
            <p className="text-slate-300 mb-4 text-lg">Please log in to use the Attendance Tracker.</p>
            <Button onClick={() => navigate('/login')}>Login</Button>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {courseToDelete && (
                 <Modal isOpen={!!courseToDelete} onClose={() => { setCourseToDelete(null); setDeleteConfirmationText(''); }} title={<div className="flex items-center gap-2 text-red-500"><TrashIcon className="w-7 h-7" /><span>Confirm Deletion</span></div>} size="md">
                    <>
                        <p className="text-slate-300">
                            This action is irreversible. To confirm deletion, please type the full course name: <strong className="text-red-400">{courseToDelete.name}</strong>
                        </p>
                        <Input
                            id="delete-confirm"
                            type="text"
                            value={deleteConfirmationText}
                            onChange={(e) => setDeleteConfirmationText(e.target.value)}
                            placeholder="Type course name to confirm"
                            className="mt-4 bg-slate-800 border-red-500/30 text-white focus:border-red-500 focus:ring-red-500"
                        />
                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => { setCourseToDelete(null); setDeleteConfirmationText(''); }}>Cancel</Button>
                            <Button
                                variant="danger"
                                onClick={confirmDeleteCourse}
                                disabled={deleteConfirmationText !== courseToDelete.name}
                            >
                                Delete Course
                            </Button>
                        </div>
                    </>
                </Modal>
            )}

            <h1 className="text-3xl font-bold text-cyan-300 tracking-wider text-center flex items-center justify-center gap-3" style={{textShadow: '0 0 8px rgba(0,255,255,0.7)'}}>
                <CheckBadgeIcon className="w-9 h-9" /> ATTENDANCE TRACKER
            </h1>

            <div className="holo-card p-6">
                <h2 className="text-xl font-semibold mb-4 text-cyan-300">Your Courses</h2>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <Input placeholder="New course name..." value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCourse()} className="bg-slate-800 border-cyan-500/30 text-white focus:border-cyan-500 focus:ring-cyan-500" />
                    <Button onClick={handleAddCourse} disabled={!newCourseName.trim()} leftIcon={<PlusIcon />} className="bg-cyan-500/20 border border-cyan-500 text-cyan-200 hover:bg-cyan-500/40">Add</Button>
                </div>
                <div className="space-y-3">
                    {!Array.isArray(courses) ? (
                        <div className="text-center p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                            <p className="text-red-400">⚠️ Error: Invalid courses data received</p>
                            <p className="text-xs text-red-300 mt-1">Please refresh the page or check your connection</p>
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="text-center p-4 bg-slate-800/50 border border-slate-600 rounded-lg">
                            <p className="text-slate-400">📚 No courses yet. Add your first course above!</p>
                        </div>
                    ) : (
                        courses.map(course => {
                            const attendedDays = course.attendedDays || [];
                            const missedDays = course.missedDays || [];
                            const totalTracked = attendedDays.length + missedDays.length;
                            const attended = attendedDays.length;
                            const percentage = totalTracked > 0 ? Math.round((attended / totalTracked) * 100) : 0;
                            const isSelected = selectedCourseId === course.id;
                            return (
                                <div key={course.id} onClick={() => setSelectedCourseId(course.id)} className={`relative overflow-hidden p-4 rounded-lg cursor-pointer transition-all duration-300 border-l-4 group ${isSelected ? 'bg-cyan-500/20 shadow-lg' : 'bg-slate-800/60 hover:bg-slate-700/60'}`} style={{ borderColor: isSelected ? course.color : 'transparent', '--course-glow-color': course.color } as React.CSSProperties}>
                                    {isSelected && <div className="absolute top-0 left-0 w-full h-full animate-light-sweep bg-transparent after:content-[''] after:absolute after:top-0 after:left-0 after:w-1/2 after:h-full after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:-translate-x-full after:animate-light-sweep" />}
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: course.color, boxShadow: `0 0 8px ${course.color}` }}></div><span className="font-bold text-slate-100">{course.name}</span></div>
                                        <button onClick={(e) => { e.stopPropagation(); setCourseToDelete(course); }} className="text-slate-500 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-500/10 z-10"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="w-full bg-slate-700 rounded-full h-2.5"><div className="h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${percentage}%`, backgroundColor: course.color,  boxShadow: `0 0 8px ${course.color}90` }}></div></div>
                                        <span className="text-lg font-black text-slate-200 w-16 text-right">{percentage}%</span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="holo-card p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-cyan-300 text-center flex items-center justify-center gap-2"><ChartPieIcon className="w-7 h-7" /> Attendance Overview</h2>
                    <HexagonGraph courses={displayedCourses} />
                </div>
                <div className="holo-card p-6">
                    <div className="flex justify-between items-center mb-4">
                        <Button onClick={() => setDisplayDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} size="sm" className="!p-2 bg-cyan-500/20 border border-cyan-500 text-cyan-200 hover:bg-cyan-500/40"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg></Button>
                        <h2 className="text-xl font-semibold text-cyan-300 text-center">{displayDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                        <Button onClick={() => setDisplayDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} size="sm" className="!p-2 bg-cyan-500/20 border border-cyan-500 text-cyan-200 hover:bg-cyan-500/40"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg></Button>
                    </div>
                    
                    {/* Prominent Subject Display */}
                    {selectedCourse ? (
                        <div className="mb-6 text-center">
                            <div className="text-sm text-slate-400 mb-2">Marking attendance for:</div>
                            <div className="text-2xl font-black uppercase tracking-wide p-3 rounded-lg border-2 border-dashed" 
                                 style={{
                                     color: selectedCourse.color,
                                     borderColor: selectedCourse.color + '60',
                                     backgroundColor: selectedCourse.color + '10',
                                     textShadow: `0 0 10px ${selectedCourse.color}80`
                                 }}>
                                {selectedCourse.name}
                            </div>
                        </div>
                    ) : (
                        <div className="mb-6 text-center">
                            <div className="text-2xl font-black text-slate-500 p-3 rounded-lg border-2 border-dashed border-slate-600">
                                NO SUBJECT SELECTED
                            </div>
                        </div>
                    )}
                    
                    {/* Enhanced Instructions */}
                    <div className="bg-slate-800/70 border border-cyan-500/30 rounded-lg p-4 mb-6">
                        <h3 className="text-cyan-300 font-bold text-sm mb-3 text-center">📋 HOW TO MARK ATTENDANCE</h3>
                        <div className="space-y-2 text-xs text-slate-300">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold">1</div>
                                <span><strong className="text-cyan-200">First Click:</strong> Mark day as <span className="text-green-400 font-bold">✓ ATTENDED</span></span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold">2</div>
                                <span><strong className="text-cyan-200">Second Click:</strong> Mark day as <span className="text-red-400 font-bold">✗ MISSED</span></span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold">3</div>
                                <span><strong className="text-cyan-200">Third Click:</strong> Clear marking <span className="text-slate-400">(unmarked)</span></span>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-600 text-center">
                            <span className="text-xs text-slate-400">💡 Future dates cannot be marked</span>
                        </div>
                    </div>

                    {selectedCourse ? (
                        <MonthlyCalendar 
                            displayDate={displayDate}
                            attendedDays={new Set(selectedCourse.attendedDays || [])} 
                            missedDays={new Set(selectedCourse.missedDays || [])}
                            onDayClick={(date, status) => handleDayInteraction(date, status)}
                            color={selectedCourse.color || '#8B5CF6'}
                        />
                    ) : (
                        <div className="text-center p-8 border-2 border-dashed border-cyan-500/30 rounded-lg">
                            <p className="text-slate-400">Please add and select a course to mark attendance.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceTrackerPage;

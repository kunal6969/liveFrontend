import React, { useState, useEffect, useMemo, FC } from 'react';
import { CgpaData, Semester } from '../types';
import * as cgpaService from '../services/cgpaService';
import { Button, Input, Select } from '../components/UIElements';
import { TrashIcon, PlusIcon, ChartPieIcon, SparkleIcon } from '../components/VibrantIcons';
import LoadingIndicator from '../components/LoadingIndicator';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// --- Helper Types ---
interface Subject {
    id: string;
    grade: string;
    credits: string;
    error?: 'grade' | 'credits' | null;
}

const GRADE_OPTIONS = [
    { value: '10', label: 'AA - 10' },
    { value: '9', label: 'AB - 9' },
    { value: '8', label: 'BB - 8' },
    { value: '7', label: 'BC - 7' },
    { value: '6', label: 'CC - 6' },
    { value: '5', label: 'CD - 5' },
    { value: '4', label: 'DD - 4' },
    { value: '0', label: 'FA - 0' },
    { value: '0', label: 'FP - 0' },
];

// --- Sub-components for the Futuristic UI ---
const SgpaCalculator: FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([{ id: `sub-${Date.now()}`, grade: '', credits: '', error: null }]);

    const handleSubjectChange = (id: string, field: 'grade' | 'credits', value: string) => {
        if (field === 'credits' && !/^\d*\.?\d*$/.test(value)) return;
        
        setSubjects(subjects.map(sub => {
            if (sub.id === id) {
                const newSub = { ...sub, [field]: value };
                // Basic validation
                const gradeVal = parseFloat(newSub.grade);
                const creditsVal = parseFloat(newSub.credits);
                if (newSub.grade && (isNaN(gradeVal) || gradeVal < 0 || gradeVal > 10)) {
                    newSub.error = 'grade';
                } else if (newSub.credits && (isNaN(creditsVal) || creditsVal < 0)) {
                    newSub.error = 'credits';
                } else {
                    newSub.error = null;
                }
                return newSub;
            }
            return sub;
        }));
    };

    const addSubject = () => setSubjects([...subjects, { id: `sub-${Date.now()}`, grade: '', credits: '', error: null }]);
    const removeSubject = (id: string) => setSubjects(subjects.filter(sub => sub.id !== id));
    
    const sgpaCalculation = useMemo(() => {
        let totalGradePoints = 0;
        let totalCredits = 0;
        let isCalculable = true;
        
        subjects.forEach(sub => {
            const grade = parseFloat(sub.grade);
            const credits = parseFloat(sub.credits);
            if (isNaN(grade) || isNaN(credits) || grade < 0 || grade > 10 || credits <= 0) {
                 if(sub.grade || sub.credits) isCalculable = false;
                 return;
            }
            totalGradePoints += grade * credits;
            totalCredits += credits;
        });

        const sgpa = totalCredits === 0 || !isCalculable ? '0.00' : (totalGradePoints / totalCredits).toFixed(2);
        
        return {
            sgpa,
            totalCredits,
            totalGradePoints,
            isCalculable
        };
    }, [subjects]);
    
    const { sgpa: calculatedSgpa, totalCredits, totalGradePoints } = sgpaCalculation;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="holo-card p-6 space-y-6 relative z-10">
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-cyan-300 mb-2">📚 Subject Grade Entry</h3>
                    <p className="text-slate-400 text-sm">Enter your subject grades and credits to calculate SGPA</p>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {subjects.map((sub, index) => (
                        <div key={sub.id} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 animate-slide-down-glow hover:shadow-lg transition-all duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/30">
                                    <span className="font-bold text-cyan-300 text-sm">#{index + 1}</span>
                                </div>
                                <h4 className="text-slate-300 font-semibold">Subject {index + 1}</h4>
                                {subjects.length > 1 && (
                                    <Button 
                                        variant="danger" 
                                        size="sm" 
                                        onClick={() => removeSubject(sub.id)} 
                                        className="!p-2 ml-auto hover:scale-110 transition-transform"
                                        title="Remove Subject"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Select 
                                        label="Grade"
                                        value={sub.grade} 
                                        onChange={value => handleSubjectChange(sub.id, 'grade', value)}
                                        options={GRADE_OPTIONS}
                                        placeholder="Select your grade"
                                        className={sub.error === 'grade' ? 'animate-shake' : ''}
                                        error={sub.error === 'grade' ? 'Please select a valid grade' : undefined}
                                        isGradeSelect={true}
                                    />
                                </div>
                                
                                <div>
                                    <Input 
                                        type="text" 
                                        label="Credits"
                                        placeholder="e.g., 3, 4, 1.5" 
                                        value={sub.credits} 
                                        onChange={e => handleSubjectChange(sub.id, 'credits', e.target.value)} 
                                        className={`bg-slate-800 border-cyan-500/30 text-white !mt-0 ${sub.error === 'credits' ? 'animate-shake border-red-500' : ''}`}
                                        error={sub.error === 'credits' ? 'Enter valid credits (e.g., 3 or 1.5)' : undefined}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="pt-4 border-t border-slate-700/50">
                    <Button 
                        onClick={addSubject} 
                        leftIcon={<PlusIcon />} 
                        className="w-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-200 hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-400 transition-all duration-300"
                        size="lg"
                    >
                        Add Another Subject
                    </Button>
                </div>
            </div>
            
            <div className="holo-card p-8 text-center bg-gradient-to-br from-slate-800/50 to-slate-900/50">
                <div className="mb-6">
                    <SparkleIcon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-cyan-300 mb-2">Calculated SGPA</h3>
                    <div className="h-1 w-16 bg-gradient-to-r from-cyan-500 to-blue-500 mx-auto rounded-full"></div>
                </div>
                
                <div className="mb-6">
                    <p className="text-8xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2" style={{ textShadow: '0 0 30px #00ffff99' }}>
                        {calculatedSgpa}
                    </p>
                    <div className="text-slate-400 space-y-1">
                        <p className="text-sm">Total Credits: <span className="text-cyan-300 font-semibold">{totalCredits}</span></p>
                        <p className="text-sm">Grade Points: <span className="text-cyan-300 font-semibold">{totalGradePoints.toFixed(2)}</span></p>
                    </div>
                </div>
                
                <div className="space-y-2 text-sm">
                    {calculatedSgpa !== 'N/A' && (
                        <div className={`p-3 rounded-lg border ${
                            parseFloat(calculatedSgpa) >= 8 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                            parseFloat(calculatedSgpa) >= 6 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
                            'bg-red-500/10 border-red-500/30 text-red-300'
                        }`}>
                            <p className="font-semibold">
                                {parseFloat(calculatedSgpa) >= 8 ? '🎉 Excellent Performance!' :
                                 parseFloat(calculatedSgpa) >= 6 ? '👍 Good Work!' :
                                 '📚 Keep Improving!'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CgpaCalculator: FC<{ user: any }> = ({ user }) => {
    const [cgpaData, setCgpaData] = useState<CgpaData>({ semesters: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [prediction, setPrediction] = useState({ futureSgpa: '', futureCredits: '' });

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        };
        const fetchData = async () => {
            setIsLoading(true);
            const data = await cgpaService.getCgpaData();
            if (data.semesters.length === 0) {
                 data.semesters.push({ id: `sem-${Date.now()}`, sgpa: '', credits: '' });
            }
            setCgpaData(data);
            setIsLoading(false);
        };
        fetchData();
    }, [user]);
    
    const handleSemesterChange = (id: string, field: 'sgpa' | 'credits', value: string) => {
        if (!/^\d*\.?\d*$/.test(value)) return;
        const newSemesters = cgpaData.semesters.map(sem => sem.id === id ? { ...sem, [field]: value } : sem);
        const newData = { ...cgpaData, semesters: newSemesters };
        setCgpaData(newData);
        cgpaService.saveCgpaData(newData);
    };

    const addSemester = () => {
        const newSemesters = [...cgpaData.semesters, { id: `sem-${Date.now()}`, sgpa: '', credits: '' }];
        setCgpaData({ ...cgpaData, semesters: newSemesters });
    };
    
    const removeSemester = (id: string) => {
        if (cgpaData.semesters.length <= 1) return;
        const newSemesters = cgpaData.semesters.filter(sem => sem.id !== id);
        const newData = { ...cgpaData, semesters: newSemesters };
        setCgpaData(newData);
        cgpaService.saveCgpaData(newData);
    };

    const { currentCgpa, totalCredits, isCalculable } = useMemo(() => {
        let totalCreditPoints = 0;
        let totalCredits = 0;
        cgpaData.semesters.forEach(sem => {
            const sgpa = parseFloat(sem.sgpa);
            const credits = parseFloat(sem.credits);
            if (!isNaN(sgpa) && !isNaN(credits) && sgpa > 0 && sgpa <= 10 && credits > 0) {
                totalCreditPoints += sgpa * credits;
                totalCredits += credits;
            }
        });
        return {
            isCalculable: totalCredits > 0,
            currentCgpa: totalCredits > 0 ? (totalCreditPoints / totalCredits) : 0,
            totalCredits,
        };
    }, [cgpaData]);

     const predictedCgpa = useMemo(() => {
        const futureSgpa = parseFloat(prediction.futureSgpa);
        const futureCredits = parseFloat(prediction.futureCredits);
        if (!isCalculable || isNaN(futureSgpa) || isNaN(futureCredits) || futureSgpa <= 0 || futureSgpa > 10 || futureCredits <= 0) return null;
        const newTotal = (currentCgpa * totalCredits + futureSgpa * futureCredits) / (totalCredits + futureCredits);
        return newTotal;
    }, [prediction, currentCgpa, totalCredits, isCalculable]);

    if (isLoading) return <div className="p-8"><LoadingIndicator message="Loading CGPA Data..." /></div>

    if(!user) return (
        <div className="text-center p-8 bg-slate-900/50 rounded-xl holo-card">
            <p className="text-slate-300 mb-4 text-lg">Please log in to save and view your CGPA history.</p>
        </div>
    )

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
             <div className="holo-card p-6 space-y-4">
                <h3 className="text-xl font-bold text-cyan-300">Enter Semester Details</h3>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                    {cgpaData.semesters.map((sem, index) => (
                        <div key={sem.id} className="flex items-center gap-2 p-2 rounded-lg animate-slide-down-glow" style={{ animationDelay: `${index * 50}ms` }}>
                            <span className="font-mono text-cyan-400">Sem {index + 1}:</span>
                            <Input type="text" placeholder="SGPA" value={sem.sgpa} onChange={e => handleSemesterChange(sem.id, 'sgpa', e.target.value)} className="bg-slate-800 border-cyan-500/30 text-white !mt-0"/>
                            <Input type="text" placeholder="Credits" value={sem.credits} onChange={e => handleSemesterChange(sem.id, 'credits', e.target.value)} className="bg-slate-800 border-cyan-500/30 text-white !mt-0"/>
                            <Button variant="danger" size="sm" onClick={() => removeSemester(sem.id)} className="!p-2" disabled={cgpaData.semesters.length <= 1}>
                                <TrashIcon className="w-4 h-4"/>
                            </Button>
                        </div>
                    ))}
                </div>
                <Button onClick={addSemester} leftIcon={<PlusIcon />} className="w-full">Add Semester</Button>
            </div>
            <div className="space-y-8">
                <div className="hologram-panel">
                    <div className={predictedCgpa !== null ? 'content-blur' : ''}>
                        <h3 className="text-xl font-bold text-cyan-300 opacity-80">Current CGPA</h3>
                        <p className="text-6xl font-mono font-black text-cyan-200 tracking-tighter" style={{ textShadow: '0 0 15px #00ffff99' }}>
                            {isCalculable ? currentCgpa.toFixed(3) : '0.000'}
                        </p>
                        <p className="text-sm text-cyan-400 opacity-70">Over {totalCredits} credits</p>
                    </div>

                    {predictedCgpa !== null && (
                         <div className="hologram-overlay">
                            <h2 className="text-lg font-bold text-fuchsia-300 opacity-80">Projected CGPA</h2>
                            <p className="text-5xl font-mono font-black text-fuchsia-200" style={{ textShadow: '0 0 15px #ff00ff99' }}>{predictedCgpa.toFixed(3)}</p>
                         </div>
                    )}
                </div>
                <div className="holo-card p-6">
                     <h3 className="text-xl font-bold text-cyan-300 flex items-center gap-2"> Predict Next Semester</h3>
                     <div className="flex items-center gap-2 mt-3">
                        <Input type="text" placeholder="Future SGPA" value={prediction.futureSgpa} onChange={e => setPrediction({...prediction, futureSgpa: e.target.value})} className="bg-slate-800 border-cyan-500/30 text-white !mt-0"/>
                        <Input type="text" placeholder="Future Credits" value={prediction.futureCredits} onChange={e => setPrediction({...prediction, futureCredits: e.target.value})} className="bg-slate-800 border-cyan-500/30 text-white !mt-0"/>
                    </div>
                </div>
            </div>
        </div>
    )
}

const CgpaPage: FC = () => {
    const [mode, setMode] = useState<'cgpa' | 'sgpa'>('cgpa');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        document.body.classList.add('futuristic-theme');
        return () => document.body.classList.remove('futuristic-theme');
    }, []);

    return (
        <div className="relative min-h-[calc(100vh-250px)]">
            {/* Background Grid */}
            <div className="absolute inset-[-5rem] bg-gray-950 -z-10" style={{
                backgroundImage: `
                    linear-gradient(to right, rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0, 255, 255, 0.1) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                animation: 'pulse-grid 10s linear infinite',
            }}></div>
            
            <div className="text-center mb-8">
                <h1 className="text-4xl font-black tracking-tighter text-slate-100 flex items-center justify-center gap-3 futuristic-title">
                    <ChartPieIcon className="w-10 h-10" /> CGPA / SGPA Calculator
                </h1>
                <p className="text-cyan-400 font-mono mt-1">FIND YOUR CGPA IN REAL TIME</p>
            </div>
            
            <div className="flex justify-center mb-8 p-1 rounded-full bg-slate-900/50 border border-cyan-500/20 max-w-sm mx-auto">
                <button
                    onClick={() => setMode('cgpa')}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all w-1/2 ${mode === 'cgpa' ? 'bg-cyan-400/80 text-slate-900 shadow-[0_0_15px_rgba(0,255,255,0.5)]' : 'text-cyan-300'}`}
                >
                    CGPA Calculator
                </button>
                <button
                    onClick={() => setMode('sgpa')}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all w-1/2 ${mode === 'sgpa' ? 'bg-cyan-400/80 text-slate-900 shadow-[0_0_15px_rgba(0,255,255,0.5)]' : 'text-cyan-300'}`}
                >
                    SGPA Calculator
                </button>
            </div>
            
            <div className="animate-fade-in">
              {mode === 'cgpa' ? <CgpaCalculator user={user} /> : <SgpaCalculator />}
            </div>
        </div>
    );
};

export default CgpaPage;

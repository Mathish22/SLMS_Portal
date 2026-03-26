import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../api/config';
import { useNavigate, useParams } from 'react-router-dom';

const ActiveExam = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({}); // { questionId: selectedOption | textualAnswer }

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(null);
    const [result, setResult] = useState(null);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) return navigate('/login');

        // Anti-cheat mechanisms
        const handleKeyDown = (e) => {
            // Prevent basic shortcuts
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                e.preventDefault();
            }
        };
        const handleContextMenu = e => e.preventDefault(); // Disable right click

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('contextmenu', handleContextMenu);

        fetchExamData();

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [id]);

    useEffect(() => {
        // Timer countdown logic
        if (timeLeft === null || timeLeft <= 0 || result) return;

        const timerId = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerId);
                    // Automatic submission when time runs out
                    submitExam(answers, true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, result, answers]);

    const fetchExamData = async () => {
        try {
            // 1. Fetch exam metadata
            const examRes = await axios.get(`${BASE_URL}/exams/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const examData = examRes.data;
            setExam(examData);

            // 2. See if already submitted
            try {
                const resultsRes = await axios.get(`${BASE_URL}/exams/${id}/results`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (resultsRes.data) {
                    setResult(resultsRes.data);
                    setIsLoading(false);
                    return; // Stop here if already taken
                }
            } catch (resultsError) {
                // 404 means no attempt yet, which is good. Proceed.
            }

            // 3. Fetch Questions (Sanitized payload, SEB check happens here)
            const qRes = await axios.get(`${BASE_URL}/exams/${id}/questions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuestions(qRes.data);

            // Calculate remaining time
            const now = new Date();
            const end = new Date(examData.endTime);
            const remainingSecondsFromEnd = Math.floor((end.getTime() - now.getTime()) / 1000);

            // Limit by exam duration limit if it's strictly enforced from start (we assume durationMinutes applies loosely, but hard limit is endTime)
            // If you want strict duration tracking, you'd save a "startTime" per student on first fetch.
            // For now, simple implementation uses the global endTime.

            if (remainingSecondsFromEnd <= 0) {
                setError('The exam time has expired.');
            } else {
                setTimeLeft(remainingSecondsFromEnd);
            }

            setIsLoading(false);

        } catch (error) {
            console.error('Error starting exam:', error);
            setError(error.response?.data?.error || 'Failed to initialize exam environment.');
            setIsLoading(false);
        }
    };

    const handleOptionSelect = (questionId, optionValue) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionValue }));
    };

    const submitExam = async (currentAnswers, autoSubmit = false) => {
        if (!autoSubmit && !window.confirm("Are you sure you want to submit? You cannot change your answers after submission.")) {
            return;
        }

        setIsSubmitting(true);

        // Format payload to backend spec => [{ questionId, selectedOption }]
        const payload = {
            answers: Object.keys(currentAnswers).map(qId => ({
                questionId: qId,
                selectedOption: currentAnswers[qId]
            }))
        };

        try {
            const response = await axios.post(`${BASE_URL}/exams/${id}/submit`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResult({
                score: response.data.score,
                maxScore: response.data.maxScore || 100,
                submittedAt: new Date()
            });
        } catch (error) {
            console.error('Submission failed', error);
            alert(error.response?.data?.error || 'Submission failed. Please try again or contact the instructor.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}h ${m}m ${s}s`;
        return `${m}m ${s}s`;
    };

    if (isLoading) return <div className="text-center p-20 text-blue-600 font-bold text-xl">Initializing Secure Environment... 🔒</div>;

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-red-500">
                <span className="text-6xl mb-4 block">🚫</span>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button onClick={() => navigate('/exam')} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium shadow-md transition-colors w-full">
                    Return to Exams
                </button>
            </div>
        </div>
    );

    if (result) return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col justify-center items-center p-4">
            <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center border border-green-200">
                <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex justify-center items-center text-5xl mx-auto mb-6">
                    🎉
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Exam Submitted!</h2>
                <p className="text-sm text-gray-500 mb-8 block font-mono bg-gray-50 p-2 rounded">
                    Time: {new Date(result.submittedAt).toLocaleString()}
                </p>

                <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-2xl p-6 text-white mb-8 shadow-inner">
                    <p className="text-green-100 uppercase text-sm font-bold tracking-wider mb-1">Your Submission</p>
                    <div className="flex justify-center items-end gap-1">
                        <span className="text-6xl font-black">{result.score}</span>
                        <span className="text-2xl font-medium mb-1 opacity-80">/ {result.maxScore}</span>
                    </div>
                    <div className="text-sm opacity-90 mt-2 text-center text-white font-medium">
                        Descriptive questions pending manual grading.
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={() => navigate('/dashboard')} className="flex-1 border-2 border-green-500 text-green-600 hover:bg-green-50 px-4 py-3 rounded-xl font-bold transition-all">
                        Dashboard
                    </button>
                    <button onClick={() => navigate('/exam')} className="flex-1 bg-green-500 text-white hover:bg-green-600 px-4 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl">
                        All Exams
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 select-none">
            {/* Top Bar / Timer */}
            <div className="bg-white shadow-md border-b-4 border-indigo-500 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div>
                        <h1 className="font-bold text-lg text-gray-800 truncate">{exam?.title}</h1>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono border">Secured Environment 🔒</span>
                    </div>

                    <div className={`px-4 py-2 rounded-lg font-bold font-mono text-lg transition-colors border-2 shadow-inner
                        ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}
                    >
                        ⏱️ {formatTime(timeLeft)}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto py-8 px-4 pb-24">

                {/* Warning Banner */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-8 shadow-sm">
                    <div className="flex items-center">
                        <span className="text-yellow-600 text-xl mr-3">⚠️</span>
                        <p className="text-sm text-yellow-800">
                            <strong>Do not refresh or leave this page.</strong> This is a monitored environment. Your exam will auto-submit when the timer expires.
                        </p>
                    </div>
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                    {questions.map((q, index) => (
                        <div key={q._id} className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 hover:border-indigo-200 transition-colors">
                            <h3 className="text-lg font-medium text-gray-900 mb-6 leading-relaxed flex flex-col items-start gap-2">
                                <div className="flex items-center">
                                    <span className="bg-indigo-100 text-indigo-800 rounded px-2 py-1 mr-3 text-sm font-bold border border-indigo-200 shadow-sm">
                                        Q{index + 1}
                                    </span>
                                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded border">
                                        {q.questionType || 'MCQ'}
                                    </span>
                                </div>
                                <span className="mt-1">{q.questionText}</span>
                            </h3>

                            {(!q.questionType || q.questionType === 'MCQ') ? (
                                <div className="space-y-3">
                                    {q.options.map((opt, optIndex) => {
                                        const isSelected = answers[q._id] === opt;
                                        return (
                                            <label
                                                key={optIndex}
                                                onClick={() => handleOptionSelect(q._id, opt)}
                                                className={`flex items-center p-4 rounded-xl cursor-pointer border-2 transition-all
                                                    ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}
                                            >
                                                <div className="flex-shrink-0 mr-4">
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center
                                                        ${isSelected ? 'border-indigo-500 border-[6px]' : 'border-gray-400'}`}>
                                                    </div>
                                                </div>
                                                <span className={`text-base flex-1 ${isSelected ? 'text-indigo-900 font-medium' : 'text-gray-700'}`}>
                                                    {opt}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : (
                                <textarea
                                    value={answers[q._id] || ''}
                                    onChange={(e) => handleOptionSelect(q._id, e.target.value)}
                                    className="w-full h-48 p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-mono text-sm text-gray-800"
                                    placeholder="Type your answer here..."
                                    spellCheck="false"
                                ></textarea>
                            )}
                        </div>
                    ))}
                </div>

                {/* Submit Action */}
                <div className="mt-10 flex flex-col items-center">
                    <p className="text-gray-500 mb-4 text-sm">
                        Answered {Object.keys(answers).length} of {questions.length} questions
                    </p>
                    <button
                        onClick={() => submitExam(answers)}
                        disabled={isSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg px-12 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 w-full md:w-auto"
                    >
                        {isSubmitting ? 'Sumitting Exam...' : 'Finish & Submit Exam'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActiveExam;

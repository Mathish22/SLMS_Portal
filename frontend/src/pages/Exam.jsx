import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../api/config';
import { useNavigate } from 'react-router-dom';

const Exam = () => {
    const [exams, setExams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/exams`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExams(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching exams:', error);
            setError('Failed to load exams.');
            setIsLoading(false);
        }
    };

    const handleStartExam = (exam) => {
        const now = new Date();
        const start = new Date(exam.startTime);
        const end = new Date(exam.endTime);

        if (now < start) {
            alert(`This exam has not started yet. It begins at ${start.toLocaleString()}`);
            return;
        }

        if (now > end) {
            alert('This exam has already ended.');
            return;
        }

        navigate(`/exam/${exam._id}/take`);
    };

    const getStatusBadge = (exam) => {
        const now = new Date();
        const start = new Date(exam.startTime);
        const end = new Date(exam.endTime);

        if (now < start) {
            return <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Upcoming</span>;
        } else if (now >= start && now <= end) {
            return <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full animate-pulse">Active Now</span>;
        } else {
            return <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Ended</span>;
        }
    };

    if (isLoading) return <div className="text-center p-10 mt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-10 px-4">
            <div className="max-w-6xl mx-auto">

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">My Exams</h1>
                        <p className="text-gray-700">View and take your scheduled examinations.</p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-orange-600 font-medium hover:text-orange-800 transition-colors"
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

                {exams.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-orange-100">
                        <span className="text-5xl mb-4 block">📝</span>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Exams Found</h3>
                        <p className="text-gray-500">There are currently no exams scheduled for your department and year.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {exams.map((exam) => {
                            const now = new Date();
                            const isActive = now >= new Date(exam.startTime) && now <= new Date(exam.endTime);

                            return (
                                <div key={exam._id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow p-6 border-t-4 border-orange-500 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{exam.title}</h3>
                                        {getStatusBadge(exam)}
                                    </div>

                                    <p className="text-sm text-gray-600 mb-4 flex-grow">{exam.description || 'No description provided.'}</p>

                                    <div className="space-y-2 mb-6 text-sm text-gray-700 bg-orange-50 p-3 rounded-lg">
                                        <div className="flex justify-between">
                                            <span className="font-medium text-gray-500">Duration:</span>
                                            <span>{exam.durationMinutes} mins</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium text-gray-500">Starts:</span>
                                            <span>{new Date(exam.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium text-gray-500">Ends:</span>
                                            <span>{new Date(exam.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-orange-200 mt-2">
                                            <span className="font-medium text-gray-500">Security:</span>
                                            <span className={exam.sebRequired ? "text-red-500 font-medium" : "text-green-600"}>
                                                {exam.sebRequired ? "SEB Required" : "Standard Browser"}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleStartExam(exam)}
                                        className={`w-full py-3 rounded-lg font-bold transition-all shadow-md mt-auto
                                            ${isActive
                                                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white transform hover:scale-[1.02]'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        {isActive ? 'Start Exam Now' : 'Not Available'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Exam;

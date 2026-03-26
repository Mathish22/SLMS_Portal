import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../api/config';
import { useNavigate, useParams } from 'react-router-dom';

const ManageQuestions = () => {
    const { id } = useParams(); // exam ID
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Form state
    const [newQuestion, setNewQuestion] = useState({
        questionText: '',
        questionType: 'MCQ',
        options: ['', '', '', ''],
        correctAnswer: ''
    });

    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (!['staff', 'admin', 'department_admin'].includes(role)) {
            navigate('/login');
            return;
        }
        fetchExamMetadata();
        fetchQuestions();
    }, [id]);

    const fetchExamMetadata = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/exams/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExam(response.data);
        } catch (error) {
            console.error('Error fetching exam:', error);
            setMessage('Error fetching exam metadata.');
        }
    };

    const fetchQuestions = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/exams/${id}/questions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuestions(response.data);
        } catch (error) {
            console.error('Error fetching questions:', error);
        }
    };

    const handleOptionChange = (index, value) => {
        const updatedOptions = [...newQuestion.options];
        const oldVal = updatedOptions[index];
        updatedOptions[index] = value;
        
        let newCorrectAnswer = newQuestion.correctAnswer;
        if (newCorrectAnswer === oldVal && oldVal !== '') {
            newCorrectAnswer = value;
        }

        setNewQuestion({ ...newQuestion, options: updatedOptions, correctAnswer: newCorrectAnswer });
    };

    const handleCreateQuestion = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        // Basic validation
        if (newQuestion.questionType === 'MCQ') {
            if (newQuestion.options.some(opt => opt.trim() === '')) {
                setMessage('Please fill in all 4 options for MCQ.');
                setIsLoading(false);
                return;
            }

            if (!newQuestion.correctAnswer) {
                setMessage('Please select the correct answer for MCQ.');
                setIsLoading(false);
                return;
            }
        }

        try {
            await axios.post(`${BASE_URL}/exams/${id}/questions`, newQuestion, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Question added successfully!');
            setNewQuestion({
                questionText: '',
                questionType: 'MCQ',
                options: ['', '', '', ''],
                correctAnswer: ''
            });
            fetchQuestions();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Failed to add question');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        if (!window.confirm("Are you sure you want to delete this question?")) return;
        try {
            await axios.delete(`${BASE_URL}/exams/questions/${questionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Question deleted successfully');
            fetchQuestions();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Failed to delete question');
        }
    };

    if (!exam) return <div className="p-10 text-center">Loading Exam...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <div>
                            <h1 className="text-2xl font-bold text-indigo-900">{exam.title}</h1>
                            <p className="text-indigo-600 mt-1">Manage multiple-choice questions for this exam</p>
                        </div>
                        <button
                            onClick={() => navigate('/staff/exams')}
                            className="bg-white text-indigo-600 font-medium px-6 py-2 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
                        >
                            ← Back to Exams
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg mb-6 ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Add Question Form (Left column) */}
                    {exam.isLocked ? (
                        <div className="lg:col-span-1 bg-yellow-50 rounded-2xl shadow-sm p-6 h-fit border border-yellow-200">
                            <h2 className="text-xl font-semibold mb-4 text-yellow-800 border-b border-yellow-200 pb-2">Questions Locked</h2>
                            <p className="text-yellow-700 text-sm leading-relaxed">
                                You cannot add or delete questions because the exam start time has already passed, or students have already attended. The questions are now locked.
                            </p>
                        </div>
                    ) : (
                        <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6 h-fit border border-gray-100">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Add New Question</h2>
                            <form onSubmit={handleCreateQuestion} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
                                    <textarea
                                        required rows="3"
                                        value={newQuestion.questionText} onChange={e => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none resize-none"
                                        placeholder="Enter the MCQ question here..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Type *</label>
                                    <select 
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                                        value={newQuestion.questionType} 
                                        onChange={e => setNewQuestion({ ...newQuestion, questionType: e.target.value })}
                                    >
                                        <option value="MCQ">Multiple Choice (MCQ)</option>
                                        <option value="Descriptive">Descriptive Text / Essay</option>
                                    </select>
                                </div>

                                {newQuestion.questionType === 'MCQ' && (
                                    <div className="space-y-3 pb-4">
                                        <label className="block text-sm font-medium text-gray-700">Options * (Select the radio button for the correct answer)</label>
                                        {newQuestion.options.map((opt, index) => (
                                            <div key={index} className="flex items-center space-x-3">
                                                <input
                                                    type="radio"
                                                    name="correctOption"
                                                    required
                                                    checked={newQuestion.correctAnswer === opt && opt !== ''}
                                                    onChange={() => {
                                                        if (opt) setNewQuestion({ ...newQuestion, correctAnswer: opt });
                                                    }}
                                                    className="h-5 w-5 text-green-600 focus:ring-green-500 cursor-pointer border-gray-300"
                                                    title="Mark as correct answer"
                                                />
                                                <span className="font-bold text-gray-500 w-6 text-right">{String.fromCharCode(65 + index)}.</span>
                                                <input
                                                    type="text" required
                                                    value={opt} onChange={e => handleOptionChange(index, e.target.value)}
                                                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${newQuestion.correctAnswer === opt && opt !== '' ? 'border-green-500 bg-green-50 focus:ring-green-400' : 'border-gray-300 focus:ring-indigo-400'}`}
                                                    placeholder={`Option ${index + 1}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white py-3 rounded-lg font-medium transition-all shadow-md">
                                    {isLoading ? 'Adding...' : 'Add Question To Exam'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Question List (Right Column) */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-800">Exam Questions ({questions.length})</h2>
                            <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                                Total Score: {questions.length}
                            </div>
                        </div>

                        {questions.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-500 border border-gray-100">
                                <span className="text-4xl mb-4 block">📝</span>
                                No questions added to this exam yet. Use the form to start building your test.
                            </div>
                        ) : (
                            questions.map((q, qIndex) => (
                                <div key={q._id} className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 relative group">
                                    {!exam.isLocked && (
                                        <button
                                            onClick={() => handleDeleteQuestion(q._id)}
                                            className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete Question"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                    <h3 className="text-lg font-medium text-gray-900 mb-4 pr-10 flex flex-col">
                                        <div>
                                            <span className="text-indigo-600 mr-2">Q{qIndex + 1}.</span>
                                            {q.questionText}
                                        </div>
                                        <span className="mt-2 inline-block px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-600 w-fit border">
                                            {q.questionType || 'MCQ'}
                                        </span>
                                    </h3>
                                    {(!q.questionType || q.questionType === 'MCQ') ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                                            {q.options.map((opt, oIndex) => {
                                                const isCorrect = opt === q.correctAnswer;
                                                return (
                                                    <div
                                                        key={oIndex}
                                                        className={`p-3 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                                                    >
                                                        <span className="font-bold mr-2 text-gray-500">{String.fromCharCode(65 + oIndex)}.</span>
                                                        <span className={isCorrect ? 'text-green-800 font-medium' : 'text-gray-700'}>{opt}</span>
                                                        {isCorrect && <span className="ml-2 text-green-600 text-sm">✓ (Correct)</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="pl-8 text-gray-500 italic text-sm">
                                            Descriptive response box will be provided to students.
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ManageQuestions;

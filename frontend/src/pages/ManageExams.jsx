import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../api/config';
import { useNavigate } from 'react-router-dom';

const ManageExams = () => {
    const [exams, setExams] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [availableYears, setAvailableYears] = useState(['I', 'II', 'III', 'IV']);

    // Form state
    const [newExam, setNewExam] = useState({
        title: '',
        description: '',
        department: '',
        year: '',
        durationMinutes: 60,
        startTime: '',
        endTime: '',
        sebRequired: true
    });

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML'];

    useEffect(() => {
        if (!['staff', 'admin', 'department_admin'].includes(role)) {
            navigate('/login');
            return;
        }
        fetchExams();
        if (role === 'staff') {
            fetchAllocatedYears();
        }
    }, []);

    const fetchAllocatedYears = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const userData = response.data;
            let yearsSet = new Set();
            if (userData.subjects) {
                userData.subjects.forEach(sub => {
                    if (sub.year) yearsSet.add(sub.year);
                });
            }
            if (userData.advisingSections) {
                userData.advisingSections.forEach(adv => {
                    if (adv.year) yearsSet.add(adv.year);
                });
            }
            if (yearsSet.size > 0) {
                const standardYears = ['I', 'II', 'III', 'IV'];
                const filteredYears = standardYears.filter(y => yearsSet.has(y));
                setAvailableYears(filteredYears.length > 0 ? filteredYears : Array.from(yearsSet));
            } else {
                setAvailableYears([]);
            }
        } catch (error) {
            console.error('Error fetching allocated years:', error);
        }
    };

    const fetchExams = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/exams`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExams(response.data);
        } catch (error) {
            console.error('Error fetching exams:', error);
        }
    };

    const handleCreateExam = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            await axios.post(`${BASE_URL}/exams`, newExam, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Exam created successfully!');
            setShowForm(false);
            setNewExam({
                title: '',
                description: '',
                department: '',
                year: '',
                durationMinutes: 60,
                startTime: '',
                endTime: '',
                sebRequired: true
            });
            fetchExams();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Failed to create exam');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex justify-between items-center bg-white rounded-2xl shadow-lg p-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">📝 Manage Exams</h1>
                        <p className="text-gray-500 mt-1">Create exams and configure SEB lock settings</p>
                    </div>
                    <div>
                        <button
                            onClick={() => navigate('/staff')}
                            className="mr-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700"
                        >
                            Return to Dashboard
                        </button>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
                        >
                            {showForm ? '✕ Cancel' : '+ Create Exam'}
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg mb-6 ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message}
                    </div>
                )}

                {showForm && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">New Exam Configuration</h2>
                        <form onSubmit={handleCreateExam} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title *</label>
                                    <input
                                        type="text" required
                                        value={newExam.title} onChange={e => setNewExam({ ...newExam, title: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                        placeholder="e.g. Midterm 1 - Data Structures"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <input
                                        type="text"
                                        value={newExam.description} onChange={e => setNewExam({ ...newExam, description: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                        placeholder="Optional instructions..."
                                    />
                                </div>

                                {role === 'admin' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Department *</label>
                                        <select required={role === 'admin'} value={newExam.department} onChange={e => setNewExam({ ...newExam, department: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none">
                                            <option value="">Select Dept</option>
                                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Year *</label>
                                    <select required value={newExam.year} onChange={e => setNewExam({ ...newExam, year: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none">
                                        <option value="">Select Year</option>
                                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    {availableYears.length === 0 && role === 'staff' && (
                                        <p className="text-xs text-red-500 mt-1">No years currently allocated to your profile.</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                                    <input
                                        type="datetime-local" required
                                        value={newExam.startTime} onChange={e => setNewExam({ ...newExam, startTime: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time * (Hard Close)</label>
                                    <input
                                        type="datetime-local" required
                                        value={newExam.endTime} onChange={e => setNewExam({ ...newExam, endTime: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Minutes) *</label>
                                    <input
                                        type="number" required min="1"
                                        value={newExam.durationMinutes} onChange={e => setNewExam({ ...newExam, durationMinutes: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                    />
                                </div>
                                <div className="flex items-center mt-6">
                                    <input
                                        type="checkbox" id="seb"
                                        checked={newExam.sebRequired} onChange={e => setNewExam({ ...newExam, sebRequired: e.target.checked })}
                                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="seb" className="ml-2 block text-sm font-medium text-gray-700">
                                        Require Safe Exam Browser (SEB) Lock
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button type="submit" disabled={isLoading} className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-lg font-medium transition-all shadow-lg">
                                    {isLoading ? 'Processing...' : 'Save Exam'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Exam List */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-800">Your Exam Definitions</h2>
                    </div>

                    {exams.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No exams created yet. Add one to get started!
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Title</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Window</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Security</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {exams.map((exam) => (
                                        <tr key={exam._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{exam.title}</div>
                                                <div className="text-sm text-gray-500">{exam.durationMinutes} mins</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {exam.department} - {exam.year} Year
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div>Starts: {new Date(exam.startTime).toLocaleString()}</div>
                                                <div>Ends: {new Date(exam.endTime).toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900 mb-1">Standard Exam</div>
                                                {exam.sebRequired ?
                                                    <span className="text-green-600 font-medium text-xs flex items-center">🔒 SEB</span> :
                                                    <span className="text-orange-500 text-xs">🌐 Browser</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => navigate(`/staff/exams/${exam._id}/questions`)}
                                                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Manage Questions
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageExams;

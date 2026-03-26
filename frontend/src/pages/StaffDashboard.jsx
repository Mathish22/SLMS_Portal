import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../api/config';
import { useNavigate } from 'react-router-dom';

const StaffDashboard = () => {
    const [activeTab, setActiveTab] = useState('study-resources');
    const [currentUser, setCurrentUser] = useState(null);
    const [students, setStudents] = useState([]);
    const [studentAttempts, setStudentAttempts] = useState([]);
    const [selectedAttempt, setSelectedAttempt] = useState(null);
    const [showAttemptModal, setShowAttemptModal] = useState(false);
    
    const [newStudent, setNewStudent] = useState({
        username: '',
        password: '',
        studentName: '',
        rollNo: '',
        department: '',
        year: ''
    });
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [editForm, setEditForm] = useState({
        username: '',
        studentName: '',
        rollNo: '',
        department: '',
        year: ''
    });
    const [showEditModal, setShowEditModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    const tabs = [
        { id: 'study-resources', label: '📚 Study Resources', icon: '📚' },
        { id: 'exam', label: '📝 Exam', icon: '📝' },
        { id: 'tasks', label: '✅ Tasks', icon: '✅' },
        { id: 'student-answers', label: '📄 Student Answers', icon: '📄' },
    ];

    if (currentUser?.advisingSections?.length > 0 || role === 'department_admin') {
        tabs.push({ id: 'attendance', label: '🗓️ Attendance', icon: '🗓️' });
    }

    const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML'];
    const years = ['I', 'II', 'III', 'IV'];

    useEffect(() => {
        if (!['staff', 'department_admin'].includes(role)) {
            navigate('/login');
            return;
        }
        fetchCurrentUser();
        fetchStudents();
    }, []);

    useEffect(() => {
        if (activeTab === 'student-answers') {
            fetchAttempts();
        }
    }, [activeTab]);

    const fetchCurrentUser = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCurrentUser(res.data);
        } catch (error) {
            console.error('Failed to fetch user', error);
        }
    };

    const fetchAttempts = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/exams/attempts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudentAttempts(res.data);
        } catch (error) {
            console.error('Failed to fetch attempts', error);
        }
    };

    const fetchStudents = async (search = '') => {
        try {
            const url = search
                ? `${BASE_URL}/auth/students?search=${encodeURIComponent(search)}`
                : `${BASE_URL}/auth/students`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        fetchStudents(value);
    };

    const handleCreateStudent = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            await axios.post(`${BASE_URL}/auth/create-student`, newStudent, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Student account created successfully!');
            setNewStudent({
                username: '',
                password: '',
                studentName: '',
                rollNo: '',
                department: '',
                year: ''
            });
            setShowForm(false);
            fetchStudents();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error creating student account');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteStudent = async (id) => {
        if (!window.confirm('Are you sure you want to delete this student?')) return;

        try {
            await axios.delete(`${BASE_URL}/auth/student/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchStudents();
            setMessage('Student deleted successfully');
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error deleting student');
        }
    };

    const openEditModal = (student) => {
        setEditingStudent(student);
        setEditForm({
            username: student.username,
            studentName: student.studentName || '',
            rollNo: student.rollNo || '',
            department: student.department || '',
            year: student.year || ''
        });
        setShowEditModal(true);
    };

    const handleUpdateStudent = async () => {
        setIsLoading(true);
        try {
            await axios.put(`${BASE_URL}/auth/student/${editingStudent._id}`, editForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Student updated successfully!');
            setShowEditModal(false);
            setEditingStudent(null);
            fetchStudents();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error updating student');
        } finally {
            setIsLoading(false);
        }
    };

    // Render Study Resources Tab
    const renderStudyResources = () => (
        <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">📚</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Study Resources</h2>
                <p className="text-gray-500">Upload and manage study materials for your students</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                    onClick={() => navigate('/upload')}
                    className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:border-green-400 transition-all group"
                >
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-2xl">📤</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Upload Materials</h3>
                            <p className="text-sm text-gray-500">Upload PDFs, notes, and study materials</p>
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => navigate('/dashboard')}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all group"
                >
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-2xl">👁️</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">View Resources</h3>
                            <p className="text-sm text-gray-500">Browse and manage uploaded resources</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render Exam Tab
    const renderExam = () => (
        <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">📝</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Exam Management</h2>
                <p className="text-gray-500">Create and manage exams for students</p>
            </div>

            <div className="flex justify-center mt-8">
                <button
                    onClick={() => navigate('/staff/exams')}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                    <span className="text-xl">⚙️</span> Manage Exams & Questions
                </button>
            </div>
        </div>
    );

    // Render Tasks Tab
    const renderTasks = () => (
        <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                    <span className="text-4xl">✅</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Tasks Assignment</h2>
                <p className="text-gray-500">Assign tasks and view student submissions</p>
            </div>
            <div className="flex justify-center mt-8">
                <button
                    onClick={() => navigate('/staff/tasks')}
                    className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg flex items-center gap-2"
                >
                    <span className="text-xl">⚙️</span> Manage Tasks
                </button>
            </div>
        </div>
    );

    // Render Student Answers Tab
    const renderStudentAnswers = () => (
        <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-3xl">📄</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Student Answers</h2>
                        <p className="text-gray-500">Review and grade {studentAttempts.length} submissions</p>
                    </div>
                </div>
                <button 
                    onClick={fetchAttempts}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                    🔄 Refresh
                </button>
            </div>

            {studentAttempts.length === 0 ? (
                <div className="p-12 text-center text-gray-500 border border-gray-100 rounded-xl bg-gray-50">
                    <span className="text-4xl mb-4 block">📭</span>
                    No student submissions found for your exams yet.
                </div>
            ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-4 font-semibold text-gray-600 uppercase text-xs tracking-wider cursor-pointer font-mono">Roll No</th>
                                <th className="p-4 font-semibold text-gray-600 uppercase text-xs tracking-wider">Student Name</th>
                                <th className="p-4 font-semibold text-gray-600 uppercase text-xs tracking-wider">Exam Title</th>
                                <th className="p-4 font-semibold text-gray-600 uppercase text-xs tracking-wider">Score</th>
                                <th className="p-4 font-semibold text-gray-600 uppercase text-xs tracking-wider">Submitted</th>
                                <th className="p-4 font-semibold text-gray-600 uppercase text-xs tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {studentAttempts.map((attempt) => (
                                <tr key={attempt._id} className="hover:bg-blue-50 transition-colors">
                                    <td className="p-4 font-mono text-gray-800 font-medium">{attempt.studentId?.rollNo || attempt.studentId?.username || '-'}</td>
                                    <td className="p-4 text-gray-800 font-medium">{attempt.studentId?.studentName || 'Unknown Student'}</td>
                                    <td className="p-4 text-gray-600">{attempt.examId?.title || 'Deleted Exam'}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            (attempt.score / attempt.maxScore) >= 0.5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {attempt.score} / {attempt.maxScore}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">{new Date(attempt.submittedAt).toLocaleString()}</td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => { setSelectedAttempt(attempt); setShowAttemptModal(true); }}
                                            className="text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                                        >
                                            View Answers
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    // Render Attendance Tab
    const renderAttendance = () => (
        <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-md">
                    <span className="text-4xl">🗓️</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Class Attendance</h2>
                <p className="text-gray-500">Record and review daily attendance for your assigned classes</p>
            </div>

            <div className="flex justify-center mt-8">
                <button
                    onClick={() => navigate('/staff/attendance')}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                    <span className="text-xl">📋</span> Take Attendance
                </button>
            </div>
        </div>
    );

    // Render Students Tab
    const renderStudents = () => (
        <>
            {/* Search and Add Button */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder="🔍 Search by name, roll no, department..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full px-4 py-3 pl-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
                >
                    {showForm ? '✕ Cancel' : '+ Add Student'}
                </button>
            </div>

            {/* Add Student Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Student Account</h2>
                    <form onSubmit={handleCreateStudent} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
                                <input
                                    type="text"
                                    placeholder="Enter full name"
                                    value={newStudent.studentName}
                                    onChange={(e) => setNewStudent({ ...newStudent, studentName: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Roll No *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., 21CS001"
                                    value={newStudent.rollNo}
                                    onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                                <select
                                    value={newStudent.department}
                                    onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                                <select
                                    value={newStudent.year}
                                    onChange={(e) => setNewStudent({ ...newStudent, year: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                >
                                    <option value="">Select Year</option>
                                    {years.map(yr => (
                                        <option key={yr} value={yr}>{yr}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                                <input
                                    type="text"
                                    placeholder="Login username"
                                    value={newStudent.username}
                                    onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                <input
                                    type="password"
                                    placeholder="Login password"
                                    value={newStudent.password}
                                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-medium transition-all"
                            >
                                {isLoading ? 'Creating...' : '✓ Create Student'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Student List */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Students ({students.length})</h2>
                </div>

                {students.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <p className="text-4xl mb-4">🎓</p>
                        <p>No students found. {searchTerm ? 'Try a different search.' : 'Add one to get started!'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {students.map((student) => (
                                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                                                    {(student.studentName || student.username).charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-800">{student.studentName || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">{student.rollNo || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{student.department || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{student.year || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{student.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => openEditModal(student)}
                                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded transition-all mr-2"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteStudent(student._id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded transition-all"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Student Modal */}
            {showEditModal && editingStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-white">✏️ Edit Student</h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Student Name</label>
                                    <input
                                        type="text"
                                        value={editForm.studentName}
                                        onChange={(e) => setEditForm({ ...editForm, studentName: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Roll No</label>
                                    <input
                                        type="text"
                                        value={editForm.rollNo}
                                        onChange={(e) => setEditForm({ ...editForm, rollNo: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                        placeholder="Enter roll number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                                    <select
                                        value={editForm.department}
                                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                                    <select
                                        value={editForm.year}
                                        onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                    >
                                        <option value="">Select Year</option>
                                        {years.map(yr => (
                                            <option key={yr} value={yr}>{yr}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                                    <input
                                        type="text"
                                        value={editForm.username}
                                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                        placeholder="Enter username"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingStudent(null);
                                }}
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateStudent}
                                disabled={isLoading}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg transition-all"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">👨‍🏫 Staff Dashboard</h1>
                            <p className="text-gray-500 mt-1">Manage students, resources, exams, and more</p>
                        </div>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`p-4 rounded-lg mb-6 ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {message}
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="bg-white rounded-2xl shadow-lg p-2 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 min-w-[150px] px-4 py-3 rounded-xl font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="transition-all">
                    {activeTab === 'study-resources' && renderStudyResources()}
                    {activeTab === 'exam' && renderExam()}
                    {activeTab === 'tasks' && renderTasks()}
                    {activeTab === 'student-answers' && renderStudentAnswers()}
                    {activeTab === 'attendance' && renderAttendance()}
                    {activeTab === 'students' && renderStudents()}
                </div>
            </div>

            {/* Answer Review Modal */}
            {showAttemptModal && selectedAttempt && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        
                        {/* Modal Header */}
                        <div className="bg-blue-600 p-6 rounded-t-2xl flex justify-between items-start text-white flex-shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">{selectedAttempt.studentId?.studentName}'s Submission</h2>
                                <div className="text-blue-100 space-x-4 text-sm">
                                    <span>Roll No: <strong className="text-white">{selectedAttempt.studentId?.rollNo || 'N/A'}</strong></span>
                                    <span>|</span>
                                    <span>Exam: <strong className="text-white">{selectedAttempt.examId?.title}</strong></span>
                                    <span>|</span>
                                    <span>Submitted: {new Date(selectedAttempt.submittedAt).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-black mb-1">{selectedAttempt.score}/{selectedAttempt.maxScore}</div>
                                <div className="text-blue-200 text-xs uppercase font-bold tracking-wider">Total Score</div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                            {selectedAttempt.examId?.examType === 'Notepad' || selectedAttempt.notepadContent ? (
                                <div className="bg-white border rounded-xl p-6 shadow-sm">
                                    <h3 className="font-bold text-gray-800 mb-4 text-lg border-b pb-2">Notepad Response:</h3>
                                    <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border">
                                        {selectedAttempt.notepadContent || '(No content submitted)'}
                                    </pre>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {selectedAttempt.answers.map((ans, idx) => {
                                        const q = ans.questionId;
                                        if (!q) return <div key={idx} className="p-4 bg-red-50 text-red-500 rounded-lg">Question deleted from database.</div>;
                                        
                                        const isDescriptive = q.questionType === 'Descriptive';
                                        const borderColor = isDescriptive ? 'border-blue-400' : (ans.isCorrect ? 'border-green-500' : 'border-red-500');

                                        return (
                                            <div key={idx} className={`bg-white rounded-xl shadow-sm border-l-4 p-5 ${borderColor}`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <h3 className="text-lg font-medium text-gray-800 flex flex-col items-start gap-2">
                                                        <div><span className="text-gray-400 mr-2">Q{idx + 1}.</span> {q.questionText}</div>
                                                        <span className="text-xs font-bold text-gray-500 bg-gray-100 border px-2 py-1 rounded inline-block">{q.questionType || 'MCQ'}</span>
                                                    </h3>
                                                    {isDescriptive ? (
                                                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center">
                                                            Pending Grade
                                                        </span>
                                                    ) : (
                                                        ans.isCorrect ? 
                                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center"><span className="mr-1">✓</span> Correct</span> : 
                                                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center"><span className="mr-1">✕</span> Incorrect</span>
                                                    )}
                                                </div>
                                                
                                                {isDescriptive ? (
                                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-700 font-mono text-sm whitespace-pre-wrap">
                                                        {ans.selectedOption || '(No response provided)'}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                                                            {q.options.map((opt, oIdx) => {
                                                                const isSelected = opt === ans.selectedOption;
                                                                const isActuallyCorrect = opt === q.correctAnswer;
                                                                
                                                                let cardStyle = "bg-gray-50 border-gray-200 text-gray-600";
                                                                if (isSelected && isActuallyCorrect) cardStyle = "bg-green-50 border-green-500 text-green-800 shadow-sm";
                                                                if (isSelected && !isActuallyCorrect) cardStyle = "bg-red-50 border-red-500 text-red-800 shadow-sm";
                                                                if (!isSelected && isActuallyCorrect) cardStyle = "bg-green-50 border-green-500 text-green-800 border-dashed opacity-80";

                                                                return (
                                                                    <div key={oIdx} className={`p-3 rounded-lg border-2 flex items-center ${cardStyle}`}>
                                                                        <span className="w-6 font-bold opacity-50">{String.fromCharCode(65 + oIdx)}.</span>
                                                                        <span className="flex-1 font-medium">{opt}</span>
                                                                        {isSelected && <span className="ml-2 font-bold">{isActuallyCorrect ? '✓' : '✕'}</span>}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        {!ans.isCorrect && (
                                                            <div className="mt-4 pl-8 text-sm flex items-center text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                                                <span className="font-bold text-yellow-700 mr-2">Correct Answer:</span> {q.correctAnswer}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t bg-white rounded-b-2xl flex justify-end flex-shrink-0">
                            <button 
                                onClick={() => { setShowAttemptModal(false); setSelectedAttempt(null); }}
                                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition-colors"
                            >
                                Close Review
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffDashboard;

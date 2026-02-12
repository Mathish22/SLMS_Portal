import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../api/config';
import { useNavigate } from 'react-router-dom';

const StaffDashboard = () => {
    const [activeTab, setActiveTab] = useState('study-resources');
    const [students, setStudents] = useState([]);
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
        { id: 'student-answers', label: '📄 Student Answers', icon: '📄' },
    ];

    const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML'];
    const years = ['I', 'II', 'III', 'IV'];

    useEffect(() => {
        if (role !== 'staff') {
            navigate('/login');
            return;
        }
        fetchStudents();
    }, []);

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

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700 text-center">🚧 Exam feature coming soon!</p>
            </div>
        </div>
    );

    // Render Student Answers Tab
    const renderStudentAnswers = () => (
        <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">📄</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Student Answers</h2>
                <p className="text-gray-500">Review and grade student submissions</p>
            </div>

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700 text-center">🚧 Student Answers feature coming soon!</p>
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
                    {activeTab === 'student-answers' && renderStudentAnswers()}
                    {activeTab === 'students' && renderStudents()}
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;

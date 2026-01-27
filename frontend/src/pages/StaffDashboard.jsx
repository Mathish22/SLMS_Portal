import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../api/config';
import { useNavigate } from 'react-router-dom';

const StaffDashboard = () => {
    const [students, setStudents] = useState([]);
    const [newStudent, setNewStudent] = useState({ username: '', password: '' });
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    useEffect(() => {
        if (role !== 'staff') {
            navigate('/login');
            return;
        }
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/auth/students`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
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
            setNewStudent({ username: '', password: '' });
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">👨‍🏫 Staff Dashboard</h1>
                            <p className="text-gray-500 mt-1">Manage student accounts</p>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
                        >
                            {showForm ? '✕ Cancel' : '+ Add Student'}
                        </button>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`p-4 rounded-lg mb-6 ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {message}
                    </div>
                )}

                {/* Add Student Form */}
                {showForm && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Student Account</h2>
                        <form onSubmit={handleCreateStudent} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Username"
                                value={newStudent.username}
                                onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                                required
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={newStudent.password}
                                onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                                required
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
                            >
                                {isLoading ? 'Creating...' : 'Create Student'}
                            </button>
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
                            <p>No students yet. Add one to get started!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {students.map((student, index) => (
                                <div key={student._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                            {student.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{student.username}</p>
                                            <p className="text-sm text-gray-500">Student</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteStudent(student._id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-all"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;

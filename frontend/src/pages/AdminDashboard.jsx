import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../api/config';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [deptAdmins, setDeptAdmins] = useState([]);
    const [newDeptAdmin, setNewDeptAdmin] = useState({ username: '', password: '', department: '' });
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML'];

    useEffect(() => {
        if (role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchDeptAdmins();
    }, [role, navigate]);

    const fetchDeptAdmins = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/auth/dept-admins`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeptAdmins(response.data);
        } catch (error) {
            console.error('Error fetching department admins:', error);
        }
    };

    const handleCreateDeptAdmin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            await axios.post(`${BASE_URL}/auth/create-dept-admin`, newDeptAdmin, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Department Admin created successfully!');
            setNewDeptAdmin({ username: '', password: '', department: '' });
            setShowForm(false);
            fetchDeptAdmins();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error creating department admin');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteDeptAdmin = async (id) => {
        if (!window.confirm('Are you sure you want to delete this Department Admin?')) return;
        try {
            await axios.delete(`${BASE_URL}/auth/dept-admin/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDeptAdmins();
            setMessage('Department Admin deleted successfully');
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error deleting admin');
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">👨‍💼 Admin Dashboard</h1>
                            <p className="text-gray-500 mt-1">Manage Department Admin accounts</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
                            >
                                {showForm ? '✕ Cancel' : '+ Add Dept Admin'}
                            </button>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg mb-6 ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message}
                    </div>
                )}

                {/* Add Dept Admin Form */}
                {showForm && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Create Department Admin</h2>
                        <form onSubmit={handleCreateDeptAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <select
                                value={newDeptAdmin.department}
                                onChange={(e) => setNewDeptAdmin({ ...newDeptAdmin, department: e.target.value })}
                                required
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                            >
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="Username"
                                value={newDeptAdmin.username}
                                onChange={(e) => setNewDeptAdmin({ ...newDeptAdmin, username: e.target.value })}
                                required
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={newDeptAdmin.password}
                                onChange={(e) => setNewDeptAdmin({ ...newDeptAdmin, password: e.target.value })}
                                required
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
                            >
                                {isLoading ? 'Creating...' : 'Create Admin'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Dept Admin List */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-slide-up">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">
                            Department Admins ({deptAdmins.length})
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600">Department</th>
                                    <th className="p-4 font-semibold text-gray-600">Username</th>
                                    <th className="p-4 font-semibold text-gray-600">Created At</th>
                                    <th className="p-4 font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {deptAdmins.map((admin) => (
                                    <tr key={admin._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
                                                {admin.staffDepartment}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium text-gray-800">{admin.username}</td>
                                        <td className="p-4 text-gray-500 text-sm">
                                            {new Date(admin.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleDeleteDeptAdmin(admin._id)}
                                                className="text-red-500 hover:text-red-700 font-medium hover:underline transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {deptAdmins.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-4xl">👨‍💼</span>
                                                <p>No Department Admins found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

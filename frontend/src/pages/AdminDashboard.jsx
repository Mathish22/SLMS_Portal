import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../api/config';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [staff, setStaff] = useState([]);
    const [newStaff, setNewStaff] = useState({ staffName: '', username: '', password: '' });
    const [editingStaff, setEditingStaff] = useState(null);
    const [editForm, setEditForm] = useState({ staffName: '', staffId: '', subjects: [] });
    const [newSubject, setNewSubject] = useState({ subjectCode: '', subjectName: '', year: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [viewingStaff, setViewingStaff] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    useEffect(() => {
        if (role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchStaff();
    }, []);

    const fetchStaff = async (search = '') => {
        try {
            const url = search
                ? `${BASE_URL}/auth/staff?search=${encodeURIComponent(search)}`
                : `${BASE_URL}/auth/staff`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaff(response.data);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        fetchStaff(value);
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            await axios.post(`${BASE_URL}/auth/create-staff`, newStaff, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Staff account created successfully!');
            setNewStaff({ staffName: '', username: '', password: '' });
            setShowForm(false);
            fetchStaff();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error creating staff account');
        } finally {
            setIsLoading(false);
        }
    };

    const openEditModal = (staffMember) => {
        setEditingStaff(staffMember);
        setEditForm({
            staffName: staffMember.staffName || '',
            staffId: staffMember.staffId || '',
            subjects: staffMember.subjects || []
        });
        setShowEditModal(true);
    };

    const handleAddSubject = () => {
        if (newSubject.subjectCode && newSubject.subjectName) {
            setEditForm({
                ...editForm,
                subjects: [...editForm.subjects, { ...newSubject }]
            });
            setNewSubject({ subjectCode: '', subjectName: '', year: '' });
        }
    };

    const handleRemoveSubject = (index) => {
        const updatedSubjects = editForm.subjects.filter((_, i) => i !== index);
        setEditForm({ ...editForm, subjects: updatedSubjects });
    };

    const handleSaveEdit = async () => {
        setIsLoading(true);
        try {
            await axios.put(`${BASE_URL}/auth/staff/${editingStaff._id}`, editForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Staff updated successfully!');
            setShowEditModal(false);
            setEditingStaff(null);
            fetchStaff();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error updating staff');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm('Are you sure you want to delete this staff member?')) return;

        try {
            await axios.delete(`${BASE_URL}/auth/staff/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchStaff();
            setMessage('Staff deleted successfully');
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error deleting staff');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">👨‍💼 Admin Dashboard</h1>
                            <p className="text-gray-500 mt-1">Manage staff accounts and their subjects</p>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
                        >
                            {showForm ? '✕ Cancel' : '+ Add Staff'}
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by Subject Code, Subject Name, Staff Name, or Staff ID..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`p-4 rounded-lg mb-6 ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {message}
                    </div>
                )}

                {/* Add Staff Form */}
                {showForm && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Staff Account</h2>
                        <form onSubmit={handleCreateStaff} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <input
                                type="text"
                                placeholder="Staff Name"
                                value={newStaff.staffName}
                                onChange={(e) => setNewStaff({ ...newStaff, staffName: e.target.value })}
                                required
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                            />
                            <input
                                type="text"
                                placeholder="Username"
                                value={newStaff.username}
                                onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                                required
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={newStaff.password}
                                onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                required
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
                            >
                                {isLoading ? 'Creating...' : 'Create Staff'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Staff List */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">Staff Members ({staff.length})</h2>
                    </div>

                    {staff.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <p className="text-4xl mb-4">👨‍🏫</p>
                            <p>No staff members found. {searchTerm && 'Try a different search term.'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subjects</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {staff.map((member) => (
                                        <tr key={member._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                                                        {(member.staffName || member.username).charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-gray-800">{member.staffName || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{member.username}</td>
                                            <td className="px-6 py-4 text-gray-600">{member.staffId || '-'}</td>
                                            <td className="px-6 py-4">
                                                {member.subjects && member.subjects.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {member.subjects.map((sub, idx) => (
                                                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                                {sub.subjectCode}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">No subjects</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setViewingStaff(member);
                                                            setShowViewModal(true);
                                                        }}
                                                        className="text-green-500 hover:text-green-700 hover:bg-green-50 px-3 py-1 rounded-lg transition-all"
                                                    >
                                                        👁️ View
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(member)}
                                                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded-lg transition-all"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStaff(member._id)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-all"
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Edit Modal */}
                {showEditModal && editingStaff && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-800">Edit Staff: {editingStaff.username}</h2>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Staff Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Staff Name</label>
                                        <input
                                            type="text"
                                            value={editForm.staffName}
                                            onChange={(e) => setEditForm({ ...editForm, staffName: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                                            placeholder="Enter staff name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Staff ID</label>
                                        <input
                                            type="text"
                                            value={editForm.staffId}
                                            onChange={(e) => setEditForm({ ...editForm, staffId: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                                            placeholder="Enter staff ID (e.g., STF001)"
                                        />
                                    </div>
                                </div>

                                {/* Subjects Section */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Handled Subjects</label>

                                    {/* Current Subjects */}
                                    {editForm.subjects.length > 0 && (
                                        <div className="mb-4 space-y-2">
                                            {editForm.subjects.map((sub, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                                    <div>
                                                        <span className="font-medium text-gray-800">{sub.subjectCode}</span>
                                                        <span className="mx-2">-</span>
                                                        <span className="text-gray-600">{sub.subjectName}</span>
                                                        {sub.year && <span className="text-gray-400 ml-2">({sub.year})</span>}
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveSubject(idx)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add New Subject */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Subject Code"
                                            value={newSubject.subjectCode}
                                            onChange={(e) => setNewSubject({ ...newSubject, subjectCode: e.target.value })}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Subject Name"
                                            value={newSubject.subjectName}
                                            onChange={(e) => setNewSubject({ ...newSubject, subjectName: e.target.value })}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Year (e.g., 2024-25)"
                                            value={newSubject.year}
                                            onChange={(e) => setNewSubject({ ...newSubject, year: e.target.value })}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddSubject}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingStaff(null);
                                    }}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={isLoading}
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2 rounded-lg transition-all"
                                >
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Modal */}
                {showViewModal && viewingStaff && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-t-2xl">
                                <h2 className="text-xl font-bold text-white">👨‍🏫 Staff Details</h2>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Staff Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Staff Name</p>
                                        <p className="font-semibold text-gray-800">{viewingStaff.staffName || '-'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Username</p>
                                        <p className="font-semibold text-gray-800">{viewingStaff.username}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Staff ID</p>
                                        <p className="font-semibold text-gray-800">{viewingStaff.staffId || '-'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Role</p>
                                        <p className="font-semibold text-gray-800 capitalize">{viewingStaff.role}</p>
                                    </div>
                                </div>

                                {/* Handled Subjects */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">📚 Handled Subjects</h3>
                                    {viewingStaff.subjects && viewingStaff.subjects.length > 0 ? (
                                        <div className="space-y-2">
                                            {viewingStaff.subjects.map((sub, idx) => (
                                                <div key={idx} className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-bold text-blue-800 text-lg">{sub.subjectCode}</p>
                                                            <p className="text-gray-700">{sub.subjectName}</p>
                                                        </div>
                                                        {sub.year && (
                                                            <span className="px-3 py-1 bg-blue-200 text-blue-800 text-sm rounded-full">
                                                                {sub.year}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <p className="text-4xl mb-2">📭</p>
                                            <p>No subjects assigned yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-gray-200 flex justify-end">
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        setViewingStaff(null);
                                    }}
                                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;

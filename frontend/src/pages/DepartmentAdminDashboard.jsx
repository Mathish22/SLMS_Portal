import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../api/config';
import { useNavigate } from 'react-router-dom';

const DepartmentAdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('staff');
    const [staff, setStaff] = useState([]);
    const [showStaffForm, setShowStaffForm] = useState(false);
    const [newStaff, setNewStaff] = useState({ staffName: '', username: '', password: '' });
    const [assignedSubjects, setAssignedSubjects] = useState([]); // For new staff creation

    // Edit State
    const [editingStaff, setEditingStaff] = useState(null);
    const [editForm, setEditForm] = useState({ staffName: '', staffId: '', staffDepartment: '', subjects: [] });

    // Subjects Declaration
    const [subjectYear, setSubjectYear] = useState('');
    const [subjectSemester, setSubjectSemester] = useState('');
    const [subjectEntry, setSubjectEntry] = useState([{ subjectCode: '', subjectName: '' }]);

    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    const years = ['I', 'II', 'III', 'IV'];
    const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const sections = ['A', 'B', 'C', 'D'];

    useEffect(() => {
        if (role !== 'department_admin') {
            navigate('/login');
            return;
        }
        if (activeTab === 'staff') {
            fetchStaff();
        }
    }, [activeTab, navigate, role]);

    const fetchStaff = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/auth/staff`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaff(response.data);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            await axios.post(`${BASE_URL}/auth/create-staff`, { ...newStaff, subjects: assignedSubjects }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Staff created successfully!');
            setNewStaff({ staffName: '', username: '', password: '' });
            setAssignedSubjects([]);
            setShowStaffForm(false);
            fetchStaff();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error creating staff');
        } finally {
            setIsLoading(false);
        }
    };

    // New Staff Subject Handlers
    const handleAddAssignment = () => {
        setAssignedSubjects([...assignedSubjects, { year: 'I', section: 'A', subjectCode: '', subjectName: '' }]);
    };

    const handleAssignmentChange = (index, field, value) => {
        const list = [...assignedSubjects];
        list[index][field] = value;
        setAssignedSubjects(list);
    };

    const handleRemoveAssignment = (index) => {
        const list = [...assignedSubjects];
        list.splice(index, 1);
        setAssignedSubjects(list);
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

    // Edit Handlers
    const handleEditClick = (s) => {
        setEditingStaff(s);
        setEditForm({
            staffName: s.staffName || '',
            staffId: s.staffId || '',
            staffDepartment: s.staffDepartment || '',
            subjects: s.subjects || []
        });
    };

    const handleEditAssignmentChange = (index, field, value) => {
        const list = [...editForm.subjects];
        list[index][field] = value;
        setEditForm({ ...editForm, subjects: list });
    };

    const handleAddEditAssignment = () => {
        setEditForm({
            ...editForm,
            subjects: [...editForm.subjects, { year: 'I', section: 'A', subjectCode: '', subjectName: '' }]
        });
    };

    const handleRemoveEditAssignment = (index) => {
        const list = [...editForm.subjects];
        list.splice(index, 1);
        setEditForm({ ...editForm, subjects: list });
    };

    const handleUpdateStaff = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.put(`${BASE_URL}/auth/staff/${editingStaff._id}`, editForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Staff updated successfully!');
            setEditingStaff(null);
            fetchStaff();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error updating staff');
        } finally {
            setIsLoading(false);
        }
    };

    // Subjects Logic (Declare)
    const handleAddSubjectRow = () => {
        setSubjectEntry([...subjectEntry, { subjectCode: '', subjectName: '' }]);
    };

    const handleRemoveSubjectRow = (index) => {
        const list = [...subjectEntry];
        list.splice(index, 1);
        setSubjectEntry(list);
    };

    const handleSubjectChange = (index, field, value) => {
        const list = [...subjectEntry];
        list[index][field] = value;
        setSubjectEntry(list);
    };

    const handleDeclareSubjects = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const ValidSubjects = subjectEntry.filter(s => s.subjectCode.trim() !== '' && s.subjectName.trim() !== '');
            if (ValidSubjects.length === 0) {
                setMessage('Please add at least one subject.');
                setIsLoading(false);
                return;
            }
            const payload = {
                year: subjectYear,
                semester: subjectSemester,
                subjects: ValidSubjects
            };
            await axios.post(`${BASE_URL}/subjects`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Subjects declared successfully!');
            setSubjectYear('');
            setSubjectSemester('');
            setSubjectEntry([{ subjectCode: '', subjectName: '' }]);
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error declaring subjects');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">🏛️ Department Admin Dashboard</h1>
                    <p className="text-gray-500">Manage your department staff and curriculum.</p>

                    <div className="flex space-x-4 mt-6 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('staff')}
                            className={`pb-2 px-4 text-sm font-medium transition-colors ${activeTab === 'staff' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Manage Staff
                        </button>
                        <button
                            onClick={() => setActiveTab('subjects')}
                            className={`pb-2 px-4 text-sm font-medium transition-colors ${activeTab === 'subjects' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Declare Subjects
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg mb-6 ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message}
                    </div>
                )}

                {/* STAFF TAB */}
                {activeTab === 'staff' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-700">Staff Members</h2>
                            <button
                                onClick={() => setShowStaffForm(!showStaffForm)}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow transition-all"
                            >
                                {showStaffForm ? 'Cancel' : '+ Add New Staff'}
                            </button>
                        </div>

                        {showStaffForm && (
                            <div className="bg-white p-6 rounded-xl shadow-md mb-6 animate-fade-in">
                                <h3 className="text-lg font-medium mb-4">Create New Staff</h3>
                                <form onSubmit={handleCreateStaff} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Staff Name"
                                        className="border p-2 rounded"
                                        value={newStaff.staffName}
                                        onChange={(e) => setNewStaff({ ...newStaff, staffName: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        className="border p-2 rounded"
                                        value={newStaff.username}
                                        onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        className="border p-2 rounded"
                                        value={newStaff.password}
                                        onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                        required
                                    />
                                    <div className="md:col-span-3">
                                        <h4 className="font-medium text-gray-700 mb-2">Teaching Assignments</h4>
                                        {assignedSubjects.map((subject, idx) => (
                                            <div key={idx} className="flex flex-wrap gap-2 mb-2 items-center bg-gray-50 p-2 rounded">
                                                <select
                                                    value={subject.year}
                                                    onChange={(e) => handleAssignmentChange(idx, 'year', e.target.value)}
                                                    className="border p-2 rounded w-20"
                                                >
                                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                                <select
                                                    value={subject.section}
                                                    onChange={(e) => handleAssignmentChange(idx, 'section', e.target.value)}
                                                    className="border p-2 rounded w-20"
                                                >
                                                    {sections.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                <input
                                                    type="text"
                                                    placeholder="Subject Code"
                                                    value={subject.subjectCode}
                                                    onChange={(e) => handleAssignmentChange(idx, 'subjectCode', e.target.value)}
                                                    className="border p-2 rounded flex-1 min-w-[100px]"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Subject Name"
                                                    value={subject.subjectName}
                                                    onChange={(e) => handleAssignmentChange(idx, 'subjectName', e.target.value)}
                                                    className="border p-2 rounded flex-[2] min-w-[150px]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveAssignment(idx)}
                                                    className="text-red-500 hover:text-red-700 px-2"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={handleAddAssignment}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-1"
                                        >
                                            + Add Subject Assignment
                                        </button>
                                    </div>
                                    <div className="md:col-span-3 md:flex md:justify-end mt-4">
                                        <button
                                            type="submit"
                                            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition shadow-md"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Creating...' : 'Create Staff Account'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-4 font-medium text-gray-600">Name</th>
                                        <th className="p-4 font-medium text-gray-600">Username</th>
                                        <th className="p-4 font-medium text-gray-600">Staff ID</th>
                                        <th className="p-4 font-medium text-gray-600 w-1/3">Subjects/Sections</th>
                                        <th className="p-4 font-medium text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {staff.map(s => (
                                        <tr key={s._id} className="hover:bg-gray-50">
                                            <td className="p-4">{s.staffName || '-'}</td>
                                            <td className="p-4">{s.username}</td>
                                            <td className="p-4 text-gray-500">{s.staffId}</td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {s.subjects && s.subjects.map((sub, i) => (
                                                        <span key={i} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                                            {sub.subjectCode} ({sub.year}-{sub.section})
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEditClick(s)}
                                                        className="text-blue-500 hover:underline"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStaff(s._id)}
                                                        className="text-red-500 hover:underline"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {staff.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-gray-500">No staff members found in your department.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {editingStaff && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-800">Edit Staff</h3>
                                <button onClick={() => setEditingStaff(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                            </div>
                            <form onSubmit={handleUpdateStaff} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Staff Name</label>
                                        <input
                                            type="text"
                                            value={editForm.staffName}
                                            onChange={(e) => setEditForm({ ...editForm, staffName: e.target.value })}
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-400 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID</label>
                                        <input
                                            type="text"
                                            value={editForm.staffId}
                                            onChange={(e) => setEditForm({ ...editForm, staffId: e.target.value })}
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-400 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Teaching Assignments</h4>
                                    {editForm.subjects.map((subject, idx) => (
                                        <div key={idx} className="flex flex-wrap gap-2 mb-2 items-center bg-gray-50 p-2 rounded">
                                            <select
                                                value={subject.year}
                                                onChange={(e) => handleEditAssignmentChange(idx, 'year', e.target.value)}
                                                className="border p-2 rounded w-20"
                                            >
                                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                            <select
                                                value={subject.section}
                                                onChange={(e) => handleEditAssignmentChange(idx, 'section', e.target.value)}
                                                className="border p-2 rounded w-20"
                                            >
                                                {sections.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="Subject Code"
                                                value={subject.subjectCode}
                                                onChange={(e) => handleEditAssignmentChange(idx, 'subjectCode', e.target.value)}
                                                className="border p-2 rounded flex-1 min-w-[100px]"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Subject Name"
                                                value={subject.subjectName}
                                                onChange={(e) => handleEditAssignmentChange(idx, 'subjectName', e.target.value)}
                                                className="border p-2 rounded flex-[2] min-w-[150px]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveEditAssignment(idx)}
                                                className="text-red-500 hover:text-red-700 px-2"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={handleAddEditAssignment}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-1"
                                    >
                                        + Add Subject Assignment
                                    </button>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingStaff(null)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded mr-2"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                        {isLoading ? 'Updating...' : 'Update Staff'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* SUBJECTS TAB */}
                {activeTab === 'subjects' && (
                    <div className="bg-white p-8 rounded-xl shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 mb-6">Declare Subjects Curriculum</h2>
                        <form onSubmit={handleDeclareSubjects}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                                    <select
                                        value={subjectYear}
                                        onChange={(e) => setSubjectYear(e.target.value)}
                                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                                        required
                                    >
                                        <option value="">Select Year</option>
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                                    <select
                                        value={subjectSemester}
                                        onChange={(e) => setSubjectSemester(e.target.value)}
                                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                                    >
                                        <option value="">Select Semester (Optional)</option>
                                        {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subjects List</label>
                                <div className="space-y-3">
                                    {subjectEntry.map((entry, idx) => (
                                        <div key={idx} className="flex gap-4">
                                            <input
                                                type="text"
                                                placeholder="Subject Code (e.g. CS8611)"
                                                className="flex-1 border p-3 rounded-lg outline-none focus:border-orange-400"
                                                value={entry.subjectCode}
                                                onChange={(e) => handleSubjectChange(idx, 'subjectCode', e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Subject Name"
                                                className="flex-[2] border p-3 rounded-lg outline-none focus:border-orange-400"
                                                value={entry.subjectName}
                                                onChange={(e) => handleSubjectChange(idx, 'subjectName', e.target.value)}
                                            />
                                            {subjectEntry.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSubjectRow(idx)}
                                                    className="text-red-500 hover:text-red-700 px-2"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddSubjectRow}
                                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    + Add Another Subject
                                </button>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-lg font-medium shadow hover:shadow-lg transition-all"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Saving...' : 'Declare Subjects'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DepartmentAdminDashboard;

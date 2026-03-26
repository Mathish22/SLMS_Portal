import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../api/config';
import { useNavigate } from 'react-router-dom';

const Attendance = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [advisingClass, setAdvisingClass] = useState(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [existingRecord, setExistingRecord] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const user = res.data;
            setCurrentUser(user);

            if (user.role !== 'staff' && user.role !== 'department_admin') {
                navigate('/login');
                return;
            }

            if (user.role === 'staff' && (!user.advisingSections || user.advisingSections.length === 0)) {
                setMessage({ type: 'error', text: 'You are not assigned as a Class Advisor for any section.' });
                setLoading(false);
                return;
            }

            // Default to the first advising section if available
            if (user.advisingSections && user.advisingSections.length > 0) {
                setAdvisingClass(user.advisingSections[0]);
            }
        } catch (error) {
            console.error('Failed to fetch user', error);
            setMessage({ type: 'error', text: 'Failed to authenticate user.' });
        } finally {
            setLoading(false);
        }
    };

    // Whenever date or advising class changes, fetch the students and any existing attendance
    useEffect(() => {
        if (advisingClass && currentUser) {
            fetchClassData();
        }
    }, [advisingClass, date]);

    const fetchClassData = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // 1. Fetch Students for this specific year and section
            const studentRes = await axios.get(`${BASE_URL}/auth/students`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Note: In an ideal backend, we'd add filters to the /students route.
            // For now, filtering on the client since dataset is relatively small per dept.
            let classStudents = studentRes.data.filter(
                s => s.year === advisingClass.year && s.section === advisingClass.section
            );

            // If the user doesn't have a department assigned on their advising section, fallback to user's main dept
            const dept = advisingClass.department || currentUser.staffDepartment || currentUser.department;

            if (dept) {
                classStudents = classStudents.filter(s => s.department === dept);
            }

            // Sort by Roll Number
            classStudents.sort((a, b) => (a.rollNo || '').localeCompare(b.rollNo || ''));
            setStudents(classStudents);

            // 2. Fetch Existing Attendance for this date
            try {
                const attRes = await axios.get(`${BASE_URL}/attendance`, {
                    params: {
                        date,
                        year: advisingClass.year,
                        section: advisingClass.section,
                        department: dept
                    },
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (attRes.data && attRes.data._id) {
                    setExistingRecord(attRes.data);

                    // Populate initial state from existing records
                    const currentRecords = {};
                    attRes.data.records.forEach(r => {
                        currentRecords[r.studentId._id || r.studentId] = {
                            status: r.status,
                            remarks: r.remarks || ''
                        };
                    });
                    setAttendanceRecords(currentRecords);
                    setMessage({ type: 'info', text: 'Loaded existing attendance record for this date.' });
                }
            } catch (attError) {
                // 404 means no record exists, which is fine
                setExistingRecord(null);

                // Initialize clean attendance mapping
                const initialRecords = {};
                classStudents.forEach(s => {
                    initialRecords[s._id] = { status: 'Present', remarks: '' };
                });
                setAttendanceRecords(initialRecords);
            }

        } catch (error) {
            console.error('Error fetching class data:', error);
            setMessage({ type: 'error', text: 'Failed to load class students.' });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId, status) => {
        setAttendanceRecords(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], status }
        }));
    };

    const handleRemarksChange = (studentId, remarks) => {
        setAttendanceRecords(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], remarks }
        }));
    };

    const markAllAs = (status) => {
        const updated = {};
        students.forEach(s => {
            updated[s._id] = {
                status,
                remarks: attendanceRecords[s._id]?.remarks || ''
            };
        });
        setAttendanceRecords(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        const dept = advisingClass.department || currentUser.staffDepartment || currentUser.department;

        const payload = {
            date,
            department: dept,
            year: advisingClass.year,
            section: advisingClass.section,
            records: Object.keys(attendanceRecords).map(studentId => ({
                studentId,
                status: attendanceRecords[studentId].status,
                remarks: attendanceRecords[studentId].remarks
            }))
        };

        try {
            if (existingRecord) {
                await axios.put(`${BASE_URL}/attendance/${existingRecord._id}`, { records: payload.records }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessage({ type: 'success', text: 'Attendance updated successfully!' });
            } else {
                const res = await axios.post(`${BASE_URL}/attendance`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setExistingRecord(res.data.attendance);
                setMessage({ type: 'success', text: 'Attendance recorded successfully!' });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Failed to save attendance.'
            });
        } finally {
            setSaving(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (loading && !currentUser) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-xl text-gray-600 animate-pulse">Loading Attendance Portal...</div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header & Controls */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <span>🗓️</span> Class Attendance
                            </h1>
                            <p className="text-gray-500 mt-1">Manage daily attendance records for your assigned sections</p>
                        </div>
                        <button
                            onClick={() => navigate('/staff/dashboard')}
                            className="text-blue-600 hover:text-blue-800 font-medium px-4 py-2 bg-blue-50 rounded-lg transition-colors"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>

                    {message.text && (
                        <div className={`p-4 rounded-lg mb-6 flex items-center ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                                'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                            <span className="mr-2">
                                {message.type === 'error' ? '⚠️' : message.type === 'success' ? '✓' : 'ℹ️'}
                            </span>
                            {message.text}
                        </div>
                    )}

                    {!currentUser?.advisingSections || currentUser.advisingSections.length === 0 ? (
                        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <h3 className="text-lg font-medium text-gray-700 mb-2">No Active Advising Assignments</h3>
                            <p className="text-gray-500">You must be granted "Class Advisor" status by a Department Admin to take attendance.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Class</label>
                                <select
                                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition-shadow"
                                    value={advisingClass ? JSON.stringify(advisingClass) : ''}
                                    onChange={(e) => setAdvisingClass(JSON.parse(e.target.value))}
                                >
                                    {currentUser.advisingSections.map((adv, idx) => (
                                        <option key={idx} value={JSON.stringify(adv)}>
                                            Year {adv.year} - Section {adv.section}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                                <input
                                    type="date"
                                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className="flex items-end">
                                <div className="w-full p-3 bg-white rounded-lg border border-gray-200 shadow-sm flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-500">Status:</span>
                                    {existingRecord ? (
                                        <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold">Record Exists (Editing)</span>
                                    ) : (
                                        <span className="bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded-full font-bold">New Record</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Attendance List */}
                {advisingClass && (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-wrap gap-4">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Student List ({students.length})
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={() => markAllAs('Present')} className="text-xs px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded font-medium transition-colors">All Present</button>
                                <button onClick={() => markAllAs('Absent')} className="text-xs px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded font-medium transition-colors">All Absent</button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-gray-500">Loading students...</div>
                        ) : students.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <span className="block text-4xl mb-3">📭</span>
                                No students found for Year {advisingClass.year} - Section {advisingClass.section}
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-100 border-y border-gray-200">
                                            <tr>
                                                <th className="p-4 font-semibold text-gray-600 text-sm">Roll No</th>
                                                <th className="p-4 font-semibold text-gray-600 text-sm">Student Name</th>
                                                <th className="p-4 font-semibold text-gray-600 text-sm min-w-[200px]">Attendance Status</th>
                                                <th className="p-4 font-semibold text-gray-600 text-sm w-1/3">Remarks (Optional)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {students.map((student) => (
                                                <tr key={student._id} className="hover:bg-blue-50/50 transition-colors">
                                                    <td className="p-4 font-mono text-sm text-gray-600 whitespace-nowrap">{student.rollNo || '-'}</td>
                                                    <td className="p-4 font-medium text-gray-800">{student.studentName || student.username}</td>
                                                    <td className="p-4">
                                                        <div className="flex gap-2">
                                                            {['Present', 'Absent', 'Leave'].map((status) => {
                                                                const isSelected = attendanceRecords[student._id]?.status === status;
                                                                const activeClass =
                                                                    status === 'Present' ? 'bg-green-500 text-white shadow-sm font-semibold' :
                                                                        status === 'Absent' ? 'bg-red-500 text-white shadow-sm font-semibold' :
                                                                            'bg-orange-400 text-white shadow-sm font-semibold';
                                                                const inactiveClass = 'bg-gray-100 text-gray-600 hover:bg-gray-200';

                                                                return (
                                                                    <button
                                                                        type="button"
                                                                        key={status}
                                                                        onClick={() => handleStatusChange(student._id, status)}
                                                                        className={`px-3 py-1.5 text-sm rounded-md transition-all ${isSelected ? activeClass : inactiveClass
                                                                            }`}
                                                                    >
                                                                        {status}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <input
                                                            type="text"
                                                            placeholder="Add note..."
                                                            className="w-full border-gray-300 border p-2 rounded text-sm focus:ring-1 focus:ring-green-400 outline-none"
                                                            value={attendanceRecords[student._id]?.remarks || ''}
                                                            onChange={(e) => handleRemarksChange(student._id, e.target.value)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg disabled:opacity-70 transition-colors flex items-center gap-2"
                                    >
                                        {saving ? (
                                            <><span>⏳</span> Saving Records...</>
                                        ) : (
                                            <><span>💾</span> {existingRecord ? 'Update Attendance' : 'Save Attendance'}</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Attendance;

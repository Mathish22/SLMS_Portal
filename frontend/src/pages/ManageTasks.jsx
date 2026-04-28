import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../api/config';
import { useNavigate } from 'react-router-dom';

const ManageTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        subjectIndex: '',
        dueDate: ''
    });
    const [subjects, setSubjects] = useState([]);
    const [sortOrder, setSortOrder] = useState('default');

    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML'];
    const years = ['I', 'II', 'III', 'IV'];

    useEffect(() => {
        fetchTasks();
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data && res.data.subjects) {
                setSubjects(res.data.subjects);
            }
        } catch (error) {
            console.error('Error fetching subjects', error);
        }
    };

    const fetchTasks = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/tasks`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(res.data);
        } catch (error) {
            console.error('Error fetching tasks', error);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        if (newTask.subjectIndex === '') {
            setMessage({ type: 'error', text: 'Please select a subject' });
            setIsLoading(false);
            return;
        }

        const selectedSubject = subjects[newTask.subjectIndex];

        try {
            await axios.post(`${BASE_URL}/tasks`, {
                title: newTask.title,
                description: newTask.description,
                year: selectedSubject.year,
                department: selectedSubject.department,
                subjectCode: selectedSubject.subjectCode,
                subjectName: selectedSubject.subjectName,
                dueDate: newTask.dueDate
            }, {
                headers: { 
                    Authorization: `Bearer ${token}`
                }
            });
            setMessage({ type: 'success', text: 'Task created successfully!' });
            setNewTask({ title: '', description: '', subjectIndex: '', dueDate: '' });
            setShowForm(false);
            fetchTasks();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Error creating task' });
        } finally {
            setIsLoading(false);
        }
    };

    const viewSubmissions = async (taskId) => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/tasks/${taskId}/submissions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubmissions(res.data);
            setSelectedTask(taskId);
        } catch (error) {
            alert('Error fetching submissions');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ← Back
                        </button>
                        <h1 className="text-3xl font-bold text-gray-800">✅ Manage Tasks</h1>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        {showForm ? 'Cancel' : '+ Create Task'}
                    </button>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {showForm && (
                    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input type="text" required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                    <input type="datetime-local" required value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <select required value={newTask.subjectIndex} onChange={e => setNewTask({...newTask, subjectIndex: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                                        <option value="">Select Subject</option>
                                        {subjects.map((s, idx) => (
                                            <option key={idx} value={idx}>{s.subjectName} ({s.subjectCode}) - {s.year} Year</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows="3"></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-medium">
                                    {isLoading ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Tasks List */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
                        {tasks.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No tasks created yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {tasks.map(task => (
                                    <div key={task._id} className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedTask === task._id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'}`} onClick={() => viewSubmissions(task._id)}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-800">{task.title}</h3>
                                                <p className="text-sm text-gray-600 mt-1">Target: {task.subjectName ? `${task.subjectName} (${task.subjectCode})` : `${task.year} Year, ${task.department}`}</p>
                                                <p className="text-sm text-gray-600">Due: {new Date(task.dueDate).toLocaleString()}</p>
                                            </div>
                                            {task.fileUrl && (
                                                <a href={task.fileUrl.startsWith('http') ? task.fileUrl : `${BASE_URL.replace('/api', '')}${task.fileUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm ml-2" onClick={e => e.stopPropagation()}>View File</a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submissions List */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Submissions</h2>
                            {selectedTask && submissions.length > 0 && (
                                <select 
                                    value={sortOrder} 
                                    onChange={(e) => setSortOrder(e.target.value)}
                                    className="border rounded px-2 py-1 text-sm bg-gray-50"
                                >
                                    <option value="default">Default Sort (Completed First)</option>
                                    <option value="nameAsc">Name (A-Z)</option>
                                    <option value="nameDesc">Name (Z-A)</option>
                                </select>
                            )}
                        </div>
                        {!selectedTask ? (
                            <p className="text-gray-500 text-center py-8">Select a task to view submissions.</p>
                        ) : (
                            <div>
                                {submissions.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No students found for this task's target group.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {[...submissions].sort((a, b) => {
                                            if (sortOrder === 'default') return 0; // Backend handles default sort
                                            const nameA = (a.student.studentName || a.student.username || '').toLowerCase();
                                            const nameB = (b.student.studentName || b.student.username || '').toLowerCase();
                                            if (sortOrder === 'nameAsc') return nameA.localeCompare(nameB);
                                            if (sortOrder === 'nameDesc') return nameB.localeCompare(nameA);
                                            return 0;
                                        }).map(sub => (
                                            <div key={sub._id} className={`border rounded-lg p-4 transition-colors ${sub.status === 'Completed' ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-gray-800">{sub.student.studentName || sub.student.username}</h4>
                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                                sub.status === 'Completed' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                                                            }`}>
                                                                {sub.status === 'Completed' ? 'Completed' : 'Pending'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 font-mono mt-1">{sub.student.rollNo || '-'} <span className="font-sans text-gray-400">|</span> {sub.student.department}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {sub.status === 'Completed' ? `Submitted at: ${new Date(sub.submittedAt).toLocaleString()}` : 'Not submitted yet'}
                                                        </p>
                                                    </div>
                                                    {sub.status === 'Completed' && sub.fileUrl ? (
                                                        <a href={sub.fileUrl.startsWith('http') ? sub.fileUrl : `${BASE_URL.replace('/api', '')}${sub.fileUrl}`} target="_blank" rel="noreferrer" className="bg-blue-500 text-white shadow-sm px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                                                            View Document
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm italic px-4 py-2">No Document</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageTasks;

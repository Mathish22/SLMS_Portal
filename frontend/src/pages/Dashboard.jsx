import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../api/config';
import { useNavigate } from 'react-router-dom';
import { FaFileAlt, FaEye, FaEdit, FaTrash } from 'react-icons/fa';

const Dashboard = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();


  // Helper to extract userId from token
  const getUserIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (e) {
      return null;
    }
  };

  // View states: 'landing', 'subjects', 'resources'
  const [viewState, setViewState] = useState('landing');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null); // To store the clicked subject
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // 1. Fetch User Details
        const userRes = await axios.get(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const currentUser = userRes.data;
        setUser(currentUser);

        // 2. Fetch Subjects based on student's details
        let fetchedSubjects = [];
        if (currentUser.role === 'student' && currentUser.department && currentUser.year) {
          const subjectRes = await axios.get(`${BASE_URL}/subjects`, {
            params: {
              department: currentUser.department,
              year: currentUser.year,
              // semester: '1' // Optional: if you have semester logic
            },
            headers: { Authorization: `Bearer ${token}` },
          });
          // API returns an array of Subject docs (per sem/year). Flatten or pick the right one.
          // Assuming the API returns a list of Subject documents, each containing a 'subjects' array.
          // We want to combine all subjects from these documents.
          if (subjectRes.data && Array.isArray(subjectRes.data)) {
            subjectRes.data.forEach(doc => {
              if (doc.subjects && Array.isArray(doc.subjects)) {
                fetchedSubjects = [...fetchedSubjects, ...doc.subjects];
              }
            });
          }
        }
        setSubjects(fetchedSubjects);

        // Set initial view state based on role
        if (currentUser.role === 'staff') {
          setViewState('all_resources');
        } else if (currentUser.role === 'admin') {
          navigate('/admin');
        } else if (currentUser.role === 'department_admin') {
          navigate('/dept-admin');
        }


        // 3. Fetch All Resources (we will filter client-side for now, or could filter server-side)
        const resourceRes = await axios.get(`${BASE_URL}/resources`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Sort resources
        const sortedResources = resourceRes.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setResources(sortedResources);

        setLoading(false);

      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load dashboard data.");
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Handle clicking a subject card
  const handleSubjectClick = (subject) => {
    setSelectedSubject(subject);
    setViewState('resources');
  };

  // Handle going back to subject list
  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setViewState('subjects');
  };

  // Handle going back to landing
  const handleBackToLanding = () => {
    setViewState('landing');
    setSelectedSubject(null);
  }

  const handleLandingOption = (option) => {
    if (option === 'resources') {
      setViewState('subjects');
    } else if (option === 'exam') {
      navigate('/exam');
    }
  };


  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${BASE_URL}/resources/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchResources();
        // eslint-disable-next-line no-unused-vars
      } catch (error) {
        alert('Error deleting resource');
      }
    }
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-orange-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center mt-10 text-red-600 font-medium">{error}</div>;
  }

  return (
    <div className="min-h-screen text-gray-800 px-4 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-orange-500 mb-2">Welcome to Academia Dashboard</h1>
          <p className="text-lg md:text-xl text-gray-700">Access and manage educational resources efficiently.</p>
        </div>



        {/* Content Area Based on View State */}

        {viewState === 'landing' && (
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 mt-10">
            {/* Resources Card */}
            <div
              onClick={() => handleLandingOption('resources')}
              className="bg-white p-10 rounded-xl shadow-lg border border-gray-200 cursor-pointer hover:shadow-2xl hover:border-orange-400 transition-all transform hover:-translate-y-2 w-full md:w-1/3 text-center group"
            >
              <div className="flex items-center justify-center w-20 h-20 bg-orange-100 text-orange-600 rounded-full mb-6 mx-auto group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <FaFileAlt size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Resources</h2>
              <p className="text-gray-600">Access your subject materials and documents.</p>
            </div>

            {/* Exam Card */}
            <div
              onClick={() => handleLandingOption('exam')}
              className="bg-white p-10 rounded-xl shadow-lg border border-gray-200 cursor-pointer hover:shadow-2xl hover:border-orange-400 transition-all transform hover:-translate-y-2 w-full md:w-1/3 text-center group"
            >
              <div className="flex items-center justify-center w-20 h-20 bg-blue-100 text-blue-600 rounded-full mb-6 mx-auto group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <FaEdit size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Exams</h2>
              <p className="text-gray-600">View exam schedules and details.</p>
            </div>
          </div>
        )}

        {viewState === 'resources' && selectedSubject && (
          /* Resource List View for Selected Subject */
          <div>
            <button
              onClick={handleBackToSubjects}
              className="mb-6 flex items-center text-orange-600 hover:text-orange-800 font-semibold"
            >
              &larr; Back to Subjects
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Resources for <span className="text-orange-600">{selectedSubject.subjectName}</span> ({selectedSubject.subjectCode})
            </h2>

            {resources.filter(r => r.subjectCode === selectedSubject.subjectCode).length > 0 ? (
              <ul className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                {resources
                  .filter(r => r.subjectCode === selectedSubject.subjectCode)
                  .map((resource) => (
                    <li
                      key={resource._id}
                      className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        <h5 className="text-lg font-semibold text-orange-600 mb-2 flex items-center">
                          <FaFileAlt className="mr-2" />
                          {resource.title}
                        </h5>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Type:</span> {resource.examType}
                        </p>
                        <p className="text-sm text-gray-600 mb-3">
                          <span className="font-medium">Year:</span> {resource.year}
                        </p>
                      </div>

                      <div className="mt-auto flex flex-wrap gap-2">
                        <a
                          href={resource.filePath.startsWith('http') ? resource.filePath : `${BASE_URL.replace('/api', '')}${resource.filePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-4 py-2 text-sm font-medium border border-orange-600 text-orange-600 rounded-md hover:bg-orange-600 hover:text-white transition-colors"
                        >
                          <FaEye className="mr-2" /> View
                        </a>
                        {['admin', 'faculty'].includes(localStorage.getItem('role')) && (
                          <button
                            onClick={() => navigate(`/edit-resource/${resource._id}`)}
                            className="flex items-center px-3 py-1 text-sm border border-blue-500 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition"
                          >
                            <FaEdit className="mr-1" /> Edit
                          </button>
                        )}

                        {(localStorage.getItem('role') === 'admin' ||
                          (localStorage.getItem('role') === 'staff' && resource.uploadedBy === getUserIdFromToken())) && (
                            <button
                              onClick={() => handleDelete(resource._id)}
                              className="flex items-center px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-600 hover:text-white transition"
                            >
                              <FaTrash className="mr-1" /> Delete
                            </button>
                          )}
                      </div>
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">No resources found for this subject.</p>
              </div>
            )}
          </div>
        )}

        {viewState === 'subjects' && (
          /* Subject Collection View */
          <div>
            <button
              onClick={handleBackToLanding}
              className="mb-6 flex items-center text-gray-500 hover:text-gray-700 font-semibold"
            >
              &larr; Back to Dashboard
            </button>

            <h2 className="text-center text-2xl font-semibold text-orange-500 mb-8">
              Your Subjects
            </h2>

            {subjects.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {subjects.map((subject, index) => (
                  <div
                    key={index}
                    onClick={() => handleSubjectClick(subject)}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-lg hover:border-orange-300 transition-all transform hover:-translate-y-1 group"
                  >
                    <div className="flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-lg mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <FaFileAlt size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3.5rem]">
                      {subject.subjectName}
                    </h3>
                    <p className="text-sm text-gray-500 font-mono bg-gray-100 inline-block px-2 py-1 rounded">
                      {subject.subjectCode}
                    </p>
                    <div className="mt-4 text-xs text-gray-400 text-right">
                      {resources.filter(r => r.subjectCode === subject.subjectCode).length} Resources
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-lg text-gray-500 mt-10">
                <p>No subjects assigned to your department/year.</p>
              </div>
            )}

          </div>
        )}

        {viewState === 'all_resources' && (
          /* All Resources View for Non-Students */
          <div>
            <h2 className="text-center text-2xl font-semibold text-orange-500 mb-6">
              All Available Resources
            </h2>

            {resources.length > 0 ? (
              <ul className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                {resources.map((resource) => (
                  <li
                    key={resource._id}
                    className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <h5 className="text-lg font-semibold text-orange-600 mb-2 flex items-center">
                        <FaFileAlt className="mr-2" />
                        {resource.title}
                      </h5>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Subject:</span> {resource.subjectCode}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Type:</span> {resource.examType}
                      </p>
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Year:</span> {resource.year}
                      </p>
                    </div>

                    <div className="mt-auto flex flex-wrap gap-2">
                      <a
                        href={resource.filePath.startsWith('http') ? resource.filePath : `${BASE_URL.replace('/api', '')}${resource.filePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 text-sm font-medium border border-orange-600 text-orange-600 rounded-md hover:bg-orange-600 hover:text-white transition-colors"
                      >
                        <FaEye className="mr-2" /> View
                      </a>
                      {['admin', 'faculty', 'department_admin'].includes(localStorage.getItem('role')) && (
                        <button
                          onClick={() => navigate(`/edit-resource/${resource._id}`)}
                          className="flex items-center px-3 py-1 text-sm border border-blue-500 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition"
                        >
                          <FaEdit className="mr-1" /> Edit
                        </button>
                      )}

                      {(localStorage.getItem('role') === 'admin' ||
                        (localStorage.getItem('role') === 'staff' && resource.uploadedBy === getUserIdFromToken())) && (
                          <button
                            onClick={() => handleDelete(resource._id)}
                            className="flex items-center px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-600 hover:text-white transition"
                          >
                            <FaTrash className="mr-1" /> Delete
                          </button>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">No resources available.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default Dashboard;
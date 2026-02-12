import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BASE_URL } from '../api/config';
import { FaCloudUploadAlt } from 'react-icons/fa';

const Upload = () => {
  const [formData, setFormData] = useState({
    title: '',
    year: '',
    subjectCode: '',
    examType: '',
    regulation: '',
    file: null,
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExamTypeSuggestions, setShowExamTypeSuggestions] = useState(false);
  const [showYearSuggestions, setShowYearSuggestions] = useState(false);
  const [assignedSubjects, setAssignedSubjects] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axios.get(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.subjects && res.data.subjects.length > 0) {
          setAssignedSubjects(res.data.subjects);
        }
      } catch (err) {
        console.error("Failed to fetch user details", err);
      }
    };
    fetchUser();
  }, []);

  const examTypeSuggestions = ['CAT-1', 'CAT-2', 'CAT-3', 'Model'];
  const regulationOptions = ['2021', '2022', '2023', '2024', '2025'];
  const currentYear = new Date().getFullYear();
  const yearSuggestions = [currentYear, currentYear - 1, currentYear - 2];

  // Close suggestions when clicking outside
  useEffect(() => {
    // No suggestions to close anymore
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setFormData({ ...formData, file: files[0] });
    } else if (name === 'subjectCode') {
      // Check if this is a selection from assigned subjects
      const selectedSubject = assignedSubjects.find(sub => sub.subjectCode === value);
      if (selectedSubject) {
        setFormData({ ...formData, subjectCode: value, year: selectedSubject.year || '' });
      } else {
        setFormData({ ...formData, subjectCode: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (name === 'examType') setShowExamTypeSuggestions(true);
    else if (name === 'year') setShowYearSuggestions(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to upload resources.');
      setLoading(false);
      return;
    }

    const { title, year, subjectCode, file } = formData;
    if (!title || !year || !subjectCode || !file) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('title', title);
    formDataToSend.append('year', year);
    formDataToSend.append('subjectCode', subjectCode);
    formDataToSend.append('file', file);
    // Optional fields
    if (formData.examType) formDataToSend.append('examType', formData.examType);
    if (formData.regulation) formDataToSend.append('regulation', formData.regulation);

    try {
      const response = await axios.post(`${BASE_URL}/resources/upload`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          // Let axios set the Content-Type with the boundary for FormData
        },
      });

      setMessage(response.data.message || 'Resource uploaded successfully!');
      setFormData({ title: '', year: '', subjectCode: '', examType: '', regulation: '', file: null });
      setShowExamTypeSuggestions(false);
      setShowYearSuggestions(false);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while uploading the resource.');
    } finally {
      setLoading(false);
    }
  };

  const selectSuggestion = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (field === 'examType') setShowExamTypeSuggestions(false);
    if (field === 'year') setShowYearSuggestions(false);
  };

  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(''), 4000);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  return (
    <div className="min-h-screen flex flex-col justify-between text-gray-800">
      {/* Header */}
      <section className="text-center py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-orange-500">
            <FaCloudUploadAlt className="inline-block mr-2" />
            Upload a Resource
          </h2>
          <p className="text-md text-gray-600 mb-6">
            Share your academic materials with the community.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="flex justify-center px-4">
        <div className="max-w-2xl w-full bg-gray-50 shadow-lg rounded-xl p-8 mb-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block font-semibold text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            {/* Year */}
            <div>
              <label htmlFor="year" className="block font-semibold text-gray-700 mb-1">
                Year
              </label>
              <input
                type="text"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="e.g. IV"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            {/* Subject Code */}
            <div>
              <label htmlFor="subjectCode" className="block font-semibold text-gray-700 mb-1">
                Subject Code
              </label>
              {assignedSubjects.length > 0 ? (
                <select
                  name="subjectCode"
                  value={formData.subjectCode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="">Select Assigned Subject</option>
                  {[...new Map(assignedSubjects.map(sub => [sub.subjectCode, sub])).values()].map((sub, idx) => (
                    <option key={idx} value={sub.subjectCode}>
                      {sub.subjectName} ({sub.subjectCode})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="subjectCode"
                  value={formData.subjectCode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Enter Subject Code"
                />
              )}
            </div>

            {/* File Upload */}
            <div>
              <label htmlFor="file" className="block font-semibold text-gray-700 mb-1">
                Upload File <FaCloudUploadAlt className="inline-block ml-1 text-orange-500" />
              </label>
              <input
                type="file"
                name="file"
                onChange={handleChange}
                required
                className="w-full py-2 border border-dashed border-gray-400 rounded-md text-sm"
              />
              {formData.file && <p className="text-sm text-gray-500 mt-1">{formData.file.name}</p>}
            </div>

            {/* Submit Button with Spinner */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-md transition duration-300 flex justify-center items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <FaCloudUploadAlt className="mr-2" />
                  Upload
                </>
              )}
            </button>

            {/* Message */}
            {(message || error) && (
              <p
                className={`text-center text-sm mt-3 font-medium ${(message && message.toLowerCase().includes('success')) || !error
                  ? 'text-green-600'
                  : 'text-red-600'
                  }`}
              >
                {message || error}
              </p>
            )}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t text-center">
        <div className="text-sm text-gray-600">
          © 2025 <span className="text-orange-500 font-medium">Academia Platform</span>. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Upload;
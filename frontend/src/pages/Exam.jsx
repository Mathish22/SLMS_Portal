import React from 'react';

const Exam = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-gray-800 bg-orange-50 px-4">
            <div className="max-w-4xl text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-orange-500 mb-6">Exam Section</h1>
                <p className="text-lg md:text-xl text-gray-700 mb-8">
                    This section is under construction. Please check back later for exam schedules and details.
                </p>
                <div className="p-10 bg-white rounded-lg shadow-lg border border-orange-200">
                    <p className="text-gray-500 italic">No exams scheduled at the moment.</p>
                </div>
            </div>
        </div>
    );
};

export default Exam;

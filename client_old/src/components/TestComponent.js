import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';

const TestComponent = () => {
  return (
    <div className="p-4 m-4 bg-green-100 rounded-lg shadow">
      <h2 className="text-xl font-bold flex items-center text-green-700">
        <FaCheckCircle className="mr-2" /> Setup Successful!
      </h2>
      <p className="mt-2 text-green-600">
        Your React, Tailwind CSS, and React Icons are working correctly!
      </p>
    </div>
  );
};

export default TestComponent; 
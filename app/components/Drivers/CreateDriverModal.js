'use client';

import { useState } from 'react';
import { useNotification } from '../UI/NotificationProvider';
import Button from '../UI/Button';

const CreateDriverModal = ({ isOpen, onClose, onDriverCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    shiftHours: '',
    pastWeekHours: ['0', '0', '0', '0', '0', '0', '0']
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHoursChange = (dayIndex, value) => {
    const newHours = [...formData.pastWeekHours];
    newHours[dayIndex] = value;
    setFormData(prev => ({
      ...prev,
      pastWeekHours: newHours
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.shiftHours) {
      showError('Validation Error', 'Please fill in driver name and shift hours');
      return;
    }

    const shiftHours = parseFloat(formData.shiftHours);
    if (isNaN(shiftHours) || shiftHours <= 0 || shiftHours > 24) {
      showError('Validation Error', 'Shift hours must be between 0 and 24');
      return;
    }

    const pastWeekHours = formData.pastWeekHours.map(h => parseFloat(h) || 0);
    if (pastWeekHours.some(h => h < 0 || h > 24)) {
      showError('Validation Error', 'All hours must be between 0 and 24');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          shiftHours: shiftHours,
          pastWeekHours: pastWeekHours
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create driver');
      }

      const result = await response.json();
      
      if (result.success) {
        showSuccess('Success', `Driver ${formData.name} created successfully`);
        onDriverCreated();
        handleClose();
      } else {
        throw new Error(result.message || 'Failed to create driver');
      }
    } catch (err) {
      console.error('Driver creation failed:', err);
      showError('Creation Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      shiftHours: '',
      pastWeekHours: ['0', '0', '0', '0', '0', '0', '0']
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Add New Driver
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Driver Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Enter driver name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Daily Shift Hours *
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="24"
                name="shiftHours"
                value={formData.shiftHours}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="8"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Past Week Hours (Sunday to Saturday)
              </label>
              <div className="grid grid-cols-7 gap-2">
                {dayNames.map((day, index) => (
                  <div key={index} className="text-center">
                    <label className="block text-xs text-gray-600 mb-1">
                      {day.slice(0, 3)}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={formData.pastWeekHours[index]}
                      onChange={(e) => handleHoursChange(index, e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 text-center"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter hours worked for each day of the past week
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                type="button"
                onClick={handleClose}
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
              >
                Create Driver
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateDriverModal;
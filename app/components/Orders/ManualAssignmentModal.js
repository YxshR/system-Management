'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '../UI/NotificationProvider';
import Button from '../UI/Button';
import LoadingSpinner from '../UI/LoadingSpinner';

const ManualAssignmentModal = ({ isOpen, onClose, order, onAssignmentComplete }) => {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingDrivers, setFetchingDrivers] = useState(false);
  const { showSuccess, showError } = useNotification();

  const fetchDrivers = async () => {
    try {
      setFetchingDrivers(true);
      const response = await fetch('/api/drivers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        const sortedDrivers = result.data.sort((a, b) => a.workloadPercentage - b.workloadPercentage);
        setDrivers(sortedDrivers);
      }
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
      showError('Error', 'Failed to load drivers');
    } finally {
      setFetchingDrivers(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedDriver) {
      showError('Error', 'Please select a driver');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/assignments/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          driverId: selectedDriver
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Assignment failed');
      }

      const result = await response.json();
      
      if (result.success) {
        showSuccess('Success', `Order #${order.id} assigned to driver successfully`);
        onAssignmentComplete();
        onClose();
      } else {
        throw new Error(result.message || 'Assignment failed');
      }
    } catch (err) {
      console.error('Assignment failed:', err);
      showError('Assignment Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDrivers();
      setSelectedDriver('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Manual Assignment
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {order && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Order Details</h4>
              <div className="text-sm text-gray-600 mt-1">
                <p>Order ID: #{order.id}</p>
                <p>Value: ₹{order.valueRs?.toLocaleString()}</p>
                <p>Delivery Time: {order.deliveryTimeMin} min</p>
                {order.route && (
                  <p>Distance: {order.route.distanceKm} km</p>
                )}
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Driver
            </label>
            {fetchingDrivers ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" text="Loading drivers..." />
              </div>
            ) : (
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a driver...</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} - {driver.workloadPercentage}% workload ({driver.remainingShiftHours.toFixed(1)}h remaining)
                  </option>
                ))}
              </select>
            )}
          </div>

          {drivers.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Driver Availability</h5>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {drivers.slice(0, 5).map((driver) => (
                  <div key={driver.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                    <span className="font-medium">{driver.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full ${
                        driver.workloadPercentage < 50 ? 'bg-green-100 text-green-800' :
                        driver.workloadPercentage < 80 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {driver.workloadPercentage}%
                      </span>
                      <span className="text-gray-500">{driver.remainingShiftHours.toFixed(1)}h left</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              variant="primary"
              loading={loading}
              disabled={!selectedDriver || fetchingDrivers}
            >
              Assign Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualAssignmentModal;
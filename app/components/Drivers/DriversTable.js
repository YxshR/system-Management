'use client';

import { useState, useEffect } from 'react';
import Table from '../UI/Table';
import Button from '../UI/Button';
import { useNotification } from '../UI/NotificationProvider';
import ErrorBoundary from '../ErrorHandling/ErrorBoundary';
import LoadingSpinner, { TableSkeleton } from '../UI/LoadingSpinner';
import ErrorMessage from '../UI/ErrorMessage';
import WeeklyHoursModal from './WeeklyHoursModal';
import CreateDriverModal from './CreateDriverModal';

const WorkloadIndicator = ({ percentage, remainingHours }) => {
  let colorClass = 'bg-green-100 text-green-800';
  let status = 'Available';
  
  if (percentage >= 90) {
    colorClass = 'bg-red-100 text-red-800';
    status = 'At Capacity';
  } else if (percentage >= 70) {
    colorClass = 'bg-yellow-100 text-yellow-800';
    status = 'Busy';
  } else if (percentage >= 40) {
    colorClass = 'bg-blue-100 text-blue-800';
    status = 'Active';
  }
  
  return (
    <div className="space-y-1">
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {status}
      </span>
      <div className="text-xs text-gray-500">
        {remainingHours.toFixed(1)}h remaining
      </div>
    </div>
  );
};

const PastWeekBreakdown = ({ pastWeekHours, onViewDetails }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Past Week Hours</div>
        <button
          onClick={onViewDetails}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          View Details
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {pastWeekHours.map((hours, index) => (
          <div key={index} className="text-center">
            <div className="text-gray-500 mb-1">{days[index]}</div>
            <div className={`px-1 py-0.5 rounded ${
              hours > 8 ? 'bg-red-100 text-red-800' :
              hours > 6 ? 'bg-yellow-100 text-yellow-800' :
              hours > 0 ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-500'
            }`}>
              {hours}h
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-500 pt-1 border-t">
        Total: {pastWeekHours.reduce((sum, h) => sum + h, 0)}h
      </div>
    </div>
  );
};

const WorkloadProgressBar = ({ percentage }) => {
  const getBarColor = (pct) => {
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 70) return 'bg-yellow-500';
    if (pct >= 40) return 'bg-blue-500';
    return 'bg-green-500';
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>Workload</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getBarColor(percentage)}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

const DriversLoading = () => (
  <LoadingSpinner 
    size="lg" 
    text="Loading drivers..." 
    centered={true}
  />
);

const EmptyState = () => (
  <div className="text-center py-12">
    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
    <h3 className="mt-2 text-sm font-medium text-gray-900">No drivers found</h3>
    <p className="mt-1 text-sm text-gray-500">No drivers are currently in the system.</p>
  </div>
);

function DriversTableContent() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWeeklyHours, setShowWeeklyHours] = useState(false);
  const [showCreateDriver, setShowCreateDriver] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const { showError } = useNotification();

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/drivers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setDrivers(result.data);
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
      const errorMessage = err.message || 'Network error occurred';
      setError(errorMessage);
      
      showError('Failed to Load Drivers', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewWeeklyHours = (driver) => {
    setSelectedDriver(driver);
    setShowWeeklyHours(true);
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  if (loading && drivers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
        <TableSkeleton rows={6} columns={6} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Failed to load drivers"
        message={error}
        onRetry={fetchDrivers}
        showDetails={true}
        error={error}
      />
    );
  }

  if (drivers.length === 0) {
    return <EmptyState />;
  }

  const totalDrivers = drivers.length;
  const availableDrivers = drivers.filter(d => d.workloadPercentage < 90).length;
  const averageWorkload = Math.round(
    drivers.reduce((sum, d) => sum + d.workloadPercentage, 0) / totalDrivers
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Drivers Overview</h3>
            <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
              <span>Total Drivers: <span className="font-medium text-gray-900">{totalDrivers}</span></span>
              <span>Available: <span className="font-medium text-green-600">{availableDrivers}</span></span>
              <span>Average Workload: <span className="font-medium text-blue-600">{averageWorkload}%</span></span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowCreateDriver(true)}
              variant="outline"
            >
              Add Driver
            </Button>
            <Button
              onClick={fetchDrivers}
              disabled={loading}
              variant="outline"
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Drivers Table */}
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Driver Name</Table.HeaderCell>
            <Table.HeaderCell>Shift Hours</Table.HeaderCell>
            <Table.HeaderCell>Past Week Hours</Table.HeaderCell>
            <Table.HeaderCell>Assignments</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {drivers.map((driver) => (
            <Table.Row key={driver.id}>
              <Table.Cell className="font-medium">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-800">
                        {driver.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                    <div className="text-xs text-gray-500">ID: {driver.id}</div>
                  </div>
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="text-sm font-medium">{driver.shiftHours}h</div>
                <div className="text-xs text-gray-500">per day</div>
              </Table.Cell>

              <Table.Cell>
                <PastWeekBreakdown 
                  pastWeekHours={driver.pastWeekHours} 
                  onViewDetails={() => handleViewWeeklyHours(driver)}
                />
              </Table.Cell>
              <Table.Cell>
                <div className="text-sm font-medium text-gray-900">{driver.assignmentCount} orders</div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      
      {loading && (
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner size="sm" text="Updating..." />
        </div>
      )}

      {/* Modals */}
      <WeeklyHoursModal
        isOpen={showWeeklyHours}
        onClose={() => setShowWeeklyHours(false)}
        driver={selectedDriver}
      />
      
      <CreateDriverModal
        isOpen={showCreateDriver}
        onClose={() => setShowCreateDriver(false)}
        onDriverCreated={fetchDrivers}
      />
    </div>
  );
}

export default function DriversTable() {
  return (
    <ErrorBoundary
      title="Drivers Table Error"
      message="The drivers table encountered an error while loading or processing data."
    >
      <DriversTableContent />
    </ErrorBoundary>
  );
}
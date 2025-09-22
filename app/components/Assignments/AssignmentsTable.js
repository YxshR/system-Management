'use client';

import { useState, useEffect } from 'react';
import Table from '../UI/Table';
import Button from '../UI/Button';
import { useNotification } from '../UI/NotificationProvider';
import ErrorBoundary from '../ErrorHandling/ErrorBoundary';
import LoadingSpinner, { TableSkeleton } from '../UI/LoadingSpinner';
import ErrorMessage from '../UI/ErrorMessage';

const AssignmentStatusIndicator = ({ assignedAt, estimatedCompletionTime }) => {
  const now = new Date();
  const isOverdue = estimatedCompletionTime && now > estimatedCompletionTime;
  const isRecent = assignedAt && (now - assignedAt) < (30 * 60 * 1000);

  if (isOverdue) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        Overdue
      </span>
    );
  }

  if (isRecent) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Recently Assigned
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      Active
    </span>
  );
};

const TrafficIndicator = ({ level }) => {
  const colors = {
    'LOW': 'bg-green-100 text-green-800',
    'MEDIUM': 'bg-yellow-100 text-yellow-800',
    'HIGH': 'bg-red-100 text-red-800'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[level] || 'bg-gray-100 text-gray-800'}`}>
      {level}
    </span>
  );
};

const formatTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};





const EmptyState = () => (
  <div className="text-center py-12">
    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
    <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
    <p className="mt-1 text-sm text-gray-500">No orders have been assigned to drivers yet.</p>
  </div>
);

function AssignmentsTableContent() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [sortField, setSortField] = useState('assignedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterDriver, setFilterDriver] = useState('');
  const { showError } = useNotification();

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/assignments', {
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
        setAssignments(result.data);
        setSummary(result.summary);
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
      const errorMessage = err.message || 'Network error occurred';
      setError(errorMessage);

      showError('Failed to Load Assignments', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedAssignments = assignments
    .filter(assignment => {
      if (!filterDriver) return true;
      return assignment.driver?.name.toLowerCase().includes(filterDriver.toLowerCase());
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'assignedAt':
          aValue = new Date(a.assignedAt);
          bValue = new Date(b.assignedAt);
          break;
        case 'driver':
          aValue = a.driver?.name || '';
          bValue = b.driver?.name || '';
          break;
        case 'order':
          aValue = a.order?.id || 0;
          bValue = b.order?.id || 0;
          break;

        case 'orderValue':
          aValue = a.order?.valueRs || 0;
          bValue = b.order?.valueRs || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const uniqueDrivers = [...new Set(assignments.map(a => a.driver?.name).filter(Boolean))].sort();

  if (loading && assignments.length === 0) {
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
        <TableSkeleton rows={8} columns={7} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load assignments"
        message={error}
        onRetry={fetchAssignments}
        showDetails={true}
        error={error}
      />
    );
  }

  if (assignments.length === 0) {
    return <EmptyState />;
  }

  const SortableHeader = ({ field, children }) => (
    <Table.HeaderCell
      className="cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          <svg
            className={`w-4 h-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </Table.HeaderCell>
  );

  return (
    <div className="space-y-6">
      {/* Summary and Controls */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Assignments Overview</h3>
            <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
              <span>Total Assignments: <span className="font-medium text-gray-900">{summary?.totalAssignments || 0}</span></span>
              <span>Drivers Used: <span className="font-medium text-green-600">{summary?.assignmentsByDriver?.length || 0}</span></span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={fetchAssignments}
              disabled={loading}
              variant="outline"
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-xs">
            <label htmlFor="driver-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Driver
            </label>
            <select
              id="driver-filter"
              value={filterDriver}
              onChange={(e) => setFilterDriver(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option className='text-black' value="">All Drivers</option>
              {uniqueDrivers.map(driver => (
                <option key={driver} value={driver}>{driver}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500">
            Showing {filteredAndSortedAssignments.length} of {assignments.length} assignments
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <Table>
        <Table.Header>
          <Table.Row>
            <SortableHeader field="assignedAt">Assignment Time</SortableHeader>
            <SortableHeader field="order">Order Details</SortableHeader>
            <SortableHeader field="driver">Driver</SortableHeader>
            <Table.HeaderCell>Route Information</Table.HeaderCell>

            <Table.HeaderCell>Status</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {filteredAndSortedAssignments.map((assignment) => (
            <Table.Row key={assignment.id}>
              <Table.Cell>
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    {formatTime(assignment.assignedAt)}
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {assignment.id}
                  </div>
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    Order #{assignment.order?.id}
                  </div>
                  <div className="text-xs text-gray-500">
                    Value: ₹{assignment.order?.valueRs?.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    Delivery: {assignment.order?.deliveryTimeMin}min
                  </div>
                </div>
              </Table.Cell>
              <Table.Cell>
                {assignment.driver ? (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-800">
                          {assignment.driver.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {assignment.driver.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Shift: {assignment.driver.shiftHours}h
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400">No driver data</span>
                )}
              </Table.Cell>
              <Table.Cell>
                {assignment.order?.route ? (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      Route #{assignment.order.route.id}
                    </div>
                    <div className="text-xs text-gray-500">
                      {assignment.order.route.distanceKm} km
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrafficIndicator level={assignment.order.route.trafficLevel} />
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400">No route data</span>
                )}
              </Table.Cell>

              <Table.Cell>
                <AssignmentStatusIndicator
                  assignedAt={assignment.assignedAt}
                  estimatedCompletionTime={assignment.estimatedCompletionTime}
                />
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
    </div>
  );
}

export default function AssignmentsTable() {
  return (
    <ErrorBoundary
      title="Assignments Table Error"
      message="The assignments table encountered an error while loading or processing data."
    >
      <AssignmentsTableContent />
    </ErrorBoundary>
  );
}
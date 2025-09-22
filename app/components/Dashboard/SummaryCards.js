'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '../UI/NotificationProvider';
import ErrorBoundary from '../ErrorHandling/ErrorBoundary';
import LoadingSpinner, { CardSkeleton } from '../UI/LoadingSpinner';
import ErrorMessage from '../UI/ErrorMessage';

const OrdersIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PendingIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TimeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const AssignmentIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

function SummaryCardsContent() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showError } = useNotification();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/stats', {
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
        setStats(result.data);
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      const errorMessage = err.message || 'Network error occurred';
      setError(errorMessage);
      
      // Show error notification
      showError('Failed to Load Dashboard Stats', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return <CardSkeleton count={4} />;
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Failed to load dashboard statistics"
        message={error}
        onRetry={fetchStats}
        showDetails={true}
        error={error}
        className="mb-8"
      />
    );
  }

  const cards = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: OrdersIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'All orders in system'
    },
    {
      title: 'Pending Assignments',
      value: stats?.pendingAssignments || 0,
      icon: PendingIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Orders awaiting assignment'
    },
    {
      title: 'Avg Delivery Time',
      value: `${stats?.averageDeliveryTime || 0} min`,
      icon: TimeIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Average estimated time'
    },
    {
      title: 'Assignment Rate',
      value: `${stats?.assignmentRate || 0}%`,
      icon: AssignmentIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Orders successfully assigned'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${card.bgColor} p-3 rounded-md`}>
                <card.icon className={`${card.color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {card.title}
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {card.value}
                  </dd>
                  <dd className="text-xs text-gray-400 mt-1">
                    {card.description}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          {loading && (
            <div className="bg-gray-50 px-5 py-2">
              <div className="flex items-center justify-center">
                <LoadingSpinner size="xs" />
                <span className="ml-2 text-xs text-gray-500">Updating...</span>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {stats?.lastUpdated && (
        <div className="col-span-full">
          <div className="flex items-center justify-center space-x-4">
            <p className="text-xs text-gray-500">
              Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}
            </p>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SummaryCards() {
  return (
    <ErrorBoundary
      title="Dashboard Cards Error"
      message="The dashboard summary cards encountered an error while loading."
    >
      <SummaryCardsContent />
    </ErrorBoundary>
  );
}
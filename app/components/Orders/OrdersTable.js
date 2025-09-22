'use client';

import { useState, useEffect } from 'react';
import Table from '../UI/Table';
import Button from '../UI/Button';
import { useNotification } from '../UI/NotificationProvider';
import ErrorBoundary from '../ErrorHandling/ErrorBoundary';
import LoadingSpinner, { TableSkeleton } from '../UI/LoadingSpinner';
import ErrorMessage from '../UI/ErrorMessage';
import ManualAssignmentModal from './ManualAssignmentModal';
import CreateOrderModal from './CreateOrderModal';

const StatusBadge = ({ status, isAssigned }) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  if (isAssigned) {
    return (
      <span className={`${baseClasses} bg-green-100 text-green-800`}>
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Assigned
      </span>
    );
  } else {
    return (
      <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        Unassigned
      </span>
    );
  }
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

const OrdersLoading = () => (
  <LoadingSpinner 
    size="lg" 
    text="Loading orders..." 
    centered={true}
  />
);

const EmptyState = () => (
  <div className="text-center py-12">
    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
    <p className="mt-1 text-sm text-gray-500">No orders are currently in the system.</p>
  </div>
);

function OrdersTableContent() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState(null);
  const [summary, setSummary] = useState(null);
  const [showManualAssignment, setShowManualAssignment] = useState(false);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [trafficFilter, setTrafficFilter] = useState('');
  const { showSuccess, showError, showInfo } = useNotification();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/orders', {
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
        setOrders(result.data);
        setSummary(result.summary);
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    try {
      setAssigning(true);
      setAssignmentMessage(null);
      
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxOrdersPerRun: 100,
          dryRun: false,
          forceReassign: false
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const assignedCount = result.summary?.totalOrdersAssigned || 0;
        const processedCount = result.summary?.totalOrdersProcessed || 0;
        
        if (assignedCount > 0) {
          showSuccess(
            'Assignment Successful',
            `Successfully assigned ${assignedCount} out of ${processedCount} orders to drivers.`
          );
          setAssignmentMessage({
            type: 'success',
            message: `Successfully assigned ${assignedCount} out of ${processedCount} orders to drivers.`
          });
        } else {
          showInfo(
            'No Assignments Made',
            result.message || 'All orders may already be assigned.'
          );
          setAssignmentMessage({
            type: 'info',
            message: result.message || 'No orders were assigned. All orders may already be assigned.'
          });
        }
        
        await fetchOrders();
      } else {
        throw new Error(result.message || 'Assignment failed');
      }
    } catch (err) {
      console.error('Failed to assign orders:', err);
      const errorMessage = err.message || 'Failed to assign orders';
      
      showError('Assignment Failed', errorMessage);
      
      setAssignmentMessage({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleManualAssign = (order) => {
    setSelectedOrder(order);
    setShowManualAssignment(true);
  };

  const handleAssignmentComplete = () => {
    fetchOrders();
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedOrders = orders
    .filter(order => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          order.id.toString().includes(searchLower) ||
          order.valueRs.toString().includes(searchLower) ||
          (order.assignment?.driver?.name || '').toLowerCase().includes(searchLower) ||
          (order.route?.id || '').toString().includes(searchLower);
        
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (statusFilter) {
        if (statusFilter === 'assigned' && !order.isAssigned) return false;
        if (statusFilter === 'unassigned' && order.isAssigned) return false;
      }
      
      // Traffic filter
      if (trafficFilter && order.route?.trafficLevel !== trafficFilter) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'value':
          aValue = a.valueRs;
          bValue = b.valueRs;
          break;
        case 'deliveryTime':
          aValue = a.deliveryTimeMin;
          bValue = b.deliveryTimeMin;
          break;
        case 'driver':
          aValue = a.assignment?.driver?.name || '';
          bValue = b.assignment?.driver?.name || '';
          break;
        case 'status':
          aValue = a.isAssigned ? 1 : 0;
          bValue = b.isAssigned ? 1 : 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (assignmentMessage) {
      const timer = setTimeout(() => {
        setAssignmentMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [assignmentMessage]);

  if (loading && orders.length === 0) {
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
        <TableSkeleton rows={8} columns={6} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Failed to load orders"
        message={error}
        onRetry={fetchOrders}
        showDetails={true}
        error={error}
      />
    );
  }

  if (orders.length === 0) {
    return <EmptyState />;
  }

  const unassignedCount = summary?.unassignedOrders || 0;

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
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Orders Overview</h3>
            <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
              <span>Total Orders: <span className="font-medium text-gray-900">{summary?.totalOrders || 0}</span></span>
              <span>Assigned: <span className="font-medium text-green-600">{summary?.assignedOrders || 0}</span></span>
              <span>Unassigned: <span className="font-medium text-yellow-600">{unassignedCount}</span></span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowCreateOrder(true)}
              variant="outline"
            >
              Create Order
            </Button>
            <Button
              onClick={fetchOrders}
              disabled={loading}
              variant="outline"
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              onClick={handleAutoAssign}
              disabled={assigning || unassignedCount === 0}
              loading={assigning}
              variant="primary"
            >
              Auto Assign All ({unassignedCount})
            </Button>
          </div>
        </div>
        
        {assignmentMessage && (
          <div className={`mt-4 p-4 rounded-md ${
            assignmentMessage.type === 'success' ? 'bg-green-50 border border-green-200' :
            assignmentMessage.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {assignmentMessage.type === 'success' && (
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {assignmentMessage.type === 'error' && (
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {assignmentMessage.type === 'info' && (
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  assignmentMessage.type === 'success' ? 'text-green-800' :
                  assignmentMessage.type === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {assignmentMessage.message}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Filters and Search */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search-orders" className="block text-sm font-medium text-gray-700 mb-1">
              Search Orders
            </label>
            <div className="relative">
              <input
                id="search-orders"
                type="text"
                placeholder="Search by ID, value, driver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
            >
              <option value="">All Status</option>
              <option value="assigned" className="text-gray-900">Assigned</option>
              <option value="unassigned" className="text-gray-900">Unassigned</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="traffic-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Traffic
            </label>
            <select
              id="traffic-filter"
              value={trafficFilter}
              onChange={(e) => setTrafficFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
            >
              <option value="">All Traffic Levels</option>
              <option value="LOW" className="text-gray-900">Low Traffic</option>
              <option value="MEDIUM" className="text-gray-900">Medium Traffic</option>
              <option value="HIGH" className="text-gray-900">High Traffic</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="text-sm text-gray-500">
              Showing {filteredAndSortedOrders.length} of {orders.length} orders
            </div>
          </div>
        </div>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <SortableHeader field="id">Order ID</SortableHeader>
            <SortableHeader field="value">Value (Rs)</SortableHeader>
            <Table.HeaderCell>Route Info</Table.HeaderCell>
            <SortableHeader field="deliveryTime">Delivery Time</SortableHeader>
            <SortableHeader field="status">Status</SortableHeader>
            <SortableHeader field="driver">Assigned Driver</SortableHeader>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {filteredAndSortedOrders.map((order) => (
            <Table.Row key={order.id} className={order.isAssigned ? 'bg-green-50' : 'bg-yellow-50'}>
              <Table.Cell className="font-medium">
                #{order.id}
              </Table.Cell>
              <Table.Cell>
                ₹{order.valueRs.toLocaleString()}
              </Table.Cell>
              <Table.Cell>
                {order.route ? (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Route #{order.route.id}</div>
                    <div className="text-xs text-gray-500">
                      {order.route.distanceKm} km • <TrafficIndicator level={order.route.trafficLevel} />
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400">No route data</span>
                )}
              </Table.Cell>
              <Table.Cell>
                <div className="space-y-1">
                  <div className="text-sm font-medium">{order.deliveryTimeMin} min</div>
                  {order.route && (
                    <div className="text-xs text-gray-500">
                      Est: {order.estimatedDeliveryTime} min
                    </div>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                <StatusBadge status={order.assignmentStatus} isAssigned={order.isAssigned} />
              </Table.Cell>
              <Table.Cell>
                {order.assignment ? (
                  <div className="text-sm font-medium text-gray-900">{order.assignment.driver.name}</div>
                ) : (
                  <span className="text-gray-400">Not assigned</span>
                )}
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center space-x-2">
                  {!order.isAssigned && (
                    <Button
                      onClick={() => handleManualAssign(order)}
                      variant="outline"
                      size="sm"
                    >
                      Assign
                    </Button>
                  )}
                  {order.isAssigned && (
                    <span className="text-xs text-green-600 font-medium">Assigned</span>
                  )}
                </div>
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

      <ManualAssignmentModal
        isOpen={showManualAssignment}
        onClose={() => setShowManualAssignment(false)}
        order={selectedOrder}
        onAssignmentComplete={handleAssignmentComplete}
      />
      
      <CreateOrderModal
        isOpen={showCreateOrder}
        onClose={() => setShowCreateOrder(false)}
        onOrderCreated={handleAssignmentComplete}
      />
    </div>
  );
}

export default function OrdersTable() {
  return (
    <ErrorBoundary
      title="Orders Table Error"
      message="The orders table encountered an error while loading or processing data."
    >
      <OrdersTableContent />
    </ErrorBoundary>
  );
}
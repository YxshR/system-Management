import Header from '../components/Layout/Header';
import SummaryCards from '../components/Dashboard/SummaryCards';

export default function Dashboard() {
  return (
    <div>
      <Header 
        title="Dashboard" 
        subtitle="Overview of delivery operations and system status"
      />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <SummaryCards />
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a 
                href="/orders" 
                className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
              >
                <div className="flex-shrink-0">
                  <span className="text-2xl">📦</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">View Orders</p>
                  <p className="text-xs text-blue-700">Manage all orders</p>
                </div>
              </a>
              
              <a 
                href="/drivers" 
                className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
              >
                <div className="flex-shrink-0">
                  <span className="text-2xl">🚚</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">View Drivers</p>
                  <p className="text-xs text-green-700">Check driver workload</p>
                </div>
              </a>
              
              <a 
                href="/assignments" 
                className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200"
              >
                <div className="flex-shrink-0">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">Assignments</p>
                  <p className="text-xs text-purple-700">View assignments</p>
                </div>
              </a>
              
              <a 
                href="/assignments"
                className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors duration-200"
              >
                <div className="flex-shrink-0">
                  <span className="text-2xl">⚡</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-900">Auto Assign</p>
                  <p className="text-xs text-orange-700">Assign all orders</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
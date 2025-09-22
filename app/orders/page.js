import Header from '../components/Layout/Header';
import OrdersTable from '../components/Orders/OrdersTable';

export default function Orders() {
  return (
    <div>
      <Header 
        title="Orders" 
        subtitle="Manage delivery orders and assignment status"
      />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <OrdersTable />
        </div>
      </div>
    </div>
  );
}
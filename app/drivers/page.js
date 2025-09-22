import Header from '../components/Layout/Header';
import DriversTable from '../components/Drivers/DriversTable';

export default function Drivers() {
  return (
    <div>
      <Header 
        title="Drivers" 
        subtitle="View driver information and workload statistics"
      />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <DriversTable />
        </div>
      </div>
    </div>
  );
}
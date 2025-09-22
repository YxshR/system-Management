import Header from '../components/Layout/Header';
import AssignmentsTable from '../components/Assignments/AssignmentsTable';

export default function Assignments() {
  return (
    <div>
      <Header 
        title="Assignments" 
        subtitle="View order-to-driver assignments and relationships"
      />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <AssignmentsTable />
        </div>
      </div>
    </div>
  );
}
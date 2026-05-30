import { useSelector } from 'react-redux';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';

const VendorDashboard = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="dashboard-page">
      <div className="page-container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Vendor Panel</h1>
            <p className="dashboard-subtitle">
              Logged in as <strong>{user?.name}</strong> — {user?.businessName || 'Vendor'}
            </p>
          </div>
        </div>

        <div className="empty-state fade-in">
          <HiOutlineOfficeBuilding className="empty-state-icon" />
          <h3 className="empty-state-title">Store Setup Pending</h3>
          <p className="empty-state-text">
            Product management and store settings will be available once the
            Store Management module (Member 2) is integrated.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;

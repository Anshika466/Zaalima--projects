import { useSelector } from 'react-redux';
import { HiOutlineShoppingBag } from 'react-icons/hi';

const CustomerHome = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="dashboard-page">
      <div className="page-container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Welcome, {user?.name}!</h1>
            <p className="dashboard-subtitle">
              You are logged in as a <strong>Customer</strong>.
            </p>
          </div>
        </div>

        <div className="empty-state fade-in">
          <HiOutlineShoppingBag className="empty-state-icon" />
          <h3 className="empty-state-title">Store Coming Soon</h3>
          <p className="empty-state-text">
            The storefront and product listings will be available once the Store
            Management module (Member 2) is integrated.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;

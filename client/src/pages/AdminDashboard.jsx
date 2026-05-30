import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineBan,
  HiOutlineRefresh,
} from 'react-icons/hi';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, usersRes] = await Promise.all([
        api.get('/admin/vendors/pending'),
        api.get('/admin/users'),
      ]);
      setPendingVendors(pendingRes.data.vendors || []);
      setAllUsers(usersRes.data.users || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const res = await api.patch(`/admin/vendors/${id}/approve`);
      toast.success(res.data.message);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (id) => {
    setActionLoading(id);
    try {
      const res = await api.patch(`/admin/users/${id}/suspend`);
      toast.success(res.data.message);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (id) => {
    setActionLoading(id);
    try {
      const res = await api.patch(`/admin/users/${id}/activate`);
      toast.success(res.data.message);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      active: 'status-active',
      pending: 'status-pending',
      suspended: 'status-suspended',
    };
    return `status-badge ${map[status] || ''}`;
  };

  return (
    <div className="dashboard-page">
      <div className="page-container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Admin Panel</h1>
            <p className="dashboard-subtitle">
              Logged in as <strong>{user?.name}</strong> — Super Admin
            </p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={fetchData}>
            <HiOutlineRefresh />
            <span>Refresh</span>
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1 mb-4">
          <button
            className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Vendors ({pendingVendors.length})
          </button>
          <button
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setActiveTab('users')}
          >
            <HiOutlineUserGroup />
            All Users ({allUsers.length})
          </button>
        </div>

        {loading ? (
          <div className="loading-overlay">
            <div className="spinner spinner-dark"></div>
            <span>Loading...</span>
          </div>
        ) : (
          <>
            {/* Pending Vendors Tab */}
            {activeTab === 'pending' && (
              <div className="table-container fade-in">
                <div className="table-header">
                  <h3 className="table-title">Pending Vendor Applications</h3>
                </div>
                {pendingVendors.length === 0 ? (
                  <div className="empty-state">
                    <HiOutlineCheckCircle className="empty-state-icon" />
                    <h3 className="empty-state-title">All Caught Up</h3>
                    <p className="empty-state-text">No pending vendor applications.</p>
                  </div>
                ) : (
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Business Name</th>
                          <th>Owner</th>
                          <th>Email</th>
                          <th>Applied On</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingVendors.map((vendor) => (
                          <tr key={vendor._id}>
                            <td><strong>{vendor.businessName}</strong></td>
                            <td>{vendor.name}</td>
                            <td>{vendor.email}</td>
                            <td>{new Date(vendor.createdAt).toLocaleDateString()}</td>
                            <td>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleApprove(vendor._id)}
                                disabled={actionLoading === vendor._id}
                              >
                                {actionLoading === vendor._id ? (
                                  <span className="spinner spinner-sm"></span>
                                ) : (
                                  <>
                                    <HiOutlineCheckCircle />
                                    <span>Approve</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* All Users Tab */}
            {activeTab === 'users' && (
              <div className="table-container fade-in">
                <div className="table-header">
                  <h3 className="table-title">All Users</h3>
                </div>
                {allUsers.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-state-text">No users found.</p>
                  </div>
                ) : (
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Joined</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.map((u) => (
                          <tr key={u._id}>
                            <td><strong>{u.name}</strong></td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`role-badge ${
                                u.role === 'superadmin' ? 'role-badge-admin' :
                                u.role === 'vendor' ? 'role-badge-vendor' :
                                'role-badge-customer'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td><span className={getStatusBadge(u.status)}>{u.status}</span></td>
                            <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td>
                              {u.role !== 'superadmin' && (
                                <>
                                  {u.status === 'active' && (
                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={() => handleSuspend(u._id)}
                                      disabled={actionLoading === u._id}
                                    >
                                      {actionLoading === u._id ? (
                                        <span className="spinner spinner-sm"></span>
                                      ) : (
                                        <>
                                          <HiOutlineBan />
                                          <span>Suspend</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                  {(u.status === 'suspended' || u.status === 'pending') && (
                                    <button
                                      className="btn btn-success btn-sm"
                                      onClick={() => u.status === 'pending' ? handleApprove(u._id) : handleActivate(u._id)}
                                      disabled={actionLoading === u._id}
                                    >
                                      {actionLoading === u._id ? (
                                        <span className="spinner spinner-sm"></span>
                                      ) : (
                                        <>
                                          <HiOutlineCheckCircle />
                                          <span>{u.status === 'pending' ? 'Approve' : 'Activate'}</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

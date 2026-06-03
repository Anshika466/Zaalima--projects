import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineBan,
  HiOutlineRefresh,
  HiOutlineCurrencyRupee,
  HiOutlineShoppingBag,
  HiOutlineOfficeBuilding,
  HiOutlineClock,
} from 'react-icons/hi';

// Simple inline bar chart — no external dependency
const SimpleBarChart = ({ data }) => {
  if (!data || !data.length) return null;
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '200px', padding: '0 8px' }}>
      {data.map((d) => (
        <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)', fontWeight: 600 }}>₹{(d.revenue/1000).toFixed(0)}k</span>
          <div
            style={{
              width: '100%',
              background: 'var(--primary)',
              borderRadius: '4px 4px 0 0',
              height: `${Math.max((d.revenue / maxRevenue) * 140, 4)}px`,
              transition: 'height 0.4s ease',
            }}
            title={`Revenue: ₹${d.revenue} | Orders: ${d.orders}`}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 500 }}>{d.day}</span>
        </div>
      ))}
    </div>
  );
};

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, usersRes, analyticsRes] = await Promise.all([
        api.get('/admin/vendors/pending'),
        api.get('/admin/users'),
        api.get('/analytics/admin'),
      ]);
      setPendingVendors(pendingRes.data.vendors || []);
      setAllUsers(usersRes.data.users || []);
      setAnalytics(analyticsRes.data || null);
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
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
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
            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <div className="fade-in">
                {/* Stats Grid */}
                <div className="stats-grid">
                  <div className="stat-card primary">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p className="stat-label">Total Revenue</p>
                        <p className="stat-value">
                          ₹{(analytics?.totalRevenue || 0).toLocaleString()}
                        </p>
                      </div>
                      <HiOutlineCurrencyRupee style={{ fontSize: '1.75rem', color: 'var(--primary)', opacity: 0.7 }} />
                    </div>
                  </div>
                  <div className="stat-card success">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p className="stat-label">Total Orders</p>
                        <p className="stat-value">{analytics?.totalOrders || 0}</p>
                      </div>
                      <HiOutlineShoppingBag style={{ fontSize: '1.75rem', color: 'var(--accent)', opacity: 0.7 }} />
                    </div>
                  </div>
                  <div className="stat-card warning">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p className="stat-label">Active Vendors</p>
                        <p className="stat-value">{analytics?.totalVendors || 0}</p>
                      </div>
                      <HiOutlineOfficeBuilding style={{ fontSize: '1.75rem', color: 'var(--warning)', opacity: 0.7 }} />
                    </div>
                  </div>
                  <div className="stat-card danger">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p className="stat-label">Pending Approvals</p>
                        <p className="stat-value">{analytics?.pendingVendors || pendingVendors.length}</p>
                      </div>
                      <HiOutlineClock style={{ fontSize: '1.75rem', color: 'var(--danger)', opacity: 0.7 }} />
                    </div>
                  </div>
                </div>

                {/* Daily Sales Chart */}
                {analytics?.dailySales?.length > 0 && (
                  <div className="table-container" style={{ padding: '1.25rem' }}>
                    <h3 className="table-title" style={{ marginBottom: '1.25rem' }}>
                      📊 Daily Sales — Last 5 Days
                    </h3>
                    <SimpleBarChart data={analytics.dailySales} />
                  </div>
                )}
              </div>
            )}

            {/* ── PENDING VENDORS TAB ── */}
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

            {/* ── ALL USERS TAB ── */}
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
                                      onClick={() =>
                                        u.status === 'pending'
                                          ? handleApprove(u._id)
                                          : handleActivate(u._id)
                                      }
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

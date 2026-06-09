import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineUserGroup, HiOutlineCheckCircle, HiOutlineBan, HiOutlineRefresh,
  HiOutlineCurrencyRupee, HiOutlineShoppingBag, HiOutlineOfficeBuilding,
  HiOutlineClock, HiOutlineTrash, HiOutlineCollection, HiOutlineSearch, HiOutlineDownload, HiOutlinePlus,
} from 'react-icons/hi';

// CSV helper
const downloadCSV = (filename, rows, headers) => {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const SimpleBarChart = ({ data }) => {
  if (!data || !data.length) return null;
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '180px', padding: '0 8px' }}>
      {data.map((d) => (
        <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)', fontWeight: 600 }}>₹{(d.revenue/1000).toFixed(0)}k</span>
          <div style={{ width: '100%', background: 'var(--primary)', borderRadius: '4px 4px 0 0', height: `${Math.max((d.revenue / maxRevenue) * 130, 4)}px`, transition: 'height 0.4s ease' }} title={`₹${d.revenue} | ${d.orders} orders`} />
          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 500 }}>{d.day}</span>
        </div>
      ))}
    </div>
  );
};

const ORDER_STATUSES = ['placed','processing','shipped','delivered','cancelled'];
const PAYMENT_STATUSES = ['pending','paid','failed','refunded'];

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [orderStatusUpdate, setOrderStatusUpdate] = useState({});
  const [productSearch, setProductSearch] = useState('');
  // Coupons state
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'percentage', discountValue: '', minOrderValue: '', maxUses: '', expiresAt: '' });
  const [couponLoading, setCouponLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, usersRes, analyticsRes, ordersRes, productsRes, couponsRes] = await Promise.all([
        api.get('/admin/vendors/pending'),
        api.get('/admin/users'),
        api.get('/analytics/admin'),
        api.get('/admin/orders'),
        api.get('/admin/products'),
        api.get('/coupons'),
      ]);
      setPendingVendors(pendingRes.data.vendors || []);
      setAllUsers(usersRes.data.users || []);
      setAnalytics(analyticsRes.data || null);
      setAllOrders(ordersRes.data.orders || []);
      setAllProducts(productsRes.data.products || []);
      setCoupons(couponsRes.data.coupons || []);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const res = await api.patch(`/admin/vendors/${id}/approve`);
      toast.success(res.data.message);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setActionLoading(null); }
  };

  const handleSuspend = async (id) => {
    setActionLoading(id);
    try {
      const res = await api.patch(`/admin/users/${id}/suspend`);
      toast.success(res.data.message);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setActionLoading(null); }
  };

  const handleActivate = async (id) => {
    setActionLoading(id);
    try {
      const res = await api.patch(`/admin/users/${id}/activate`);
      toast.success(res.data.message);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setActionLoading(null); }
  };

  const handleOrderStatusUpdate = async (orderId) => {
    const update = orderStatusUpdate[orderId];
    if (!update) return;
    setActionLoading(orderId);
    try {
      await api.patch(`/admin/orders/${orderId}/status`, update);
      toast.success('Order updated');
      fetchData();
    } catch (err) {
      toast.error('Update failed');
    } finally { setActionLoading(null); }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product from the platform?')) return;
    setActionLoading(id);
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success('Product deleted');
      fetchData();
    } catch (err) {
      toast.error('Delete failed');
    } finally { setActionLoading(null); }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discountValue) return toast.error('Code and discount value are required.');
    setCouponLoading(true);
    try {
      await api.post('/coupons', {
        code: couponForm.code,
        discountType: couponForm.discountType,
        discountValue: Number(couponForm.discountValue),
        minOrderValue: Number(couponForm.minOrderValue) || 0,
        maxUses: Number(couponForm.maxUses) || 0,
        expiresAt: couponForm.expiresAt || undefined,
      });
      toast.success('Coupon created!');
      setCouponForm({ code: '', discountType: 'percentage', discountValue: '', minOrderValue: '', maxUses: '', expiresAt: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    } finally { setCouponLoading(false); }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Coupon deleted.');
      fetchData();
    } catch { toast.error('Delete failed.'); }
  };

  const statusBadge = (status) => {
    const map = { active: 'status-active', pending: 'status-pending', suspended: 'status-suspended' };
    return <span className={`status-badge ${map[status] || ''}`}>{status}</span>;
  };

  const roleBadge = (role) => {
    const cls = role === 'superadmin' ? 'role-badge-admin' : role === 'vendor' ? 'role-badge-vendor' : 'role-badge-customer';
    return <span className={`role-badge ${cls}`}>{role}</span>;
  };

  const TABS = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'pending', label: `⏳ Pending (${pendingVendors.length})` },
    { key: 'users', label: `👥 Users (${allUsers.length})` },
    { key: 'orders', label: `🛒 Orders (${allOrders.length})` },
    { key: 'products', label: `📦 Products (${allProducts.length})` },
    { key: 'coupons', label: `🎟 Coupons (${coupons.length})` },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Super Admin Panel</h1>
            <p className="dashboard-subtitle">Logged in as <strong>{user?.name}</strong> — Platform Manager</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-outline btn-sm" onClick={fetchData}><HiOutlineRefresh /> Refresh</button>
            <button className="btn btn-outline btn-sm" title="Download Revenue CSV"
              onClick={() => downloadCSV('revenue_report.csv',
                allOrders.map(o => ({ OrderID: o._id.slice(-8).toUpperCase(), Customer: o.userId?.name||'', Email: o.userId?.email||'', Amount: o.amount, OrderStatus: o.orderStatus, PaymentStatus: o.paymentStatus, Date: new Date(o.createdAt).toLocaleDateString() })),
                ['OrderID','Customer','Email','Amount','OrderStatus','PaymentStatus','Date'])}
            ><HiOutlineDownload /> Revenue</button>
            <button className="btn btn-outline btn-sm" title="Download Customers CSV"
              onClick={() => downloadCSV('customers.csv',
                allUsers.filter(u=>u.role==='customer').map(u=>({ Name: u.name, Email: u.email, Status: u.status, Joined: new Date(u.createdAt).toLocaleDateString() })),
                ['Name','Email','Status','Joined'])}
            ><HiOutlineDownload /> Customers</button>
            <button className="btn btn-outline btn-sm" title="Download Vendors CSV"
              onClick={() => downloadCSV('vendors.csv',
                allUsers.filter(u=>u.role==='vendor').map(u=>({ Name: u.name, Email: u.email, Business: u.businessName||'', Status: u.status, Joined: new Date(u.createdAt).toLocaleDateString() })),
                ['Name','Email','Business','Status','Joined'])}
            ><HiOutlineDownload /> Vendors</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {TABS.map(t => (
            <button key={t.key} className={`btn btn-sm ${activeTab === t.key ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="spinner spinner-dark" /><span>Loading...</span></div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {activeTab === 'overview' && (
              <div className="fade-in">
                <div className="stats-grid">
                  {[
                    { label: 'Total Revenue', value: `₹${(analytics?.totalRevenue||0).toLocaleString()}`, icon: <HiOutlineCurrencyRupee />, cls: 'primary' },
                    { label: 'Total Orders', value: analytics?.totalOrders||0, icon: <HiOutlineShoppingBag />, cls: 'success' },
                    { label: 'Total Products', value: analytics?.totalProducts||0, icon: <HiOutlineCollection />, cls: 'info' },
                    { label: 'Active Vendors', value: analytics?.totalVendors||0, icon: <HiOutlineOfficeBuilding />, cls: 'warning' },
                    { label: 'Customers', value: analytics?.totalCustomers||0, icon: <HiOutlineUserGroup />, cls: 'success' },
                    { label: 'Pending Vendors', value: analytics?.pendingVendors||0, icon: <HiOutlineClock />, cls: 'danger' },
                  ].map(s => (
                    <div key={s.label} className={`stat-card ${s.cls}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div><p className="stat-label">{s.label}</p><p className="stat-value">{s.value}</p></div>
                        <span style={{ fontSize: '1.75rem', opacity: 0.6 }}>{s.icon}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {analytics?.dailySales?.length > 0 && (
                  <div className="table-container" style={{ padding: '1.25rem', marginTop: '1.5rem' }}>
                    <h3 className="table-title" style={{ marginBottom: '1.25rem' }}>📊 Daily Revenue — Last 5 Days</h3>
                    <SimpleBarChart data={analytics.dailySales} />
                  </div>
                )}
              </div>
            )}

            {/* ── PENDING VENDORS ── */}
            {activeTab === 'pending' && (
              <div className="table-container fade-in">
                <div className="table-header"><h3 className="table-title">Pending Vendor Applications</h3></div>
                {pendingVendors.length === 0 ? (
                  <div className="empty-state"><HiOutlineCheckCircle className="empty-state-icon" /><h3 className="empty-state-title">All Caught Up</h3><p className="empty-state-text">No pending applications.</p></div>
                ) : (
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead><tr><th>Business</th><th>Owner</th><th>Email</th><th>Applied</th><th>Action</th></tr></thead>
                      <tbody>
                        {pendingVendors.map(v => (
                          <tr key={v._id}>
                            <td><strong>{v.businessName}</strong></td>
                            <td>{v.name}</td>
                            <td>{v.email}</td>
                            <td>{new Date(v.createdAt).toLocaleDateString()}</td>
                            <td>
                              <button className="btn btn-success btn-sm" onClick={() => handleApprove(v._id)} disabled={actionLoading === v._id}>
                                {actionLoading === v._id ? <span className="spinner spinner-sm" /> : <><HiOutlineCheckCircle /><span>Approve</span></>}
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

            {/* ── ALL USERS ── */}
            {activeTab === 'users' && (
              <div className="table-container fade-in">
                <div className="table-header"><h3 className="table-title">All Users ({allUsers.length})</h3></div>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead>
                    <tbody>
                      {allUsers.map(u => (
                        <tr key={u._id}>
                          <td><strong>{u.name}</strong></td>
                          <td>{u.email}</td>
                          <td>{roleBadge(u.role)}</td>
                          <td>{statusBadge(u.status)}</td>
                          <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td>
                            {u.role !== 'superadmin' && (
                              <>
                                {u.status === 'active' && <button className="btn btn-danger btn-sm" onClick={() => handleSuspend(u._id)} disabled={actionLoading === u._id}>{actionLoading === u._id ? <span className="spinner spinner-sm" /> : <><HiOutlineBan /><span>Suspend</span></>}</button>}
                                {(u.status === 'suspended' || u.status === 'pending') && <button className="btn btn-success btn-sm" onClick={() => u.status === 'pending' ? handleApprove(u._id) : handleActivate(u._id)} disabled={actionLoading === u._id}>{actionLoading === u._id ? <span className="spinner spinner-sm" /> : <><HiOutlineCheckCircle /><span>{u.status === 'pending' ? 'Approve' : 'Activate'}</span></>}</button>}
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── ALL ORDERS ── */}
            {activeTab === 'orders' && (
              <div className="table-container fade-in">
                <div className="table-header"><h3 className="table-title">All Platform Orders ({allOrders.length})</h3></div>
                {allOrders.length === 0 ? (
                  <div className="empty-state"><HiOutlineShoppingBag className="empty-state-icon" /><h3 className="empty-state-title">No Orders Yet</h3></div>
                ) : (
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Payment</th><th>Order Status</th><th>Date</th><th>Update</th></tr></thead>
                      <tbody>
                        {allOrders.map(o => (
                          <tr key={o._id}>
                            <td><code style={{ fontSize: '0.75rem', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: '3px' }}>{o._id.slice(-8).toUpperCase()}</code></td>
                            <td>
                              <strong>{o.userId?.name || '—'}</strong>
                              <br /><span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{o.userId?.email}</span>
                            </td>
                            <td><strong>₹{o.amount?.toLocaleString()}</strong></td>
                            <td>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: o.paymentStatus === 'paid' ? 'var(--success)' : o.paymentStatus === 'failed' ? 'var(--danger)' : 'var(--warning)' }}>
                                {o.paymentStatus}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>{o.orderStatus}</span>
                            </td>
                            <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <select
                                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-300)' }}
                                  defaultValue=""
                                  onChange={e => setOrderStatusUpdate(prev => ({ ...prev, [o._id]: { ...prev[o._id], orderStatus: e.target.value }}))}
                                >
                                  <option value="" disabled>Status</option>
                                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <select
                                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-300)' }}
                                  defaultValue=""
                                  onChange={e => setOrderStatusUpdate(prev => ({ ...prev, [o._id]: { ...prev[o._id], paymentStatus: e.target.value }}))}
                                >
                                  <option value="" disabled>Payment</option>
                                  {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <button className="btn btn-primary btn-sm" onClick={() => handleOrderStatusUpdate(o._id)} disabled={actionLoading === o._id || !orderStatusUpdate[o._id]}>
                                  {actionLoading === o._id ? <span className="spinner spinner-sm" /> : 'Save'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── ALL PRODUCTS ── */}
            {activeTab === 'products' && (
              <div className="table-container fade-in">
                <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <h3 className="table-title">All Platform Products ({allProducts.length})</h3>
                  <div style={{ position: 'relative', minWidth: '240px' }}>
                    <HiOutlineSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                    <input type="text" className="form-input" placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} style={{ paddingLeft: '2.25rem', fontSize: '0.82rem', height: '36px' }} />
                  </div>
                </div>
                {(() => {
                  let filtered = allProducts.filter(p => {
                    const q = productSearch.toLowerCase();
                    if (!q) return true;
                    return p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.storeId?.name?.toLowerCase().includes(q);
                  });
                  if (filtered.length === 0 && allProducts.length > 0) {
                    filtered = allProducts;
                  }
                  return filtered.length === 0 ? (
                    <div className="empty-state"><HiOutlineSearch className="empty-state-icon" /><h3 className="empty-state-title">No products listed</h3></div>
                  ) : (
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead><tr><th>Image</th><th>Product</th><th>Category</th><th>Store</th><th>Price</th><th>Stock</th><th>Action</th></tr></thead>
                      <tbody>
                        {filtered.map(p => (
                          <tr key={p._id}>
                            <td>
                              <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius)' }} onError={e => { e.target.style.display = 'none'; }} />
                            </td>
                            <td><strong>{p.name}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{p.description?.slice(0, 50)}</span></td>
                            <td>{p.category}</td>
                            <td>{p.storeId?.name || '—'}</td>
                            <td><strong>₹{p.price?.toLocaleString()}</strong></td>
                            <td>
                              <span style={{ fontWeight: 600, color: p.stock > 5 ? 'var(--success)' : p.stock > 0 ? 'var(--warning)' : 'var(--danger)' }}>
                                {p.stock}
                              </span>
                            </td>
                            <td>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProduct(p._id)} disabled={actionLoading === p._id}>
                                {actionLoading === p._id ? <span className="spinner spinner-sm" /> : <><HiOutlineTrash /><span>Delete</span></>}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  );
                })()}
              </div>
            )}
            {/* ── COUPONS ── */}
            {activeTab === 'coupons' && (
              <div className="fade-in">
                {/* Create coupon form */}
                <div className="stat-card" style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>🎟 Create New Coupon</h3>
                  <form onSubmit={handleCreateCoupon}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Code *</label>
                        <input className="form-input" placeholder="SAVE20" value={couponForm.code}
                          onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Type</label>
                        <select className="form-input" value={couponForm.discountType} onChange={e => setCouponForm({...couponForm, discountType: e.target.value})}>
                          <option value="percentage">Percentage (%)</option>
                          <option value="flat">Flat (₹)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Value *</label>
                        <input type="number" className="form-input" placeholder={couponForm.discountType==='percentage'?'e.g. 20':'e.g. 100'}
                          value={couponForm.discountValue} onChange={e => setCouponForm({...couponForm, discountValue: e.target.value})} min="0" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Min Order (₹)</label>
                        <input type="number" className="form-input" placeholder="0" value={couponForm.minOrderValue} onChange={e => setCouponForm({...couponForm, minOrderValue: e.target.value})} min="0" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Max Uses (0=∞)</label>
                        <input type="number" className="form-input" placeholder="0" value={couponForm.maxUses} onChange={e => setCouponForm({...couponForm, maxUses: e.target.value})} min="0" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Expires At</label>
                        <input type="date" className="form-input" value={couponForm.expiresAt} onChange={e => setCouponForm({...couponForm, expiresAt: e.target.value})} />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={couponLoading}>
                      <HiOutlinePlus /> {couponLoading ? 'Creating...' : 'Create Coupon'}
                    </button>
                  </form>
                </div>

                {/* Existing coupons */}
                <div className="table-container">
                  <div className="table-header"><h3 className="table-title">Active Coupons ({coupons.length})</h3></div>
                  {coupons.length === 0 ? (
                    <div className="empty-state"><p className="empty-state-text">No coupons yet.</p></div>
                  ) : (
                    <div className="table-scroll">
                      <table className="data-table">
                        <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Used/Max</th><th>Expires</th><th>Action</th></tr></thead>
                        <tbody>
                          {coupons.map(c => (
                            <tr key={c._id}>
                              <td><code style={{ fontWeight: 700, background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 4 }}>{c.code}</code></td>
                              <td><span style={{ textTransform: 'capitalize' }}>{c.discountType}</span></td>
                              <td><strong>{c.discountType==='percentage'?`${c.discountValue}%`:`₹${c.discountValue}`}</strong></td>
                              <td>{c.minOrderValue > 0 ? `₹${c.minOrderValue}` : '—'}</td>
                              <td>{c.usedCount} / {c.maxUses > 0 ? c.maxUses : '∞'}</td>
                              <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}</td>
                              <td>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCoupon(c._id)}><HiOutlineTrash /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

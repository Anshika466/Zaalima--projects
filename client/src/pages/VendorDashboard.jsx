import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  HiOutlineOfficeBuilding, HiOutlineShoppingBag, HiOutlineCurrencyRupee,
  HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineRefresh, HiOutlineClipboardList,
  HiOutlineSearch, HiOutlineDownload,
} from 'react-icons/hi';
import api from '../utils/axios';
import toast from 'react-hot-toast';

// ── CSV helper ──
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
          <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)', fontWeight: 600 }}>₹{(d.revenue/1000).toFixed(1)}k</span>
          <div style={{ width: '100%', background: 'var(--primary)', borderRadius: '4px 4px 0 0', height: `${Math.max((d.revenue / maxRevenue) * 130, 4)}px`, transition: 'height 0.4s ease' }} title={`₹${d.revenue} | ${d.orders} orders`} />
          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 500 }}>{d.day}</span>
        </div>
      ))}
    </div>
  );
};

const VendorDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');

  const [storeName, setStoreName] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [editingStore, setEditingStore] = useState(false);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productForm, setProductForm] = useState({ id: null, name: '', price: '', stock: '', description: '', image: '', category: '' });
  const [showProductModal, setShowProductModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [inventorySearch, setInventorySearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const storeRes = await api.get('/stores/my');
      if (storeRes.data.success && storeRes.data.store) {
        setStore(storeRes.data.store);
        setStoreName(storeRes.data.store.name);
        setStoreDesc(storeRes.data.store.description || '');
        const [prodRes, ordersRes] = await Promise.all([
          api.get('/products/my'),
          api.get('/stores/my-orders'),
        ]);
        if (prodRes.data.success) setProducts(prodRes.data.products);
        if (ordersRes.data.success) setOrders(ordersRes.data.orders);
      }
    } catch (err) {
      toast.error('Failed to load store data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!storeName.trim()) return toast.error('Store name is required');
    try {
      const res = await api.post('/stores', { name: storeName, description: storeDesc });
      if (res.data.success) { toast.success('Store created!'); fetchData(); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create store');
    }
  };

  const handleUpdateStore = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch('/stores/my', { name: storeName, description: storeDesc });
      if (res.data.success) { toast.success('Store updated!'); setEditingStore(false); fetchData(); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const { name, price, stock, category, description, image, id } = productForm;
    if (!name || !price || stock === '' || !category) return toast.error('Fill all required fields');
    try {
      const payload = { name, price: Number(price), stock: Number(stock), category, description, image: image || undefined };
      const res = id ? await api.put(`/products/${id}`, payload) : await api.post('/products', payload);
      if (res.data.success) {
        toast.success(id ? 'Product updated!' : 'Product added!');
        setShowProductModal(false);
        setProductForm({ id: null, name: '', price: '', stock: '', description: '', image: '', category: '' });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setActionLoading(id);
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.data.success) { toast.success('Deleted!'); fetchData(); }
    } catch (err) {
      toast.error('Delete failed');
    } finally { setActionLoading(null); }
  };

  const openEdit = (p) => {
    setProductForm({ id: p._id, name: p.name, price: p.price, stock: p.stock, description: p.description || '', image: p.image || '', category: p.category || '' });
    setShowProductModal(true);
  };

  if (loading) return <div className="dashboard-page"><div className="page-container" style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner spinner-dark" /></div></div>;

  // ── NO STORE YET ──
  if (!store) {
    return (
      <div className="dashboard-page">
        <div className="page-container" style={{ maxWidth: '560px', margin: '3rem auto' }}>
          <div className="stat-card fade-in">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <HiOutlineOfficeBuilding style={{ fontSize: '2.5rem', color: 'var(--primary)' }} />
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Setup Your Store</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Enter a name to launch your vendor dashboard.</p>
              </div>
            </div>
            <form onSubmit={handleCreateStore}>
              <div className="form-group">
                <label className="form-label">Store Name *</label>
                <input type="text" className="form-input" placeholder="e.g. Trendz Store" value={storeName} onChange={e => setStoreName(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="3" placeholder="Describe your store..." value={storeDesc} onChange={e => setStoreDesc(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>Launch My Store</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── STORE EXISTS ──
  const totalStock = products.reduce((a, p) => a + p.stock, 0);
  const avgPrice = products.length ? (products.reduce((a, p) => a + p.price, 0) / products.length).toFixed(0) : 0;
  const totalOrderRevenue = orders.reduce((a, o) => a + (o.amount || 0), 0);

  const dailySales = (() => {
    const daysMap = {};
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString();
      const label = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      daysMap[key] = { day: label, revenue: 0, orders: 0 };
    }
    orders.forEach(o => {
      const key = new Date(o.createdAt).toLocaleDateString();
      if (daysMap[key]) {
        daysMap[key].revenue += (o.amount || 0);
        daysMap[key].orders += 1;
      }
    });
    return Object.values(daysMap);
  })();

  return (
    <div className="dashboard-page">
      <div className="page-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            {editingStore ? (
              <form onSubmit={handleUpdateStore} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <input className="form-input" style={{ marginBottom: '0.5rem' }} value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Store name" />
                  <input className="form-input" value={storeDesc} onChange={e => setStoreDesc(e.target.value)} placeholder="Description" />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary btn-sm">Save</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditingStore(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <h1 className="dashboard-title">{store.name} <button className="btn btn-outline btn-sm" style={{ marginLeft: '0.75rem' }} onClick={() => setEditingStore(true)}><HiOutlinePencil /></button></h1>
                <p className="dashboard-subtitle">{store.description || 'Your vendor control center'}</p>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={fetchData}><HiOutlineRefresh /></button>
            <button
              className="btn btn-outline btn-sm"
              title="Download Product List CSV"
              onClick={() => downloadCSV(
                `products_${store.name.replace(/\s+/g,'_')}.csv`,
                products.map(p => ({ Name: p.name, Category: p.category, Price: p.price, Stock: p.stock, Description: p.description || '' })),
                ['Name', 'Category', 'Price', 'Stock', 'Description']
              )}
            >
              <HiOutlineDownload /> Products
            </button>
            <button
              className="btn btn-outline btn-sm"
              title="Download Revenue & Orders CSV"
              onClick={() => downloadCSV(
                `revenue_${store.name.replace(/\s+/g,'_')}.csv`,
                orders.map(o => ({ OrderID: o._id.slice(-8).toUpperCase(), Customer: o.userId?.name || '', Email: o.userId?.email || '', Amount: o.amount, Status: o.orderStatus, Payment: o.paymentStatus, Date: new Date(o.createdAt).toLocaleDateString() })),
                ['OrderID', 'Customer', 'Email', 'Amount', 'Status', 'Payment', 'Date']
              )}
            >
              <HiOutlineDownload /> Revenue
            </button>
            <button className="btn btn-primary" onClick={() => { setProductForm({ id: null, name: '', price: '', stock: '', description: '', image: '', category: '' }); setShowProductModal(true); }}>
              <HiOutlinePlus /> Add Product
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: 'Total Products', value: products.length, icon: <HiOutlineShoppingBag />, cls: 'info' },
            { label: 'Total Stock', value: `${totalStock} units`, icon: <HiOutlineOfficeBuilding />, cls: 'warning' },
            { label: 'Avg. Price', value: `₹${avgPrice}`, icon: <HiOutlineCurrencyRupee />, cls: 'success' },
            { label: 'Store Revenue', value: `₹${totalOrderRevenue.toLocaleString()}`, icon: <HiOutlineCurrencyRupee />, cls: 'primary' },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.cls}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><p className="stat-label">{s.label}</p><p className="stat-value">{s.value}</p></div>
                <span style={{ fontSize: '1.75rem', opacity: 0.6 }}>{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Sales Chart */}
        {orders.length > 0 && (
          <div className="table-container" style={{ padding: '1.25rem', marginTop: '1.5rem' }}>
            <h3 className="table-title" style={{ marginBottom: '1.25rem' }}>📊 Daily Revenue — Last 5 Days</h3>
            <SimpleBarChart data={dailySales} />
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', margin: '1.5rem 0 1rem' }}>
          <button className={`btn btn-sm ${activeTab === 'inventory' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('inventory')}>
            <HiOutlineShoppingBag /> Inventory ({products.length})
          </button>
          <button className={`btn btn-sm ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('orders')}>
            <HiOutlineClipboardList /> Orders ({orders.length})
          </button>
        </div>

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <>
            {/* Search Bar */}
            <div style={{ marginBottom: '1rem', position: 'relative', maxWidth: '360px' }}>
              <HiOutlineSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '1.1rem' }} />
              <input type="text" className="form-input" placeholder="Search inventory..." value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
            </div>
            {(() => {
              let filtered = products.filter(p => {
                const q = inventorySearch.toLowerCase();
                if (!q) return true;
                return p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
              });
              if (filtered.length === 0 && products.length > 0) {
                filtered = products;
              }
              return filtered.length === 0 ? (
                <div className="empty-state fade-in"><HiOutlineSearch className="empty-state-icon" /><h3 className="empty-state-title">No products listed</h3><p className="empty-state-text">Click "Add Product" to list your first item.</p></div>
              ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {filtered.map(p => (
                <div key={p._id} className="stat-card" style={{ borderLeft: p.stock <= 5 ? '4px solid var(--danger)' : '4px solid var(--primary)', position: 'relative' }}>
                  {p.image && <div style={{ height: '130px', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '0.75rem' }}><img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>{p.category}</span>
                    {p.stock <= 5 && (
                      <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                        ⚠️ Low Stock
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontWeight: 700, margin: '0.25rem 0', fontSize: '0.95rem' }}>{p.name}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>{p.description?.slice(0, 80)}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--gray-100)', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
                    <div><span style={{ fontSize: '0.72rem', color: 'var(--gray-400)', display: 'block' }}>Price</span><strong>₹{p.price}</strong></div>
                    <div style={{ textAlign: 'right' }}><span style={{ fontSize: '0.72rem', color: 'var(--gray-400)', display: 'block' }}>Stock</span><strong style={{ color: p.stock > 5 ? 'var(--success)' : 'var(--danger)' }}>{p.stock} left</strong></div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => openEdit(p)}><HiOutlinePencil /> Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProduct(p._id)} disabled={actionLoading === p._id}>
                      {actionLoading === p._id ? <span className="spinner spinner-sm" /> : <HiOutlineTrash />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
              );
            })()}
          </>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          orders.length === 0 ? (
            <div className="empty-state fade-in"><HiOutlineClipboardList className="empty-state-icon" /><h3 className="empty-state-title">No orders yet</h3><p className="empty-state-text">Customer orders for your products will appear here.</p></div>
          ) : (
            <div className="table-container fade-in">
              <div className="table-scroll">
                <table className="data-table">
                  <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o._id}>
                        <td><code style={{ fontSize: '0.75rem', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: '3px' }}>{o._id.slice(-8).toUpperCase()}</code></td>
                        <td><strong>{o.userId?.name || '—'}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{o.userId?.email}</span></td>
                        <td><strong>₹{o.amount?.toLocaleString()}</strong></td>
                        <td><span style={{ fontSize: '0.75rem', fontWeight: 600, color: o.paymentStatus === 'paid' ? 'var(--success)' : 'var(--warning)' }}>{o.paymentStatus}</span></td>
                        <td><span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>{o.orderStatus}</span></td>
                        <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: '2rem', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>{productForm.id ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSaveProduct}>
              <div className="form-group"><label className="form-label">Name *</label><input type="text" className="form-input" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group"><label className="form-label">Price (₹) *</label><input type="number" className="form-input" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} required min="0" /></div>
                <div className="form-group"><label className="form-label">Stock *</label><input type="number" className="form-input" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} required min="0" /></div>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}><label className="form-label">Category *</label><input type="text" className="form-input" placeholder="e.g. Electronics" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} required /></div>
              <div className="form-group" style={{ marginTop: '1rem' }}><label className="form-label">Image URL</label><input type="text" className="form-input" placeholder="https://..." value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} /></div>
              <div className="form-group" style={{ marginTop: '1rem' }}><label className="form-label">Description</label><textarea className="form-input" rows="3" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} /></div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowProductModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;

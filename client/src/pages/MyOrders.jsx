import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineShoppingBag,
  HiOutlineRefresh,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from 'react-icons/hi';

const STATUS_STEPS = ['placed', 'processing', 'shipped', 'delivered'];

const OrderStatusTracker = ({ status }) => {
  const currentIdx = STATUS_STEPS.indexOf(status);
  if (status === 'cancelled') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
        <span style={{ background: 'var(--danger)', color: '#fff', padding: '0.2rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>
          ❌ Order Cancelled
        </span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: '0.75rem', flexWrap: 'wrap' }}>
      {STATUS_STEPS.map((step, idx) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem'
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: idx <= currentIdx ? 'var(--primary)' : 'var(--gray-200)',
              color: idx <= currentIdx ? '#fff' : 'var(--gray-400)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.3s',
            }}>
              {idx < currentIdx ? '✓' : idx + 1}
            </div>
            <span style={{
              fontSize: '0.65rem', fontWeight: idx === currentIdx ? 700 : 400,
              color: idx <= currentIdx ? 'var(--primary)' : 'var(--gray-400)',
              textTransform: 'capitalize', whiteSpace: 'nowrap',
            }}>
              {step}
            </span>
          </div>
          {idx < STATUS_STEPS.length - 1 && (
            <div style={{
              width: '40px', height: '2px', marginBottom: '16px',
              background: idx < currentIdx ? 'var(--primary)' : 'var(--gray-200)',
              transition: 'all 0.3s',
            }} />
          )}
        </div>
      ))}
    </div>
  );
};

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/my');
      if (res.data.success) setOrders(res.data.orders);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(orderId);
    try {
      const res = await api.patch(`/orders/${orderId}/cancel`);
      if (res.data.success) {
        toast.success('Order cancelled successfully.');
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancellingId(null);
    }
  };

  const paymentBadge = (status) => {
    const colors = {
      paid: { bg: 'var(--success-light)', color: 'var(--accent-dark)' },
      pending: { bg: 'var(--warning-light)', color: '#92400E' },
      failed: { bg: 'var(--danger-light)', color: '#991B1B' },
      refunded: { bg: 'var(--info-light)', color: '#1E40AF' },
    };
    const s = colors[status] || colors.pending;
    return (
      <span style={{ background: s.bg, color: s.color, padding: '0.15rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 600 }}>
        {status}
      </span>
    );
  };

  return (
    <div className="dashboard-page">
      <div className="page-container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">My Orders</h1>
            <p className="dashboard-subtitle">Track and review your purchase history</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-outline btn-sm" onClick={fetchOrders}>
              <HiOutlineRefresh /> Refresh
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/shop')}>
              Continue Shopping
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner spinner-dark" />
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state fade-in">
            <HiOutlineShoppingBag className="empty-state-icon" />
            <h3 className="empty-state-title">No Orders Yet</h3>
            <p className="empty-state-text">You haven't placed any orders. Start shopping!</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/shop')}>
              Browse Products
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            {orders.map((order) => (
              <div key={order._id} className="stat-card" style={{ borderLeft: `4px solid ${order.orderStatus === 'delivered' ? 'var(--success)' : order.orderStatus === 'cancelled' ? 'var(--danger)' : 'var(--primary)'}` }}>
                {/* Order Header */}
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer', flexWrap: 'wrap', gap: '0.5rem' }}
                  onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                >
                  <div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginBottom: '0.15rem' }}>
                      Order ID: <code style={{ background: 'var(--gray-100)', padding: '0 4px', borderRadius: '3px' }}>{order._id.slice(-8).toUpperCase()}</code>
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      Placed: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <OrderStatusTracker status={order.orderStatus} />
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--secondary)' }}>₹{order.amount?.toLocaleString()}</span>
                    {paymentBadge(order.paymentStatus)}
                    <span style={{ color: 'var(--primary)', fontSize: '1.1rem', marginTop: '0.25rem' }}>
                      {expandedId === order._id ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                    </span>
                  </div>
                </div>

                {/* Expanded Detail */}
                {expandedId === order._id && (
                  <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--gray-100)', paddingTop: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {/* Items */}
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--gray-700)' }}>Items Ordered</p>
                        {order.products?.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.3rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                            <span>{item.name} × {item.quantity}</span>
                            <strong>₹{(item.price * item.quantity).toLocaleString()}</strong>
                          </div>
                        ))}
                      </div>
                      {/* Address */}
                      {order.shippingAddress && (
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--gray-700)' }}>Delivery Address</p>
                          <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', lineHeight: 1.7 }}>
                            {order.shippingAddress.street}<br />
                            {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                            {order.shippingAddress.pincode}
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Action Button */}
                    {(order.orderStatus === 'placed' || order.orderStatus === 'processing') && (
                      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--gray-100)', paddingTop: '0.75rem' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ borderColor: 'var(--danger)', color: 'var(--danger)', fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelOrder(order._id);
                          }}
                          disabled={cancellingId === order._id}
                        >
                          {cancellingId === order._id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;

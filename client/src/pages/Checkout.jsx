import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearCart, removeFromCart, updateQuantity } from '../store/slices/cartSlice';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineShoppingCart, HiOutlineTrash, HiOutlineLocationMarker,
  HiOutlineCreditCard, HiOutlineTruck, HiOutlineCheckCircle,
} from 'react-icons/hi';

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems: items, totalPrice: totalAmount } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const [step, setStep] = useState(1); // 1=address, 2=payment, 3=confirm
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discount }
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState('');
  const [couponErr, setCouponErr] = useState('');

  const discount = appliedCoupon?.discount || 0;
  const finalAmount = Math.max(0, totalAmount - discount);

  const [address, setAddress] = useState({
    street: '', city: '', state: '', pincode: '', phone: '',
  });

  const handleAddressChange = (e) => {
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addressValid = address.street && address.city && address.state && address.pincode && address.phone;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponErr('');
    setCouponMsg('');
    try {
      const res = await api.post('/coupons/validate', { code: couponCode, orderTotal: totalAmount });
      if (res.data.success) {
        setAppliedCoupon(res.data.coupon);
        setCouponMsg(`✅ ${res.data.message} You save ₹${res.data.coupon.discount.toLocaleString()}!`);
      }
    } catch (err) {
      setCouponErr(err.response?.data?.message || 'Invalid coupon code.');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMsg('');
    setCouponErr('');
  };

  const handlePlaceOrder = async () => {
    if (!addressValid) return toast.error('Please fill all address fields');
    if (items.length === 0) return toast.error('Cart is empty');
    setPlacing(true);
    try {
      const products = items.map((item) => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || '',
        storeId: item.storeId || '',
      }));

      const payload = {
        products,
        amount: finalAmount,
        shippingAddress: address,
        paymentMethod,
        couponCode: appliedCoupon?.code || '',
        discountAmount: discount,
        originalAmount: totalAmount,
      };

      const res = await api.post('/orders', payload);
      if (res.data.success) {
        dispatch(clearCart());
        setOrderId(res.data.order?._id || '');
        setOrderPlaced(true);
        toast.success('Order placed successfully! 🎉');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order. Try again.');
    } finally {
      setPlacing(false);
    }
  };

  // ── ORDER SUCCESS SCREEN ──
  if (orderPlaced) {
    return (
      <div className="dashboard-page">
        <div className="page-container" style={{ maxWidth: '540px', margin: '3rem auto', textAlign: 'center' }}>
          <div className="stat-card fade-in" style={{ padding: '3rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <HiOutlineCheckCircle style={{ fontSize: '3rem', color: 'var(--success)', marginBottom: '0.5rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--secondary)', margin: '0.5rem 0' }}>
              Order Placed!
            </h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
              Thank you, <strong>{user?.name}</strong>. Your order has been received.
            </p>
            {orderId && (
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)', marginBottom: '1.5rem' }}>
                Order ID: <code style={{ background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>{orderId.slice(-8).toUpperCase()}</code>
              </p>
            )}
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '2rem', background: 'var(--gray-50)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
              {paymentMethod === 'cod' ? '💵 Payment: Cash on Delivery' : '💳 Payment: Paid Online'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={() => navigate('/orders')}>
                <HiOutlineCheckCircle /> View My Orders
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/shop')}>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── EMPTY CART ──
  if (items.length === 0) {
    return (
      <div className="dashboard-page">
        <div className="page-container" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center' }}>
          <div className="empty-state fade-in">
            <HiOutlineShoppingCart className="empty-state-icon" />
            <h3 className="empty-state-title">Your Cart is Empty</h3>
            <p className="empty-state-text">Browse products and add them to your cart to checkout.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/shop')}>
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Checkout</h1>
            <p className="dashboard-subtitle">Complete your purchase in a few steps</p>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '2rem', maxWidth: '400px' }}>
          {[{ n: 1, label: 'Address' }, { n: 2, label: 'Payment' }, { n: 3, label: 'Confirm' }].map((s, idx) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: step >= s.n ? 'var(--primary)' : 'var(--gray-200)',
                  color: step >= s.n ? '#fff' : 'var(--gray-400)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.3s',
                }}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span style={{ fontSize: '0.72rem', marginTop: '0.25rem', fontWeight: step === s.n ? 700 : 400, color: step >= s.n ? 'var(--primary)' : 'var(--gray-400)' }}>
                  {s.label}
                </span>
              </div>
              {idx < 2 && <div style={{ height: '2px', flex: 1, background: step > s.n ? 'var(--primary)' : 'var(--gray-200)', marginBottom: '16px', transition: 'all 0.3s' }} />}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '1.5rem', alignItems: 'start' }}>

          {/* Left — Steps */}
          <div>
            {/* STEP 1 — Address */}
            {step === 1 && (
              <div className="stat-card fade-in">
                <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HiOutlineLocationMarker style={{ color: 'var(--primary)' }} /> Delivery Address
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Street Address *</label>
                    <input name="street" className="form-input" placeholder="123 Main Street, Apartment 4B" value={address.street} onChange={handleAddressChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input name="city" className="form-input" placeholder="Mumbai" value={address.city} onChange={handleAddressChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input name="state" className="form-input" placeholder="Maharashtra" value={address.state} onChange={handleAddressChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode *</label>
                    <input name="pincode" className="form-input" placeholder="400001" value={address.pincode} onChange={handleAddressChange} maxLength={6} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input name="phone" className="form-input" placeholder="9876543210" value={address.phone} onChange={handleAddressChange} maxLength={10} />
                  </div>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => { if (!addressValid) return toast.error('Please fill all fields'); setStep(2); }} disabled={!addressValid}>
                  Continue to Payment →
                </button>
              </div>
            )}

            {/* STEP 2 — Payment */}
            {step === 2 && (
              <div className="stat-card fade-in">
                <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HiOutlineCreditCard style={{ color: 'var(--primary)' }} /> Payment Method
                </h2>

                {[
                  { value: 'cod', icon: '💵', title: 'Cash on Delivery', desc: 'Pay when your order arrives at your door.' },
                  { value: 'online', icon: '💳', title: 'Online Payment (UPI / Card)', desc: 'Pay securely online. Your order is processed immediately.' },
                ].map((m) => (
                  <div
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    style={{
                      padding: '1rem 1.25rem', borderRadius: 'var(--radius)', marginBottom: '0.75rem', cursor: 'pointer',
                      border: `2px solid ${paymentMethod === m.value ? 'var(--primary)' : 'var(--gray-200)'}`,
                      background: paymentMethod === m.value ? 'var(--primary-bg)' : '#fff',
                      transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '1rem',
                    }}
                  >
                    <span style={{ fontSize: '1.75rem' }}>{m.icon}</span>
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: '0.15rem' }}>{m.title}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{m.desc}</p>
                    </div>
                    <div style={{ marginLeft: 'auto', width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${paymentMethod === m.value ? 'var(--primary)' : 'var(--gray-300)'}`, background: paymentMethod === m.value ? 'var(--primary)' : 'transparent', transition: 'all 0.2s' }} />
                  </div>
                ))}

                {paymentMethod === 'online' && (
                  <div style={{ background: 'var(--info-light)', border: '1px solid var(--info)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#1E40AF', marginTop: '0.5rem' }}>
                    ℹ️ For demo purposes, selecting "Online Payment" will mark your order as <strong>paid</strong> immediately without a real payment gateway.
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
                  <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setStep(3)}>Review Order →</button>
                </div>
              </div>
            )}

            {/* STEP 3 — Confirm */}
            {step === 3 && (
              <div className="stat-card fade-in">
                <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HiOutlineCheckCircle style={{ color: 'var(--primary)' }} /> Order Summary
                </h2>

                {/* Address Review */}
                <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Delivery To</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}>
                    {address.street}, {address.city}, {address.state} — {address.pincode}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>📞 {address.phone}</p>
                </div>

                {/* Payment Review */}
                <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Payment</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-700)', fontWeight: 600 }}>
                    {paymentMethod === 'cod' ? '💵 Cash on Delivery' : '💳 Online Payment'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(2)}>← Back</button>
                  <button className="btn btn-primary" style={{ flex: 2 }} onClick={handlePlaceOrder} disabled={placing}>
                    {placing ? (
                      <><span className="spinner spinner-sm" /> Placing Order...</>
                    ) : (
                      <><HiOutlineTruck /> Place Order — ₹{finalAmount.toLocaleString()}</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right — Cart Summary */}
          <div className="stat-card" style={{ position: 'sticky', top: '80px' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>
              🛒 Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h3>
            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {items.map((item) => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                    {item.image && <img src={item.image} alt={item.name} style={{ width: '36px', height: '36px', borderRadius: 'var(--radius)', objectFit: 'cover', flexShrink: 0 }} />}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <button
                          onClick={() => {
                            if (item.quantity > 1) {
                              dispatch(updateQuantity({ itemId: item._id, quantity: item.quantity - 1 }));
                            } else {
                              dispatch(removeFromCart(item._id));
                            }
                          }}
                          style={{
                            background: 'var(--gray-100)', border: '1px solid var(--gray-300)',
                            borderRadius: '4px', width: '20px', height: '20px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: '9px',
                            cursor: 'pointer', color: 'var(--gray-700)'
                          }}
                          title="Decrease quantity"
                        >
                          ➖
                        </button>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '14px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            dispatch(updateQuantity({ itemId: item._id, quantity: item.quantity + 1 }));
                          }}
                          style={{
                            background: 'var(--gray-100)', border: '1px solid var(--gray-300)',
                            borderRadius: '4px', width: '20px', height: '20px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: '9px',
                            cursor: 'pointer', color: 'var(--gray-700)'
                          }}
                          title="Increase quantity"
                        >
                          ➕
                        </button>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <strong style={{ fontSize: '0.85rem' }}>₹{(item.price * item.quantity).toLocaleString()}</strong>
                    <button
                      onClick={() => dispatch(removeFromCart(item._id))}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', padding: '2px' }}
                      title="Remove item"
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code */}
            <div style={{ margin: '1rem 0 0', paddingTop: '1rem', borderTop: '1px solid var(--gray-100)' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Promo Code</p>
              {appliedCoupon ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--success-light, #ecfdf5)', border: '1px solid var(--success)', borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--success)' }}>🎟 {appliedCoupon.code} applied!</span>
                  <button onClick={handleRemoveCoupon} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Remove</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponErr(''); setCouponMsg(''); }}
                    placeholder="Enter code"
                    className="form-input"
                    style={{ flex: 1, fontSize: '0.82rem', padding: '0.5rem 0.75rem', textTransform: 'uppercase' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  />
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    style={{ flexShrink: 0, padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    {couponLoading ? '…' : 'Apply'}
                  </button>
                </div>
              )}
              {couponErr && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.35rem' }}>{couponErr}</p>}
              {couponMsg && <p style={{ color: 'var(--success)', fontSize: '0.75rem', marginTop: '0.35rem' }}>{couponMsg}</p>}
            </div>

            <div style={{ borderTop: '2px solid var(--gray-200)', marginTop: '1rem', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                <span>Subtotal</span><span>₹{totalAmount.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>
                  <span>Discount ({appliedCoupon?.code})</span><span>-₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                <span>Shipping</span><span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--gray-100)' }}>
                <span>Total</span><span style={{ color: 'var(--primary)' }}>₹{finalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

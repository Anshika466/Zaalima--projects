import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearCart } from '../store/slices/cartSlice';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineShoppingCart,
  HiOutlineTrash,
  HiOutlineCreditCard,
  HiOutlineLocationMarker,
} from 'react-icons/hi';

const Checkout = () => {
  const { cartItems, totalPrice, totalQuantity } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [isPlacing, setIsPlacing] = useState(false);

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const validateAddress = () => {
    return address.street.trim() && address.city.trim() && address.pincode.trim();
  };

  const handlePlaceOrder = async () => {
    if (!cartItems.length) {
      toast.error('Your cart is empty.');
      return;
    }
    if (!validateAddress()) {
      toast.error('Please fill in at least street, city, and pincode.');
      return;
    }

    setIsPlacing(true);
    try {
      // 1. Place the order in DB
      const orderRes = await api.post('/orders', {
        products: cartItems,
        amount: totalPrice,
        shippingAddress: address,
      });

      toast.success(orderRes.data.message || 'Order placed successfully!');
      dispatch(clearCart());
      navigate('/shop');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order.');
    } finally {
      setIsPlacing(false);
    }
  };

  if (!cartItems.length) {
    return (
      <div className="dashboard-page">
        <div className="page-container">
          <div className="empty-state fade-in">
            <HiOutlineShoppingCart className="empty-state-icon" />
            <h3 className="empty-state-title">Your cart is empty</h3>
            <p className="empty-state-text">
              Add some products from the shop before checking out.
            </p>
            <button
              className="btn btn-primary mt-3"
              onClick={() => navigate('/shop')}
            >
              Continue Shopping
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
            <p className="dashboard-subtitle">
              Review your order and enter shipping details
            </p>
          </div>
        </div>

        <div className="checkout-grid">
          {/* Cart Summary */}
          <div className="table-container">
            <div className="table-header">
              <h3 className="table-title">
                <HiOutlineShoppingCart style={{ marginRight: '0.5rem' }} />
                Cart Items ({totalQuantity})
              </h3>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>₹{item.price?.toLocaleString()}</td>
                      <td>{item.quantity}</td>
                      <td>
                        <strong>₹{(item.price * item.quantity).toLocaleString()}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              style={{
                padding: '1rem 1.25rem',
                borderTop: '1px solid var(--gray-200)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span className="text-muted">Total Amount</span>
              <span
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                }}
              >
                ₹{totalPrice?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Shipping & Payment */}
          <div className="auth-card" style={{ maxWidth: '100%' }}>
            <h3
              style={{
                fontWeight: 600,
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <HiOutlineLocationMarker />
              Shipping Address
            </h3>

            <div className="form-group">
              <label className="form-label">Street / Flat No.</label>
              <input
                type="text"
                name="street"
                className="form-input"
                style={{ paddingLeft: '0.75rem' }}
                placeholder="123, MG Road"
                value={address.street}
                onChange={handleAddressChange}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="city"
                  className="form-input"
                  style={{ paddingLeft: '0.75rem' }}
                  placeholder="Mumbai"
                  value={address.city}
                  onChange={handleAddressChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  name="state"
                  className="form-input"
                  style={{ paddingLeft: '0.75rem' }}
                  placeholder="Maharashtra"
                  value={address.state}
                  onChange={handleAddressChange}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Pincode</label>
              <input
                type="text"
                name="pincode"
                className="form-input"
                style={{ paddingLeft: '0.75rem' }}
                placeholder="400001"
                value={address.pincode}
                onChange={handleAddressChange}
              />
            </div>

            <div className="alert alert-info" style={{ marginTop: '1rem' }}>
              <strong>Payment:</strong> Cash on Delivery (COD). Online payment
              via Stripe coming soon.
            </div>

            <button
              className="btn btn-primary btn-block"
              onClick={handlePlaceOrder}
              disabled={isPlacing}
              id="place-order-btn"
              style={{ marginTop: '1rem' }}
            >
              {isPlacing ? (
                <>
                  <span className="spinner spinner-sm"></span>
                  <span>Placing Order...</span>
                </>
              ) : (
                <>
                  <HiOutlineCreditCard />
                  <span>Place Order — ₹{totalPrice?.toLocaleString()}</span>
                </>
              )}
            </button>

            <button
              className="btn btn-outline btn-block"
              onClick={() => navigate('/shop')}
              style={{ marginTop: '0.75rem' }}
            >
              ← Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

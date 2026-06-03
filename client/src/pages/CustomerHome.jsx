import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart, removeFromCart } from '../store/slices/cartSlice';
import { HiOutlineShoppingBag, HiOutlineShoppingCart, HiOutlinePlus, HiOutlineMinus } from 'react-icons/hi';

// Mock products — replace with API call when product listing endpoint is ready
const MOCK_PRODUCTS = [
  { _id: 'p1', name: 'Wireless Headphones', price: 1999, category: 'Electronics', vendorName: 'TechZone' },
  { _id: 'p2', name: 'Running Shoes', price: 2499, category: 'Footwear', vendorName: 'SportHub' },
  { _id: 'p3', name: 'Cotton T-Shirt', price: 499, category: 'Clothing', vendorName: 'FashionCo' },
  { _id: 'p4', name: 'Stainless Water Bottle', price: 799, category: 'Lifestyle', vendorName: 'EcoStore' },
  { _id: 'p5', name: 'Notebook Set (3-pack)', price: 349, category: 'Stationery', vendorName: 'WriteRight' },
  { _id: 'p6', name: 'Bluetooth Speaker', price: 1499, category: 'Electronics', vendorName: 'TechZone' },
];

const CustomerHome = () => {
  const { user } = useSelector((state) => state.auth);
  const { cartItems, totalQuantity, totalPrice } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const getCartItem = (id) => cartItems.find((item) => item._id === id);

  return (
    <div className="dashboard-page">
      <div className="page-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Welcome, {user?.name}!</h1>
            <p className="dashboard-subtitle">
              You are logged in as a <strong>Customer</strong>. Browse and add to cart.
            </p>
          </div>

          {/* Cart Summary Button */}
          {totalQuantity > 0 && (
            <button
              className="btn btn-primary"
              onClick={() => navigate('/checkout')}
              id="go-to-checkout-btn"
            >
              <HiOutlineShoppingCart />
              <span>Cart ({totalQuantity}) — ₹{totalPrice?.toLocaleString()}</span>
            </button>
          )}
        </div>

        {/* Products Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}>
          {MOCK_PRODUCTS.map((product) => {
            const cartItem = getCartItem(product._id);
            return (
              <div key={product._id} className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div style={{
                  background: 'var(--primary-bg)',
                  borderRadius: 'var(--radius)',
                  height: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem',
                }}>
                  <HiOutlineShoppingBag style={{ fontSize: '2.5rem', color: 'var(--primary)' }} />
                </div>

                <p style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                  {product.category} · {product.vendorName}
                </p>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.5rem' }}>
                  {product.name}
                </h3>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>
                  ₹{product.price.toLocaleString()}
                </p>

                {cartItem ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => dispatch(removeFromCart(product._id))}
                      style={{ padding: '0.3rem 0.6rem' }}
                    >
                      <HiOutlineMinus />
                    </button>
                    <span style={{ fontWeight: 600, minWidth: '1.5rem', textAlign: 'center' }}>
                      {cartItem.quantity}
                    </span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => dispatch(addToCart(product))}
                      style={{ padding: '0.3rem 0.6rem' }}
                    >
                      <HiOutlinePlus />
                    </button>
                    <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginLeft: 'auto' }}>
                      ₹{(product.price * cartItem.quantity).toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%' }}
                    onClick={() => dispatch(addToCart(product))}
                    id={`add-to-cart-${product._id}`}
                  >
                    <HiOutlinePlus />
                    Add to Cart
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Sticky Checkout Footer */}
        {totalQuantity > 0 && (
          <div style={{
            position: 'sticky',
            bottom: '1.5rem',
            background: 'var(--secondary)',
            color: '#fff',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-lg)',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <div>
              <span style={{ fontWeight: 600 }}>{totalQuantity} item{totalQuantity !== 1 ? 's' : ''} in cart</span>
              <span style={{ margin: '0 0.75rem', opacity: 0.5 }}>|</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{totalPrice?.toLocaleString()}</span>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerHome;

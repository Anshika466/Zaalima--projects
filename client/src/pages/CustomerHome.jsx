import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart, removeFromCart, updateQuantity } from '../store/slices/cartSlice';
import { HiOutlineShoppingBag, HiOutlineShoppingCart, HiOutlinePlus, HiOutlineMinus, HiOutlineSearch } from 'react-icons/hi';
import api from '../utils/axios';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const StarDisplay = ({ value }) => (
  <span style={{ color: '#f59e0b', fontSize: 13 }}>
    {'★'.repeat(Math.round(value || 0))}{'☆'.repeat(5 - Math.round(value || 0))}
  </span>
);

const CustomerHome = () => {
  const { user } = useSelector((state) => state.auth);
  const { token } = useSelector((state) => state.auth);
  const { cartItems, totalQuantity, totalPrice } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlist, setWishlist] = useState([]);
  const [wishLoading, setWishLoading] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await api.get('/products');
        if (res.data.success) {
          setProducts(res.data.products);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        toast.error('Could not load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
    if (token) fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const { data } = await axios.get(`${API}/auth/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist((data.wishlist || []).map((p) => p._id || p));
    } catch {}
  };

  const toggleWishlist = async (productId) => {
    setWishLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const isWished = wishlist.includes(productId);
      if (isWished) {
        await axios.delete(`${API}/auth/wishlist/${productId}`, { headers: { Authorization: `Bearer ${token}` } });
        setWishlist((prev) => prev.filter((id) => id !== productId));
      } else {
        await axios.post(`${API}/auth/wishlist/${productId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
        setWishlist((prev) => [...prev, productId]);
      }
    } catch {}
    setWishLoading((prev) => ({ ...prev, [productId]: false }));
  };


  const getCartItem = (id) => cartItems.find((item) => item._id === id);

  return (
    <div className="dashboard-page">
      <div className="page-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Welcome, {user?.name}!</h1>
            <p className="dashboard-subtitle">
              You are logged in as a <strong>Customer</strong>. Browse and add items to your cart.
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

        {/* Search Bar */}
        <div style={{ marginBottom: '1rem', position: 'relative', maxWidth: '480px' }}>
          <HiOutlineSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '1.1rem' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search products by name, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Category Filter Badges */}
        {!loading && products.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {['All', ...new Set(products.map((p) => p.category).filter(Boolean))].map((cat) => (
              <button
                key={cat}
                className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>Loading storefront products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state fade-in" style={{ padding: '3rem' }}>
            <HiOutlineShoppingBag className="empty-state-icon" />
            <h3 className="empty-state-title">No Products Listed Yet</h3>
            <p className="empty-state-text">Check back later once vendors have listed their inventory items.</p>
          </div>
        ) : (
          /* Products Grid */
          (() => {
            let filtered = products.filter((p) => {
              if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
              const q = searchQuery.toLowerCase();
              if (!q) return true;
              return (
                p.name?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q)
              );
            });
            if (filtered.length === 0 && !searchQuery.trim() && selectedCategory === 'All') {
              filtered = products;
            }
            return (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1.25rem',
            marginBottom: '2rem',
          }}>
            {filtered.map((product) => {
              const cartItem = getCartItem(product._id);
              return (
                <div key={product._id} className="stat-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '4px solid var(--primary)' }}>
                  <div style={{
                    background: 'var(--primary-bg)',
                    borderRadius: 'var(--radius)',
                    height: '140px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    marginBottom: '0.75rem',
                  }}>
                    {product.image ? (
                      <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <HiOutlineShoppingBag style={{ fontSize: '2.5rem', color: 'var(--primary)' }} />
                    )}
                  </div>

                  <p style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                    {product.category || 'General'}
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3
                      style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem', cursor: 'pointer' }}
                      onClick={() => navigate(`/product/${product._id}`)}
                    >
                      {product.name}
                    </h3>
                    <button
                      style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: '0 0 0 6px', flexShrink: 0 }}
                      onClick={() => toggleWishlist(product._id)}
                      disabled={wishLoading[product._id]}
                      title={wishlist.includes(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      {wishlist.includes(product._id) ? '❤️' : '🤍'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: '0.4rem' }}>
                    <StarDisplay value={product.averageRating || 0} />
                    <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>({product.numOfReviews || 0})</span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', flexGrow: 1, marginBottom: '1rem' }}>
                    {product.description || 'No description available.'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                      ₹{product.price.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: product.stock > 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                    </span>
                  </div>

                  {product.stock > 0 ? (
                    cartItem ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            if (cartItem.quantity > 1) {
                              dispatch(updateQuantity({ itemId: product._id, quantity: cartItem.quantity - 1 }));
                            } else {
                              dispatch(removeFromCart(product._id));
                            }
                          }}
                          style={{ padding: '0.3rem 0.6rem' }}
                        >
                          <HiOutlineMinus />
                        </button>
                        <span style={{ fontWeight: 600, minWidth: '1.5rem', textAlign: 'center' }}>
                          {cartItem.quantity}
                        </span>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={cartItem.quantity >= product.stock}
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
                    )
                  ) : (
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ width: '100%' }}
                      disabled
                    >
                      Temporarily Unavailable
                    </button>
                  )}
                </div>
              );
            })}
          </div>
            );
          })()
        )}

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

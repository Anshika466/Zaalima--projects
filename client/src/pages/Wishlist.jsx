import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const StarRating = ({ value }) => (
  <span style={{ color: '#f59e0b', fontSize: 13 }}>
    {'★'.repeat(Math.round(value || 0))}{'☆'.repeat(5 - Math.round(value || 0))}
  </span>
);

export default function Wishlist() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.auth);

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState({});
  const [removing, setRemoving] = useState({});

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const { data } = await axios.get(`${API}/auth/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist(data.wishlist || []);
    } catch {
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    setRemoving((prev) => ({ ...prev, [productId]: true }));
    try {
      await axios.delete(`${API}/auth/wishlist/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist((prev) => prev.filter((p) => p._id !== productId));
    } catch {}
    setRemoving((prev) => ({ ...prev, [productId]: false }));
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart({ ...product, quantity: 1 }));
    setAdded((prev) => ({ ...prev, [product._id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [product._id]: false })), 1800);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <div>
          <h1 style={styles.title}>❤️ My Wishlist</h1>
          <p style={styles.subtitle}>{wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading ? (
        <div style={styles.center}>
          <div style={styles.spinner} />
          <p style={{ color: '#9ca3af', marginTop: 16 }}>Loading wishlist…</p>
        </div>
      ) : wishlist.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 72 }}>🤍</div>
          <h2 style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 700, margin: '16px 0 8px' }}>Your wishlist is empty</h2>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>Save products you love by clicking the heart icon</p>
          <button style={styles.shopBtn} onClick={() => navigate('/shop')}>Browse Products</button>
        </div>
      ) : (
        <div style={styles.grid}>
          {wishlist.map((product) => (
            <div key={product._id} style={styles.card}>
              <div style={styles.imgWrap} onClick={() => navigate(`/product/${product._id}`)}>
                <img
                  src={product.image}
                  alt={product.name}
                  style={styles.img}
                  onError={(e) =>
                    (e.target.src =
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200')
                  }
                />
                {product.stock === 0 && <div style={styles.outBadge}>Out of Stock</div>}
                <button
                  style={styles.removeHeart}
                  onClick={(e) => { e.stopPropagation(); handleRemove(product._id); }}
                  disabled={removing[product._id]}
                  title="Remove from wishlist"
                >
                  ❤️
                </button>
              </div>

              <div style={styles.info}>
                <span style={styles.catTag}>{product.category}</span>
                <h3
                  style={styles.prodName}
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  {product.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <StarRating value={product.averageRating || 0} />
                  <span style={{ color: '#6b7280', fontSize: 12 }}>({product.numOfReviews || 0})</span>
                </div>
                <div style={styles.bottomRow}>
                  <span style={styles.price}>₹{product.price?.toLocaleString('en-IN')}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{
                        ...styles.cartBtn,
                        opacity: product.stock === 0 ? 0.5 : 1,
                        cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                      }}
                      disabled={product.stock === 0}
                      onClick={() => handleAddToCart(product)}
                    >
                      {added[product._id] ? '✓ Added' : '🛒 Add'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--gray-50, #f9fafb)',
    padding: '32px 24px 48px',
    fontFamily: "'Outfit','Inter',sans-serif",
    maxWidth: 1100,
    margin: '0 auto',
  },
  header: { display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 32 },
  backBtn: {
    background: 'transparent', color: 'var(--gray-700)',
    border: '1px solid var(--gray-300)', borderRadius: 10,
    padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', marginTop: 8,
  },
  title: { color: 'var(--secondary, #0F172A)', fontSize: 28, fontWeight: 800, margin: '0 0 4px' },
  subtitle: { color: 'var(--gray-500, #6B7280)', fontSize: 14, margin: 0 },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80 },
  spinner: { width: 44, height: 44, border: '4px solid var(--gray-200)', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', textAlign: 'center' },
  shopBtn: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
    border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 15,
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 },
  card: {
    background: '#ffffff', border: '1px solid var(--gray-200)',
    borderRadius: 20, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: 'var(--shadow-sm)',
  },
  imgWrap: { position: 'relative', cursor: 'pointer', background: 'var(--gray-50)' },
  img: { width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' },
  outBadge: {
    position: 'absolute', bottom: 10, left: 10,
    background: 'rgba(239,68,68,0.9)', color: '#fff',
    borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600,
  },
  removeHeart: {
    position: 'absolute', top: 10, right: 10,
    background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
    width: 36, height: 36, fontSize: 18, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s',
    boxShadow: 'var(--shadow-sm)',
  },
  info: { padding: 16 },
  catTag: { background: 'var(--primary-bg, #EEF2FF)', color: 'var(--primary, #4F46E5)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 },
  prodName: { color: 'var(--secondary, #0F172A)', fontSize: 15, fontWeight: 700, margin: '8px 0 4px', cursor: 'pointer', lineHeight: 1.4 },
  bottomRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  price: { color: 'var(--primary, #4F46E5)', fontSize: 18, fontWeight: 800 },
  cartBtn: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
    border: 'none', borderRadius: 8, padding: '8px 14px',
    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
};

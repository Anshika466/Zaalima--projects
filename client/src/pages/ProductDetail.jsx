import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const StarRating = ({ value, interactive = false, onChange }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => interactive && onChange && onChange(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          style={{
            fontSize: interactive ? '28px' : '18px',
            cursor: interactive ? 'pointer' : 'default',
            color: star <= (hovered || value) ? '#f59e0b' : '#d1d5db',
            transition: 'color 0.15s',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, user } = useSelector((s) => s.auth);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  // Wishlist
  const [wishlisted, setWishlisted] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);

  // Review form
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');
  const [reviewErr, setReviewErr] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const isCustomer = user?.role === 'customer';

  useEffect(() => {
    fetchProduct();
    if (token && isCustomer) fetchWishlist();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/products/${id}`);
      setProduct(data.product);
    } catch {
      setError('Product not found.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const { data } = await axios.get(`${API}/auth/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlisted(data.wishlist.some((p) => (p._id || p) === id || (p._id || p).toString() === id));
    } catch {}
  };

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(addToCart({ ...product, quantity: 1 }));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const toggleWishlist = async () => {
    if (!token || !isCustomer) return navigate('/login');
    setWishLoading(true);
    try {
      if (wishlisted) {
        await axios.delete(`${API}/auth/wishlist/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setWishlisted(false);
      } else {
        await axios.post(`${API}/auth/wishlist/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
        setWishlisted(true);
      }
    } catch {}
    setWishLoading(false);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return setReviewErr('Please select a star rating.');
    setReviewSubmitting(true);
    setReviewErr('');
    setReviewMsg('');
    try {
      const { data } = await axios.post(
        `${API}/products/${id}/review`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProduct(data.product);
      setReviewMsg('Review submitted! Thank you.');
      setRating(0);
      setComment('');
    } catch (err) {
      setReviewErr(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const stockColor = product?.stock === 0 ? '#ef4444' : product?.stock <= 5 ? '#f59e0b' : '#10b981';

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.spinner} />
      <p style={{ color: '#9ca3af', marginTop: 16 }}>Loading product…</p>
    </div>
  );

  if (error || !product) return (
    <div style={styles.center}>
      <div style={{ fontSize: 64 }}>😕</div>
      <p style={{ color: '#ef4444', fontSize: 18 }}>{error || 'Product not found.'}</p>
      <button style={styles.backBtn} onClick={() => navigate(-1)}>← Go Back</button>
    </div>
  );

  const hasReviewed = product.reviews?.some((r) => r.userId === user?._id || r.userId?.toString() === user?._id?.toString());

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>

      <div style={styles.card}>
        {/* LEFT — Image */}
        <div style={styles.imageWrapper}>
          <img
            src={product.image}
            alt={product.name}
            style={styles.image}
            onError={(e) => (e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600')}
          />
          {product.stock === 0 && (
            <div style={styles.outOfStock}>Out of Stock</div>
          )}
        </div>

        {/* RIGHT — Details */}
        <div style={styles.details}>
          <div style={styles.categoryBadge}>{product.category}</div>
          <h1 style={styles.productName}>{product.name}</h1>

          {product.storeId?.name && (
            <button
              style={styles.storeLink}
              onClick={() => navigate(`/store/${product.storeId._id}`)}
            >
              🏪 {product.storeId.name}
            </button>
          )}

          <div style={styles.ratingRow}>
            <StarRating value={Math.round(product.averageRating || 0)} />
            <span style={{ color: '#9ca3af', fontSize: 14, marginLeft: 8 }}>
              {product.averageRating ? product.averageRating.toFixed(1) : 'No rating'} · {product.numOfReviews || 0} reviews
            </span>
          </div>

          <div style={styles.price}>₹{product.price?.toLocaleString('en-IN')}</div>

          <div style={{ marginBottom: 16 }}>
            <span style={{ ...styles.stockBadge, background: stockColor + '22', color: stockColor, border: `1px solid ${stockColor}` }}>
              {product.stock === 0 ? 'Out of Stock' : product.stock <= 5 ? `Only ${product.stock} left!` : `${product.stock} in stock`}
            </span>
          </div>

          {product.description && (
            <div style={styles.descBox}>
              <h3 style={styles.sectionTitle}>Description</h3>
              <p style={styles.desc}>{product.description}</p>
            </div>
          )}

          <div style={styles.actionRow}>
            {isCustomer && (
              <>
                <button
                  style={{
                    ...styles.cartBtn,
                    opacity: product.stock === 0 ? 0.5 : 1,
                    cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                  }}
                  disabled={product.stock === 0}
                  onClick={handleAddToCart}
                >
                  {added ? '✓ Added!' : '🛒 Add to Cart'}
                </button>
                <button
                  style={{ ...styles.wishBtn, color: wishlisted ? '#ef4444' : '#9ca3af' }}
                  onClick={toggleWishlist}
                  disabled={wishLoading}
                  title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {wishlisted ? '❤️' : '🤍'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* REVIEWS SECTION */}
      <div style={styles.reviewsSection}>
        <h2 style={styles.reviewsTitle}>Customer Reviews</h2>

        {/* Write a review */}
        {isCustomer && !hasReviewed && (
          <form style={styles.reviewForm} onSubmit={handleReviewSubmit}>
            <h3 style={{ color: 'var(--secondary, #0F172A)', marginBottom: 12, fontSize: 16 }}>Write a Review</h3>
            <StarRating value={rating} interactive onChange={setRating} />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience… (optional)"
              style={styles.reviewTextarea}
              rows={3}
            />
            {reviewErr && <p style={{ color: '#ef4444', fontSize: 13, margin: '4px 0' }}>{reviewErr}</p>}
            {reviewMsg && <p style={{ color: '#10b981', fontSize: 13, margin: '4px 0' }}>{reviewMsg}</p>}
            <button type="submit" style={styles.reviewSubmitBtn} disabled={reviewSubmitting}>
              {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </form>
        )}
        {isCustomer && hasReviewed && (
          <p style={{ color: '#10b981', marginBottom: 16, fontSize: 14 }}>✓ You have already reviewed this product.</p>
        )}

        {/* Review list */}
        {product.reviews?.length === 0 && (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '32px 0' }}>No reviews yet. Be the first!</p>
        )}
        <div style={styles.reviewList}>
          {[...(product.reviews || [])].reverse().map((r, i) => (
            <div key={i} style={styles.reviewCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={styles.avatar}>{r.name?.[0]?.toUpperCase()}</div>
                  <span style={{ color: 'var(--secondary, #0F172A)', fontWeight: 600 }}>{r.name}</span>
                </div>
                <StarRating value={r.rating} />
              </div>
              {r.comment && <p style={{ color: 'var(--gray-700, #374151)', fontSize: 14, lineHeight: 1.5 }}>{r.comment}</p>}
              <p style={{ color: 'var(--gray-400, #9CA3AF)', fontSize: 12, marginTop: 8 }}>
                {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--gray-50, #f9fafb)',
    padding: '32px 16px',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    maxWidth: 1100,
    margin: '0 auto',
  },
  center: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: 'var(--gray-50, #f9fafb)', gap: 16,
  },
  spinner: {
    width: 48, height: 48,
    border: '4px solid var(--gray-200)',
    borderTop: '4px solid var(--primary)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  backBtn: {
    background: 'transparent', color: 'var(--gray-700)', border: '1px solid var(--gray-300)',
    borderRadius: 10, padding: '10px 20px', cursor: 'pointer', marginBottom: 24,
    fontSize: 14, fontFamily: 'inherit', transition: 'background 0.2s',
  },
  card: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40,
    background: '#ffffff', border: '1px solid var(--gray-200)',
    borderRadius: 24, padding: 40, marginBottom: 40,
    boxShadow: 'var(--shadow-md)',
  },
  imageWrapper: { position: 'relative', borderRadius: 20, overflow: 'hidden', background: 'var(--gray-50)' },
  image: { width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' },
  outOfStock: {
    position: 'absolute', top: 16, left: 16,
    background: 'rgba(239,68,68,0.9)', color: '#fff',
    borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600,
  },
  details: { display: 'flex', flexDirection: 'column', gap: 0 },
  categoryBadge: {
    display: 'inline-block', background: 'var(--primary-bg, #EEF2FF)', color: 'var(--primary, #4F46E5)',
    border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: '4px 14px',
    fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 12, alignSelf: 'flex-start',
  },
  productName: {
    color: 'var(--secondary, #0F172A)', fontSize: 28, fontWeight: 800, lineHeight: 1.3, margin: '0 0 12px 0',
  },
  storeLink: {
    background: 'none', border: 'none', color: 'var(--primary, #4F46E5)', cursor: 'pointer',
    fontSize: 14, padding: 0, marginBottom: 12, textDecoration: 'underline', fontFamily: 'inherit',
  },
  ratingRow: { display: 'flex', alignItems: 'center', marginBottom: 16 },
  price: { color: 'var(--primary, #4F46E5)', fontSize: 36, fontWeight: 800, marginBottom: 16 },
  stockBadge: {
    display: 'inline-block', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600,
  },
  descBox: { background: 'var(--gray-50, #f9fafb)', border: '1px solid var(--gray-200)', borderRadius: 12, padding: 16, marginTop: 16, marginBottom: 24 },
  sectionTitle: { color: 'var(--gray-500, #6B7280)', fontSize: 13, fontWeight: 600, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  desc: { color: 'var(--gray-700, #374151)', fontSize: 15, lineHeight: 1.7, margin: 0 },
  actionRow: { display: 'flex', gap: 12, alignItems: 'center', marginTop: 'auto' },
  cartBtn: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
    border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', flex: 1, fontFamily: 'inherit', transition: 'opacity 0.2s, transform 0.1s',
  },
  wishBtn: {
    background: 'transparent', border: '1px solid var(--gray-300)',
    borderRadius: 12, padding: '14px 18px', fontSize: 22, cursor: 'pointer', transition: 'transform 0.2s',
  },
  reviewsSection: { marginTop: 8 },
  reviewsTitle: { color: 'var(--secondary, #0F172A)', fontSize: 22, fontWeight: 700, marginBottom: 24 },
  reviewForm: {
    background: '#ffffff', border: '1px solid var(--gray-200)',
    borderRadius: 16, padding: 24, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12,
    boxShadow: 'var(--shadow-sm)',
  },
  reviewTextarea: {
    background: '#ffffff', border: '1px solid var(--gray-300)',
    color: 'var(--gray-800, #1F2937)', borderRadius: 10, padding: '12px 16px', fontSize: 14,
    fontFamily: 'inherit', resize: 'vertical', outline: 'none',
  },
  reviewSubmitBtn: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
    border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14,
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start',
  },
  reviewList: { display: 'flex', flexDirection: 'column', gap: 16 },
  reviewCard: {
    background: '#ffffff', border: '1px solid var(--gray-200)',
    borderRadius: 16, padding: '20px 24px',
    boxShadow: 'var(--shadow-sm)',
  },
  avatar: {
    width: 38, height: 38, borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', fontWeight: 700, fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};

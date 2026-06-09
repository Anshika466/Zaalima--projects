import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const StarRating = ({ value }) => (
  <span style={{ color: '#f59e0b', fontSize: 14 }}>
    {'★'.repeat(Math.round(value))}{'☆'.repeat(5 - Math.round(value))}
  </span>
);

export default function StorePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [store, setStore]       = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('All');
  const [added, setAdded]       = useState({});

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [storeRes, prodRes] = await Promise.all([
          axios.get(`${API}/stores/${id}`),
          axios.get(`${API}/products/store/${id}`),
        ]);
        setStore(storeRes.data.store);
        setProducts(prodRes.data.products);
      } catch {
        setStore(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const categories = ['All', ...new Set(products.map((p) => p.category))];

  let filtered = products;
  if (category !== 'All') filtered = filtered.filter((p) => p.category === category);
  if (search.trim()) {
    const q = search.toLowerCase();
    const matched = filtered.filter((p) =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
    filtered = matched.length > 0 ? matched : filtered;
  }

  const handleAddToCart = (product) => {
    dispatch(addToCart({ ...product, quantity: 1 }));
    setAdded((prev) => ({ ...prev, [product._id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [product._id]: false })), 1800);
  };

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.spinner} />
    </div>
  );

  if (!store) return (
    <div style={styles.center}>
      <p style={{ color: '#ef4444', fontSize: 20 }}>Store not found.</p>
      <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
    </div>
  );

  return (
    <div style={styles.page}>
      {/* Store Banner */}
      <div style={styles.banner}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <div style={styles.storeIcon}>{store.name?.[0]?.toUpperCase()}</div>
        <h1 style={styles.storeName}>{store.name}</h1>
        {store.description && <p style={styles.storeDesc}>{store.description}</p>}
        <div style={styles.statRow}>
          <div style={styles.stat}><span style={styles.statNum}>{products.length}</span><span style={styles.statLabel}>Products</span></div>
          <div style={styles.stat}><span style={styles.statNum}>{categories.length - 1}</span><span style={styles.statLabel}>Categories</span></div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersRow}>
        <input
          style={styles.searchInput}
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={styles.categoryRow}>
          {categories.map((cat) => (
            <button
              key={cat}
              style={{ ...styles.catBtn, ...(category === cat ? styles.catBtnActive : {}) }}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: 48 }}>No products found.</p>
      ) : (
        <div style={styles.grid}>
          {filtered.map((p) => (
            <div key={p._id} style={styles.productCard}>
              <div style={styles.imgWrap} onClick={() => navigate(`/product/${p._id}`)}>
                <img
                  src={p.image}
                  alt={p.name}
                  style={styles.prodImg}
                  onError={(e) => (e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200')}
                />
                {p.stock === 0 && <div style={styles.outBadge}>Out of Stock</div>}
              </div>
              <div style={styles.prodInfo}>
                <span style={styles.catTag}>{p.category}</span>
                <h3 style={styles.prodName} onClick={() => navigate(`/product/${p._id}`)}>{p.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <StarRating value={p.averageRating || 0} />
                  <span style={{ color: '#6b7280', fontSize: 12 }}>({p.numOfReviews || 0})</span>
                </div>
                <div style={styles.priceRow}>
                  <span style={styles.price}>₹{p.price?.toLocaleString('en-IN')}</span>
                  <button
                    style={{ ...styles.addBtn, opacity: p.stock === 0 ? 0.5 : 1, cursor: p.stock === 0 ? 'not-allowed' : 'pointer' }}
                    disabled={p.stock === 0}
                    onClick={() => handleAddToCart(p)}
                  >
                    {added[p._id] ? '✓' : '+'}
                  </button>
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
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '0 0 48px', fontFamily: "'Outfit','Inter',sans-serif" },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)', gap: 16 },
  spinner: { width: 48, height: 48, border: '4px solid #1e3a5f', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  banner: {
    background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.2) 100%)',
    borderBottom: '1px solid rgba(99,102,241,0.3)',
    padding: '40px 48px', textAlign: 'center', position: 'relative',
  },
  backBtn: {
    position: 'absolute', top: 24, left: 24,
    background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
  },
  storeIcon: {
    width: 80, height: 80, borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', fontSize: 36, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
  },
  storeName: { color: '#f1f5f9', fontSize: 32, fontWeight: 800, margin: '0 0 8px' },
  storeDesc: { color: '#94a3b8', fontSize: 15, margin: '0 auto 24px', maxWidth: 600 },
  statRow: { display: 'flex', justifyContent: 'center', gap: 40 },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  statNum: { color: '#a5b4fc', fontSize: 24, fontWeight: 800 },
  statLabel: { color: '#6b7280', fontSize: 12 },
  filtersRow: { padding: '24px 48px', display: 'flex', flexDirection: 'column', gap: 12 },
  searchInput: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0', borderRadius: 12, padding: '12px 18px', fontSize: 14,
    fontFamily: 'inherit', outline: 'none', maxWidth: 400,
  },
  categoryRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  catBtn: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#9ca3af', borderRadius: 20, padding: '6px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
  },
  catBtnActive: { background: 'rgba(99,102,241,0.3)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.5)' },
  grid: { padding: '0 48px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 },
  productCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' },
  imgWrap: { position: 'relative', overflow: 'hidden', cursor: 'pointer', background: '#0d1117' },
  prodImg: { width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' },
  outBadge: { position: 'absolute', top: 10, left: 10, background: 'rgba(239,68,68,0.9)', color: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600 },
  prodInfo: { padding: 16 },
  catTag: { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 },
  prodName: { color: '#f1f5f9', fontSize: 15, fontWeight: 700, margin: '8px 0 4px', cursor: 'pointer', lineHeight: 1.4 },
  priceRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  price: { color: '#a5b4fc', fontSize: 18, fontWeight: 800 },
  addBtn: {
    width: 34, height: 34, borderRadius: 10,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
    border: 'none', fontSize: 20, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};

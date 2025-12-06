import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchUser, fetchUserItems, fetchUserReviews } from '../api';

function formatPrice(price) {
  return price?.toLocaleString() + '원';
}

const STATUS_MAP = {
  ON_SALE: { label: '판매중', className: 'status-on-sale' },
  RESERVED: { label: '예약중', className: 'status-reserved' },
  SOLD: { label: '판매완료', className: 'status-sold' },
};

export default function SellerProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items'); // items, reviews

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [userData, itemsData, reviewsData] = await Promise.all([
          fetchUser(userId),
          fetchUserItems(userId),
          fetchUserReviews(userId),
        ]);
        setUser(userData);
        setItems(itemsData);
        setReviews(reviewsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  if (loading) return <div className="loading">로딩 중...</div>;
  if (!user) return <div className="error">판매자를 찾을 수 없습니다.</div>;

  return (
    <div className="seller-profile-page">
      {/* 프로필 헤더 */}
      <div className="seller-profile-header">
        <div className="profile-avatar large">{user.username?.charAt(0) || '?'}</div>
        <div className="profile-info">
          <h1>{user.username}</h1>
          <div className="profile-stats">
            <span className="rating">⭐ {user.avg_rating || '0.0'}</span>
            <span className="review-count">리뷰 {user.review_count || 0}개</span>
            <span className="item-count">판매상품 {items.length}개</span>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="seller-profile-tabs">
        <button
          className={`tab ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          판매상품 ({items.length})
        </button>
        <button
          className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          거래후기 ({reviews.length})
        </button>
      </div>

      {/* 판매상품 탭 */}
      {activeTab === 'items' && (
        <div className="seller-items-grid">
          {items.length === 0 ? (
            <div className="empty">등록한 상품이 없습니다.</div>
          ) : (
            items.map((item) => (
              <Link to={`/item/${item.item_id}`} key={item.item_id} className="item-card">
                <div className="item-image">
                  {item.event_option_id ? (
                    <div className="ticket-icon">🎫</div>
                  ) : (
                    <div className="product-icon">📦</div>
                  )}
                  <span className={`status-badge ${STATUS_MAP[item.status]?.className}`}>
                    {STATUS_MAP[item.status]?.label}
                  </span>
                </div>
                <div className="item-info">
                  <h3 className="item-title">{item.title}</h3>
                  <p className="item-price">{formatPrice(item.price)}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* 거래후기 탭 */}
      {activeTab === 'reviews' && (
        <div className="seller-reviews-list">
          {reviews.length === 0 ? (
            <div className="empty">받은 리뷰가 없습니다.</div>
          ) : (
            reviews.map((review) => (
              <div key={review.review_id} className="review-card">
                <div className="review-header">
                  <span className="reviewer-name">{review.reviewer_name}</span>
                  <span className="review-rating">
                    {'⭐'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </span>
                </div>
                {review.comment && (
                  <p className="review-comment">{review.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

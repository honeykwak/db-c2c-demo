import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  fetchUser,
  fetchUserItems,
  fetchUserPurchases,
  fetchUserReviews,
  fetchWishlist,
  updateItemStatus,
  createReview,
} from '../api';

function formatPrice(price) {
  return price?.toLocaleString() + '원';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

const STATUS_MAP = {
  ON_SALE: { label: '판매중', className: 'status-on-sale' },
  RESERVED: { label: '예약중', className: 'status-reserved' },
  SOLD: { label: '판매완료', className: 'status-sold' },
};

export default function MyPage({ currentUserId }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'selling';

  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // 리뷰 작성 모달
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!currentUserId) {
        setLoading(false);
        return;
      }
      try {
        const [userData, itemsData, purchasesData, reviewsData, wishlistData] = await Promise.all([
          fetchUser(currentUserId),
          fetchUserItems(currentUserId),
          fetchUserPurchases(currentUserId),
          fetchUserReviews(currentUserId),
          fetchWishlist(currentUserId),
        ]);
        setUser(userData);
        setItems(itemsData);
        setPurchases(purchasesData);
        setReviews(reviewsData);
        setWishlist(wishlistData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUserId]);

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await updateItemStatus(itemId, newStatus);
      setItems(items.map(item =>
        item.item_id === itemId ? { ...item, status: newStatus } : item
      ));
    } catch (err) {
      console.error(err);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const openReviewModal = (purchase) => {
    setReviewTarget(purchase);
    setReviewForm({ rating: 5, comment: '' });
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewTarget) return;

    setReviewSubmitting(true);
    try {
      await createReview(
        reviewTarget.trans_id,
        currentUserId,
        reviewForm.rating,
        reviewForm.comment
      );
      alert('리뷰가 등록되었습니다!');
      setShowReviewModal(false);
      // 구매 목록 새로고침
      const purchasesData = await fetchUserPurchases(currentUserId);
      setPurchases(purchasesData);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || '리뷰 등록에 실패했습니다.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (!currentUserId) {
    return (
      <div className="mypage">
        <h1>마이페이지</h1>
        <div className="empty">로그인이 필요합니다.</div>
      </div>
    );
  }

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="mypage">
      {/* 프로필 헤더 */}
      <div className="mypage-header">
        <div className="profile-avatar">{user?.username?.charAt(0) || '?'}</div>
        <div className="profile-info">
          <h1>{user?.username}</h1>
          <div className="profile-stats">
            <span className="rating">⭐ {user?.avg_rating || '0.0'}</span>
            <span className="review-count">리뷰 {user?.review_count || 0}개</span>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="mypage-tabs">
        <button
          className={`tab ${activeTab === 'selling' ? 'active' : ''}`}
          onClick={() => setSearchParams({ tab: 'selling' })}
        >
          판매 상품 ({items.length})
        </button>
        <button
          className={`tab ${activeTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setSearchParams({ tab: 'purchases' })}
        >
          구매 내역 ({purchases.length})
        </button>
        <button
          className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setSearchParams({ tab: 'reviews' })}
        >
          받은 리뷰 ({reviews.length})
        </button>
        <button
          className={`tab ${activeTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => setSearchParams({ tab: 'wishlist' })}
        >
          ❤️ 찜한 상품 ({wishlist.length})
        </button>
      </div>

      {/* 판매 상품 탭 */}
      {activeTab === 'selling' && (
        <div className="mypage-content">
          {items.length === 0 ? (
            <div className="empty">
              <p>등록한 상품이 없습니다.</p>
              <Link to="/sell" className="btn btn-primary">판매하기</Link>
            </div>
          ) : (
            <div className="my-items-list">
              {items.map((item) => (
                <div key={item.item_id} className="my-item-card">
                  <Link to={`/item/${item.item_id}`} className="my-item-link">
                    <div className="my-item-icon">
                      {item.event_option_id ? '🎫' : '📦'}
                    </div>
                    <div className="my-item-info">
                      <h3>{item.title}</h3>
                      <p className="price">{formatPrice(item.price)}</p>
                      <p className="date">{formatDate(item.reg_date)}</p>
                    </div>
                  </Link>
                  <div className="my-item-status">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.item_id, e.target.value)}
                      className={STATUS_MAP[item.status]?.className}
                    >
                      <option value="ON_SALE">판매중</option>
                      <option value="RESERVED">예약중</option>
                      <option value="SOLD">판매완료</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 구매 내역 탭 */}
      {activeTab === 'purchases' && (
        <div className="mypage-content">
          {purchases.length === 0 ? (
            <div className="empty">
              <p>구매 내역이 없습니다.</p>
              <Link to="/" className="btn btn-primary">상품 둘러보기</Link>
            </div>
          ) : (
            <div className="purchases-list">
              {purchases.map((purchase) => (
                <div key={purchase.trans_id} className="purchase-card">
                  <div className="purchase-info">
                    <div className="purchase-icon">
                      {purchase.seat_info ? '🎫' : '📦'}
                    </div>
                    <div className="purchase-details">
                      <h3>{purchase.title}</h3>
                      <p className="seller">판매자: {purchase.seller_name}</p>
                      <p className="price">{formatPrice(purchase.final_price)}</p>
                      <p className="date">{formatDate(purchase.trans_date)}</p>
                      {purchase.event_name && (
                        <p className="event-info">
                          {purchase.event_name} / {purchase.venue}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="purchase-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openReviewModal(purchase)}
                    >
                      리뷰 작성
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 받은 리뷰 탭 */}
      {activeTab === 'reviews' && (
        <div className="mypage-content">
          {reviews.length === 0 ? (
            <div className="empty">
              <p>받은 리뷰가 없습니다.</p>
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* 찜한 상품 탭 */}
      {activeTab === 'wishlist' && (
        <div className="mypage-content">
          {wishlist.length === 0 ? (
            <div className="empty">
              <p>찜한 상품이 없습니다.</p>
              <Link to="/" className="btn btn-primary">상품 둘러보기</Link>
            </div>
          ) : (
            <div className="wishlist-grid">
              {wishlist.map((item) => (
                <Link to={`/item/${item.item_id}`} key={item.item_id} className="wishlist-card">
                  <div className="wishlist-image">
                    <div className={item.event_option_id ? 'ticket-icon' : 'product-icon'}>
                      {item.event_option_id ? '🎫' : '📦'}
                    </div>
                    <span className={`status-badge small ${STATUS_MAP[item.status]?.className}`}>
                      {STATUS_MAP[item.status]?.label}
                    </span>
                  </div>
                  <div className="wishlist-info">
                    <h3>{item.title}</h3>
                    <p className="price">{formatPrice(item.price)}</p>
                    <p className="seller">판매자: {item.seller_name}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 리뷰 작성 모달 */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>리뷰 작성</h2>
            <p className="modal-subtitle">
              {reviewTarget?.seller_name}님과의 거래는 어떠셨나요?
            </p>
            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label>평점</label>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`star ${reviewForm.rating >= n ? 'active' : ''}`}
                      onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                    >
                      {reviewForm.rating >= n ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>후기 (선택)</label>
                <textarea
                  placeholder="거래 후기를 작성해주세요"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowReviewModal(false)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={reviewSubmitting}
                >
                  {reviewSubmitting ? '등록 중...' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

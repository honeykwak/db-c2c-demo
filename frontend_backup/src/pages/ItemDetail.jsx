import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchItem, createChatRoom, createTransaction, fetchUser, checkWishlist, addToWishlist, removeFromWishlist } from '../api';

function formatPrice(price) {
  return price?.toLocaleString() + '원';
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const STATUS_MAP = {
  ON_SALE: { label: '판매중', className: 'status-on-sale' },
  RESERVED: { label: '예약중', className: 'status-reserved' },
  SOLD: { label: '판매완료', className: 'status-sold' },
};

const SPEC_LABELS = {
  color: '색상',
  ram_gb: 'RAM',
  storage_gb: '저장공간',
  screen_size: '화면크기',
  battery_mah: '배터리',
  weight_g: '무게',
  cpu: 'CPU',
  gpu: 'GPU',
  os: '운영체제',
  resolution: '해상도',
};

function formatSpecLabel(key) {
  return SPEC_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatSpecValue(key, value) {
  if (key === 'ram_gb') return `${value}GB`;
  if (key === 'storage_gb') return `${value}GB`;
  if (key === 'battery_mah') return `${value}mAh`;
  if (key === 'weight_g') return `${value}g`;
  if (key === 'screen_size') return `${value}인치`;
  if (typeof value === 'boolean') return value ? '예' : '아니오';
  return String(value);
}

// 카테고리/브랜드별 아이콘 매핑
function getItemIcon(item) {
  // 티켓인 경우 - 아티스트/장르에 따라 다른 아이콘
  if (item.event_option_id) {
    const title = item.title?.toLowerCase() || '';
    if (title.includes('bts') || title.includes('방탄')) return '💜';
    if (title.includes('블핑') || title.includes('블랙핑크')) return '🖤';
    if (title.includes('뉴진스')) return '🐰';
    if (title.includes('아이유')) return '🎤';
    if (title.includes('싸이') || title.includes('흠뻑')) return '💦';
    if (title.includes('임영웅')) return '👑';
    if (title.includes('세븐틴')) return '💎';
    if (title.includes('에스파')) return '🌌';
    if (title.includes('악뮤') || title.includes('악동')) return '🎸';
    if (title.includes('아이브')) return '💗';
    return '🎫';
  }

  // 일반 상품 - 브랜드/카테고리에 따라 다른 아이콘
  const title = item.title?.toLowerCase() || '';
  const brand = item.brand_name?.toLowerCase() || '';
  const model = item.model_name?.toLowerCase() || '';

  // 브랜드 기반
  if (brand.includes('apple') || brand.includes('애플') || title.includes('아이폰') || title.includes('맥북') || title.includes('에어팟')) return '🍎';
  if (brand.includes('samsung') || brand.includes('삼성') || title.includes('갤럭시')) return '📱';
  if (brand.includes('lg') || brand.includes('엘지')) return '🖥️';
  if (brand.includes('sony') || brand.includes('소니')) return '🎮';
  if (brand.includes('nintendo') || brand.includes('닌텐도')) return '🕹️';
  if (brand.includes('dyson') || brand.includes('다이슨')) return '🌀';

  // 제품 종류 기반
  if (title.includes('노트북') || title.includes('맥북') || model.includes('macbook')) return '💻';
  if (title.includes('태블릿') || title.includes('아이패드') || title.includes('갤탭')) return '📱';
  if (title.includes('이어폰') || title.includes('에어팟') || title.includes('버즈') || title.includes('헤드폰')) return '🎧';
  if (title.includes('키보드')) return '⌨️';
  if (title.includes('마우스')) return '🖱️';
  if (title.includes('모니터') || title.includes('tv') || title.includes('티비')) return '🖥️';
  if (title.includes('카메라') || title.includes('캠')) return '📷';
  if (title.includes('스피커') || title.includes('사운드바')) return '🔊';
  if (title.includes('게임') || title.includes('플스') || title.includes('스위치')) return '🎮';
  if (title.includes('시계') || title.includes('워치')) return '⌚';
  if (title.includes('냉장고')) return '🧊';
  if (title.includes('세탁기')) return '🧺';
  if (title.includes('청소기')) return '🧹';
  if (title.includes('에어컨')) return '❄️';
  if (title.includes('의자') || title.includes('책상')) return '🪑';
  if (title.includes('자전거')) return '🚲';
  if (title.includes('캠핑')) return '⛺';

  // 카테고리 기반 (fallback)
  if (item.category_id === 1 || item.category_id === 4 || item.category_id === 5) return '📱';
  if (item.category_id === 2 || item.category_id === 6) return '🏠';

  return '📦';
}

export default function ItemDetail({ currentUserId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isWished, setIsWished] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchItem(id);
        setItem(data);
        // 판매자 정보 (평점 포함)
        const sellerData = await fetchUser(data.seller_id);
        setSeller(sellerData);
      } catch (err) {
        console.error(err);
        setError('상품을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // 찜 상태 확인
  useEffect(() => {
    async function checkWish() {
      if (!currentUserId || !id) return;
      try {
        const wished = await checkWishlist(currentUserId, id);
        setIsWished(wished);
      } catch (err) {
        console.error(err);
      }
    }
    checkWish();
  }, [currentUserId, id]);

  const handleWishToggle = async () => {
    if (!currentUserId) {
      alert('로그인이 필요합니다.');
      return;
    }
    setWishLoading(true);
    try {
      if (isWished) {
        await removeFromWishlist(currentUserId, item.item_id);
        setIsWished(false);
      } else {
        await addToWishlist(currentUserId, item.item_id);
        setIsWished(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWishLoading(false);
    }
  };

  const handleChat = async () => {
    if (!currentUserId) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (currentUserId === item.seller_id) {
      alert('자신의 상품입니다.');
      return;
    }
    setActionLoading(true);
    try {
      const room = await createChatRoom(item.item_id, currentUserId);
      navigate(`/chat/${room.room_id}`);
    } catch (err) {
      console.error(err);
      alert('채팅방 생성에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!currentUserId) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (currentUserId === item.seller_id) {
      alert('자신의 상품은 구매할 수 없습니다.');
      return;
    }
    if (item.status !== 'ON_SALE') {
      alert('판매중인 상품이 아닙니다.');
      return;
    }
    if (!confirm(`${formatPrice(item.price)}에 구매하시겠습니까?`)) return;

    setActionLoading(true);
    try {
      const trans = await createTransaction(item.item_id, currentUserId, item.price);
      alert('구매가 완료되었습니다!');
      navigate(`/mypage?tab=purchases`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || '구매에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!item) return null;

  const isTicket = item.event_option_id != null;
  const isMyItem = currentUserId === item.seller_id;

  return (
    <div className="item-detail-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← 뒤로
      </button>

      <div className="item-detail-container">
        {/* 이미지/아이콘 영역 */}
        <div className="item-detail-image">
          <div className={isTicket ? 'ticket-icon-large' : 'product-icon-large'}>
            {getItemIcon(item)}
          </div>
        </div>

        {/* 정보 영역 */}
        <div className="item-detail-info">
          <span className={`status-badge large ${STATUS_MAP[item.status]?.className}`}>
            {STATUS_MAP[item.status]?.label}
          </span>

          <div className="item-detail-header">
            <h1 className="item-detail-title">{item.title}</h1>
            <button
              className={`wish-btn ${isWished ? 'active' : ''}`}
              onClick={handleWishToggle}
              disabled={wishLoading}
            >
              <span className="wish-icon">{isWished ? '❤️' : '🤍'}</span>
              <span className="wish-text">{isWished ? '찜완료' : '찜하기'}</span>
            </button>
          </div>
          <p className="item-detail-price">{formatPrice(item.price)}</p>

          {/* 티켓 정보 */}
          {isTicket && (
            <div className="ticket-info-box">
              <h3>🎭 공연 정보</h3>
              <div className="info-row">
                <span className="label">공연명</span>
                <span className="value">{item.event_name}</span>
              </div>
              <div className="info-row">
                <span className="label">아티스트</span>
                <span className="value">{item.artist_name}</span>
              </div>
              <div className="info-row">
                <span className="label">장소</span>
                <span className="value">{item.venue}</span>
              </div>
              <div className="info-row">
                <span className="label">일시</span>
                <span className="value">{formatDateTime(item.event_datetime)}</span>
              </div>
              {item.seat_info && (
                <>
                  <h3>💺 좌석 정보</h3>
                  <div className="info-row">
                    <span className="label">등급</span>
                    <span className="value">{item.seat_info.grade}석</span>
                  </div>
                  <div className="info-row">
                    <span className="label">구역</span>
                    <span className="value">{item.seat_info.sector}구역</span>
                  </div>
                  <div className="info-row">
                    <span className="label">열/번호</span>
                    <span className="value">{item.seat_info.row}열 {item.seat_info.number}번</span>
                  </div>
                </>
              )}
              {item.original_price && (
                <div className="info-row highlight">
                  <span className="label">정가</span>
                  <span className="value">{formatPrice(item.original_price)}</span>
                </div>
              )}
            </div>
          )}

          {/* SKU 상품 정보 */}
          {item.product_code && (
            <div className="sku-info-box">
              <h3>📋 제품 정보</h3>
              <div className="info-row">
                <span className="label">SKU</span>
                <span className="value">{item.product_code}</span>
              </div>
              <div className="info-row">
                <span className="label">브랜드</span>
                <span className="value">{item.brand_name}</span>
              </div>
              <div className="info-row">
                <span className="label">모델명</span>
                <span className="value">{item.model_name}</span>
              </div>
              {item.specs && (
                <div className="specs-box">
                  <h4>상세 스펙</h4>
                  <div className="specs-list">
                    {Object.entries(item.specs).map(([key, value]) => (
                      <div className="spec-item" key={key}>
                        <span className="spec-label">{formatSpecLabel(key)}</span>
                        <span className="spec-value">{formatSpecValue(key, value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 카테고리 */}
          {item.category_name && (
            <p className="item-category">카테고리: {item.category_name}</p>
          )}

          {/* 설명 */}
          {item.description && (
            <div className="item-description">
              <h3>상품 설명</h3>
              <p>{item.description}</p>
            </div>
          )}

          {/* 판매자 정보 */}
          {seller && (
            <Link to={`/seller/${seller.user_id}`} className="seller-info-box clickable">
              <h3>👤 판매자 정보</h3>
              <div className="seller-row">
                <span className="seller-name">{seller.username}</span>
                <span className="seller-rating">
                  ⭐ {seller.avg_rating} ({seller.review_count}개 리뷰)
                </span>
              </div>
              <span className="view-profile">프로필 보기 →</span>
            </Link>
          )}

          {/* 액션 버튼 */}
          <div className="item-actions">
            {!isMyItem && item.status === 'ON_SALE' && (
              <>
                <button
                  className="btn btn-primary"
                  onClick={handleBuy}
                  disabled={actionLoading}
                >
                  {actionLoading ? '처리중...' : '바로 구매'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleChat}
                  disabled={actionLoading}
                >
                  채팅하기
                </button>
              </>
            )}
            {isMyItem && (
              <Link to="/mypage" className="btn btn-secondary">
                내 상품 관리
              </Link>
            )}
            {item.status === 'SOLD' && (
              <p className="sold-notice">이미 판매완료된 상품입니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

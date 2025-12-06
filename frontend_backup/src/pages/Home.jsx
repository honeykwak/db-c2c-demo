import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchItems, fetchEvents, fetchEventOptions, fetchCategories } from '../api';

function formatPrice(price) {
  return price?.toLocaleString() + '원';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const STATUS_MAP = {
  ON_SALE: { label: '판매중', className: 'status-on-sale' },
  RESERVED: { label: '예약중', className: 'status-reserved' },
  SOLD: { label: '판매완료', className: 'status-sold' },
};

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
  if (item.category_id === 1 || item.category_id === 4 || item.category_id === 5) return '📱'; // 디지털기기
  if (item.category_id === 2 || item.category_id === 6) return '🏠'; // 가전

  return '📦';
}

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // 필터
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [eventOptions, setEventOptions] = useState([]);
  const [selectedEventOption, setSelectedEventOption] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [evts, cats] = await Promise.all([fetchEvents(), fetchCategories()]);
        setEvents(evts);
        setCategories(cats);
      } catch (err) {
        console.error(err);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    async function loadEventOptions() {
      if (!selectedEvent) {
        setEventOptions([]);
        setSelectedEventOption('');
        return;
      }
      try {
        const opts = await fetchEventOptions(selectedEvent);
        setEventOptions(opts);
      } catch (err) {
        console.error(err);
      }
    }
    loadEventOptions();
  }, [selectedEvent]);

  // 페이지 또는 필터 변경시 데이터 로드
  useEffect(() => {
    async function loadItems() {
      setLoading(true);
      setError('');
      try {
        const params = { page: currentPage, limit: 20 };
        if (search) params.search = search;
        if (selectedCategory) params.category = selectedCategory;
        if (selectedEventOption) params.event_option_id = selectedEventOption;
        if (activeTab === 'ticket') params.type = 'ticket';
        if (activeTab === 'product') params.type = 'product';
        if (statusFilter !== 'all') params.status = statusFilter;

        const data = await fetchItems(params);
        setItems(data.items || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      } catch (err) {
        console.error(err);
        setError('상품을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }
    loadItems();
  }, [currentPage, search, selectedCategory, selectedEventOption, activeTab, statusFilter]);

  // 필터 변경시 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedEventOption, activeTab, statusFilter]);

  // 정렬 (클라이언트 사이드) - 필터는 서버에서 처리됨
  const filteredItems = [...items].sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    return b.item_id - a.item_id;
  });

  // 페이지 번호 생성
  const getPageNumbers = () => {
    const pages = [];
    const { totalPages } = pagination;
    const current = currentPage;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (current >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="home-page">
      {/* 히어로 섹션 */}
      <section className="hero">
        <div className="hero-decoration">
          <span className="floating-icon icon-1">🎫</span>
          <span className="floating-icon icon-2">📱</span>
          <span className="floating-icon icon-3">🎸</span>
          <span className="floating-icon icon-4">💻</span>
          <span className="floating-icon icon-5">🎧</span>
          <span className="floating-icon icon-6">📦</span>
        </div>
        <div className="hero-content">
          <h1>티켓과 중고상품을 한곳에서</h1>
          <p>공연 티켓부터 전자기기까지, 안전한 거래를 시작하세요</p>
          <div className="hero-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="공연명, 상품명, SKU 코드로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="hero-tags">
            <span className="hero-tag">#콘서트티켓</span>
            <span className="hero-tag">#아이폰</span>
            <span className="hero-tag">#갤럭시</span>
            <span className="hero-tag">#에어팟</span>
          </div>
        </div>
      </section>

      {/* 탭 */}
      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            전체
          </button>
          <button
            className={`tab ${activeTab === 'ticket' ? 'active' : ''}`}
            onClick={() => setActiveTab('ticket')}
          >
            티켓
          </button>
          <button
            className={`tab ${activeTab === 'product' ? 'active' : ''}`}
            onClick={() => setActiveTab('product')}
          >
            일반상품
          </button>
        </div>
      </div>

      {/* 상태 필터 + 정렬 */}
      <div className="filter-sort-row">
        <div className="status-filters">
          <button
            className={`status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            전체
          </button>
          <button
            className={`status-filter-btn on-sale ${statusFilter === 'ON_SALE' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ON_SALE')}
          >
            판매중
          </button>
          <button
            className={`status-filter-btn reserved ${statusFilter === 'RESERVED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('RESERVED')}
          >
            예약중
          </button>
          <button
            className={`status-filter-btn sold ${statusFilter === 'SOLD' ? 'active' : ''}`}
            onClick={() => setStatusFilter('SOLD')}
          >
            판매완료
          </button>
        </div>
        <div className="sort-select">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="latest">최신순</option>
            <option value="price_low">낮은 가격순</option>
            <option value="price_high">높은 가격순</option>
          </select>
        </div>
      </div>

      {/* 필터 */}
      <div className="filters">
        {activeTab === 'ticket' && (
          <>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <option value="">공연 선택</option>
              {events.map((ev) => (
                <option key={ev.event_id} value={ev.event_id}>
                  {ev.event_name} - {ev.artist_name}
                </option>
              ))}
            </select>
            {selectedEvent && (
              <select
                value={selectedEventOption}
                onChange={(e) => setSelectedEventOption(e.target.value)}
              >
                <option value="">회차 선택</option>
                {eventOptions.map((opt) => (
                  <option key={opt.event_option_id} value={opt.event_option_id}>
                    {opt.venue} / {formatDate(opt.event_datetime)}
                  </option>
                ))}
              </select>
            )}
          </>
        )}
        {activeTab === 'product' && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">카테고리 전체</option>
            {categories
              .filter((cat) => cat.category_name !== '티켓')
              .map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
          </select>
        )}
      </div>

      {/* 상품 개수 */}
      {!loading && (
        <div className="items-count">
          총 <strong>{pagination.total}</strong>개 상품
        </div>
      )}

      {/* 상품 리스트 */}
      {loading && <div className="loading">로딩 중...</div>}
      {error && <div className="error">{error}</div>}

      <div className="items-grid">
        {filteredItems.map((item) => (
          <Link to={`/item/${item.item_id}`} key={item.item_id} className="item-card">
            <div className="item-image">
              <div className={item.event_option_id ? 'ticket-icon' : 'product-icon'}>
                {getItemIcon(item)}
              </div>
              <span className={`status-badge ${STATUS_MAP[item.status]?.className}`}>
                {STATUS_MAP[item.status]?.label}
              </span>
            </div>
            <div className="item-info">
              <h3 className="item-title">{item.title}</h3>
              <p className="item-price">{formatPrice(item.price)}</p>
              {item.event_option_id && item.seat_info && (
                <p className="item-meta">
                  {item.seat_info.grade}석 {item.seat_info.sector}구역
                </p>
              )}
              {item.product_code && (
                <p className="item-meta sku">SKU: {item.product_code}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {!loading && filteredItems.length === 0 && (
        <div className="empty">등록된 상품이 없습니다.</div>
      )}

      {/* 페이지네이션 */}
      {!loading && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            «
          </button>
          <button
            className="page-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>

          {getPageNumbers().map((page, idx) => (
            page === '...' ? (
              <span key={`dots-${idx}`} className="page-dots">...</span>
            ) : (
              <button
                key={page}
                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            )
          ))}

          <button
            className="page-btn"
            onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={currentPage === pagination.totalPages}
          >
            ›
          </button>
          <button
            className="page-btn"
            onClick={() => setCurrentPage(pagination.totalPages)}
            disabled={currentPage === pagination.totalPages}
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}

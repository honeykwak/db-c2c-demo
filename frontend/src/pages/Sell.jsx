import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchCategories,
  fetchEvents,
  fetchEventOptions,
  autocompleteProducts,
  createItem,
} from '../api';

export default function Sell({ currentUserId }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('ticket'); // ticket, sku, general
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventOptions, setEventOptions] = useState([]);

  // 공통 폼
  const [form, setForm] = useState({
    title: '',
    price: '',
    categoryId: '',
    description: '',
  });

  // SKU 검색
  const [skuQuery, setSkuQuery] = useState('');
  const [skuSuggestions, setSkuSuggestions] = useState([]);
  const [selectedSku, setSelectedSku] = useState(null);

  // 티켓 정보
  const [selectedEventId, setSelectedEventId] = useState('');
  const [ticket, setTicket] = useState({
    event_option_id: '',
    original_price: '',
    seat_grade: '',
    seat_sector: '',
    seat_row: '',
    seat_number: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    async function loadInitial() {
      try {
        const [cats, evts] = await Promise.all([fetchCategories(), fetchEvents()]);
        setCategories(cats);
        setEvents(evts);
      } catch (err) {
        console.error(err);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    async function loadEventOptions() {
      if (!selectedEventId) {
        setEventOptions([]);
        return;
      }
      try {
        const opts = await fetchEventOptions(selectedEventId);
        setEventOptions(opts);
      } catch (err) {
        console.error(err);
      }
    }
    loadEventOptions();
  }, [selectedEventId]);

  useEffect(() => {
    async function loadSku() {
      if (!skuQuery || mode !== 'sku') {
        setSkuSuggestions([]);
        return;
      }
      try {
        const data = await autocompleteProducts(skuQuery);
        setSkuSuggestions(data);
      } catch (err) {
        console.error(err);
      }
    }
    const handle = setTimeout(loadSku, 250);
    return () => clearTimeout(handle);
  }, [skuQuery, mode]);

  // 티켓 가격 제한 체크
  const checkPriceLimit = () => {
    if (mode === 'ticket' && ticket.original_price && form.price) {
      const maxPrice = Number(ticket.original_price) * 1.2;
      if (Number(form.price) > maxPrice) {
        return `암표 방지: 판매가는 정가의 120%(${maxPrice.toLocaleString()}원)를 초과할 수 없습니다.`;
      }
    }
    return null;
  };

  const priceWarning = checkPriceLimit();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUserId) {
      setMessage({ type: 'error', text: '로그인이 필요합니다.' });
      return;
    }

    if (priceWarning) {
      setMessage({ type: 'error', text: priceWarning });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        seller_id: currentUserId,
        title: form.title,
        price: Number(form.price),
        category_id: form.categoryId ? Number(form.categoryId) : null,
        description: form.description || null,
      };

      if (mode === 'sku') {
        payload.std_id = selectedSku?.std_id || null;
      }

      if (mode === 'ticket') {
        payload.ticket = {
          event_option_id: Number(ticket.event_option_id),
          original_price: Number(ticket.original_price),
          seat_info: {
            grade: ticket.seat_grade,
            sector: ticket.seat_sector,
            row: Number(ticket.seat_row),
            number: Number(ticket.seat_number),
          },
        };
      }

      const result = await createItem(payload);
      setMessage({ type: 'success', text: '등록이 완료되었습니다!' });
      setTimeout(() => {
        navigate(`/item/${result.item_id}`);
      }, 1000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || '등록에 실패했습니다.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sell-page">
      <h1>판매하기</h1>
      <p className="sell-page-subtitle">판매할 상품의 유형을 선택하고 정보를 입력해주세요</p>

      {/* 판매 유형 선택 */}
      <div className="sell-mode-tabs">
        <button
          className={`mode-tab ${mode === 'ticket' ? 'active' : ''}`}
          onClick={() => setMode('ticket')}
        >
          <span className="tab-icon">🎫</span>
          <span>티켓 판매</span>
          <span className="tab-desc">콘서트, 공연 티켓</span>
        </button>
        <button
          className={`mode-tab ${mode === 'sku' ? 'active' : ''}`}
          onClick={() => setMode('sku')}
        >
          <span className="tab-icon">📱</span>
          <span>SKU 상품</span>
          <span className="tab-desc">전자기기, 브랜드 제품</span>
        </button>
        <button
          className={`mode-tab ${mode === 'general' ? 'active' : ''}`}
          onClick={() => setMode('general')}
        >
          <span className="tab-icon">📦</span>
          <span>일반 상품</span>
          <span className="tab-desc">기타 중고물품</span>
        </button>
      </div>

      <form className="sell-form" onSubmit={handleSubmit}>
        {/* 티켓 전용 필드 */}
        {mode === 'ticket' && (
          <div className="form-section">
            <h2>공연 정보</h2>
            <div className="form-group">
              <label>공연 선택 *</label>
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setTicket({ ...ticket, event_option_id: '' });
                }}
                required
              >
                <option value="">공연을 선택하세요</option>
                {events.map((ev) => (
                  <option key={ev.event_id} value={ev.event_id}>
                    {ev.event_name} - {ev.artist_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedEventId && (
              <div className="form-group">
                <label>회차 선택 *</label>
                <select
                  value={ticket.event_option_id}
                  onChange={(e) => setTicket({ ...ticket, event_option_id: e.target.value })}
                  required
                >
                  <option value="">회차를 선택하세요</option>
                  {eventOptions.map((opt) => (
                    <option key={opt.event_option_id} value={opt.event_option_id}>
                      {opt.venue} / {new Date(opt.event_datetime).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <h2>좌석 정보</h2>
            <div className="form-row">
              <div className="form-group">
                <label>좌석 등급 *</label>
                <input
                  type="text"
                  placeholder="VIP, R, S, A 등"
                  value={ticket.seat_grade}
                  onChange={(e) => setTicket({ ...ticket, seat_grade: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>구역 *</label>
                <input
                  type="text"
                  placeholder="A, B, C 등"
                  value={ticket.seat_sector}
                  onChange={(e) => setTicket({ ...ticket, seat_sector: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>열 *</label>
                <input
                  type="number"
                  placeholder="1"
                  value={ticket.seat_row}
                  onChange={(e) => setTicket({ ...ticket, seat_row: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>번호 *</label>
                <input
                  type="number"
                  placeholder="1"
                  value={ticket.seat_number}
                  onChange={(e) => setTicket({ ...ticket, seat_number: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>티켓 정가 *</label>
              <input
                type="number"
                placeholder="정가를 입력하세요"
                value={ticket.original_price}
                onChange={(e) => setTicket({ ...ticket, original_price: e.target.value })}
                required
              />
              <small className="hint">암표 방지: 판매가는 정가의 120%까지만 설정 가능합니다.</small>
            </div>
          </div>
        )}

        {/* SKU 상품 전용 필드 */}
        {mode === 'sku' && (
          <div className="form-section">
            <h2>제품 정보 (SKU)</h2>
            <div className="form-group">
              <label>제품 코드 검색 *</label>
              <input
                type="text"
                placeholder="제품 코드나 모델명을 입력하세요 (예: SM-R177)"
                value={skuQuery}
                onChange={(e) => {
                  setSkuQuery(e.target.value);
                  setSelectedSku(null);
                }}
              />
              {skuSuggestions.length > 0 && (
                <ul className="sku-suggestions">
                  {skuSuggestions.map((p) => (
                    <li key={p.std_id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSku(p);
                          setSkuQuery(p.product_code);
                          setSkuSuggestions([]);
                        }}
                      >
                        <strong>{p.product_code}</strong>
                        <span>{p.brand_name} {p.model_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {selectedSku && (
                <div className="selected-sku">
                  ✅ 선택됨: {selectedSku.product_code} - {selectedSku.brand_name} {selectedSku.model_name}
                </div>
              )}
              <small className="hint">SKU 기반으로 동일 제품을 정확하게 식별합니다.</small>
            </div>
          </div>
        )}

        {/* 공통 필드 */}
        <div className="form-section">
          <h2>상품 정보</h2>
          <div className="form-group">
            <label>제목 *</label>
            <input
              type="text"
              placeholder="상품 제목을 입력하세요"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>가격 *</label>
            <input
              type="number"
              placeholder="가격을 입력하세요"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            {priceWarning && <small className="warning">{priceWarning}</small>}
          </div>

          <div className="form-group">
            <label>카테고리</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">선택 안 함</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>상품 설명</label>
            <textarea
              placeholder="상품에 대한 상세 설명을 입력하세요"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
            />
          </div>
        </div>

        {/* 메시지 */}
        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        {/* 제출 버튼 */}
        <button type="submit" className="btn btn-primary btn-large" disabled={submitting}>
          {submitting ? '등록 중...' : '판매 등록'}
        </button>
      </form>
    </div>
  );
}

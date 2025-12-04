import React, { useEffect, useMemo, useState } from 'react';
import {
  autocompleteProducts,
  createItem,
  fetchCategories,
  fetchEventOptions,
  fetchEvents,
  fetchItems,
} from './api';

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`tab-button ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ItemsList({ filters, onFiltersChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);

  const params = useMemo(
    () => ({
      search: filters.search || undefined,
      category: filters.categoryId || undefined,
      event_option_id: filters.eventOptionId || undefined,
      seat_sector: filters.seatSector || undefined,
    }),
    [filters],
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchItems(params);
        setItems(data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        setError('상품 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      }
    }
    loadCategories();
  }, []);

  return (
    <div className="panel">
      <h2>상품 목록</h2>
      <div className="filters">
        <input
          type="text"
          placeholder="검색어 (아이폰, 갤럭시 등)"
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
        />
        <select
          value={filters.categoryId || ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              categoryId: e.target.value ? Number(e.target.value) : null,
            })
          }
        >
          <option value="">카테고리 전체</option>
          {categories.map((c) => (
            <option key={c.category_id} value={c.category_id}>
              {c.category_id}. {c.category_name}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="이벤트 옵션 ID"
          value={filters.eventOptionId || ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              eventOptionId: e.target.value ? Number(e.target.value) : null,
            })
          }
        />
        <input
          type="text"
          placeholder="좌석 섹터 (예: A)"
          value={filters.seatSector}
          onChange={(e) =>
            onFiltersChange({ ...filters, seatSector: e.target.value })
          }
        />
      </div>
      {loading && <p>불러오는 중...</p>}
      {error && <p className="error">{error}</p>}
      <table className="items-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>제목</th>
            <th>가격</th>
            <th>카테고리</th>
            <th>SKU</th>
            <th>이벤트 옵션</th>
            <th>좌석 정보(JSONB)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.item_id}>
              <td>{item.item_id}</td>
              <td>{item.title}</td>
              <td>{item.price?.toLocaleString()}</td>
              <td>{item.category_id ?? '-'}</td>
              <td>
                {item.product_code
                  ? `${item.product_code} / ${item.model_name}`
                  : '-'}
              </td>
              <td>{item.event_option_id ?? '-'}</td>
              <td>
                {item.seat_info
                  ? JSON.stringify(item.seat_info)
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ItemForm() {
  const [mode, setMode] = useState('general'); // general | sku | ticket
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventOptions, setEventOptions] = useState([]);

  const [form, setForm] = useState({
    title: '',
    price: '',
    categoryId: '',
    stdId: '',
  });

  const [skuQuery, setSkuQuery] = useState('');
  const [skuSuggestions, setSkuSuggestions] = useState([]);
  const [selectedSku, setSelectedSku] = useState(null);

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
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadInitial() {
      try {
        const [cats, evts] = await Promise.all([
          fetchCategories(),
          fetchEvents(),
        ]);
        setCategories(cats);
        setEvents(evts);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    async function loadOptions() {
      if (!selectedEventId) {
        setEventOptions([]);
        return;
      }
      try {
        const options = await fetchEventOptions(selectedEventId);
        setEventOptions(options);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      }
    }
    loadOptions();
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
        // eslint-disable-next-line no-console
        console.error(err);
      }
    }
    const handle = setTimeout(loadSku, 250);
    return () => clearTimeout(handle);
  }, [skuQuery, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      // 카테고리 ID 결정: 티켓 모드는 자동으로 '티켓' 카테고리 사용
      let categoryId = null;
      if (mode === 'ticket') {
        const ticketCategory =
          categories.find((c) => c.category_name === '티켓') ||
          categories.find((c) => c.category_name.includes('티켓')) ||
          null;
        categoryId = ticketCategory ? ticketCategory.category_id : 3; // fallback: 3
      } else if (form.categoryId) {
        categoryId = Number(form.categoryId);
      }

      const payload = {
        seller_id: 1,
        title: form.title,
        price: Number(form.price),
        category_id: categoryId,
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
      setMessage(`등록 성공 (item_id=${result.item_id})`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      const errorMsg = err.response?.data?.error || '등록에 실패했습니다.';
      setMessage(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="panel">
      <h2>상품 등록</h2>
      <div className="mode-toggle">
        <TabButton active={mode === 'general'} onClick={() => setMode('general')}>
          일반 상품
        </TabButton>
        <TabButton active={mode === 'sku'} onClick={() => setMode('sku')}>
          SKU 기반 상품
        </TabButton>
        <TabButton active={mode === 'ticket'} onClick={() => setMode('ticket')}>
          티켓 상품
        </TabButton>
      </div>

      <form className="item-form" onSubmit={handleSubmit}>
        <label>
          제목
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </label>

        <label>
          가격
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
        </label>

        {mode !== 'ticket' && (
          <label>
            카테고리
            <select
              value={form.categoryId}
              onChange={(e) =>
                setForm({ ...form, categoryId: e.target.value || '' })
              }
            >
              <option value="">선택 안 함</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_id}. {c.category_name}
                </option>
              ))}
            </select>
          </label>
        )}

        {mode === 'sku' && (
          <div className="sku-section">
            <label>
              제품 코드 검색
              <input
                type="text"
                value={skuQuery}
                onChange={(e) => {
                  setSkuQuery(e.target.value);
                  setSelectedSku(null);
                }}
                placeholder="예: SM-"
              />
            </label>
            {skuSuggestions.length > 0 && (
              <ul className="sku-list">
                {skuSuggestions.map((p) => (
                  <li key={p.std_id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSku(p);
                        setSkuQuery(p.product_code);
                      }}
                    >
                      {p.product_code} / {p.brand_name} {p.model_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selectedSku && (
              <p className="hint">
                선택된 SKU: {selectedSku.product_code} / {selectedSku.model_name}
              </p>
            )}
          </div>
        )}

        {mode === 'ticket' && (
          <div className="ticket-section">
            <label>
              이벤트
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value || '');
                  setTicket({ ...ticket, event_option_id: '' });
                }}
              >
                <option value="">선택</option>
                {events.map((ev) => (
                  <option key={ev.event_id} value={ev.event_id}>
                    {ev.event_id}. {ev.event_name} ({ev.artist_name})
                  </option>
                ))}
              </select>
            </label>

            <label>
              이벤트 옵션
              <select
                value={ticket.event_option_id}
                onChange={(e) =>
                  setTicket({ ...ticket, event_option_id: e.target.value })
                }
              >
                <option value="">선택</option>
                {eventOptions.map((opt) => (
                  <option key={opt.event_option_id} value={opt.event_option_id}>
                    {opt.event_option_id}. {opt.venue} /{' '}
                    {new Date(opt.event_datetime).toLocaleString()}
                  </option>
                ))}
              </select>
            </label>

            <div className="ticket-grid">
              <label>
                좌석 등급
                <input
                  type="text"
                  value={ticket.seat_grade}
                  onChange={(e) =>
                    setTicket({ ...ticket, seat_grade: e.target.value })
                  }
                />
              </label>
              <label>
                구역
                <input
                  type="text"
                  value={ticket.seat_sector}
                  onChange={(e) =>
                    setTicket({ ...ticket, seat_sector: e.target.value })
                  }
                />
              </label>
              <label>
                열
                <input
                  type="number"
                  value={ticket.seat_row}
                  onChange={(e) =>
                    setTicket({ ...ticket, seat_row: e.target.value })
                  }
                />
              </label>
              <label>
                번호
                <input
                  type="number"
                  value={ticket.seat_number}
                  onChange={(e) =>
                    setTicket({ ...ticket, seat_number: e.target.value })
                  }
                />
              </label>
            </div>

            <label>
              원가
              <input
                type="number"
                value={ticket.original_price}
                onChange={(e) =>
                  setTicket({ ...ticket, original_price: e.target.value })
                }
              />
            </label>
            <p className="hint">
              암표 방지: 판매 가격은 원가의 120%를 초과할 수 없습니다.
            </p>
          </div>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? '등록 중...' : '등록'}
        </button>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('list');
  const [filters, setFilters] = useState({
    search: '',
    categoryId: null,
    eventOptionId: null,
    seatSector: '',
  });

  return (
    <div className="app">
      <header className="header">
        <h1>DB C2C Demo (PostgreSQL 중심)</h1>
        <p className="sub">
          SKU 기반 검색, 카테고리 재귀 쿼리, JSONB 좌석 필터, 암표 방지 트리거를
          시연하기 위한 데모 UI입니다.
        </p>
      </header>

      <div className="tabs">
        <TabButton active={activeTab === 'list'} onClick={() => setActiveTab('list')}>
          상품 목록 / 검색
        </TabButton>
        <TabButton active={activeTab === 'create'} onClick={() => setActiveTab('create')}>
          상품 등록
        </TabButton>
      </div>

      {activeTab === 'list' ? (
        <ItemsList filters={filters} onFiltersChange={setFilters} />
      ) : (
        <ItemForm />
      )}
    </div>
  );
}



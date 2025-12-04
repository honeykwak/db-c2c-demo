import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchEvents, fetchEventOptions, fetchItems } from '../api';

function formatPrice(price) {
  return price?.toLocaleString() + '원';
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 아티스트별 이모지
function getArtistEmoji(artistName) {
  const name = artistName?.toLowerCase() || '';
  if (name.includes('bts') || name.includes('방탄')) return '💜';
  if (name.includes('블핑') || name.includes('블랙핑크')) return '🖤';
  if (name.includes('뉴진스')) return '🐰';
  if (name.includes('아이유')) return '🎤';
  if (name.includes('싸이')) return '💦';
  if (name.includes('임영웅')) return '👑';
  if (name.includes('세븐틴')) return '💎';
  if (name.includes('에스파')) return '🌌';
  if (name.includes('악뮤') || name.includes('악동')) return '🎸';
  if (name.includes('아이브')) return '💗';
  return '🎫';
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventOptions, setEventOptions] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await fetchEvents();
        setEvents(data);
        if (data.length > 0) {
          setSelectedEvent(data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  useEffect(() => {
    async function loadEventDetails() {
      if (!selectedEvent) return;

      setTicketsLoading(true);
      try {
        const [options, ticketData] = await Promise.all([
          fetchEventOptions(selectedEvent.event_id),
          fetchItems({ type: 'ticket', limit: 100 })
        ]);
        setEventOptions(options);

        // 해당 이벤트의 티켓만 필터링
        const eventOptionIds = options.map(o => o.event_option_id);
        const filteredTickets = ticketData.items.filter(item =>
          eventOptionIds.includes(item.event_option_id)
        );
        setTickets(filteredTickets);
      } catch (err) {
        console.error(err);
      } finally {
        setTicketsLoading(false);
      }
    }
    loadEventDetails();
  }, [selectedEvent]);

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>공연 / 이벤트</h1>
        <p className="events-subtitle">진행중인 공연의 티켓을 찾아보세요</p>
      </div>

      {/* 공연 목록 */}
      <div className="events-list">
        {events.map((event) => (
          <button
            key={event.event_id}
            className={`event-card ${selectedEvent?.event_id === event.event_id ? 'active' : ''}`}
            onClick={() => setSelectedEvent(event)}
          >
            <span className="event-icon">{getArtistEmoji(event.artist_name)}</span>
            <div className="event-info">
              <h3>{event.event_name}</h3>
              <p className="artist">{event.artist_name}</p>
            </div>
          </button>
        ))}
      </div>

      {/* 선택된 공연 상세 */}
      {selectedEvent && (
        <div className="event-detail">
          <div className="event-detail-header">
            <span className="event-detail-icon">{getArtistEmoji(selectedEvent.artist_name)}</span>
            <div className="event-detail-info">
              <h2>{selectedEvent.event_name}</h2>
              <p className="artist">{selectedEvent.artist_name}</p>
            </div>
          </div>

          {/* 회차 정보 */}
          <div className="event-options">
            <h3>공연 일정</h3>
            <div className="options-grid">
              {eventOptions.map((opt) => (
                <div key={opt.event_option_id} className="option-card">
                  <div className="option-date">
                    <span className="date-icon">📅</span>
                    {formatDateTime(opt.event_datetime)}
                  </div>
                  <div className="option-venue">
                    <span className="venue-icon">📍</span>
                    {opt.venue}
                  </div>
                  <div className="option-tickets">
                    <span className="ticket-count">
                      {tickets.filter(t => t.event_option_id === opt.event_option_id).length}
                    </span>
                    개 티켓 판매중
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 판매중인 티켓 */}
          <div className="event-tickets">
            <h3>판매중인 티켓 ({tickets.length})</h3>
            {ticketsLoading ? (
              <div className="loading">로딩 중...</div>
            ) : tickets.length === 0 ? (
              <div className="empty-tickets">현재 판매중인 티켓이 없습니다.</div>
            ) : (
              <div className="tickets-grid">
                {tickets.map((ticket) => {
                  const option = eventOptions.find(o => o.event_option_id === ticket.event_option_id);
                  return (
                    <Link to={`/item/${ticket.item_id}`} key={ticket.item_id} className="ticket-card">
                      <div className="ticket-header">
                        <span className="ticket-icon">🎫</span>
                        <span className={`status-badge small ${ticket.status === 'ON_SALE' ? 'status-on-sale' : ticket.status === 'RESERVED' ? 'status-reserved' : 'status-sold'}`}>
                          {ticket.status === 'ON_SALE' ? '판매중' : ticket.status === 'RESERVED' ? '예약중' : '판매완료'}
                        </span>
                      </div>
                      <h4>{ticket.title}</h4>
                      <p className="ticket-venue">{option?.venue}</p>
                      <p className="ticket-datetime">{formatDateTime(option?.event_datetime)}</p>
                      {ticket.seat_info && (
                        <p className="ticket-seat">
                          {ticket.seat_info.grade}석 {ticket.seat_info.sector}구역 {ticket.seat_info.row}열 {ticket.seat_info.number}번
                        </p>
                      )}
                      <p className="ticket-price">{formatPrice(ticket.price)}</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchChatRooms } from '../api';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;

  if (diff < 60000) return '방금 전';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const STATUS_MAP = {
  ON_SALE: { label: '판매중', className: 'status-on-sale' },
  RESERVED: { label: '예약중', className: 'status-reserved' },
  SOLD: { label: '판매완료', className: 'status-sold' },
};

export default function ChatList({ currentUserId }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!currentUserId) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchChatRooms(currentUserId);
        setRooms(data);
      } catch (err) {
        console.error(err);
        setError('채팅 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUserId]);

  if (!currentUserId) {
    return (
      <div className="chat-list-page">
        <h1>채팅</h1>
        <div className="empty">로그인이 필요합니다.</div>
      </div>
    );
  }

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="chat-list-page">
      <h1>채팅</h1>

      {rooms.length === 0 ? (
        <div className="empty">
          <p>채팅 내역이 없습니다.</p>
          <p>상품에서 '채팅하기'를 눌러 대화를 시작하세요.</p>
        </div>
      ) : (
        <div className="chat-rooms">
          {rooms.map((room) => {
            const isMyItem = room.seller_id === currentUserId;
            const otherName = isMyItem ? room.buyer_name : room.seller_name;

            return (
              <Link
                to={`/chat/${room.room_id}`}
                key={room.room_id}
                className="chat-room-item"
              >
                <div className="chat-room-avatar">
                  {otherName?.charAt(0) || '?'}
                </div>
                <div className="chat-room-content">
                  <div className="chat-room-header">
                    <span className="chat-room-name">{otherName}</span>
                    <span className="chat-room-time">{formatTime(room.last_message_at)}</span>
                  </div>
                  <div className="chat-room-item-info">
                    <span className={`status-badge small ${STATUS_MAP[room.item_status]?.className}`}>
                      {STATUS_MAP[room.item_status]?.label}
                    </span>
                    <span className="item-title">{room.item_title}</span>
                  </div>
                  <p className="chat-room-message">
                    {room.last_message || '새로운 채팅방입니다.'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

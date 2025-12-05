import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchChatRoom, sendMessage, createTransaction, updateItemStatus } from '../api';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatPrice(price) {
  return price?.toLocaleString() + '원';
}

const STATUS_MAP = {
  ON_SALE: { label: '판매중', className: 'status-on-sale' },
  RESERVED: { label: '예약중', className: 'status-reserved' },
  SOLD: { label: '판매완료', className: 'status-sold' },
};

export default function ChatRoom({ currentUserId }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadChat = async () => {
    try {
      const data = await fetchChatRoom(roomId);
      setRoom(data.room);
      setMessages(data.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChat();
    // 3초마다 새 메시지 확인 (폴링)
    const interval = setInterval(loadChat, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const msg = await sendMessage(roomId, currentUserId, newMessage.trim());
      setMessages([...messages, msg]);
      setNewMessage('');
    } catch (err) {
      console.error(err);
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleBuy = async () => {
    if (!confirm(`${formatPrice(room.item_price)}에 구매하시겠습니까?`)) return;

    setActionLoading(true);
    try {
      await createTransaction(room.item_id, currentUserId, room.item_price);
      alert('구매가 완료되었습니다!');
      loadChat();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || '구매에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReserve = async () => {
    setActionLoading(true);
    try {
      await updateItemStatus(room.item_id, 'RESERVED');
      alert('예약 처리되었습니다.');
      loadChat();
    } catch (err) {
      console.error(err);
      alert('상태 변경에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (!room) return <div className="error">채팅방을 찾을 수 없습니다.</div>;

  const isSeller = room.seller_id === currentUserId;
  const isBuyer = room.buyer_id === currentUserId;
  const otherName = isSeller ? room.buyer_name : room.seller_name;

  return (
    <div className="chat-room-page">
      {/* 헤더 */}
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate('/chat')}>
          ←
        </button>
        <div className="chat-header-info">
          <h2>{otherName}</h2>
        </div>
      </div>

      {/* 상품 정보 바 */}
      <Link to={`/item/${room.item_id}`} className="chat-item-bar">
        <div className="chat-item-info">
          <span className={`status-badge small ${STATUS_MAP[room.item_status]?.className}`}>
            {STATUS_MAP[room.item_status]?.label}
          </span>
          <span className="item-title">{room.item_title}</span>
          <span className="item-price">{formatPrice(room.item_price)}</span>
        </div>
        {room.item_status === 'ON_SALE' && (
          <div className="chat-item-actions">
            {isBuyer && (
              <button
                className="btn btn-sm btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  handleBuy();
                }}
                disabled={actionLoading}
              >
                구매하기
              </button>
            )}
            {isSeller && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={(e) => {
                  e.preventDefault();
                  handleReserve();
                }}
                disabled={actionLoading}
              >
                예약중 처리
              </button>
            )}
          </div>
        )}
      </Link>

      {/* 메시지 목록 */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            대화를 시작해보세요!
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.message_id}
              className={`chat-message ${isMe ? 'mine' : 'theirs'}`}
            >
              {!isMe && <div className="sender-name">{msg.sender_name}</div>}
              <div className="message-bubble">
                <p>{msg.content}</p>
                <span className="message-time">{formatTime(msg.sent_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="메시지를 입력하세요"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
        />
        <button type="submit" disabled={sending || !newMessage.trim()}>
          전송
        </button>
      </form>
    </div>
  );
}

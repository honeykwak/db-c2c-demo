import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// ========== Categories ==========
export async function fetchCategories() {
  const res = await api.get('/categories');
  return res.data;
}

// ========== Events ==========
export async function fetchEvents() {
  const res = await api.get('/events');
  return res.data;
}

export async function fetchEventOptions(eventId) {
  const res = await api.get(`/events/${eventId}/options`);
  return res.data;
}

// ========== Products (SKU) ==========
export async function autocompleteProducts(q) {
  const res = await api.get('/products/autocomplete', { params: { q } });
  return res.data;
}

// ========== Items ==========
export async function fetchItems(params = {}) {
  const res = await api.get('/items', { params });
  const data = res.data;

  // 백엔드가 배열 형태로만 응답하는 경우를 대비한 호환 처리
  if (Array.isArray(data)) {
    return {
      items: data,
      pagination: {
        page: 1,
        totalPages: 1,
        total: data.length,
        hasMore: false,
        limit: data.length,
      },
    };
  }

  // 기본: { items: [], pagination: {} } 형태
  return data;
}

export async function fetchItem(itemId) {
  const res = await api.get(`/items/${itemId}`);
  return res.data;
}

export async function createItem(payload) {
  const res = await api.post('/items', payload);
  return res.data;
}

export async function updateItemStatus(itemId, status) {
  const res = await api.patch(`/items/${itemId}/status`, { status });
  return res.data;
}

// ========== Users ==========
export async function fetchUsers() {
  const res = await api.get('/users');
  return res.data;
}

export async function fetchUser(userId) {
  const res = await api.get(`/users/${userId}`);
  return res.data;
}

export async function fetchUserItems(userId) {
  const res = await api.get(`/users/${userId}/items`);
  return res.data;
}

export async function fetchUserPurchases(userId) {
  const res = await api.get(`/users/${userId}/purchases`);
  return res.data;
}

export async function fetchUserReviews(userId) {
  const res = await api.get(`/users/${userId}/reviews`);
  return res.data;
}

// ========== Chat ==========
export async function fetchChatRooms(userId) {
  const res = await api.get('/chat/rooms', { params: { user_id: userId } });
  return res.data;
}

export async function createChatRoom(itemId, buyerId) {
  const res = await api.post('/chat/rooms', { item_id: itemId, buyer_id: buyerId });
  return res.data;
}

export async function fetchChatRoom(roomId) {
  const res = await api.get(`/chat/rooms/${roomId}`);
  return res.data;
}

export async function sendMessage(roomId, senderId, content) {
  const res = await api.post(`/chat/rooms/${roomId}/messages`, {
    sender_id: senderId,
    content,
  });
  return res.data;
}

// ========== Transactions ==========
export async function createTransaction(itemId, buyerId, finalPrice) {
  const res = await api.post('/transactions', {
    item_id: itemId,
    buyer_id: buyerId,
    final_price: finalPrice,
  });
  return res.data;
}

export async function fetchTransaction(transId) {
  const res = await api.get(`/transactions/${transId}`);
  return res.data;
}

export async function createReview(transId, reviewerId, rating, comment) {
  const res = await api.post(`/transactions/${transId}/review`, {
    reviewer_id: reviewerId,
    rating,
    comment,
  });
  return res.data;
}

// ========== Wishlist ==========
export async function fetchWishlist(userId) {
  const res = await api.get(`/wishlist/${userId}`);
  return res.data;
}

export async function checkWishlist(userId, itemId) {
  const res = await api.get(`/wishlist/${userId}/check/${itemId}`);
  return res.data.isWished;
}

export async function addToWishlist(userId, itemId) {
  const res = await api.post('/wishlist', { user_id: userId, item_id: itemId });
  return res.data;
}

export async function removeFromWishlist(userId, itemId) {
  const res = await api.delete(`/wishlist/${userId}/${itemId}`);
  return res.data;
}

export async function getWishlistCount(itemId) {
  const res = await api.get(`/wishlist/count/${itemId}`);
  return res.data.count;
}

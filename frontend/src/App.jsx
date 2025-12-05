import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { fetchUsers } from './api';

import Home from './pages/Home';
import ItemDetail from './pages/ItemDetail';
import Sell from './pages/Sell';
import Events from './pages/Events';
import ChatList from './pages/ChatList';
import ChatRoom from './pages/ChatRoom';
import MyPage from './pages/MyPage';
import SellerProfile from './pages/SellerProfile';

function NavBar({ currentUserId, setCurrentUserId, users, darkMode, setDarkMode }) {
  const location = useLocation();

  // 채팅방 페이지에서는 네비게이션 숨김
  if (location.pathname.startsWith('/chat/')) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🛒</span>
          <span className="logo-text">마켓시티</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            홈
          </Link>
          <Link
            to="/events"
            className={`nav-link ${location.pathname === '/events' ? 'active' : ''}`}
          >
            공연
          </Link>
          <Link
            to="/sell"
            className={`nav-link ${location.pathname === '/sell' ? 'active' : ''}`}
          >
            판매하기
          </Link>
          <Link
            to="/chat"
            className={`nav-link ${location.pathname === '/chat' ? 'active' : ''}`}
          >
            채팅
          </Link>
          <Link
            to="/mypage"
            className={`nav-link ${location.pathname.startsWith('/mypage') ? 'active' : ''}`}
          >
            마이페이지
          </Link>
        </div>

        <div className="nav-right">
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? '라이트 모드' : '다크 모드'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <div className="user-profile-select">
            <span className="user-nickname">
              {users.find((u) => String(u.user_id) === String(currentUserId))?.username ||
                '로그인'}
            </span>
            <select
              value={currentUserId || ''}
              onChange={(e) => {
                const val = e.target.value;
                setCurrentUserId(val ? Number(val) : null);
              }}
              className="user-select"
            >
              <option value="">로그인 선택</option>
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </nav>
  );
}

function AppContent({ currentUserId, setCurrentUserId, users, darkMode, setDarkMode }) {
  return (
    <>
      <NavBar
        currentUserId={currentUserId}
        setCurrentUserId={setCurrentUserId}
        users={users}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/item/:id" element={<ItemDetail currentUserId={currentUserId} />} />
          <Route path="/events" element={<Events />} />
          <Route path="/sell" element={<Sell currentUserId={currentUserId} />} />
          <Route path="/chat" element={<ChatList currentUserId={currentUserId} />} />
          <Route path="/chat/:roomId" element={<ChatRoom currentUserId={currentUserId} />} />
          <Route path="/mypage" element={<MyPage currentUserId={currentUserId} />} />
          <Route path="/seller/:userId" element={<SellerProfile />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // 다크모드 적용
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await fetchUsers();
        setUsers(data);
        if (data.length > 0) {
          setCurrentUserId(data[0].user_id);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load users', err);
      }
    }
    loadUsers();
  }, []);

  return (
    <BrowserRouter>
      <AppContent
        currentUserId={currentUserId}
        setCurrentUserId={setCurrentUserId}
        users={users}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    </BrowserRouter>
  );
}



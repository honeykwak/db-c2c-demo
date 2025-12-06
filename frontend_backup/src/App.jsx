import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

import Home from './pages/Home';
import ItemDetail from './pages/ItemDetail';
import Sell from './pages/Sell';
import Events from './pages/Events';
import ChatList from './pages/ChatList';
import ChatRoom from './pages/ChatRoom';
import MyPage from './pages/MyPage';
import SellerProfile from './pages/SellerProfile';

function NavBar({ darkMode, setDarkMode }) {
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

        <button
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? '라이트 모드' : '다크 모드'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}

function AppContent({ currentUserId, darkMode, setDarkMode }) {
  return (
    <>
      <NavBar darkMode={darkMode} setDarkMode={setDarkMode} />
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

  return (
    <BrowserRouter>
      <AppContent
        currentUserId={currentUserId}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    </BrowserRouter>
  );
}



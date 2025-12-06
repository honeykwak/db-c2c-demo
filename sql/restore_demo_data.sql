-- ======================================================================
-- RESTORE DEMO DATA SCRIPT
-- Purpose: Reset database and populate it with specific data for the 
--          C2C Platform Presentation Scenarios (A, B, C, D).
-- ======================================================================

BEGIN;

-- 1. TRUNCATE ALL TABLES (Clean Slate)
-- Using CASCADE to handle foreign key dependencies automatically
TRUNCATE TABLE 
    users,
    category,
    standard_product,
    event,
    event_option,
    item,
    ticket_details,
    transaction,
    review,
    chat_room,
    chat_message
    RESTART IDENTITY CASCADE;

-- 2. INSERT USERS
-- ID 1: Seller (판매자)
-- ID 2: Buyer (구매자)
INSERT INTO users (username) VALUES 
('demo_seller'),
('demo_buyer');

-- 3. INSERT CATEGORIES (Scenario C: Recursive CTE)
-- ID 1: 디지털기기
--   ID 4: 스마트폰 (Parent: 1)
--   ID 5: 노트북 (Parent: 1)
-- ID 3: 티켓/교환권
--   ID 6: 콘서트 (Parent: 3)
INSERT INTO category (category_name, parent_category_id) VALUES
('디지털기기', NULL), -- 1
('생활가전', NULL),   -- 2
('티켓/교환권', NULL); -- 3

INSERT INTO category (category_name, parent_category_id) VALUES
('스마트폰', 1), -- 4
('노트북', 1),   -- 5
('콘서트', 3);   -- 6

-- 4. INSERT STANDARD PRODUCTS (Scenario A: SKU & Auto-complete)
-- ID 1: Samsung Galaxy Buds2 (Search target)
-- ID 2: Samsung Galaxy Z Flip5
-- ID 3: Apple MacBook Pro 14 M3
INSERT INTO standard_product (product_code, brand_name, model_name, specs, category_id) VALUES
('SM-R177', 'Samsung', 'Galaxy Buds2', '{"color": "white", "bluetooth": "5.2"}', 1),
('SM-F731N', 'Samsung', 'Galaxy Z Flip5', '{"color": "mint", "storage": "256GB"}', 4),
('M3-PRO-14', 'Apple', 'MacBook Pro 14 M3', '{"chip": "M3 Pro", "memory": "18GB"}', 5);

-- 5. INSERT EVENTS & OPTIONS (Scenario B: Ticket Registration)
-- Event 1: Psy Soaking Show 2025
-- Event 2: IU Concert 2025
INSERT INTO event (event_name, artist_name) VALUES
('싸이 흠뻑쇼 2025', '싸이'),
('아이유 콘서트 2025', '아이유');

-- Event Options for Psy (Event ID 1)
INSERT INTO event_option (event_id, venue, event_datetime) VALUES
(1, '서울 잠실주경기장', '2025-07-20 18:42:00'), -- Option ID 1
(1, '부산 아시아드', '2025-07-27 18:42:00');    -- Option ID 2

-- Event Options for IU (Event ID 2)
INSERT INTO event_option (event_id, venue, event_datetime) VALUES
(2, '서울 월드컵경기장', '2025-09-20 19:00:00'); -- Option ID 3

-- 6. INSERT EXISTING ITEMS (Scenario A & D)

-- Item 1: Ticket (Scenario D: Seat Filter Target)
-- "Psy Soaking Show - R Grade, Sector A"
-- Price: 150,000 (Original: 130,000) -> OK (< 156,000)
INSERT INTO item (seller_id, title, price, status, description, category_id, std_id) VALUES
(1, '싸이 흠뻑쇼 서울 막콘 R석 A구역 양도합니다', 150000, 'ON_SALE', '개인사정으로 못가요 ㅠ', 6, NULL);

INSERT INTO ticket_details (item_id, event_option_id, seat_info, original_price) VALUES
((SELECT currval('item_item_id_seq')), 1, '{"grade": "R", "sector": "A", "row": 10, "number": 15}', 130000);

-- Item 2: Ticket (Diff Sector)
-- "Psy Soaking Show - S Grade, Sector C"
-- Price: 120,000 (Original: 110,000)
INSERT INTO item (seller_id, title, price, status, description, category_id, std_id) VALUES
(1, '싸이 흠뻑쇼 부산 S석 C구역', 120000, 'ON_SALE', '친구랑 같이 가려다 취소', 6, NULL);

INSERT INTO ticket_details (item_id, event_option_id, seat_info, original_price) VALUES
((SELECT currval('item_item_id_seq')), 2, '{"grade": "S", "sector": "C", "row": 5, "number": 22}', 110000);

-- Item 3: Digital Product (Scenario A: Search Target)
-- Galaxy Z Flip5 (Linked to Standard Product ID 2)
INSERT INTO item (seller_id, title, price, status, description, category_id, std_id) VALUES
(1, '갤럭시 Z플립5 민트 S급 팝니다', 850000, 'ON_SALE', '한달 사용, 기스 없음', 4, 2);

-- Item 4: General Item (No Std, No Ticket)
INSERT INTO item (seller_id, title, price, status, description, category_id, std_id) VALUES
(1, '직접 만든 수제 비누', 5000, 'ON_SALE', '선물용으로 좋아요', 2, NULL);

COMMIT;

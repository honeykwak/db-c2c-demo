-- Seed data for PostgreSQL schema
-- Based on section 10 of DB spec markdown

-- ======================================================================
-- 1. Users
-- ======================================================================

INSERT INTO users (user_id, username)
VALUES (1, 'demo_seller')
ON CONFLICT (user_id) DO NOTHING;


-- 추가 사용자 (user_2 ~ user_50)
INSERT INTO users (user_id, username)
SELECT g, 'user_' || g
FROM generate_series(2, 50) AS g
ON CONFLICT (user_id) DO NOTHING;

-- ======================================================================
-- 2. Category (계층 구조)
-- ======================================================================

INSERT INTO category (category_id, category_name, parent_category_id) VALUES
    (1, '디지털기기', NULL),
    (2, '가전', NULL),
    (3, '티켓', NULL),
    (4, '스마트폰', 1),
    (5, '노트북', 1),
    (6, 'TV', 2)
ON CONFLICT (category_id) DO NOTHING;


-- ======================================================================
-- 3. StandardProduct (SKU 및 JSONB)
-- ======================================================================

INSERT INTO standard_product (std_id, product_code, brand_name, model_name, specs, category_id) VALUES
    (1, 'SM-R177',  '삼성', '갤럭시 버즈2',       '{"color": "white", "bluetooth": "5.2"}',                          1),
    (2, 'SM-F731N', '삼성', '갤럭시 Z플립5',     '{"color": "mint", "ram_gb": 8, "storage_gb": 256}',              4),
    (3, 'M3-PRO-14','Apple','맥북프로 14 M3',    '{"color": "space_black", "ram_gb": 18, "chip": "M3 Pro"}',       5)
ON CONFLICT (std_id) DO NOTHING;


-- 추가 SKU 데이터 (std_id 4 ~ 103, 총 100개)
-- 카테고리는 1,4,5를 순환 참조
INSERT INTO standard_product (std_id, product_code, brand_name, model_name, specs, category_id)
SELECT
    g                                       AS std_id,
    'AUTO-SKU-' || g                        AS product_code,
    CASE (g % 3)
        WHEN 0 THEN '삼성'
        WHEN 1 THEN 'Apple'
        ELSE 'LG'
    END                                     AS brand_name,
    'Auto Model ' || g                      AS model_name,
    jsonb_build_object(
        'color',       CASE (g % 4)
                           WHEN 0 THEN 'black'
                           WHEN 1 THEN 'white'
                           WHEN 2 THEN 'blue'
                           ELSE 'red'
                       END,
        'ram_gb',      4 + (g % 4) * 4,
        'storage_gb',  64 + (g % 5) * 64
    )                                       AS specs,
    CASE (g % 3)
        WHEN 0 THEN 1   -- 디지털기기
        WHEN 1 THEN 4   -- 스마트폰
        ELSE 5          -- 노트북
    END                                     AS category_id
FROM generate_series(4, 103) AS g
ON CONFLICT (std_id) DO NOTHING;


-- ======================================================================
-- 4. Event 및 EventOption (티켓)
-- ======================================================================

-- Event (10개 공연)
INSERT INTO event (event_id, event_name, artist_name) VALUES
    (1, '싸이 흠뻑쇼 2025', '싸이'),
    (2, '아이유 콘서트 2025', '아이유'),
    (3, '뉴진스 팬미팅 2025', '뉴진스'),
    (4, 'BTS 월드투어', 'BTS'),
    (5, '블랙핑크 인 유어 에어리어', '블랙핑크'),
    (6, '임영웅 전국투어', '임영웅'),
    (7, '세븐틴 팔로우 투어', '세븐틴'),
    (8, '에스파 시너지 콘서트', '에스파'),
    (9, '악뮤 항해 콘서트', '악동뮤지션'),
    (10, '아이브 쇼케이스', '아이브')
ON CONFLICT (event_id) DO NOTHING;


-- EventOption (각 공연별 2~3개 회차)
INSERT INTO event_option (event_option_id, event_id, venue, event_datetime) VALUES
    -- 싸이 (event_id: 1)
    (10, 1, '서울 잠실주경기장', '2025-07-10 19:00:00'),
    (11, 1, '부산 아시아드', '2025-07-15 19:00:00'),
    -- 아이유 (event_id: 2)
    (12, 2, '서울 월드컵경기장', '2025-09-20 18:00:00'),
    -- 뉴진스 (event_id: 3)
    (13, 3, '서울 KSPO돔', '2025-08-01 18:00:00'),
    (14, 3, '서울 KSPO돔', '2025-08-02 18:00:00'),
    -- BTS (event_id: 4)
    (15, 4, '서울 잠실주경기장', '2025-10-05 19:00:00'),
    (16, 4, '서울 잠실주경기장', '2025-10-06 19:00:00'),
    (17, 4, '부산 아시아드', '2025-10-12 19:00:00'),
    -- 블랙핑크 (event_id: 5)
    (18, 5, '서울 고척스카이돔', '2025-11-15 18:00:00'),
    (19, 5, '서울 고척스카이돔', '2025-11-16 18:00:00'),
    -- 임영웅 (event_id: 6)
    (20, 6, '서울 올림픽체조경기장', '2025-06-20 19:00:00'),
    (21, 6, '부산 벡스코', '2025-06-27 19:00:00'),
    (22, 6, '대구 엑스코', '2025-07-04 19:00:00'),
    -- 세븐틴 (event_id: 7)
    (23, 7, '인천 SSG랜더스필드', '2025-09-01 18:00:00'),
    (24, 7, '고양 킨텍스', '2025-09-08 18:00:00'),
    -- 에스파 (event_id: 8)
    (25, 8, '서울 KSPO돔', '2025-12-20 19:00:00'),
    (26, 8, '서울 KSPO돔', '2025-12-21 19:00:00'),
    -- 악뮤 (event_id: 9)
    (27, 9, '서울 블루스퀘어', '2025-05-10 19:30:00'),
    (28, 9, '서울 블루스퀘어', '2025-05-11 17:00:00'),
    -- 아이브 (event_id: 10)
    (29, 10, '서울 YES24라이브홀', '2025-07-25 19:00:00'),
    (30, 10, '서울 YES24라이브홀', '2025-07-26 18:00:00')
ON CONFLICT (event_option_id) DO NOTHING;


-- ======================================================================
-- 5. Item 및 TicketDetails (실제 매물)
-- ======================================================================

-- Item
INSERT INTO item (item_id, seller_id, title, price, std_id, category_id) VALUES
    (1, 1, '(티켓) 흠뻑쇼 서울 R석 A구역 팝니다', 180000, NULL, 3),
    (2, 1, '(티켓) 흠뻑쇼 서울 S석 팝니다',        150000, NULL, 3),
    (3, 1, '(SKU) 갤럭시 Z플립5 민트색 A급',       750000, 2,    4),
    (4, 1, '(일반) 직접 만든 손수건',                5000, NULL, 1)
ON CONFLICT (item_id) DO NOTHING;


-- 자동 생성 Item (item_id 5 ~ 1004, 총 1000개)
-- 일부는 SKU 기반, 일부는 일반/티켓 상품으로 사용 가능
INSERT INTO item (item_id, seller_id, title, price, std_id, category_id)
SELECT
    g                                        AS item_id,
    1 + (g % 50)                             AS seller_id,   -- user_1 ~ user_50 순환
    CASE
        WHEN g % 3 = 0 THEN '(AUTO 티켓) 이벤트 티켓 ' || g
        WHEN g % 3 = 1 THEN '(AUTO SKU) 표준 상품 매물 ' || g
        ELSE '(AUTO 일반) 일반 상품 매물 ' || g
    END                                      AS title,
    10000 + (g * 10)                         AS price,
    CASE
        WHEN g % 3 = 1 THEN 1 + (g % 100)    -- std_id 1 ~ 100 순환
        ELSE NULL
    END                                      AS std_id,
    CASE
        WHEN g % 3 = 0 THEN 3                -- 티켓
        WHEN g % 3 = 1 THEN 4                -- 스마트폰
        ELSE 1                               -- 디지털기기
    END                                      AS category_id
FROM generate_series(5, 1004) AS g
ON CONFLICT (item_id) DO NOTHING;


-- TicketDetails
INSERT INTO ticket_details (item_id, event_option_id, seat_info, original_price) VALUES
    (1, 10, '{"grade": "R", "sector": "A", "row": 10, "number": 5}', 130000),
    (2, 10, '{"grade": "S", "sector": "C", "row": 20, "number": 11}', 120000)
ON CONFLICT (item_id) DO NOTHING;


-- 자동 생성 TicketDetails (티켓 아이템만: g % 3 = 0인 것만)
-- event_option_id 는 10~30을 순환 (모든 공연에 골고루 분배)
-- seat_info 는 grade/sector/row/number 를 규칙적으로 생성
-- original_price 는 항상 price 보다 충분히 높게 설정하여 트리거 통과
INSERT INTO ticket_details (item_id, event_option_id, seat_info, original_price)
SELECT
    g                                                   AS item_id,
    10 + ((g / 3) % 21)                                 AS event_option_id,  -- 10~30 순환 (21개 옵션)
    jsonb_build_object(
        'grade',  CASE ((g / 3) % 3)
                      WHEN 0 THEN 'R'
                      WHEN 1 THEN 'S'
                      ELSE 'A'
                  END,
        'sector', chr(65 + ((g / 3) % 4)),              -- 'A' ~ 'D'
        'row',   1 + ((g / 3) % 30),
        'number',1 + ((g / 3) % 50)
    )                                                   AS seat_info,
    100000 + (g * 100)                                  AS original_price
FROM generate_series(6, 1004, 3) AS g  -- g % 3 = 0 인 것만 (6, 9, 12, ...)
ON CONFLICT (item_id) DO NOTHING;


-- ======================================================================
-- 6. Sequences alignment (optional but keeps IDs in sync)
-- ======================================================================

-- Ensure sequences continue after manually inserted IDs
SELECT setval(pg_get_serial_sequence('users', 'user_id'),       (SELECT COALESCE(MAX(user_id), 1) FROM users));
SELECT setval(pg_get_serial_sequence('category', 'category_id'), (SELECT COALESCE(MAX(category_id), 1) FROM category));
SELECT setval(pg_get_serial_sequence('standard_product', 'std_id'), (SELECT COALESCE(MAX(std_id), 1) FROM standard_product));
SELECT setval(pg_get_serial_sequence('event', 'event_id'),      (SELECT COALESCE(MAX(event_id), 1) FROM event));
SELECT setval(pg_get_serial_sequence('event_option', 'event_option_id'), (SELECT COALESCE(MAX(event_option_id), 1) FROM event_option));
SELECT setval(pg_get_serial_sequence('item', 'item_id'),        (SELECT COALESCE(MAX(item_id), 1) FROM item));



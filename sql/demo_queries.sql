-- Demo queries for core DB logic
-- 1) Category recursive CTE (US 2.2)
-- 2) JSONB seat_info search (US 2.3)
-- 3) JOIN for integrated search (US 2.1)


-- ======================================================================
-- 1. Category recursive CTE (디지털기기 및 모든 자식 카테고리)
-- Example: starting from category_id = 1 (디지털기기)
-- ======================================================================

WITH RECURSIVE category_tree AS (
    SELECT
        c.category_id,
        c.category_name,
        c.parent_category_id
    FROM category c
    WHERE c.category_id = 1  -- root category (e.g., 디지털기기)

    UNION ALL

    SELECT
        child.category_id,
        child.category_name,
        child.parent_category_id
    FROM category child
    INNER JOIN category_tree ct
        ON child.parent_category_id = ct.category_id
)
SELECT * FROM category_tree;


-- ======================================================================
-- 2. JSONB seat_info search (특정 이벤트 옵션 + 구역 필터링)
-- Example: event_option_id = 10 AND sector = 'A'
-- ======================================================================

SELECT
    i.item_id,
    i.title,
    i.price,
    td.seat_info,
    td.original_price
FROM item i
JOIN ticket_details td
    ON i.item_id = td.item_id
WHERE td.event_option_id = 10
  AND td.seat_info ->> 'sector' = 'A';


-- ======================================================================
-- 3. 통합 검색: Item.title + StandardProduct.model_name
-- Example: search keyword = '아이폰'
-- ======================================================================

SELECT
    i.item_id,
    i.title,
    i.price,
    sp.model_name,
    sp.product_code
FROM item i
LEFT JOIN standard_product sp
    ON i.std_id = sp.std_id
WHERE i.title ILIKE '%아이폰%'
   OR sp.model_name ILIKE '%아이폰%';



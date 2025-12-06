-- ======================================================================
-- VERIFY DEMO DATA SCRIPT
-- Purpose: Check counts and specific data points to confirm restoration.
-- ======================================================================

SELECT 'Users' as table_name, count(*) as count FROM users
UNION ALL
SELECT 'Category', count(*) FROM category
UNION ALL
SELECT 'StandardProduct', count(*) FROM standard_product
UNION ALL
SELECT 'Event', count(*) FROM event
UNION ALL
SELECT 'EventOption', count(*) FROM event_option
UNION ALL
SELECT 'Item', count(*) FROM item
UNION ALL
SELECT 'TicketDetails', count(*) FROM ticket_details;

-- Check specific data for Scenario A (SKU Search target)
SELECT * FROM standard_product WHERE product_code = 'SM-R177';

-- Check specific data for Scenario D (Seat Filter target)
SELECT i.title, td.seat_info 
FROM item i 
JOIN ticket_details td ON i.item_id = td.item_id
WHERE i.title LIKE '%싸이%';

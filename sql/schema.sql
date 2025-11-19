-- PostgreSQL schema for C2C platform demo
-- Focus: 11 tables, JSONB, Recursive CTE target, Trigger-based business logic

-- ======================================================================
-- 1. Custom Types
-- ======================================================================

CREATE TYPE item_status AS ENUM ('ON_SALE', 'RESERVED', 'SOLD');


-- ======================================================================
-- 2. Core Tables
-- ======================================================================

-- 2.1 User
-- Not heavily used in MVP, but required for FK relations
CREATE TABLE users (
    user_id      BIGSERIAL PRIMARY KEY,
    username     VARCHAR(100) NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);


-- 2.2 Category (self-referencing hierarchy)
CREATE TABLE category (
    category_id         BIGSERIAL PRIMARY KEY,
    category_name       VARCHAR(100) NOT NULL,
    parent_category_id  BIGINT REFERENCES category(category_id)
);


-- 2.3 StandardProduct (SKU + JSONB specs)
CREATE TABLE standard_product (
    std_id        BIGSERIAL PRIMARY KEY,
    product_code  VARCHAR(50) NOT NULL UNIQUE,
    brand_name    VARCHAR(100) NOT NULL,
    model_name    VARCHAR(200) NOT NULL,
    specs         JSONB NOT NULL,
    category_id   BIGINT NOT NULL REFERENCES category(category_id)
);


-- 2.4 Item (supertype for all sellable items)
CREATE TABLE item (
    item_id      BIGSERIAL PRIMARY KEY,
    seller_id    BIGINT NOT NULL REFERENCES users(user_id),
    title        VARCHAR(255) NOT NULL,
    price        INTEGER NOT NULL,
    status       item_status NOT NULL DEFAULT 'ON_SALE',
    description  TEXT,
    reg_date     TIMESTAMP NOT NULL DEFAULT NOW(),
    std_id       BIGINT REFERENCES standard_product(std_id),
    category_id  BIGINT REFERENCES category(category_id)
);


-- ======================================================================
-- 3. Ticket-related Tables
-- ======================================================================

-- 3.1 Event
CREATE TABLE event (
    event_id     BIGSERIAL PRIMARY KEY,
    event_name   VARCHAR(200) NOT NULL,
    artist_name  VARCHAR(200) NOT NULL
);


-- 3.2 EventOption (venue + datetime)
CREATE TABLE event_option (
    event_option_id  BIGSERIAL PRIMARY KEY,
    event_id         BIGINT NOT NULL REFERENCES event(event_id),
    venue            VARCHAR(200) NOT NULL,
    event_datetime   TIMESTAMP NOT NULL
);


-- 3.3 TicketDetails (1:1 with Item, JSONB seat_info)
CREATE TABLE ticket_details (
    item_id          BIGINT PRIMARY KEY REFERENCES item(item_id),
    event_option_id  BIGINT NOT NULL REFERENCES event_option(event_option_id),
    seat_info        JSONB NOT NULL,
    original_price   INTEGER NOT NULL
);


-- ======================================================================
-- 4. Transaction & Review
-- ======================================================================

CREATE TABLE transaction (
    trans_id     BIGSERIAL PRIMARY KEY,
    item_id      BIGINT NOT NULL UNIQUE REFERENCES item(item_id),
    buyer_id     BIGINT NOT NULL REFERENCES users(user_id),
    final_price  INTEGER NOT NULL,
    trans_date   TIMESTAMP NOT NULL DEFAULT NOW()
);


CREATE TABLE review (
    review_id     BIGSERIAL PRIMARY KEY,
    trans_id      BIGINT NOT NULL REFERENCES transaction(trans_id),
    reviewer_id   BIGINT NOT NULL REFERENCES users(user_id),
    reviewee_id   BIGINT NOT NULL REFERENCES users(user_id),
    rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment       TEXT
);


-- ======================================================================
-- 5. Chat
-- ======================================================================

CREATE TABLE chat_room (
    room_id    BIGSERIAL PRIMARY KEY,
    item_id    BIGINT NOT NULL REFERENCES item(item_id),
    buyer_id   BIGINT NOT NULL REFERENCES users(user_id),
    seller_id  BIGINT NOT NULL REFERENCES users(user_id)
);


CREATE TABLE chat_message (
    message_id  BIGSERIAL PRIMARY KEY,
    room_id     BIGINT NOT NULL REFERENCES chat_room(room_id),
    sender_id   BIGINT NOT NULL REFERENCES users(user_id),
    content     TEXT NOT NULL,
    sent_at     TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ======================================================================
-- 6. Business Logic: Scalping Prevention Trigger
-- ======================================================================

-- Function: check_ticket_price_limit
-- Requirement:
--   Item.price must NOT exceed TicketDetails.original_price * 1.2

CREATE OR REPLACE FUNCTION check_ticket_price_limit()
RETURNS TRIGGER AS $$
DECLARE
    item_price INT;
BEGIN
    -- Fetch corresponding Item price (1:1 relationship)
    SELECT price INTO item_price
    FROM item
    WHERE item_id = NEW.item_id;

    -- Compare price with 120% of original_price
    IF item_price > (NEW.original_price * 1.2) THEN
        RAISE EXCEPTION 'Price (%) exceeds 120%% of the original price (%). Scalping detected.',
            item_price, NEW.original_price;
    END IF;

    RETURN NEW; -- validation passed
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trigger_check_price
BEFORE INSERT ON ticket_details
FOR EACH ROW
EXECUTE FUNCTION check_ticket_price_limit();



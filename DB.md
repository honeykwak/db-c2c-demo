# 1. 프로젝트 개요 (Overview)

## 1.1. 목표

본 프로젝트의 목표는 '웹 서비스'를 완성하는 것이 아니다. **"정교하게 설계된 11개 테이블의 PostgreSQL 스키마가, 기존 C2C 플랫폼의 한계(부정확한 검색, 복잡한 상품 등록)를 어떻게 해결하는지 증명하는 것"**이 유일한 목표이다.

모든 프론트엔드(React) 및 백엔드(Node.js) 구현은, 이 데이터베이스 스키마의 효율성과 정교함(복합 JOIN, 재귀 쿼리, JSONB, 트랜잭션 로직)을 시연하기 위한 '도구'로서의 역할만 수행한다.

## 1.2. 핵심 증명 과제 (MVP)

1. **SKU 표준화:** `StandardProduct` 테이블을 활용하여, `product_code` 기반의 정확한 상품 등록 및 검색이 가능함을 증명한다.
2. **복합 상품 처리:** `Event` → `EventOption` → `TicketDetails` (1:1) → `Item`으로 이어지는 복잡한 '티켓' 상품을 정규화된 스키마로 처리 가능함을 증명한다.
3. **DB 비즈니스 로직:** '암표 방지' 로직을 DB단(트리거)에서 구현하여, 스키마가 단순 저장을 넘어 비즈니스 규칙을 강제할 수 있음을 증명한다.
4. **고급 데이터 타입:** `JSONB` 타입을 활용하여 비정형 데이터(좌석, 스펙)의 유연한 저장 및 검색을 증명한다.

# 2. 기술 스택 (Tech Stack)

- **Database:** **PostgreSQL**
- **Backend (API):** **Node.js (Express)**
- **Frontend (UI):** **React**

# 3. 범위 (Scope)

| 구분 | IN SCOPE (필수 구현) | OUT OF SCOPE (구현 제외) |
| --- | --- | --- |
| **핵심 기능** | 1. SKU 기반 상품 등록 (자동완성 포함)

2. 티켓 상품 등록 (옵션/`JSONB` 활용)

3. 통합 상품 검색 (SKU+제목)

4. 카테고리별 필터링 (재귀 쿼리)

5. 티켓 이벤트/좌석(`JSONB`) 필터링

6. 암표 방지 로직 (DB 트리거) | 1. 실제 결제/거래 완료 기능

2. 사용자 간 채팅 기능

3. 거래 리뷰(평점) 기능 |
| **사용자** | - (기능 없음. API 호출 시 `seller_id=1` 등 하드코딩) | - 로그인 / 회원가입

- 마이페이지, 프로필 |
| **데이터** | - `StandardProduct`, `Category`, `Event` 등

 **모든 기준 정보는 개발자가 DB에 미리 INSERT** | - 관리자(Admin)용 데이터 등록 페이지 |

# 4. 핵심 기능 명세 (Features & User Stories)

## Epic 1: 상품 등록 (Seller's Flow)

### User Story 1.1: 판매자가 [표준 제품(SKU)]을 등록한다.

- **As a** 판매자,
- **I want to** `product_code`를 입력하여 `StandardProduct`를 선택하고, 나의 판매 정보를 추가하여 `Item`을 등록한다.
- **Acceptance Criteria (AC):**
    1. [UI] '상품 등록' 페이지에는 '제품 코드'(`product_code`) 입력창, '제목'(`title`), '판매 가격'(`price`) 입력창이 있다.
    2. [UI/FE] 사용자가 '제품 코드'를 입력할 때마다, 백엔드에 자동완성 API(`GET /api/products/autocomplete`)를 호출한다.
    3. [BE] `StandardProduct` 테이블에서 `product_code`가 일치(LIKE)하는 상위 5개 항목을 반환한다.
    4. [UI] 사용자가 자동완성 목록에서 특정 제품(예: "SM-R177 / 갤럭시 버즈2")을 선택하면, 해당 `std_id`가 내부적으로 저장된다.
    5. [BE] '등록' 버튼 클릭 시, 백엔드는 `POST /api/items`를 호출한다. `Item` 테이블에 `seller_id=1`(가정), `std_id`(선택된 값), `title`, `price`를 **INSERT**한다.

### User Story 1.2: 판매자가 [티켓]을 등록한다.

- **As a** 판매자,
- **I want to** `Event`와 `EventOption`을 순차적으로 선택하고, **`JSONB` 형식**으로 좌석 정보와 가격을 입력하여 `Item`을 등록한다.
- **Acceptance Criteria (AC):**
    1. [UI] '상품 등록' 페이지에서 '티켓 등록' 탭을 선택한다.
    2. [UI/FE] (1) `Event` 드롭다운(`GET /api/events`) / (2) `EventOption` 드롭다운(`GET /api/events/:id/options`)이 순차적으로 활성화된다.
    3. [UI] 사용자가 `EventOption`을 선택하면, '좌석 등급'(R,S...), '구역'(A,B...), '열'(10,11...)을 입력하는 필드와 '원가'(`original_price`), '판매 가격'(`price`) 입력창이 나타난다.
    4. [BE] '등록' 버튼 클릭 시, 프론트엔드는 좌석 정보를 **JSON 객체**로 만들어 `POST /api/items`를 호출한다. (예: `{"seat_info": {"grade": "R", "sector": "A", "row": 10}, ...}`)
    5. [BE] **(핵심 로직 1)** `Item` 테이블과 `TicketDetails` 테이블에 데이터를 **동시에 INSERT**해야 하므로 **트랜잭션(Transaction)** 처리를 한다. (`TicketDetails.seat_info`에는 `JSONB` 데이터가 저장됨)
    6. [BE] **(핵심 로직 2)** `Item.price`가 `TicketDetails.original_price` * 1.2 (120%)를 초과하는지 검증한다. (상세는 6.1절)
    7. [BE] 검증 실패 시, `400 Bad Request` 에러를 반환한다. 성공 시, 두 테이블에 Commit 한다.

### User Story 1.3: 판매자가 [일반 상품]을 등록한다.

- `product_code`나 `Event`를 선택하지 않고 `title`, `price`만 입력하여 `Item`을 등록한다.
- `Item` 테이블에 `std_id`는 `NULL`로 저장된다.

## Epic 2: 상품 검색 (Buyer's Flow)

### User Story 2.1: 구매자가 [통합 검색]을 한다.

- **As a** 구매자,
- **I want to** 검색창에 "아이폰"이라고 입력하여, `StandardProduct`의 `model_name`과 `Item`의 `title` 양쪽에서 일치하는 상품을 모두 찾는다.
- **Acceptance Criteria (AC):**
    1. [UI] 메인 페이지에 `GET /api/items`를 호출하여 모든 `Item` 목록을 표시한다.
    2. [UI] 검색창에 "아이폰" 입력 시, `GET /api/items?search=아이폰` API를 호출한다.
    3. [BE] **(핵심 로직 3)** `Item` 테이블과 `StandardProduct` 테이블을 **LEFT JOIN** 한다.
    4. [BE] `WHERE Item.title LIKE '%아이폰%' OR StandardProduct.model_name LIKE '%아이폰%'` SQL을 실행하여 결과를 반환한다.

### User Story 2.2: 구매자가 [카테고리]로 필터링한다.

- **As a** 구매자,
- **I want to** "디지털기기" 카테고리를 클릭하여, "디지털기기" 및 그 하위 카테고리(예: "스마트폰", "노트북")의 모든 `Item`을 한 번에 본다.
- **Acceptance Criteria (AC):**
    1. [UI] `GET /api/categories`로 모든 카테고리 목록을 가져와 표시한다.
    2. [UI] "디지털기기"(`category_id=1`) 클릭 시, `GET /api/items?category=1` API를 호출한다.
    3. [BE] **(핵심 로직 4)** `Category` 테이블에서 `category_id=1`을 포함한 모든 자식 카테고리 ID 목록을 **재귀 쿼리(Recursive CTE)**를 사용해 찾는다. (예: [1, 5, 6, 7])
    4. [BE] `Item` 테이블에서 `WHERE category_id IN (1, 5, 6, 7)` SQL을 실행하여 결과를 반환한다.

### User Story 2.3: 구매자가 [티켓 좌석]으로 필터링한다. (고도화)

- **As a** 구매자,
- **I want to** "싸이 흠뻑쇼 7/10 서울" 공연의 매물 중 "A구역" 매물만 필터링한다.
- **Acceptance Criteria (AC):**
    1. [UI] 이벤트 필터링 후, '좌석 상세 필터' UI(예: '구역' 입력창)를 제공한다.
    2. [UI] "A" 입력 시, `GET /api/items?event_option_id=10&seat_sector=A` API를 호출한다.
    3. [BE] **(핵심 로직 5 - JSONB 쿼리)** `Item` ↔ `TicketDetails` JOIN 후, **`JSONB` 쿼리 연산자(`>>`)**를 사용해 `seat_info` 내부를 검색한다.
    4. [BE] `WHERE T.event_option_id = 10 AND TD.seat_info ->> 'sector' = 'A'` SQL을 실행하여 결과를 반환한다.

# 5. 핵심 데이터베이스 아키텍처 및 고도화 전략

본 프로젝트는 단순 기능 구현을 넘어, '데이터베이스 고도화' 자체를 핵심 목표로 한다. 이를 위해 기존 C2C 플랫폼의 암시적 한계(비정규화된 데이터)를 극복하는 구체적인 DB 기술로 **PostgreSQL**을 선정하고 활용한다.

## 5.1. RDBMS 선정: PostgreSQL

MySQL도 훌륭한 범용 RDBMS이나, 본 프로젝트의 '고도화' 목표 달성을 위해 다음과 같은 명확한 이점을 제공하는 PostgreSQL을 최종 선정한다.

1. **`JSONB` (Native JSON Support):**
    - **활용:** `TicketDetails.seat_info` (좌석) 및 `StandardProduct.specs` (제품 스펙) 컬럼에 적용.
    - **이점:** "R석 A구역 10열" 같은 비정형 텍스트(`VARCHAR`)를 `{"grade": "R", "sector": "A"}` 같은 **정형화된 비정형 데이터(`JSONB`)**로 저장한다.
    - **증명(US 2.3):** `VARCHAR`의 `LIKE '%A구역%'` 검색 대비, `JSONB` 연산자(`>> 'sector' = 'A'`)를 사용한 **인덱싱 가능한** 고속 검색을 시연한다. 이는 데이터베이스가 단순 저장을 넘어 데이터의 '의미'를 이해하고 처리함을 증명한다.
2. **강력한 내장 기능 (Triggers, Recursive CTEs):**
    - **재귀 쿼리 (Recursive CTE):** '계층형 카테고리'(US 2.2) 검색 시, `WITH RECURSIVE` SQL문을 사용하여 N+1 쿼리 문제 없이 **단 하나의 쿼리**로 모든 하위 카테고리를 조회한다.
    - **트리거 (`PL/pgSQL`):** '암표 방지'(US 1.2) 로직을 애플리케이션(Node.js)이 아닌 **DB단**에 구현한다. `BEFORE INSERT/UPDATE` 트리거를 사용하여, 가격 조건 미충족 시 `INSERT` 자체를 롤백시킨다. (6.1절)

## 5.2. 핵심 DB 기능 활용 전략 (요약)

| 차별화 포인트 | 대상 테이블/기능 | 활용 기술 (PostgreSQL) | 기존 C2C 플랫폼의 한계 |
| --- | --- | --- | --- |
| **유연한 상품 스펙** | `StandardProduct`, `TicketDetails` | **`JSONB` Data Type** | 모든 스펙을 `VARCHAR(255)`로 저장 (검색/필터링 불가) |
| **카테고리 필터링** | `Category` (Self-Referencing) | **Recursive CTE (재귀 쿼리)** | 애플리케이션에서 N+1 쿼리 발생 (성능 저하) |
| **비즈니스 로직 강제** | `Item`, `TicketDetails` (암표 방지) | **Database Trigger (`PL/pgSQL`)** | Node.js 등 애플리케이션단에서만 검증 (DB 무결성 보장X) |
| **확장성 있는 구조** | `Item` ↔ `TicketDetails` | **1:1 특수화 관계 (IS-A)** | `Item` 테이블에 `seat_info` 등 `NULL` 컬럼이 난립 (비정규화) |
| **안정적 ID 관리** | 모든 테이블 PK | **`BIGSERIAL` / `IDENTITY`** | `INT` 사용 시 대용량 서비스에서 ID 고갈(Overflow) 위험 |

# 6. 핵심 데이터베이스 로직 (상세)

## 6.1. 암표 방지 (Scalping Prevention)

- **요구사항:** 티켓 판매 가격(`Item.price`)은 원가(`TicketDetails.original_price`)의 120%를 초과할 수 없다.
- **구현 방식 (권장):** PostgreSQL **트리거(Trigger)** 사용.
    - **전략:** `Item` 테이블이 아닌, `Item`과 1:1 관계인 `TicketDetails` 테이블의 `INSERT` 시점에 가격 검증 로직을 수행하는 것이 가장 정합성이 높다. (`Item` 등록 트랜잭션 내에서 `TicketDetails`가 `INSERT`될 때 실행)
    - **트리거 함수 (Function) 생성:**
        
        ```
        CREATE OR REPLACE FUNCTION check_ticket_price_limit()
        RETURNS TRIGGER AS $$
        DECLARE
          item_price INT;
        BEGIN
          -- 1:1 관계의 Item 테이블에서 판매 가격을 가져옴
          SELECT price INTO item_price FROM Item WHERE item_id = NEW.item_id;
        
          -- 가격 비교 (NEW.original_price는 방금 INSERT되는 TicketDetails의 원가)
          IF item_price > (NEW.original_price * 1.2) THEN
            RAISE EXCEPTION 'Price (%) exceeds 120%% of the original price (%). Scalping detected.', item_price, NEW.original_price;
          END IF;
        
          RETURN NEW; -- 검증 통과
        END;
        $$ LANGUAGE plpgsql;
        
        ```
        
    - **트리거 생성:**
        
        ```
        CREATE TRIGGER trigger_check_price
        BEFORE INSERT ON TicketDetails
        FOR EACH ROW
        EXECUTE FUNCTION check_ticket_price_limit();
        
        ```
        

# 7. API Endpoints (초안)

| Method | Endpoint | 설명 (User Story) |
| --- | --- | --- |
| `POST` | `/api/items` | 새 `Item` 등록 (1.1, 1.2, 1.3) |
| `GET` | `/api/items` | 모든 `Item` 조회 + 필터링 (2.1, 2.2, 2.3) |
| `GET` | `/api/products/autocomplete` | 표준 제품 `product_code` 자동완성 (1.1) |
| `GET` | `/api/categories` | 모든 카테고리 목록 조회 (2.2) |
| `GET` | `/api/events` | 모든 `Event` 목록 조회 (1.2) |
| `GET` | `/api/events/:id/options` | 특정 `Event`의 `EventOption` 목록 조회 (1.2) |

# 8. 데이터베이스 스키마 (PostgreSQL - Mermaid)

- (PostgreSQL의 `JSONB`, `BIGINT(BIGSERIAL)`, `Timestamp` 타입을 반영한 최종 스키마)

```
erDiagram
    User ||--|{ Item : "sells"
    User ||--o{ Transaction : "buys"
    User ||--o{ Review : "writes (reviewer)"
    User ||--o{ Review : "receives (reviewee)"
    User ||--o{ ChatRoom : "participates_as_buyer"
    User ||--o{ ChatRoom : "participates_as_seller"
    User ||--o{ ChatMessage : "sends"

    Item {
        BIGINT item_id PK "BIGSERIAL"
        BIGINT seller_id FK
        String title
        Integer price
        ENUM status "ON_SALE, RESERVED, SOLD (CREATE TYPE)"
        String description
        Timestamp reg_date
        BIGINT std_id FK "Nullable"
        BIGINT category_id FK "Nullable"
    }
    Item |o--o| Transaction : "is_sold_in (1:1)"
    Item ||--|{ ChatRoom : "discusses (1:N)"
    Item ||--|| TicketDetails : "is_a (1:1 specialization)"

    StandardProduct {
        BIGINT std_id PK "BIGSERIAL"
        String product_code "Unique"
        String brand_name
        String model_name
        JSONB specs "Product specifications"
        BIGINT category_id FK
    }
    StandardProduct }o--|| Item : "is_template_for (1:N)"

    Category {
        BIGINT category_id PK "BIGSERIAL"
        String category_name
        BIGINT parent_category_id FK "Nullable, self-ref"
    }
    Category }o--|| Item : "classifies (1:N)"
    Category }o--|| StandardProduct : "classifies (1:N)"
    Category }o--o{ Category : "is_child_of (Hierarchy)"

    Event {
        BIGINT event_id PK "BIGSERIAL"
        String event_name
        String artist_name
    }
    Event ||--|{ EventOption : "has_options (1:N)"

    EventOption {
        BIGINT event_option_id PK "BIGSERIAL"
        BIGINT event_id FK
        String venue
        Timestamp event_datetime
    }
    EventOption ||--|{ TicketDetails : "is_template_for (1:N)"

    TicketDetails {
        BIGINT item_id PK "PK & FK to Item"
        BIGINT event_option_id FK
        JSONB seat_info "e.g., {"grade": "R", "sector": "A"}"
        Integer original_price
    }

    Transaction {
        BIGINT trans_id PK "BIGSERIAL"
        BIGINT item_id FK "Unique"
        BIGINT buyer_id FK
        Integer final_price
        Timestamp trans_date
    }
    Transaction ||--o{ Review : "generates (1:N)"

    Review {
        BIGINT review_id PK "BIGSERIAL"
        BIGINT trans_id FK
        BIGINT reviewer_id FK
        BIGINT reviewee_id FK
        Integer rating "CHECK (1-5)"
        String comment
    }

    ChatRoom {
        BIGINT room_id PK "BIGSERIAL"
        BIGINT item_id FK
        BIGINT buyer_id FK
        BIGINT seller_id FK
    }
    ChatRoom ||--|{ ChatMessage : "contains (1:N)"

    ChatMessage {
        BIGINT message_id PK "BIGSERIAL"
        BIGINT room_id FK
        BIGINT sender_id FK
        String content
        Timestamp sent_at
    }

```

# 9. 배포 계획 (Deployment Plan)

## 9.1. 목표

- **비용 0원**으로 팀원 간 원격 테스트 및 최종 데모 시연이 가능한 클라우드 환경을 구축한다.

## 9.2. 배포 스택

| 구분 | 서비스 | 역할 (및 이유) |
| --- | --- | --- |
| **Frontend (React)** | **Vercel** | React 배포에 최적화. GitHub 연동 시 `push`만으로 자동 배포. (무료) |
| **Backend (Node.js)** | **Render** | 'Free Web Service' 플랜 제공. GitHub 연동 및 자동 `npm install/start`. (무료) |
| **Database (PostgreSQL)** | **Railway** (또는 Neon) | PostgreSQL 호환. DB 프로젝트 데모에 충분한 강력한 무료 티어(Free Tier) 제공. (무용) |

## 9.3. 기술적 주요 사항

배포 시 `localhost` 환경과 달라 발생하는 2가지 주요 문제를 해결한다.

1. **CORS (Cross-Origin Resource Sharing)**
    - **문제:** 프론트엔드(`Vercel` 주소)와 백엔드(`Render` 주소)의 도메인이 달라 브라우저가 API 요청을 차단.
    - **해결:** **백엔드(Node.js)**에서 `cors` 라이브러리를 설치하고, Vercel에서 배포된 프론트엔드 주소(`origin`)만 명시적으로 허용한다.
2. **데이터베이스 연결 (환경 변수)**
    - **문제:** 백엔드 서버가 `localhost:5432`가 아닌, 클라우드(`Railway`)에 있는 DB 주소로 접속해야 함.
    - **해결:** `Railway`에서 제공하는 DB 연결 정보(DATABASE_URL)를 **백엔드 서버(Render)**의 **'환경 변수(Environment Variables)'**에 등록한다. Node.js 코드는 `process.env.DATABASE_URL`을 참조하여 DB에 연결한다.

# 10. 초기 데이터 명세 (Mock Data Specification)

데모 시연 및 기능 검증(US 2.2, 2.3)을 위해, 11개 테이블 중 최소 5개 핵심 테이블에는 `INSERT`를 통해 다음과 같은 초기 데이터가 반드시 필요하다.

### 10.1. `Category` (계층 구조)

- 재귀 쿼리(US 2.2)를 검증하기 위한 계층 데이터가 필요.

| category_id | category_name | parent_category_id |
| --- | --- | --- |
| 1 | 디지털기기 | NULL |
| 2 | 가전 | NULL |
| 3 | 티켓 | NULL |
| 4 | 스마트폰 | 1 |
| 5 | 노트북 | 1 |
| 6 | TV | 2 |

### 10.2. `StandardProduct` (SKU 및 `JSONB`)

- SKU 검색(US 1.1) 및 `JSONB` 스펙(US 5.1) 검증용 데이터.

| std_id | product_code | brand_name | model_name | specs (`JSONB`) | category_id |
| --- | --- | --- | --- | --- | --- |
| 1 | SM-R177 | 삼성 | 갤럭시 버즈2 | `{"color": "white", "bluetooth": "5.2"}` | 1 |
| 2 | SM-F731N | 삼성 | 갤럭시 Z플립5 | `{"color": "mint", "ram_gb": 8, "storage_gb": 256}` | 4 |
| 3 | M3-PRO-14 | Apple | 맥북프로 14 M3 | `{"color": "space_black", "ram_gb": 18, "chip": "M3 Pro"}` | 5 |

### 10.3. `Event` 및 `EventOption` (티켓)

- 티켓 등록(US 1.2) 및 필터링(US 2.3)을 위한 기본 이벤트 데이터.

**Event**
| event_id | event_name | artist_name |
| :--- | :--- | :--- |
| 1 | 싸이 흠뻑쇼 2025 | 싸이 |
| 2 | 아이유 콘서트 2025 | 아이유 |

**EventOption**
| event_option_id | event_id | venue | event_datetime |
| :--- | :--- | :--- | :--- |
| 10 | 1 | 서울 잠실주경기장 | '2025-07-10 19:00:00' |
| 11 | 1 | 부산 아시아드 | '2025-07-15 19:00:00' |
| 12 | 2 | 서울 월드컵경기장 | '2025-09-20 18:00:00' |

### 10.4. `Item` 및 `TicketDetails` (실제 매물)

- 암표 방지(6.1) 및 `JSONB` 검색(US 2.3)을 위한 핵심 데이터.

**Item**
| item_id | seller_id | title | price | std_id | category_id |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 1 | (티켓) 흠뻑쇼 서울 R석 A구역 팝니다 | 180000 | NULL | 3 |
| 2 | 1 | (티켓) 흠뻑쇼 서울 S석 팝니다 | 150000 | NULL | 3 |
| 3 | 1 | (SKU) 갤럭시 Z플립5 민트색 A급 | 750000 | 2 | 4 |
| 4 | 1 | (일반) 직접 만든 손수건 | 5000 | NULL | NULL |

**TicketDetails**

- `item_id=1` (암표 O) / `item_id=2` (암표 X)
| item_id | event_option_id | seat_info (`JSONB`) | original_price |
| :--- | :--- | :--- | :--- |
| 1 | 10 | `{"grade": "R", "sector": "A", "row": 10, "number": 5}` | 130000 |
| 2 | 10 | `{"grade": "S", "sector": "C", "row": 20, "number": 11}` | 120000 |

# 11. 구현을 위한 태스크 분류 (Implementation Tasks)

프로젝트 MVP(4장) 및 고도화 전략(5장)을 기반으로, 구현 태스크를 역할별로 분류한다.

### 11.1. [DB (PostgreSQL)]

- **담당:** 데이터베이스 설계 및 핵심 로직 구현
- **Task 1: DDL 작성:** 8장의 Mermaid 스키마를 기반으로 11개 테이블 `CREATE TABLE` DDL 스크립트 작성 (PK, FK, `JSONB`, `BIGSERIAL`, `ENUM` 등 모든 타입 및 제약 조건 포함)
- **Task 2: 초기 데이터 `INSERT`:** 10장의 Mock Data `INSERT` 스크립트 작성
- **Task 3: 트리거 작성 (6.1):** `check_ticket_price_limit()` 함수 및 `trigger_check_price` 트리거 (암표 방지) `PL/pgSQL` 코드 작성
- **Task 4: 재귀 쿼리 검증 (5.2):** `Category` 테이블용 `WITH RECURSIVE` SQL (US 2.2) 검증
- **Task 5: `JSONB` 쿼리 검증 (5.1):** `TicketDetails.seat_info` 대상 `JSONB` 연산자( `>>` ) 쿼리 (US 2.3) 검증
- **Task 6: 배포:** `Railway` (또는 Neon)에 PostgreSQL 인스턴스 생성 및 DDL, Mock Data 적용 (팀원에게 `DATABASE_URL` 공유)

### 11.2. [Backend (Node.js/Express)]

- **담당:** API 엔드포인트 구현 (7장)
- **Task 1: 프로젝트 셋업:** Express 서버 기본 구조, `cors` 설정 (9.3), PostgreSQL DB 연결(`node-postgres` 라이브러리) 모듈화
- **Task 2: API 구현 (GET /categories, /events):** 단순 `SELECT` API 구현 (US 1.2, 2.2)
- **Task 3: API 구현 (GET /events/:id/options):** `WHERE` 조건 `SELECT` API 구현 (US 1.2)
- **Task 4: API 구현 (GET /products/autocomplete):** `LIKE` 검색 API 구현 (US 1.1)
- **Task 5: API 구현 (POST /items):** `INSERT` 로직 구현. 특히 **트랜잭션(Transaction)** 처리 (`BEGIN`, `COMMIT`, `ROLLBACK`) 필수 (US 1.2 - 티켓 등록 시 `Item`과 `TicketDetails` 동시 `INSERT`)
- **Task 6: API 구현 (GET /items? ...):** 복합 `JOIN` 및 `WHERE` 절을 동적으로 생성하는 가장 복잡한 API 구현
    - `?search=` (US 2.1 - `LEFT JOIN ... WHERE ... LIKE ...`)
    - `?category=` (US 2.2 - [DB] Task 4의 재귀 쿼리 SQL을 받아 실행)
    - `?event_option_id=` + `&seat_sector=` (US 2.3 - [DB] Task 5의 `JSONB` 쿼리 SQL을 받아 실행)
- **Task 7: 배포:** `Render`에 Node.js 프로젝트 배포 및 `DATABASE_URL` 환경 변수 설정 (9.3)

### 11.3. [Frontend (React)]

- **담당:** 사용자 시연을 위한 UI/UX 구현
- **Task 1: 프로젝트 셋업:** React(`create-react-app` 등) 셋업, `axios` (API 호출) 설치
- **Task 2: UI 컴포넌트:** '상품 목록' UI, '상품 등록' UI (탭 전환 포함) 기본 레이아웃 구현
- **Task 3: 기능 구현 (상품 등록 - SKU):** '제품 코드' 입력 시 `autocomplete` API(BE Task 4) 호출 및 UI 렌더링 (US 1.1)
- **Task 4: 기능 구현 (상품 등록 - 티켓):** `Event` 선택 시 `EventOption` API(BE Task 3)를 연쇄적으로 호출하는 로직 구현. 좌석 정보(`JSONB`) 입력을 받아 `POST /items` API(BE Task 5) 호출 (US 1.2)
- **Task 5: 기능 구현 (검색/필터링):** '검색창', '카테고리 목록', '이벤트 필터' UI에서 `GET /items` API(BE Task 6)를 다양한 파라미터로 호출하고, 목록을 다시 렌더링하는 기능 구현 (US 2.1, 2.2, 2.3)
- **Task 6: 배포:** `Vercel`에 React 프로젝트 배포 및 API 요청 주소를 `Render` 백엔드 주소로 설정 (9.3)
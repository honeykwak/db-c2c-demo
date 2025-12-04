const express = require('express');
const cors = require('cors');
require('dotenv').config();

const categoriesRouter = require('./routes/categories');
const eventsRouter = require('./routes/events');
const productsRouter = require('./routes/products');
const itemsRouter = require('./routes/items');

const app = express();

// 미들웨어
// CORS: 로컬에서는 전체 허용, 배포 환경에서는 CORS_ORIGIN으로 제한 가능
const allowedOrigin = process.env.CORS_ORIGIN;
if (allowedOrigin) {
  app.use(
    cors({
      origin: allowedOrigin,
    }),
  );
} else {
app.use(cors());
}
app.use(express.json());

// 라우트
app.use('/api/categories', categoriesRouter);
app.use('/api/events', eventsRouter);
app.use('/api/products', productsRouter);
app.use('/api/items', itemsRouter);

// 헬스 체크용
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}`);
});



require('dotenv').config();

// Initialise Firebase Admin first (before any routes need it)
require('./config/firebaseAdmin');

const express   = require('express');
const cors      = require('cors');
const mongoose  = require('mongoose');
const rateLimit = require('express-rate-limit');

const notificationRoutes = require('./routes/notifications');
const farmRoutes         = require('./routes/farms');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Rate limit: max 20 send-requests per minute
const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, slow down.' },
});
app.use('/api/notifications/send', sendLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/notifications', notificationRoutes);
app.use('/api/farms',         farmRoutes);

app.get('/health', (_, res) => res.json({
  status:    'ok',
  project:   process.env.FIREBASE_PROJECT_ID,
  time:      new Date(),
}));

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

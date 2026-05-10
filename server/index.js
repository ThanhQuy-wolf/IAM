require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const connectDB = require('./config/db');
const passport = require('./config/passport');

const app = express();

connectDB();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(passport.initialize());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/oauth', require('./routes/oauth'));
app.use('/api/twofa', require('./routes/twofa'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/webauthn', require('./routes/webauthn'));

app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

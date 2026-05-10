const router = require('express').Router();
const passport = require('../config/passport');
const { generateAccessToken, generateRefreshToken, setRefreshCookie } = require('../services/tokenService');

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` }),
  async (req, res) => {
    try {
      const user = req.user;
      const accessToken = generateAccessToken(user);
      const refreshToken = await generateRefreshToken(user._id);
      setRefreshCookie(res, refreshToken);

      // Pass access token to client via URL fragment (stays in-memory, not server logs)
      res.redirect(`${process.env.CLIENT_URL}/oauth/callback#token=${accessToken}`);
    } catch (err) {
      res.redirect(`${process.env.CLIENT_URL}/login?error=server`);
    }
  }
);

module.exports = router;

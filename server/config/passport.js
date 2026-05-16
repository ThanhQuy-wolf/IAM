const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;

    // Link to existing account if email matches
    let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

    if (user) {
      if (!user.googleId) {
        user.googleId = profile.id;
        await user.save();
      }
      return done(null, user);
    }

    user = await User.create({ email, googleId: profile.id });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
  scope: ['user:email'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(null, false);

    // Link to existing account if email matches
    let user = await User.findOne({ $or: [{ githubId: profile.id }, { email }] });

    if (user) {
      if (!user.githubId) {
        user.githubId = profile.id;
        await user.save();
      }
      return done(null, user);
    }

    user = await User.create({ email, githubId: profile.id });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

module.exports = passport;

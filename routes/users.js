const express = require('express');
const User = require('./../models/user');
const router = express.Router();
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

router.get('/register', async (req, res) => {
  res.render('users/register', { ...req.content });
});

router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // register using passport
  User.register({ username }, password, async (err, user) => {
    if (err) {
      req.flash('error', err.message);
      res.render('users/register', { ...req.content });
    } else {
      passport.authenticate('local')(req, res, () => {
        req.flash('success', 'Váš účet byl v pořádku vytvořen. Nyní jste přihlášen/a.');
        res.redirect('/posts');
      });
    }
  });
});

router.get('/login', async (req, res) => {
  res.render('users/login', { ...req.content });
});

router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/posts',
    failureRedirect: '/users/login',
    failureFlash: 'Nesprávné uživatelské jméno nebo heslo.',
  })
);

router.get('/logout', async (req, res) => {
  req.logout();
  req.flash('success', 'Byl/a jste odhášen/a.');
  res.redirect('/');
});

module.exports = router;

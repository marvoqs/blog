module.exports = function (req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      req.flash('error', 'Pro přístup na tuto stránku je potřeba se nejprve přihlásit.');
      res.redirect('/users/login');
    }
}
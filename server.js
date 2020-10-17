require('dotenv').config();
const express = require('express');
const flash = require('express-flash');
const session = require('express-session');
const passport = require('passport');
const methodOverride = require('method-override');
const ejs = require('ejs');
const connectDB = require("./config/db");
const postRouter = require('./routes/posts');
const userRouter = require('./routes/users');
const pageComposer = require('./middleware/pageComposer');

const Post = require('./models/post');
const User = require('./models/user');

const app = express();

const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

connectDB();

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(pageComposer);

app.get('/', (req, res) => {
  res.redirect('/posts');
})

app.use('/posts', postRouter);
app.use('/users', userRouter);

app.listen(port, () => console.log(`Server runs on port ${port}.`));
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const _ = require('lodash');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const czdate = require('./czdate');

const Post = require('./models/post');
const User = require('./models/user');

const app = express();

const port = process.env.PORT || 3000;
const postLimit = 10;

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

mongoose.connect(
  `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.t7utl.mongodb.net/blog?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  }
);

app.get('/', async (req, res) => {

  function composeMessage(numOfArticles) {
    // compose message based on number of found articles
    if (numOfArticles === 0) {
      return 'Nebyl nalezen žádný článek odpovídající vašemu zadání.';
    } else if (numOfArticles === 1) {
      return 'Nalezli jsme 1 článek, který odpovídá vašemu zadání.';
    } else if (numOfArticles > 1 && numOfArticles < 5) {
      return `Nalezli jsme ${numOfArticles} články, které odpovídají vašemu zadání.`;
    } else {
      return `Nalezli jsme ${numOfArticles} článků, které odpovídají vašemu zadání.`;
    }
  }

  try {

    // user-is-searching checker
    const isSearching = () => (req.query.q !== undefined && req.query.q !== '');

    // create db query
    const dbQuery = isSearching() ? { $text: { $search: req.query.q } } : {};

    // get number of all the found articles
    const numOfArticles = await Post.countDocuments(dbQuery);

    // if user is searching, compose a message based on number of found articles
    const message = isSearching() && composeMessage(numOfArticles);

    // pagination
    const page = req.query.page === undefined ? 1 : parseInt(req.query.page);
    const startIndex = (page - 1) * postLimit;
    const endIndex = page * postLimit;
    const navigation = {};
    if (endIndex < (numOfArticles)) {
      navigation.next = page + 1;
    }
    if (startIndex > 0) {
      navigation.previous = page - 1;
    }

    Post.createIndexes();

    // get posts for this page
    const posts = await Post.find(dbQuery)
      .sort({
        date: -1,
      })
      .skip(startIndex)
      .limit(postLimit);

    // go throw the posts and humanize its dates
    posts.map(
      (post) => (post.dateHumanized = czdate(post.date, 'd. m. yyyy H:MM'))
    );

    // compose content
    const content = await composeContent({
      query: req.query.q,
      message,
      posts,
      navigation
    });

    res.render('posts', content);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error.');
  }

});

app.get('/posts/:id/:kebab', async (req, res) => {
  try {
    // look for post and update views
    const post = await Post.findOneAndUpdate({
      _id: req.params.id,
      kebab: req.params.kebab,
    }, {
      $inc: {
        views: 1,
      },
    });

    // check if post exists
    if (post) {
      // create a new field with humanized date
      post.dateHumanized = czdate(post.date, 'dddd d. mmmm yyyy H:MM');

      //render page with post
      res.render('post', await composeContent({post}));
    } else {
      // redirect home with 404
      res.status(404).redirect('/');
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error.');
  }
});

app.get('/register', async (req, res) => {
  res.render('register', await composeContent());
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // register using passport
  User.register({username}, password, async (err, user) => {
    if (err) {
      console.error(err.message);
      res.render('register', await composeContent({message: err.message}));
    } else {
      passport.authenticate('local')(req, res, () => {
        res.redirect('/compose');
      });
    }
    
  });

});

app.get('/login', async (req, res) => {
  res.render('login', await composeContent());
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = new User({ username, password });

  req.login(user, async (err) => {
    if (err) {
      console.error(err.message);
      res.render('login', await composeContent({message: err.message}));
    } else {
      passport.authenticate('local')(req, res, () => {
        res.redirect('/compose');
      });
    }
  })

});

app.get('/logout', async (req, res) => {
  req.logout();
  res.redirect('/');
});

app.get('/compose', async (req, res) => {
  if (req.isAuthenticated()) {
    res.render('compose', await composeContent());
  } else {
    res.redirect('/login');
  }
  
});

app.post('/compose', async (req, res) => {
  const {
    title,
    intro,
    content,
    tags
  } = req.body;

  let kebab = _.kebabCase(title);

  const tagsArray = tags.split(',').map((tag) => tag.trim());

  const post = new Post({
    kebab,
    title,
    intro,
    content,
    tags: tagsArray,
    date: Date.now(),
  });

  post.save((err) => {
    if (!err) {
      res.redirect('/');
    }
  });
});

async function composeContent(content = {}) {
  return {
    ...content,
    newPosts: await getNewPosts(),
    popularPosts: await getPopularPosts(),
  };
}

async function getNewPosts() {
  const newPosts = await Post.find()
    .sort({
      date: -1,
    })
    .limit(5);

  newPosts.map(
    (post) => (post.dateHumanized = czdate(post.date, 'd. m. yyyy H:MM'))
  );

  return newPosts;
}

async function getPopularPosts() {
  const popularPosts = await Post.find()
    .sort({
      views: -1,
    })
    .limit(5);

  popularPosts.map(
    (post) => (post.dateHumanized = czdate(post.date, 'd. m. yyyy H:MM'))
  );

  return popularPosts;
}

app.listen(port, () => console.log(`Server runs on port ${port}.`));
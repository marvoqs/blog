require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const _ = require('lodash');
const czdate = require('./czdate');
const Post = require('./posts');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(
  `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.t7utl.mongodb.net/blog?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  }
);

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(
  express.urlencoded({
    extended: true,
  })
);

const postLimit = 10;

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
    const isSearching = () => (req.query.q !== undefined && req.query.q !== '');
    
    const dbQuery = isSearching() ? { $text: { $search: req.query.q } } : {};

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
    const posts = await Post.find(dbQuery)
      .sort({
        date: -1,
      })
      .skip(startIndex)
      .limit(postLimit);

    posts.map(
      (post) => (post.dateHumanized = czdate(post.date, 'd. m. yyyy H:MM'))
    );

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

app.get('/compose', async (req, res) => {
  res.render('compose', await composeContent());
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

async function composeContent(content) {
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
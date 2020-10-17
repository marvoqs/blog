const express = require('express');
const auth = require('./../middleware/auth');
const Post = require('./../models/post');
const router = express.Router();

const czdate = require('../config/czdate');

const postLimit = 10;

router.get('/', async (req, res) => {
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
    const isSearching = () => req.query.q !== undefined && req.query.q !== '';

    // create db query
    const dbQuery = isSearching() ? { $text: { $search: req.query.q } } : {};

    // get number of all the found articles
    const numOfArticles = await Post.countDocuments(dbQuery);

    // pagination
    const page = req.query.page === undefined ? 1 : parseInt(req.query.page);
    const startIndex = (page - 1) * postLimit;
    const endIndex = page * postLimit;
    const navigation = {};
    if (endIndex < numOfArticles) {
      navigation.next = page + 1;
    }
    if (startIndex > 0) {
      navigation.previous = page - 1;
    }

    Post.createIndexes();

    // get posts for this page
    const posts = await Post.find(dbQuery)
      .sort({
        createdAt: -1,
      })
      .skip(startIndex)
      .limit(postLimit);

    // go throw the posts and humanize its dates
    posts.map((post) => (post.dateHumanized = czdate(post.createdAt, 'd. m. yyyy H:MM')));

    // compose content
    const content = {
      ...req.content,
      query: req.query.q,
      posts,
      navigation,
    };

    // if user is searching, compose and flash a message based on number of found articles
    if (isSearching()) {
      req.flash('info', composeMessage(numOfArticles));
    }

    res.render('posts/index', content);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error.');
  }
});

router.get('/new', auth, async (req, res) => {
  res.render('posts/new', { ...req.content, post: new Post() });
});

router.get('/edit/:id', auth, async (req, res) => {
  post = await Post.findById(req.params.id);
  res.render('posts/edit', { ...req.content, post });
});

router.post(
  '/',
  auth,
  async (req, res, next) => {
    req.post = new Post();
    req.post.authorId = req.user.id;
    next();
    req.flash('success', 'Nový článek byl úspěšně vložen.');
  },
  savePostAndRedirect('new')
);

router.put(
  '/:id',
  auth,
  async (req, res, next) => {
    req.post = await Post.findById(req.params.id);
    next();
    req.flash('success', 'Změny byly uloženy.');
  },
  savePostAndRedirect('new')
);

router.delete('/:id', auth, async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  req.flash('success', 'Článek byl odstraněn.');
  res.redirect('/');
});

router.get('/:slug', async (req, res) => {
  try {
    // look for post and update views
    const post = await Post.findOneAndUpdate(
      { slug: req.params.slug },
      {
        $inc: {
          views: 1,
        },
      }
    );

    // check if post exists
    if (post) {
      // create a new field with humanized date
      post.dateHumanized = czdate(post.createdAt, 'dddd d. mmmm yyyy H:MM');

      //render page with post
      res.render('posts/show', { ...req.content, post });
    } else {
      // redirect home with 404
      res.status(404).redirect('/');
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error.');
  }
});

function savePostAndRedirect(path) {
  return async (req, res) => {
    let post = req.post;
    post.title = req.body.title;
    post.intro = req.body.intro;
    post.markdown = req.body.markdown;
    post.tags = req.body.tags.split(',').map((tag) => tag.trim());
    try {
      post = await post.save();
      res.redirect(`/posts/${post.slug}`);
    } catch (e) {
      console.log(e);
      res.render(`posts/${path}`, { ...req.content, post });
    }
  };
}

module.exports = router;

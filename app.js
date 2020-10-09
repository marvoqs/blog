require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const _ = require('lodash');
const dateFormat = require('dateformat');
const Post = require('./posts');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(
  `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.t7utl.mongodb.net/blog?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  }
);

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(
  express.urlencoded({
    extended: true,
  })
);

dateFormat.i18n = {
  dayNames: [
    'ne',
    'po',
    'út',
    'st',
    'čt',
    'pá',
    'so',
    'neděle',
    'pondělí',
    'úterý',
    'středa',
    'čtvrtek',
    'pátek',
    'sobota',
  ],
  monthNames: [
    'ledna',
    'února',
    'března',
    'dubna',
    'května',
    'června',
    'července',
    'srpna',
    'září',
    'října',
    'listopadu',
    'prosince',
    'ledna',
    'února',
    'března',
    'dubna',
    'května',
    'června',
    'července',
    'srpna',
    'září',
    'října',
    'listopadu',
    'prosince',
  ],
  timeNames: ['a', 'p', 'am', 'pm', 'A', 'P', 'AM', 'PM'],
};

const postLimit = 10;

app.get('/', (req, res) => {
  res.redirect('/posts');
});

app.get('/posts', async (req, res) => {
  const page = req.query.page === undefined ? 1 : parseInt(req.query.page);

  const startIndex = (page - 1) * postLimit;
  const endIndex = page * postLimit;

  const navigation = {};

  if (endIndex < (await Post.countDocuments().exec())) {
    navigation.next = page + 1;
  }

  if (startIndex > 0) {
    navigation.previous = page - 1;
  }

  try {
    const posts = await Post.find()
      .sort({
        date: -1,
      })
      .skip(startIndex)
      .limit(postLimit)
      .exec();
    posts.map(
      (post) => (post.dateHumanized = dateFormat(post.date, 'd. m. yyyy H:MM'))
    );

    const content = {
      newPosts: await getNewPosts(),
      popularPosts: await getPopularPosts(),
      posts,
      page,
    };

    res.render('home', content);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error.');
  }
});

app.get('/posts/:id/:kebab', async (req, res) => {
  try {
    // look for post and update views
    const post = await Post.findOneAndUpdate(
      {
        _id: req.params.id,
        kebab: req.params.kebab,
      },
      {
        $inc: {
          views: 1,
        },
      }
    );

    // check if post exists
    if (post) {
      // create a new field with humanized date
      post.dateHumanized = dateFormat(post.date, 'dddd d. mmmm yyyy H:MM');

      const content = {
        newPosts: await getNewPosts(),
        popularPosts: await getPopularPosts(),
        post,
      };

      //render page with post
      res.render('post', content);
    } else {
      // redirect home with 404
      res.status(404).redirect('/');
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error.');
  }
});

app.get('/compose', (req, res) => {
  res.render('compose', {
    newPosts: getNewPosts(),
  });
});

app.post('/compose', (req, res) => {
  const { title, intro, content, labels } = req.body;

  let kebab = _.kebabCase(title);

  const labelsArray = labels.split(',').map((label) => label.trim());

  const post = new Post({
    kebab,
    title,
    intro,
    content,
    labels: labelsArray,
    date: Date.now(),
  });

  post.save((err) => {
    if (!err) {
      res.redirect('/');
    }
  });
});

async function getNewPosts() {
  const newPosts = await Post.find()
    .sort({
      date: -1,
    })
    .limit(5);

  newPosts.map(
    (post) => (post.dateHumanized = dateFormat(post.date, 'd. m. yyyy H:MM'))
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
    (post) => (post.dateHumanized = dateFormat(post.date, 'd. m. yyyy H:MM'))
  );

  return popularPosts;
}

app.listen(port, () => console.log(`Server runs on port ${port}.`));

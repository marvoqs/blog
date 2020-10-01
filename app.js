require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const _ = require('lodash');
const dateFormat = require('dateformat');

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

const postSchema = {
  kebab: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  intro: {
    type: String,
    required: true,
  },
  content: String,
  date: {
    type: Date,
    default: Date.now(),
  },
  labels: [],
  views: {
    type: Number,
    default: 0,
  },
};

const Post = mongoose.model('Post', postSchema);

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(
  express.urlencoded({
    extended: true,
  })
);

dateFormat.i18n = {
  dayNames: [
    'neděle',
    'pondělí',
    'úterý',
    'středa',
    'čtvrtek',
    'pátek',
    'sobota',
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

app.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({
      date: -1,
    });
    posts.map(
      (post) => (post.dateHumanized = dateFormat(post.date, 'd. m. yyyy H:MM'))
    );
    res.render('home', {
      posts,
    });
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
      { $inc: { views: 1 } }
    );

    // check if post exists
    if (post) {
      // create a new field with humanized date
      post.dateHumanized = dateFormat(post.date, 'dddd d. mmmm yyyy H:MM');

      //render page with post
      res.render('post', {
        post,
      });
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
  res.render('compose');
});

app.post('/compose', async (req, res) => {
  const { title, intro, content, labels } = req.body;

  let kebab = _.kebabCase(title);

  const labelsArray = labels.split(',').map((label) => label.trim());

  const post = new Post({
    kebab,
    title,
    intro,
    content,
    labels: labelsArray,
  });

  post.save((err) => {
    if (!err) {
      res.redirect('/');
    }
  });
});

app.listen(port, () => console.log(`Server runs on port ${port}.`));

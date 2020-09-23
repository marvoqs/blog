require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(
  `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.t7utl.mongodb.net/blog?retryWrites=true&w=majority`,
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const postSchema = {
  kebab: String,
  title: String,
  intro: String,
  content: String,
  date: {
    type: Date,
    default: Date.now(),
  },
  labels: [],
};

const Post = mongoose.model('Post', postSchema);

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  Post.find((err, foundPosts) => {
    if (err) {
      console.log(err);
    } else {
      res.render('home', {
        posts: foundPosts,
      });
    }
  });
});

app.get('/compose', (req, res) => {
  res.render('compose');
});

app.post('/compose', (req, res) => {
  const { title, intro, content, labels } = req.body;

  const kebab = _.kebabCase(title);

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

app.listen(port, () => {
  console.log(`Server runs on port ${port}.`);
});

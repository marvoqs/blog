const Post = require('../models/post');
const czdate = require('../config/czdate');

async function composeContent(req, res, next) {
  req.content = {
    newPosts: await getNewPosts(),
    popularPosts: await getPopularPosts(),
  };
  req.content.user = req.isAuthenticated() ? req.user : false;
  next();
}

async function getNewPosts() {
  const newPosts = await Post.find()
    .sort({
      createdAt: -1,
    })
    .limit(5);

  newPosts.map((post) => (post.dateHumanized = czdate(post.createdAt, 'd. m. yyyy H:MM')));

  return newPosts;
}

async function getPopularPosts() {
  const popularPosts = await Post.find()
    .sort({
      views: -1,
    })
    .limit(5);

  popularPosts.map((post) => (post.dateHumanized = czdate(post.createdAt, 'd. m. yyyy H:MM')));

  return popularPosts;
}

module.exports = composeContent;

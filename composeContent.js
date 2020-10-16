const Post = require('./models/post');
const czdate = require('./czdate');

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

module.exports = composeContent;
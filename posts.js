const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model('Post', postSchema);
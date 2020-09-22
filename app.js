require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(
  `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@cluster0.t7utl.mongodb.net/blog?retryWrites=true&w=majority`,
  { useNewUrlParser: true }
);

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.json({ extended: true }));

app.get('/', (req, res) => {
  res.render('home');
});

app.listen(port, () => {
  console.log(`Server runs on port ${port}.`);
});

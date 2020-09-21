const express = require('express');
const ejs = require('ejs');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server runs on port ${port}.`);
});

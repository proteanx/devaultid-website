const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: true }));

app.use('/alias', require('./routes/alias'));

app.listen(3000)
var express = require('express');
var path = require('path');
var combo = require('./combo');
var app = express();

// app.use(express.static('.'));
var config = {
  root: path.join(__dirname, './static'),
  combine_dir: path.join(__dirname, './combine'),
};
app.use('/combine', combo(config))
app.listen(3721);

module.exports = app;
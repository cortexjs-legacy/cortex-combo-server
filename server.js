var request = require('supertest');
var express = require('express');
var cssParser = require('css-absolute-image-path');
var path = require('path');
var fs = require('fs');
var es = require('event-stream');
var mkdirp = require('mkdirp');

var app = express();

// app.use(express.static('.'));
app.use('/combo', function(req, res) {
  var root = path.join(__dirname, 'static');

  function split(p) {
    return p.slice(1).split(",").map(function(item) {
      return item.replace(/~/g, '/');
    }).map(function(item) {
      return path.join(root, item);
    });
  }


  var paths = split(req.path);
  var parser = new cssParser({
    root_dir: "./static/",
    root_path: "./",
    hosts: [req.host]
  });


  var filepath = path.join(root,'..','combo',req.path);

  mkdirp(path.dirname(filepath),function(err){
    var filestreams = paths.map(function(filepath) {
      function write(data) {
        this.emit('data', parser.parse(filepath));
      }

      function end() {
        this.emit('end');
      }

      var through = es.through(write, end);
      return fs.createReadStream(filepath).pipe(through);
    });
    var result = es.merge.apply(es, filestreams);
    var dest = fs.createWriteStream(filepath);
    result.pipe(dest);
    dest.on('close',function(){
      res.sendfile(filepath);
    });

  });

});

request(app)
  .get('/combo/~a.css,~dir~d.css,~b.css,~dir~c.css')
  .expect(200)
  .end(function(err, res) {
    if (err) throw err;
    console.log(res.headers);
    console.log(res.text);
  });
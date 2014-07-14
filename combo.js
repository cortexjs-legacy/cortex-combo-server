var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var es = require('event-stream');
var async = require('async');
var cssParser = require('css-absolute-image-path');
var crypto = require('crypto');
var resumer = require('resumer');
var Buffer = require('buffer').Buffer;

function md5(str) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(str);
  str = md5sum.digest('hex');
  return str;
}

function generateComments(paths){
  var content = "/**\n * Combo Server\n" + paths.map(function(p){
    return ' * ' + p;
  }).join('\n') + "\n */\n";
  return content
}

function dynamic(req, res, next, root, cache_path) {
  function split(p) {
    return p.slice(1).split(",").map(function(item) {
      return item.replace(/~/g, '/');
    });
  }
  var urlpaths = split(req.path);
  var paths = urlpaths.map(function(item) {
    return path.join(root, item);
  });
  var parser = new cssParser({
    root_dir: root,
    root_path: "./",
    md5: true,
    allow_image_miss: true,
    hosts: [req.headers.host]
  });

  mkdirp(path.dirname(cache_path), function(err) {
    if (err) {
      return res.send(404);
    }


    async.mapSeries(paths, function(filepath, done) {
      fs.exists(filepath, function(exists) {
        if (!exists) {
          return done(path.relative(root, filepath) + ' not exists');
        }
        done(null);
      });
    }, function(err) {
      if (err) {
        return res.send(404, err);
      }


      var filestreams = [resumer().queue(generateComments(urlpaths)).end()];

      paths.forEach(function(filepath) {
        var buffer = [];

        function write(data) {
          buffer.push(parser.parse(filepath));
        }

        function end() {
          var content = Buffer.concat(buffer);
          this.emit('data', content);
          this.emit('end');
        }

        filestreams.push(fs.createReadStream(filepath).pipe(es.through(write, end)));
      });
      var result = es.merge.apply(es, filestreams);
      var dest = fs.createWriteStream(cache_path);
      result.pipe(dest);
      result.pipe(res);
    });
  });
}

module.exports = function(config) {
  var root = config.root;
  var combine_dir = config.combine_dir;
  return function(req, res, next) {
    var cache_path = path.join(combine_dir, md5(req.path) + path.extname(req.path));
    fs.exists(cache_path, function(exists) {
      // if (exists) {
      //   res.sendfile(cache_path);
      // } else {
      dynamic(req, res, next, root, cache_path);
      // }
    });

  }
}
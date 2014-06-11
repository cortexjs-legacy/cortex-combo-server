var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var es = require('event-stream');
var async = require('async');
var cssParser = require('css-absolute-image-path');
var crypto = require('crypto');

function md5(str) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(str);
  str = md5sum.digest('hex');
  return str;
}

function dynamic(req, res, next, root, cache_path) {
  function split(p) {
    return p.slice(1).split(",").map(function(item) {
      return item.replace(/~/g, '/');
    }).map(function(item) {
      return path.join(root, item);
    });
  }

  var paths = split(req.path);
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

    async.map(paths, function(filepath, done) {
      fs.exists(filepath, function(exists) {
        if (!exists) {
          return done(filepath + ' not exists');
        }

        function write(data) {
          this.emit('data', parser.parse(filepath));
        }

        function end() {
          this.emit('end');
        }

        var through = es.through(write, end);

        done(null, fs.createReadStream(filepath).pipe(through));
      });
    }, function(err, filestreams) {
      if (err) {
        return res.send(404, err);
      }
      var result = es.merge.apply(es, filestreams);
      var dest = fs.createWriteStream(cache_path);
      result.pipe(dest);
      dest.on('close', function() {
        res.sendfile(cache_path);
      });
    });
  });
}

module.exports = function(config) {
  var root = config.root;
  var combine_dir = config.combine_dir;
  return function(req, res, next) {
    var cache_path = path.join(combine_dir, md5(req.path) + path.extname(req.path));
    fs.exists(cache_path, function(exists) {
      if (exists) {
        res.sendfile(cache_path);
      } else {
        dynamic(req, res, next, root, cache_path);
      }
    });

  }
}
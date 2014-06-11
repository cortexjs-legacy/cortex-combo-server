var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var es = require('event-stream');
var async = require('async');
var cssParser = require('css-absolute-image-path');

module.exports = function(config) {
  var root = config.root;
  var combine_dir = config.combine_dir;
  return function(req, res, next) {

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
      hosts: [req.headers.host]
    });


    var filepath = path.join(combine_dir, req.path);


    mkdirp(path.dirname(filepath), function(err) {
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
        var dest = fs.createWriteStream(filepath);
        result.pipe(dest);
        dest.on('close', function() {
          res.sendfile(filepath);
        });
      });
    });
  }
}
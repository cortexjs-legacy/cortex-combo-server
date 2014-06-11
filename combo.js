var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var es = require('event-stream');
var cssParser = require('css-absolute-image-path');
module.exports = function(config) {
  var root = config.root;
  var combine_dir = config.combine_dir;
  return function(req, res) {

    console.log('here');

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
      dest.on('close', function() {
        res.sendfile(filepath);
      });

    });

  }
}
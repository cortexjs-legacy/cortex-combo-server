var request = require('supertest');
var app = require('../server');
var fse = require('fs-extra');
var path = require('path');
var assert = require('assert');
var fs = require('fs');


describe('combo-server', function() {
  beforeEach(function(done) {
    fse.remove(path.join(__dirname, '..', 'combine'), done);
  });
  app.listen(3000);
  request = request('http://127.0.0.1:3000');
  this.timeout(0);
  it('normal', function(done) {
    request
      .get('/combine/a.css,b.css,dir~c.css')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        assert.equal(res.text, fs.readFileSync(path.join(__dirname, 'expected', 'normal.css'), 'utf8'));
        done();
      });
  });

  it('with file not exists', function(done) {
    request
      .get('/combine/a.css,notexist.css')
      .expect(404)
      .end(function(err, res) {
        if (err) throw err;
        assert.equal(res.text, 'notexist.css not exists');
        done();
      });
  });

  it('with background image not exists', function() {
    request
      .get('/combine/dir~nbg.css')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        // console.log(res.text);
        done();
      });
  });
});
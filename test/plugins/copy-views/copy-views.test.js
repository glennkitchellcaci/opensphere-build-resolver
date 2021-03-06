'use strict';

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const expect = require('chai').expect;
const copy = require('../../../plugins/copy-views');
const rimraf = require('rimraf');

describe('copy views resolver', () => {
  afterEach(() => {
    copy.clear();
    rimraf.sync(path.join(outputDir, '*'));
  });

  var outputDir = path.join(process.cwd(), '.test');

  var run = (pack) => {
    return copy.resolver(pack, '.', 0, [pack.name]).then(() => {
      return copy.writer(pack, outputDir);
    });
  };

  var file = path.join(outputDir, 'copy-views-args');

  it('should not pick up views from undefined directories', () => {
    var pack = {
      name: 'thing',
      build: {
        type: 'app'
      }
    };

    return run(pack).then(() => {
      expect(fs.readFileSync(file, 'utf-8')).to.equal('');
    });
  });

  it('should not pick up views from undefined views', () => {
    var pack = {
      name: 'thing-plugin-test',
      directories: {
      },
      build: {
        type: 'app'
      }
    };

    return run(pack).then(() => {
      expect(fs.readFileSync(file, 'utf-8')).to.equal('');
    });
  });

  it('should only write the file for app projects', () => {
    var pack = {
      name: 'thing',
      build: {
        type: 'lib'
      }
    };

    return run(pack).then(() => {
      expect(fs.existsSync(file)).to.be.false;
    });
  });

  it('should pick up views from directories', () => {
    var pack = {
      name: 'thing',
      directories: {
        views: 'foo'
      },
      build: {
        type: 'app'
      }
    };

    return run(pack).then(() => {
      expect(fs.readFileSync(file, 'utf-8')).to.equal(path.join('foo', '*'));
    });
  });

  it('should pick up views from multiple projects and sort them properly', () => {
    var pack1 = {
      name: 'thing-foo',
      directories: {
        views: 'foo'
      },
      build: {
        type: 'app'
      }
    };

    var pack2 = {
      name: 'thing-foo-plugin-bar',
      directories: {
        views: 'bar'
      },
      build: {
        type: 'app'
      }
    };

    return Promise.join(
      copy.resolver(pack1, pack1.name, 0, ['thing-foo']),
      copy.resolver(pack2, pack2.name, 1, ['thing-foo', 'thing-foo-plugin-bar']))
      .then(() => {
        return copy.writer(pack1, outputDir);
      })
      .then(() => {
        var expected = [
          path.join(pack1.name, 'foo', '*'),
          path.join(pack2.name, 'bar', '*')];

        expect(fs.readFileSync(file, 'utf-8')).to.equal(expected.join('\n'));
      });
  });

  it('should normalize win32 paths to forward slashes', () => {
    var pack = {
      name: 'thing',
      directories: {
        views: 'foo\\bar'
      },
      build: {
        type: 'app'
      }
    };

    return run(pack).then(() => {
      expect(fs.readFileSync(file, 'utf-8')).to.equal(path.join('foo', 'bar', '*'));
    });
  });
});

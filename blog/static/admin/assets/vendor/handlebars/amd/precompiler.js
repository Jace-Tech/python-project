define(['exports', 'neo-async', 'fs', './handlebars', 'path', 'source-map'], function (exports, _neoAsync, _fs, _handlebars, _path, _sourceMap) {
  /* eslint-disable no-console */
  'use strict';

  // istanbul ignore next

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  var _Async = _interopRequireDefault(_neoAsync);

  var _fs2 = _interopRequireDefault(_fs);

  module.exports.loadTemplates = function (opts, callback) {
    loadStrings(opts, function (err, strings) {
      if (err) {
        callback(err);
      } else {
        loadFiles(opts, function (err, files) {
          if (err) {
            callback(err);
          } else {
            opts.templates = strings.concat(files);
            callback(undefined, opts);
          }
        });
      }
    });
  };

  function loadStrings(opts, callback) {
    var strings = arrayCast(opts.string),
        names = arrayCast(opts.name);

    if (names.length !== strings.length && strings.length > 1) {
      return callback(new _handlebars.Exception('Number of names did not match the number of string inputs'));
    }

    _Async['default'].map(strings, function (string, callback) {
      if (string !== '-') {
        callback(undefined, string);
      } else {
        (function () {
          // Load from stdin
          var buffer = '';
          process.stdin.setEncoding('utf8');

          process.stdin.on('data', function (chunk) {
            buffer += chunk;
          });
          process.stdin.on('end', function () {
            callback(undefined, buffer);
          });
        })();
      }
    }, function (err, strings) {
      strings = strings.map(function (string, index) {
        return {
          name: names[index],
          path: names[index],
          source: string
        };
      });
      callback(err, strings);
    });
  }

  function loadFiles(opts, callback) {
    // Build file extension pattern
    var extension = (opts.extension || 'handlebars').replace(/[\\^$*+?.():=!|{}\-[\]]/g, function (arg) {
      return '\\' + arg;
    });
    extension = new RegExp('\\.' + extension + '$');

    var ret = [],
        queue = (opts.files || []).map(function (template) {
      return { template: template, root: opts.root };
    });
    _Async['default'].whilst(function () {
      return queue.length;
    }, function (callback) {
      var _queue$shift = queue.shift();

      var path = _queue$shift.template;
      var root = _queue$shift.root;

      _fs2['default'].stat(path, function (err, stat) {
        if (err) {
          return callback(new _handlebars.Exception('Unable to open template file "' + path + '"'));
        }

        if (stat.isDirectory()) {
          opts.hasDirectory = true;

          _fs2['default'].readdir(path, function (err, children) {
            /* istanbul ignore next : Race condition that being too lazy to test */
            if (err) {
              return callback(err);
            }
            children.forEach(function (file) {
              var childPath = path + '/' + file;

              if (extension.test(childPath) || _fs2['default'].statSync(childPath).isDirectory()) {
                queue.push({ template: childPath, root: root || path });
              }
            });

            callback();
          });
        } else {
          _fs2['default'].readFile(path, 'utf8', function (err, data) {
            /* istanbul ignore next : Race condition that being too lazy to test */
            if (err) {
              return callback(err);
            }

            if (opts.bom && data.indexOf('﻿') === 0) {
              data = data.substring(1);
            }

            // Clean the template name
            var name = path;
            if (!root) {
              name = _path.basename(name);
            } else if (name.indexOf(root) === 0) {
              name = name.substring(root.length + 1);
            }
            name = name.replace(extension, '');

            ret.push({
              path: path,
              name: name,
              source: data
            });

            callback();
          });
        }
      });
    }, function (err) {
      if (err) {
        callback(err);
      } else {
        callback(undefined, ret);
      }
    });
  }

  module.exports.cli = function (opts) {
    if (opts.version) {
      console.log(_handlebars.VERSION);
      return;
    }

    if (!opts.templates.length && !opts.hasDirectory) {
      throw new _handlebars.Exception('Must define at least one template or directory.');
    }

    if (opts.simple && opts.min) {
      throw new _handlebars.Exception('Unable to minimize simple output');
    }

    var multiple = opts.templates.length !== 1 || opts.hasDirectory;
    if (opts.simple && multiple) {
      throw new _handlebars.Exception('Unable to output multiple templates in simple mode');
    }

    // Force simple mode if we have only one template and it's unnamed.
    if (!opts.amd && !opts.commonjs && opts.templates.length === 1 && !opts.templates[0].name) {
      opts.simple = true;
    }

    // Convert the known list into a hash
    var known = {};
    if (opts.known && !Array.isArray(opts.known)) {
      opts.known = [opts.known];
    }
    if (opts.known) {
      for (var i = 0, len = opts.known.length; i < len; i++) {
        known[opts.known[i]] = true;
      }
    }

    var objectName = opts.partial ? 'Handlebars.partials' : 'templates';

    var output = new _sourceMap.SourceNode();
    if (!opts.simple) {
      if (opts.amd) {
        output.add("define(['" + opts.handlebarPath + 'handlebars.runtime\'], function(Handlebars) {\n  Handlebars = Handlebars["default"];');
      } else if (opts.commonjs) {
        output.add('var Handlebars = require("' + opts.commonjs + '");');
      } else {
        output.add('(function() {\n');
      }
      output.add('  var template = Handlebars.template, templates = ');
      if (opts.namespace) {
        output.add(opts.namespace);
        output.add(' = ');
        output.add(opts.namespace);
        output.add(' || ');
      }
      output.add('{};\n');
    }

    opts.templates.forEach(function (template) {
      var options = {
        knownHelpers: known,
        knownHelpersOnly: opts.o
      };

      if (opts.map) {
        options.srcName = template.path;
      }
      if (opts.data) {
        options.data = true;
      }

      var precompiled = _handlebars.precompile(template.source, options);

      // If we are generating a source map, we have to reconstruct the SourceNode object
      if (opts.map) {
        var consumer = new _sourceMap.SourceMapConsumer(precompiled.map);
        precompiled = _sourceMap.SourceNode.fromStringWithSourceMap(precompiled.code, consumer);
      }

      if (opts.simple) {
        output.add([precompiled, '\n']);
      } else {
        if (!template.name) {
          throw new _handlebars.Exception('Name missing for template');
        }

        if (opts.amd && !multiple) {
          output.add('return ');
        }
        output.add([objectName, "['", template.name, "'] = template(", precompiled, ');\n']);
      }
    });

    // Output the content
    if (!opts.simple) {
      if (opts.amd) {
        if (multiple) {
          output.add(['return ', objectName, ';\n']);
        }
        output.add('});');
      } else if (!opts.commonjs) {
        output.add('})();');
      }
    }

    if (opts.map) {
      output.add('\n//# sourceMappingURL=' + opts.map + '\n');
    }

    output = output.toStringWithSourceMap();
    output.map = output.map + '';

    if (opts.min) {
      output = minify(output, opts.map);
    }

    if (opts.map) {
      _fs2['default'].writeFileSync(opts.map, output.map, 'utf8');
    }
    output = output.code;

    if (opts.output) {
      _fs2['default'].writeFileSync(opts.output, output, 'utf8');
    } else {
      console.log(output);
    }
  };

  function arrayCast(value) {
    value = value != null ? value : [];
    if (!Array.isArray(value)) {
      value = [value];
    }
    return value;
  }

  /**
   * Run uglify to minify the compiled template, if uglify exists in the dependencies.
   *
   * We are using `require` instead of `import` here, because es6-modules do not allow
   * dynamic imports and uglify-js is an optional dependency. Since we are inside NodeJS here, this
   * should not be a problem.
   *
   * @param {string} output the compiled template
   * @param {string} sourceMapFile the file to write the source map to.
   */
  function minify(output, sourceMapFile) {
    try {
      // Try to resolve uglify-js in order to see if it does exist
      require.resolve('uglify-js');
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND') {
        // Something else seems to be wrong
        throw e;
      }
      // it does not exist!
      console.error('Code minimization is disabled due to missing uglify-js dependency');
      return output;
    }
    return require('uglify-js').minify(output.code, {
      sourceMap: {
        content: output.map,
        url: sourceMapFile
      }
    });
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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bnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuaW1wb3J0IEFzeW5jIGZyb20gJ25lby1hc3luYyc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgSGFuZGxlYmFycyBmcm9tICcuL2hhbmRsZWJhcnMnO1xuaW1wb3J0IHsgYmFzZW5hbWUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IFNvdXJjZU1hcENvbnN1bWVyLCBTb3VyY2VOb2RlIH0gZnJvbSAnc291cmNlLW1hcCc7XG5cbm1vZHVsZS5leHBvcnRzLmxvYWRUZW1wbGF0ZXMgPSBmdW5jdGlvbihvcHRzLCBjYWxsYmFjaykge1xuICBsb2FkU3RyaW5ncyhvcHRzLCBmdW5jdGlvbihlcnIsIHN0cmluZ3MpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBjYWxsYmFjayhlcnIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2FkRmlsZXMob3B0cywgZnVuY3Rpb24oZXJyLCBmaWxlcykge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvcHRzLnRlbXBsYXRlcyA9IHN0cmluZ3MuY29uY2F0KGZpbGVzKTtcbiAgICAgICAgICBjYWxsYmFjayh1bmRlZmluZWQsIG9wdHMpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xufTtcblxuZnVuY3Rpb24gbG9hZFN0cmluZ3Mob3B0cywgY2FsbGJhY2spIHtcbiAgbGV0IHN0cmluZ3MgPSBhcnJheUNhc3Qob3B0cy5zdHJpbmcpLFxuICAgIG5hbWVzID0gYXJyYXlDYXN0KG9wdHMubmFtZSk7XG5cbiAgaWYgKG5hbWVzLmxlbmd0aCAhPT0gc3RyaW5ncy5sZW5ndGggJiYgc3RyaW5ncy5sZW5ndGggPiAxKSB7XG4gICAgcmV0dXJuIGNhbGxiYWNrKFxuICAgICAgbmV3IEhhbmRsZWJhcnMuRXhjZXB0aW9uKFxuICAgICAgICAnTnVtYmVyIG9mIG5hbWVzIGRpZCBub3QgbWF0Y2ggdGhlIG51bWJlciBvZiBzdHJpbmcgaW5wdXRzJ1xuICAgICAgKVxuICAgICk7XG4gIH1cblxuICBBc3luYy5tYXAoXG4gICAgc3RyaW5ncyxcbiAgICBmdW5jdGlvbihzdHJpbmcsIGNhbGxiYWNrKSB7XG4gICAgICBpZiAoc3RyaW5nICE9PSAnLScpIHtcbiAgICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCBzdHJpbmcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gTG9hZCBmcm9tIHN0ZGluXG4gICAgICAgIGxldCBidWZmZXIgPSAnJztcbiAgICAgICAgcHJvY2Vzcy5zdGRpbi5zZXRFbmNvZGluZygndXRmOCcpO1xuXG4gICAgICAgIHByb2Nlc3Muc3RkaW4ub24oJ2RhdGEnLCBmdW5jdGlvbihjaHVuaykge1xuICAgICAgICAgIGJ1ZmZlciArPSBjaHVuaztcbiAgICAgICAgfSk7XG4gICAgICAgIHByb2Nlc3Muc3RkaW4ub24oJ2VuZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgYnVmZmVyKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBmdW5jdGlvbihlcnIsIHN0cmluZ3MpIHtcbiAgICAgIHN0cmluZ3MgPSBzdHJpbmdzLm1hcCgoc3RyaW5nLCBpbmRleCkgPT4gKHtcbiAgICAgICAgbmFtZTogbmFtZXNbaW5kZXhdLFxuICAgICAgICBwYXRoOiBuYW1lc1tpbmRleF0sXG4gICAgICAgIHNvdXJjZTogc3RyaW5nXG4gICAgICB9KSk7XG4gICAgICBjYWxsYmFjayhlcnIsIHN0cmluZ3MpO1xuICAgIH1cbiAgKTtcbn1cblxuZnVuY3Rpb24gbG9hZEZpbGVzKG9wdHMsIGNhbGxiYWNrKSB7XG4gIC8vIEJ1aWxkIGZpbGUgZXh0ZW5zaW9uIHBhdHRlcm5cbiAgbGV0IGV4dGVuc2lvbiA9IChvcHRzLmV4dGVuc2lvbiB8fCAnaGFuZGxlYmFycycpLnJlcGxhY2UoXG4gICAgL1tcXFxcXiQqKz8uKCk6PSF8e31cXC1bXFxdXS9nLFxuICAgIGZ1bmN0aW9uKGFyZykge1xuICAgICAgcmV0dXJuICdcXFxcJyArIGFyZztcbiAgICB9XG4gICk7XG4gIGV4dGVuc2lvbiA9IG5ldyBSZWdFeHAoJ1xcXFwuJyArIGV4dGVuc2lvbiArICckJyk7XG5cbiAgbGV0IHJldCA9IFtdLFxuICAgIHF1ZXVlID0gKG9wdHMuZmlsZXMgfHwgW10pLm1hcCh0ZW1wbGF0ZSA9PiAoeyB0ZW1wbGF0ZSwgcm9vdDogb3B0cy5yb290IH0pKTtcbiAgQXN5bmMud2hpbHN0KFxuICAgICgpID0+IHF1ZXVlLmxlbmd0aCxcbiAgICBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgbGV0IHsgdGVtcGxhdGU6IHBhdGgsIHJvb3QgfSA9IHF1ZXVlLnNoaWZ0KCk7XG5cbiAgICAgIGZzLnN0YXQocGF0aCwgZnVuY3Rpb24oZXJyLCBzdGF0KSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soXG4gICAgICAgICAgICBuZXcgSGFuZGxlYmFycy5FeGNlcHRpb24oYFVuYWJsZSB0byBvcGVuIHRlbXBsYXRlIGZpbGUgXCIke3BhdGh9XCJgKVxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgb3B0cy5oYXNEaXJlY3RvcnkgPSB0cnVlO1xuXG4gICAgICAgICAgZnMucmVhZGRpcihwYXRoLCBmdW5jdGlvbihlcnIsIGNoaWxkcmVuKSB7XG4gICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCA6IFJhY2UgY29uZGl0aW9uIHRoYXQgYmVpbmcgdG9vIGxhenkgdG8gdGVzdCAqL1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICAgICAgICBsZXQgY2hpbGRQYXRoID0gcGF0aCArICcvJyArIGZpbGU7XG5cbiAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIGV4dGVuc2lvbi50ZXN0KGNoaWxkUGF0aCkgfHxcbiAgICAgICAgICAgICAgICBmcy5zdGF0U3luYyhjaGlsZFBhdGgpLmlzRGlyZWN0b3J5KClcbiAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgcXVldWUucHVzaCh7IHRlbXBsYXRlOiBjaGlsZFBhdGgsIHJvb3Q6IHJvb3QgfHwgcGF0aCB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZnMucmVhZEZpbGUocGF0aCwgJ3V0ZjgnLCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0IDogUmFjZSBjb25kaXRpb24gdGhhdCBiZWluZyB0b28gbGF6eSB0byB0ZXN0ICovXG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob3B0cy5ib20gJiYgZGF0YS5pbmRleE9mKCdcXHVGRUZGJykgPT09IDApIHtcbiAgICAgICAgICAgICAgZGF0YSA9IGRhdGEuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDbGVhbiB0aGUgdGVtcGxhdGUgbmFtZVxuICAgICAgICAgICAgbGV0IG5hbWUgPSBwYXRoO1xuICAgICAgICAgICAgaWYgKCFyb290KSB7XG4gICAgICAgICAgICAgIG5hbWUgPSBiYXNlbmFtZShuYW1lKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobmFtZS5pbmRleE9mKHJvb3QpID09PSAwKSB7XG4gICAgICAgICAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cmluZyhyb290Lmxlbmd0aCArIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZShleHRlbnNpb24sICcnKTtcblxuICAgICAgICAgICAgcmV0LnB1c2goe1xuICAgICAgICAgICAgICBwYXRoOiBwYXRoLFxuICAgICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgICBzb3VyY2U6IGRhdGFcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uKGVycikge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCByZXQpO1xuICAgICAgfVxuICAgIH1cbiAgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMuY2xpID0gZnVuY3Rpb24ob3B0cykge1xuICBpZiAob3B0cy52ZXJzaW9uKSB7XG4gICAgY29uc29sZS5sb2coSGFuZGxlYmFycy5WRVJTSU9OKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoIW9wdHMudGVtcGxhdGVzLmxlbmd0aCAmJiAhb3B0cy5oYXNEaXJlY3RvcnkpIHtcbiAgICB0aHJvdyBuZXcgSGFuZGxlYmFycy5FeGNlcHRpb24oXG4gICAgICAnTXVzdCBkZWZpbmUgYXQgbGVhc3Qgb25lIHRlbXBsYXRlIG9yIGRpcmVjdG9yeS4nXG4gICAgKTtcbiAgfVxuXG4gIGlmIChvcHRzLnNpbXBsZSAmJiBvcHRzLm1pbikge1xuICAgIHRocm93IG5ldyBIYW5kbGViYXJzLkV4Y2VwdGlvbignVW5hYmxlIHRvIG1pbmltaXplIHNpbXBsZSBvdXRwdXQnKTtcbiAgfVxuXG4gIGNvbnN0IG11bHRpcGxlID0gb3B0cy50ZW1wbGF0ZXMubGVuZ3RoICE9PSAxIHx8IG9wdHMuaGFzRGlyZWN0b3J5O1xuICBpZiAob3B0cy5zaW1wbGUgJiYgbXVsdGlwbGUpIHtcbiAgICB0aHJvdyBuZXcgSGFuZGxlYmFycy5FeGNlcHRpb24oXG4gICAgICAnVW5hYmxlIHRvIG91dHB1dCBtdWx0aXBsZSB0ZW1wbGF0ZXMgaW4gc2ltcGxlIG1vZGUnXG4gICAgKTtcbiAgfVxuXG4gIC8vIEZvcmNlIHNpbXBsZSBtb2RlIGlmIHdlIGhhdmUgb25seSBvbmUgdGVtcGxhdGUgYW5kIGl0J3MgdW5uYW1lZC5cbiAgaWYgKFxuICAgICFvcHRzLmFtZCAmJlxuICAgICFvcHRzLmNvbW1vbmpzICYmXG4gICAgb3B0cy50ZW1wbGF0ZXMubGVuZ3RoID09PSAxICYmXG4gICAgIW9wdHMudGVtcGxhdGVzWzBdLm5hbWVcbiAgKSB7XG4gICAgb3B0cy5zaW1wbGUgPSB0cnVlO1xuICB9XG5cbiAgLy8gQ29udmVydCB0aGUga25vd24gbGlzdCBpbnRvIGEgaGFzaFxuICBsZXQga25vd24gPSB7fTtcbiAgaWYgKG9wdHMua25vd24gJiYgIUFycmF5LmlzQXJyYXkob3B0cy5rbm93bikpIHtcbiAgICBvcHRzLmtub3duID0gW29wdHMua25vd25dO1xuICB9XG4gIGlmIChvcHRzLmtub3duKSB7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IG9wdHMua25vd24ubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGtub3duW29wdHMua25vd25baV1dID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBvYmplY3ROYW1lID0gb3B0cy5wYXJ0aWFsID8gJ0hhbmRsZWJhcnMucGFydGlhbHMnIDogJ3RlbXBsYXRlcyc7XG5cbiAgbGV0IG91dHB1dCA9IG5ldyBTb3VyY2VOb2RlKCk7XG4gIGlmICghb3B0cy5zaW1wbGUpIHtcbiAgICBpZiAob3B0cy5hbWQpIHtcbiAgICAgIG91dHB1dC5hZGQoXG4gICAgICAgIFwiZGVmaW5lKFsnXCIgK1xuICAgICAgICAgIG9wdHMuaGFuZGxlYmFyUGF0aCArXG4gICAgICAgICAgJ2hhbmRsZWJhcnMucnVudGltZVxcJ10sIGZ1bmN0aW9uKEhhbmRsZWJhcnMpIHtcXG4gIEhhbmRsZWJhcnMgPSBIYW5kbGViYXJzW1wiZGVmYXVsdFwiXTsnXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAob3B0cy5jb21tb25qcykge1xuICAgICAgb3V0cHV0LmFkZCgndmFyIEhhbmRsZWJhcnMgPSByZXF1aXJlKFwiJyArIG9wdHMuY29tbW9uanMgKyAnXCIpOycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQuYWRkKCcoZnVuY3Rpb24oKSB7XFxuJyk7XG4gICAgfVxuICAgIG91dHB1dC5hZGQoJyAgdmFyIHRlbXBsYXRlID0gSGFuZGxlYmFycy50ZW1wbGF0ZSwgdGVtcGxhdGVzID0gJyk7XG4gICAgaWYgKG9wdHMubmFtZXNwYWNlKSB7XG4gICAgICBvdXRwdXQuYWRkKG9wdHMubmFtZXNwYWNlKTtcbiAgICAgIG91dHB1dC5hZGQoJyA9ICcpO1xuICAgICAgb3V0cHV0LmFkZChvcHRzLm5hbWVzcGFjZSk7XG4gICAgICBvdXRwdXQuYWRkKCcgfHwgJyk7XG4gICAgfVxuICAgIG91dHB1dC5hZGQoJ3t9O1xcbicpO1xuICB9XG5cbiAgb3B0cy50ZW1wbGF0ZXMuZm9yRWFjaChmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgIGxldCBvcHRpb25zID0ge1xuICAgICAga25vd25IZWxwZXJzOiBrbm93bixcbiAgICAgIGtub3duSGVscGVyc09ubHk6IG9wdHMub1xuICAgIH07XG5cbiAgICBpZiAob3B0cy5tYXApIHtcbiAgICAgIG9wdGlvbnMuc3JjTmFtZSA9IHRlbXBsYXRlLnBhdGg7XG4gICAgfVxuICAgIGlmIChvcHRzLmRhdGEpIHtcbiAgICAgIG9wdGlvbnMuZGF0YSA9IHRydWU7XG4gICAgfVxuXG4gICAgbGV0IHByZWNvbXBpbGVkID0gSGFuZGxlYmFycy5wcmVjb21waWxlKHRlbXBsYXRlLnNvdXJjZSwgb3B0aW9ucyk7XG5cbiAgICAvLyBJZiB3ZSBhcmUgZ2VuZXJhdGluZyBhIHNvdXJjZSBtYXAsIHdlIGhhdmUgdG8gcmVjb25zdHJ1Y3QgdGhlIFNvdXJjZU5vZGUgb2JqZWN0XG4gICAgaWYgKG9wdHMubWFwKSB7XG4gICAgICBsZXQgY29uc3VtZXIgPSBuZXcgU291cmNlTWFwQ29uc3VtZXIocHJlY29tcGlsZWQubWFwKTtcbiAgICAgIHByZWNvbXBpbGVkID0gU291cmNlTm9kZS5mcm9tU3RyaW5nV2l0aFNvdXJjZU1hcChcbiAgICAgICAgcHJlY29tcGlsZWQuY29kZSxcbiAgICAgICAgY29uc3VtZXJcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMuc2ltcGxlKSB7XG4gICAgICBvdXRwdXQuYWRkKFtwcmVjb21waWxlZCwgJ1xcbiddKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCF0ZW1wbGF0ZS5uYW1lKSB7XG4gICAgICAgIHRocm93IG5ldyBIYW5kbGViYXJzLkV4Y2VwdGlvbignTmFtZSBtaXNzaW5nIGZvciB0ZW1wbGF0ZScpO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0cy5hbWQgJiYgIW11bHRpcGxlKSB7XG4gICAgICAgIG91dHB1dC5hZGQoJ3JldHVybiAnKTtcbiAgICAgIH1cbiAgICAgIG91dHB1dC5hZGQoW1xuICAgICAgICBvYmplY3ROYW1lLFxuICAgICAgICBcIlsnXCIsXG4gICAgICAgIHRlbXBsYXRlLm5hbWUsXG4gICAgICAgIFwiJ10gPSB0ZW1wbGF0ZShcIixcbiAgICAgICAgcHJlY29tcGlsZWQsXG4gICAgICAgICcpO1xcbidcbiAgICAgIF0pO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gT3V0cHV0IHRoZSBjb250ZW50XG4gIGlmICghb3B0cy5zaW1wbGUpIHtcbiAgICBpZiAob3B0cy5hbWQpIHtcbiAgICAgIGlmIChtdWx0aXBsZSkge1xuICAgICAgICBvdXRwdXQuYWRkKFsncmV0dXJuICcsIG9iamVjdE5hbWUsICc7XFxuJ10pO1xuICAgICAgfVxuICAgICAgb3V0cHV0LmFkZCgnfSk7Jyk7XG4gICAgfSBlbHNlIGlmICghb3B0cy5jb21tb25qcykge1xuICAgICAgb3V0cHV0LmFkZCgnfSkoKTsnKTtcbiAgICB9XG4gIH1cblxuICBpZiAob3B0cy5tYXApIHtcbiAgICBvdXRwdXQuYWRkKCdcXG4vLyMgc291cmNlTWFwcGluZ1VSTD0nICsgb3B0cy5tYXAgKyAnXFxuJyk7XG4gIH1cblxuICBvdXRwdXQgPSBvdXRwdXQudG9TdHJpbmdXaXRoU291cmNlTWFwKCk7XG4gIG91dHB1dC5tYXAgPSBvdXRwdXQubWFwICsgJyc7XG5cbiAgaWYgKG9wdHMubWluKSB7XG4gICAgb3V0cHV0ID0gbWluaWZ5KG91dHB1dCwgb3B0cy5tYXApO1xuICB9XG5cbiAgaWYgKG9wdHMubWFwKSB7XG4gICAgZnMud3JpdGVGaWxlU3luYyhvcHRzLm1hcCwgb3V0cHV0Lm1hcCwgJ3V0ZjgnKTtcbiAgfVxuICBvdXRwdXQgPSBvdXRwdXQuY29kZTtcblxuICBpZiAob3B0cy5vdXRwdXQpIHtcbiAgICBmcy53cml0ZUZpbGVTeW5jKG9wdHMub3V0cHV0LCBvdXRwdXQsICd1dGY4Jyk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2cob3V0cHV0KTtcbiAgfVxufTtcblxuZnVuY3Rpb24gYXJyYXlDYXN0KHZhbHVlKSB7XG4gIHZhbHVlID0gdmFsdWUgIT0gbnVsbCA/IHZhbHVlIDogW107XG4gIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICB2YWx1ZSA9IFt2YWx1ZV07XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIFJ1biB1Z2xpZnkgdG8gbWluaWZ5IHRoZSBjb21waWxlZCB0ZW1wbGF0ZSwgaWYgdWdsaWZ5IGV4aXN0cyBpbiB0aGUgZGVwZW5kZW5jaWVzLlxuICpcbiAqIFdlIGFyZSB1c2luZyBgcmVxdWlyZWAgaW5zdGVhZCBvZiBgaW1wb3J0YCBoZXJlLCBiZWNhdXNlIGVzNi1tb2R1bGVzIGRvIG5vdCBhbGxvd1xuICogZHluYW1pYyBpbXBvcnRzIGFuZCB1Z2xpZnktanMgaXMgYW4gb3B0aW9uYWwgZGVwZW5kZW5jeS4gU2luY2Ugd2UgYXJlIGluc2lkZSBOb2RlSlMgaGVyZSwgdGhpc1xuICogc2hvdWxkIG5vdCBiZSBhIHByb2JsZW0uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dCB0aGUgY29tcGlsZWQgdGVtcGxhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBzb3VyY2VNYXBGaWxlIHRoZSBmaWxlIHRvIHdyaXRlIHRoZSBzb3VyY2UgbWFwIHRvLlxuICovXG5mdW5jdGlvbiBtaW5pZnkob3V0cHV0LCBzb3VyY2VNYXBGaWxlKSB7XG4gIHRyeSB7XG4gICAgLy8gVHJ5IHRvIHJlc29sdmUgdWdsaWZ5LWpzIGluIG9yZGVyIHRvIHNlZSBpZiBpdCBkb2VzIGV4aXN0XG4gICAgcmVxdWlyZS5yZXNvbHZlKCd1Z2xpZnktanMnKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlLmNvZGUgIT09ICdNT0RVTEVfTk9UX0ZPVU5EJykge1xuICAgICAgLy8gU29tZXRoaW5nIGVsc2Ugc2VlbXMgdG8gYmUgd3JvbmdcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICAgIC8vIGl0IGRvZXMgbm90IGV4aXN0IVxuICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAnQ29kZSBtaW5pbWl6YXRpb24gaXMgZGlzYWJsZWQgZHVlIHRvIG1pc3NpbmcgdWdsaWZ5LWpzIGRlcGVuZGVuY3knXG4gICAgKTtcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG4gIHJldHVybiByZXF1aXJlKCd1Z2xpZnktanMnKS5taW5pZnkob3V0cHV0LmNvZGUsIHtcbiAgICBzb3VyY2VNYXA6IHtcbiAgICAgIGNvbnRlbnQ6IG91dHB1dC5tYXAsXG4gICAgICB1cmw6IHNvdXJjZU1hcEZpbGVcbiAgICB9XG4gIH0pO1xufVxuIl19

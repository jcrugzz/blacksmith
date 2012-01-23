/*
 * core.js: The foundations of the generator.
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */

var jsdom = require('jsdom'),
    weld = require('weld').weld,
    broadway = require('broadway');

// TODO: Add a format management library (dom vs. jquery vs. raw html detection)

// On attach, set up the infrastructure for attaching more plugins.
exports.attach = function (options) {
  var core = this;

  // TODO: Think about this more/better.
  // There *will* be a concept of logging though.
  // Probably will just expect a winston.
  core.log = options.log || options.logger || function () {};

  core.welder = function welder (doc) {
    var dom = this.dom,
        $ = this.$;

    // doc includes a "template" property.
    dom.innerHTML = doc.template;

    weld(dom, doc, {
      "map": core.mapper, // Mapper will probably be extended somehow.
      "alias": core.aliases // May not use "alias" but I'd be dumb to ignore.
    });

    // May want to use callbacks instead.
    return dom;
      
  };

  // Some sense of doc transformational "middlewares"
  // `this` refers to "core."
  core.docXforms = [];
  core.domXforms = [];
  core.postXforms = [];

  core.aliases = {};

  core.addDocTransform = function addDocTransform (xform) {
    core.docXforms.push(xform);
  };

  core.addDomTransform = function addDomTransform (xform) {
    core.domXforms.push(xform);
  };

  core.addPostTransform = function addPostTransform (xform) {
    core.postXforms.push(xform);
  };

  core.addWeldAlias = function (key, val) {
    core.aliases[key] = val;
  };

  // This is an "identity" mapper.
  core.mapper = function () {
    return true;
  };

};

// On init, create the jsdom.
exports.init = function (done) {
  var core = this;

  // Create a dom and attach stuff to the main document.
  jsdom.env("<html><body></body></html>", [
    "./jquery.js"
  ], function (err, window) {

    if (err) {
      return cb(new Error("Error while creating jsdom: "+err.message));
    };

    var document = core.document = window.document;

    core.dom = document.createElement('div');
    core.$ = window.$;

    // Should probably init before defining this method.
    core.generate = function (doc) {

      var results = doc;

      // Sync for now, may use util.async later.
      [
        core.docXforms,
        [ core.welder ],
        core.domXforms,
        [
          function dom2html (dom) {
            return dom.innerHTML;
          }
        ],
        core.postXforms
      ].forEach(function (stack) {
        stack.slice().reverse().forEach(function (xform) {
          results = xform.call(core, results);
        });
      });

      return results;
      
    }

    done();
  });
};
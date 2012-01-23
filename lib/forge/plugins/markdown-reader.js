var marked = require('marked');

exports.attach = function (opts) {

  var self = this;


  opts = opts || {};

  var property = opts.property;

  if (property) {
    self.addTransform(function markdownReader (doc) {

      // Throw some markdown down.
      doc[property] = marked(String(doc[property]));

      // This is to tell Weld to simply attach the results without trying to
      // do anything fancy.
      self.addAlias(property, function () {
        return false;
      });

    });
  }
  else {
    throw new Error('Markdown reader does not know which field to parse.');
  }
}
var HyperJson = require("hyperjson");
var _ = require("underscore");

var HyperJsonCollection = function(obj, key) {
  if (_.isArray(obj) && key) {
    obj = _.indexBy(obj, key);
  }
  this.obj = { _items: obj };
};

HyperJsonCollection.prototype = Object.create(HyperJson.prototype);

HyperJsonCollection.prototype.each = function(iterator) {
  var items = this.obj._items, i;
  if (_.isArray(items)) {
    for (i = items.length - 1; i >= 0; --i) {
      items[i] = iterator(items[i], i);
    }
  } else {
    var keys = Object.keys(items);
    for (i = keys.length - 1; i >= 0; --i) {
      var key = keys[i];
      items[key] = iterator(items[key], key);
    }
  }
  return this;
};

HyperJsonCollection.prototype.linkEach = function(rel, iterator, opts) {
  var items = this.obj._items, i, item, key;
  if (_.isArray(items)) {
    for (i = items.length - 1; i >= 0; --i) {
      item = items[i];
      items[i] = new HyperJson(item).link(rel, iterator(item, i), opts).toObject();
    }
  } else {
    var keys = Object.keys(items);
    for (i = keys.length - 1; i >= 0; --i) {
      key = keys[i];
      item = items[key];
      items[key] = new HyperJson(item).link(rel, iterator(item, key), opts).toObject();
    }
  }
  return this;
};

module.exports = HyperJsonCollection;

var HyperJson = require("hyperjson");
var _ = require("underscore");

var HyperJsonCollection = function(obj, key) {
  var index, newObj;
  obj = clone(obj);
  if (Array.isArray(obj)) {
    if (!!key) {
      newObj = {};
      index = 0;
      _.each(obj, function(item) {
        newObj[item[key]] = item;
      });
      obj = newObj;
    }
  }
  this.obj = {
    _items: obj
  };
};

HyperJsonCollection.prototype = Object.create(HyperJson.prototype);

HyperJsonCollection.prototype.each = function(cb) {
  var items, x;
  items = this.obj._items;
  for (x in items) {
    items[x] = cb(clone(items[x]), x);
  }
  return this;
};

HyperJsonCollection.prototype.linkEach = function(rel, cb, opts) {
  var items, x;
  items = this.obj._items;
  for (x in items) {
    items[x] = new HyperJson(clone(items[x])).link(rel, cb(items[x], x), opts).toObject();
  }
  return this;
};


module.exports = HyperJsonCollection;

var clone = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

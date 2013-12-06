var HyperJson = require("hyperjson");
var urlgrey = require("urlgrey");
var _ = require("underscore");

var HyperJsonCollection = function(obj, key) {
  var index, newObj;
  obj = _.clone(obj);
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
  var i, items, len, x;
  items = this.obj._items;
  if (Array.isArray(items)) {
    len = (!!items ? items.length : 0);
    i = 0;
    while (i < len) {
      items[i] = cb(items[i]);
      i++;
    }
  } else {
    for (x in items) {
      items[x] = cb(_.clone(items[x]), x);
    }
  }
  return this;
};

HyperJsonCollection.prototype.linkEach = function(rel, cb) {
  var i, items, len, x;
  items = this.obj._items;
  if (Array.isArray(items)) {
    len = (!!items ? items.length : 0);
    i = 0;
    while (i < len) {
      items[i] = new HyperJson(_.clone(items[i])).link(rel, cb(items[i], i)).toObject();
      i++;
    }
  } else {
    for (x in items) {
      items[x] = new HyperJson(_.clone(items[x])).link(rel, cb(items[x], x)).toObject();
    }
  }
  return this;
};


var send = function(req, res, jsonObj, shouldAddDefaultLinks) {
  if (!(jsonObj instanceof HyperJson)) {
    throw new Error("send is for hyperjson objects only");
  }
  if (shouldAddDefaultLinks){
    addDefaultLinks(req, res, jsonObj);
  }
  res.setHeader("content-type", "application/json; charset=utf-8");
  var body = JSON.stringify(jsonObj.toObject());
  res.setHeader("content-length", Buffer.byteLength(body));
  res.end(body);
};

var addDefaultLinks = function(req, res, json) {
  var current, parent;
  if (json instanceof HyperJson) {
    current = json.toObject();
  } else {
    current = json;
  }
  if (!current._links || !current._links.parent) {
    try {
      parent = urlgrey(req.url).parent();
      json.link("parent", parent);
    } catch (ex) {
      if (ex.message !== "The current path has no parent path") {
        throw ex;
      }
    }
  }
  return current;
};

var factory = function(options){
  options = options || {};
  var addDefaultLinks = options.defaultLinks || true;
  var objectName = options.objectName || "object";
  var collectionName = options.collectionName || "collection";

  var middleware = function(req, res, next) {
    res[objectName] = function(obj) {
      var json;
      json = new HyperJson(obj);
      json.send = function() {
        return send(req, res, json, addDefaultLinks);
      };
      return json;
    };
    res[collectionName] = function(objArr, key) {
      var json;
      json = new HyperJsonCollection(objArr, key);
      json.send = function() {
        return send(req, res, json, addDefaultLinks);
      };
      return json;
    };
    return next();
  };

  return middleware;

};

module.exports = factory;

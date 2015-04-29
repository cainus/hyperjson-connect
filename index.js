var HyperJson = require("hyperjson");
var urlgrey = require("urlgrey");
var _ = require("lodash");
var HyperJsonCollection = require('./HyperJsonCollection');

var send = function(req, res, hyperjson, options) {
  var obj = hyperjson.toObject();
  
  if (options.defaultLinks && !(obj._links || {}).up && req.url.length > 1){
    var host = req.headers.host || 'localhost';
    var protocol = _.isFunction(options.protocol) ? options.protocol(req) : (options.protocol || "http");
    var upLink = urlgrey([protocol, "://", host].join(""))
      .hostname(host)
      .path(req.url)
      .parent()
      .toString();
    hyperjson.link("up", upLink);
    obj = hyperjson.toObject();
  }

  var body = JSON.stringify(obj);
  res.setHeader("content-type", "application/json");
  res.setHeader("content-length", Buffer.byteLength(body));
  res.end(body);
};

var factory = function(options){
  options = options || {};
  if (options.defaultLinks !== false){
    options.defaultLinks = true;
  }
  var objectName = options.objectName || "object";
  var collectionName = options.collectionName || "collection";
  options.protocol = options.protocol || "http";
  

  var middleware = function(req, res, next) {
    res[objectName] = function(obj) {
      var json;
      json = new HyperJson(obj);
      json.send = function() {
        return send(req, res, json, options);
      };
      return json;
    };
    res[collectionName] = function(objArr, key) {
      var json;
      json = new HyperJsonCollection(objArr, key);
      json.send = function() {
        return send(req, res, json, options);
      };
      return json;
    };
    return next();
  };

  return middleware;

};

module.exports = factory;

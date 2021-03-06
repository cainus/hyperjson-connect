var http = require('http');
var express = require('express');
var connect = require('connect');
var request = require('request');
var should = require('should');
var hyperjson = require('../index');
var server;
var app;
var port = 1337;
var baseUrl = "http://localhost:1337";


var testRoot = function(done){
  request({uri : baseUrl, method : "GET"}, function(err, response, body){
    if (err){should.fail(err);}
    var expected = {
       "_items": [
         {
           "firstname": "Joey",
           "lastname": "Ramone",
           "_links": {
             "update": {
               "href": "/artists/1",
               "method": "PUT",
               "schema": {}
             }
           }
         },
         {
           "firstname": "Joe",
           "lastname": "Strummer",
           "_links": {
             "update": {
               "href": "/artists/2",
               "method": "PUT",
               "schema": {}
             }
           }
         },
         {
           "firstname": "Neil",
           "lastname": "Young"
         }
       ],
      "_links": {
               "google": {
                 "href": "http://google.com"
               }
             }
    };
    var parsed = JSON.parse(body);
    parsed.should.eql(expected);
    response.statusCode.should.equal(200);
    response.headers['content-type']
      .should.equal('application/json');
    response.headers['content-length']
      .should.equal('322');
    done();
  });
};

function setup(res){
  var artists = [
    {"id" : 1, "firstname" : "Joey", "lastname" : "Ramone"},
    {"id" : 2, "firstname" : "Joe", "lastname" : "Strummer"},
    {"id" : 3, "firstname" : "Neil", "lastname" : "Young"}
  ];
  res.collection(artists)
    .linkEach("update", function(item){
      return "/artists/" + item.id;
    },
    {
      method : "PUT",
      schema : {},
      when: function(a) { return a.firstname[0] === "J"; }
    })
    .each(function(item){
      delete item.id;
      return item;
    })
    .link("google", "http://google.com")
    .send();
}

describe("the middleware", function(){
  describe("with node's HttpServer", function(){
    afterEach(function(done){
      server.close(function(){
        done();
      });
    });
    beforeEach(function(done){
      server = http.createServer(function (req, res) {
        hyperjson()(req, res, function(){
          return setup(res);
        });
      }).listen(port, done);
    });
    it("can output collections", function(done){
      testRoot(done);
    });
  });


  describe("with defaultLinks set to false on express", function(){
    beforeEach(function(done){
      app = express();
      app.use(hyperjson({defaultLinks : false}));
      app.get('/', function(req, res){
        return setup(res);
      });
      server = http.createServer(app)
                  .listen(port, done);
    });
    afterEach(function(done){
      server.close(function(){
        done();
      });
    });
    it("doesn't add a `up` link to sub resources", function(done){
      app.get("/api/resource", function(req, res){
        res.object({"test" : true}).send();
      });
      request({uri:baseUrl + '/api/resource', method:'get'}, function(err,response,body){
        if (err){should.fail(err);}
        response.statusCode.should.equal(200);
        var expected = {
          test: true
        };
        JSON.parse(body).should.eql(expected);
        done();
      });
    });
  });


  describe("with options.protocol set to a function", function(){
    beforeEach(function(done){
      app = express();
      var protocolFunction = function(req){
        return req.headers['x-forwarded-proto'] ||
               req.headers['x-forwarded-protocol'] ||
               'http';
      };
      app.use(hyperjson({protocol : protocolFunction}));
      app.get('/', function(req, res){
        return setup(res);
      });
      server = http.createServer(app)
                  .listen(port, done);
    });
    afterEach(function(done){
      server.close(function(){
        done();
      });
    });
    it("executes the function to determine the correct protocol", function(done){
      app.get("/api/resource", function(req, res){
        res.object({"test" : true}).send();
      });
      request({uri:baseUrl + '/api/resource', method:'get', headers : {'x-forwarded-proto' : 'https'}}, function(err,response,body){
        if (err){should.fail(err);}
        response.statusCode.should.equal(200);
        var expected = {
          "test": true,
          "_links": {
            "up": {
              "href": "https://localhost:1337/api"
            }
          }
        };
        JSON.parse(body).should.eql(expected);
        done();
      });
    });
  });

  describe("options.beforeSend", function () {
    var req, res, obj, body;

    function beforeSend (_req, _res, _obj, _body) {
      req = _req;
      res = _res;
      obj = _obj;
      body = _body;
    }


    beforeEach(function (done) {
      app = express();
      app.use(hyperjson({beforeSend: beforeSend}));
      app.get("/", function (req, res) {
        setup(res);
      });
      server = http.createServer(app).listen(port, done);
    });

    afterEach(function (done) {
      server.close(done);
    });

    it("is passed the response object, the response body as an object, and the response body as a string", function (done) {
      request({uri: baseUrl}, function (err, theResponse, theBody) {
        (req instanceof http.IncomingMessage).should.equal(true);
        (res instanceof http.ServerResponse).should.equal(true);
        theBody.should.equal(body);
        JSON.parse(theBody).should.eql(obj);
        done();
      });
    });
  });


  describe("with express", function(){
    beforeEach(function(done){
      app = express();
      app.use(hyperjson());
      app.get('/', function(req, res){
        return setup(res);
      });
      server = http.createServer(app)
                  .listen(port, done);
    });
    afterEach(function(done){
      server.close(function(){
        done();
      });
    });
    it("can output collections", function(done){
      testRoot(done);
    });
    it("adds an up link to sub resources", function(done){
      app.get("/api/resource", function(req, res){
        res.object({"test" : true}).send();
      });
      request({uri:baseUrl + '/api/resource', method:'get'}, function(err,response,body){
        if (err){should.fail(err);}
        response.statusCode.should.equal(200);
        var expected = {
          test: true,
          _links: {
            up : {
              href: 'http://localhost:1337/api' } } };
        JSON.parse(body).should.eql(expected);
        done();
      });
    });
    it("uses the host header for creating default links", function(done){
      app.get("/api/resource", function(req, res){
        res.object({"test" : true}).send();
      });
      request({ uri:baseUrl + '/api/resource',
                method:'get',
                headers : {
                  'host' : "zombo.com:1337"
                }}, function(err,response,body){
        if (err){should.fail(err);}
        response.statusCode.should.equal(200);
        var expected = {
          test: true,
          _links: {
            up : {
              href: 'http://zombo.com:1337/api' } } };
        JSON.parse(body).should.eql(expected);
        done();
      });
    });
    it("uses localhost for links if there is no host header", function(done){
      app.get("/api/resource", function(req, res){
        res.object({"test" : true}).send();
      });
      request({ uri:baseUrl + '/api/resource',
                method:'get'
                }, function(err,response,body){
        if (err){should.fail(err);}
        response.statusCode.should.equal(200);
        var expected = {
          test: true,
          _links: {
            up : {
              href: 'http://localhost:1337/api' } } };
        JSON.parse(body).should.eql(expected);
        done();
      });
    });
  });
  describe("with connect", function(){
    beforeEach(function(done){
      app = connect();
      app.use(hyperjson());
      app.use(function(req, res){
        return setup(res);
      });
      server = http.createServer(app)
                  .listen(port, done);
    });
    afterEach(function(done){
      server.close(function(){
        done();
      });
    });
    it("can output collections", function(done){
      testRoot(done);
    });
  });
});


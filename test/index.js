var http = require('http');
var express = require('express');
var connect = require('connect');
var request = require('request');
var should = require('should');
var hyperjson = require('../index');
var server;
var port = 1337;
var baseUrl = "http://localhost:1337";
var artists = [
  {"id" : 1, "firstname" : "Joey", "lastname" : "Ramone"},
  {"id" : 2, "firstname" : "Joe", "lastname" : "Strummer"},
  {"id" : 3, "firstname" : "Neil", "lastname" : "Young"}
];


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
               "href": "/artists/1"
             }
           }
         },
         {
           "firstname": "Joe",
           "lastname": "Strummer",
           "_links": {
             "update": {
               "href": "/artists/2"
             }
           }
         },
         {
           "firstname": "Neil",
           "lastname": "Young",
           "_links": {
             "update": {
               "href": "/artists/3"
             }
           }
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
      .should.equal('application/json; charset=utf-8');
    response.headers['content-length']
      .should.equal('310');
    done();
  });
};

function setup(res){
  res.collection(artists)
    .linkEach("update", function(item){
      return "/artists/" + item.id;
    },
    {method : "PUT", schema : {}})
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
  describe("with express", function(){
    beforeEach(function(done){
      app = express();
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

hyperjson-connect
=================

This is a connect-compatible middleware for adding support for easily creating json api responses based on the [hyper+json spec](https://github.com/cainus/hyper-json-spec) (using the [hyperjson library](https://github.com/cainus/hyper-json/)).



[![Build Status](https://travis-ci.org/cainus/hyperjson-connect.png?branch=master)](https://travis-ci.org/cainus/hyperjson-connect)
[![codecov.io](https://codecov.io/github/cainus/codecov.io/coverage.svg?branch=master)](https://codecov.io/github/cainus/codecov.io?branch=master)

[![NPM](https://nodei.co/npm/hyperjson-connect.png)](https://nodei.co/npm/hyperjson-connect/)


This middleware provides a fluent interface for adding links to json api responses.  Links are added in the Hyper+json style (documented 
[here](https://github.com/cainus/hyper-json-spec) ).

This sort of library is useful if you want to create hypermedia apis using json.

## Setup:

Add this middleware to your connect or express app like any other
middleware for the default settings:

```javascript
var hyperjsonConnect = require('hyperjson-connect');
app.use(hyperjsonConnect());
```

There is also an optional `options` parameter that lets you specify some
particular options:

* `defaultLinks` (boolean, defaults to true) : when true, 'up' links
will automatically be added to every payload to point up one directory in your url.

* `protocol` (string or function, defaults to 'http') : All links will start with this
protocol by default.  If `protocol` is a function, the function should
take a request object as its only parameter and return the protocol as a
string.  For example, I often use this to when behind a load balancer
that forwards the protocol as a header:  

```javascript
  var hyperjsonConnect = require('hyperjson-connect');
  var protocolFunction = function(req){
    return req.headers['x-forwarded-proto'] ||
           req.headers['x-forwarded-protocol'] ||
           'http';
  };
  app.use(hyperjsonConnect({protocol : protocolFunction}));
```

* `objectName` (string, defaults to 'object') : you can change
  res.object() to res.whateverYouWant() by specifying the new name here.

* `collectionName` (string, defaults to 'collection') : you can change
  res.collection() to res.whateverYouWant() by specifying the new name
here.

### example:

```javascript
var hyperjsonConnect = require('hyperjson-connect');
app.use(hyperjsonConnect({
  defaultLinks : false,
  protocol : 'https',
  objectName : 'single',
  collectionName : 'list'
}));
```

## Usage:

### res.object()

##### Basic Usage  
Create a json representation of an object and send it in the http response:
```javascript
res.object({thisis : "a test"}).send();
```

#### .toString()
Creates json strings from objects.
```javascript
res.object({thisis : "a test"}).toString();  // '{"thisis":"a test"}'
```

#### .send()
Actually send a response.
```javascript
res.object({thisis : "a test"}).send();
                 /* { thisis : "a test", 
                      prop1 : {
                        random : "value"}
                      }
                 */
```

#### .toObject()
Returns the resulting deserialized "json" object.
```javascript
res.object({thisis : "a test"}).toObject();  // {"thisis":"a test"}
```

#### .property()
Adds a property to the json output.
```javascript
res.object({thisis : "a test"})
  .property("prop1", {random : "value"})
  .send();                 /* { thisis : "a test", 
                                    prop1 : {
                                      random : "value"}
                                  }
                               */
```




#### .link()
Adds a link to the json output.
```javascript
res.object({thisis : "a test"})
  .link("self", "http://localhost:8080/api/test")
  .send();                 /* { thisis : "a test", 
                                    _links : {
                                      self : {
                                        href : "http://localhost:8080/api/test"
                                      }
                                  }
                               */
```
This can be called multiple times to add more links.
```javascript
res.object({thisis : "a test"})
  .link("self", "http://localhost:8080/api/test")
  .link("up", "http://localhost:8080/api/")
  .link("kid", "http://localhost:8080/api/kid1")
  .link("kid", "http://localhost:8080/api/kid2")
  .send();                 /* { thisis : "a test", 
                                    _links : {
                                      self : {
                                        href : "http://localhost:8080/api/test"
                                      },
                                      up : {
                                        href : "http://localhost:8080/api/"
                                      },
                                      kid : [{
                                        href : "http://localhost:8080/api/kid1"
                                      },{
                                        href : "http://localhost:8080/api/kid2"
                                      }]
                                  }
                               */
```
`link()` can also be used to add non-traditional links for HTTP methods other than GET.
```javascript
res.object({thisis : "a test"})
  .link("self", "http://percolatorjs.com", {type : 'application/json', schema : {}, method : 'POST'})
  .send();                  /* {  thisis : "a test", 
                                      _links : {
                                          self : { href : "http://percolatorjs.com",
                                                   type : 'application/json',
                                                   schema : {},
                                                   method : 'POST' }
                                      }
                                    }
                                */

```

Check out the [hyper+json spec](https://github.com/cainus/hyper-json-spec) if you want to read more about these kinds of links.

### res.collection()
`res.collection()` has all the same features of res.object(), except it takes an array of objects instead of just one object, and returns them wrapped in a json object that is also linkable.  You can check out the [hyper-json library](https://github.com/cainus/hyper-json) for more details, but here are some simple examples.

Basic usage:
```javascript
res.collection([{test:1}, {test:2}]).send();
    /*
      {
        "_items" : [
          {"test" : 1}, {"test" : 2}
        ]
      }
    */
```

With links:
```javascript
res.collection([{test:1}, {test:2}])
.linkEach('delete', function(obj){ return '/delete/' + obj.test })
.link('home', '/home')
.send();
    /*
      {
        "_items" : [
          {
            "test" : 1,
            "_links": { delete: { "href": "/delete/1" } }
          }, 
          {
            "test" : 2,
            "_links": { "delete" : { "href": "/delete/2" } }
          }
        ],
        "_links" : { "home" : { "href" : "/home" } }
      }
    */
```

With links:
```javascript
res.collection([{test:1}, {test:2}])
.linkEach('delete', function(obj){ return '/delete/' + obj.test })
.link('home', '/home'. {method: "DELETE", schema: {})
.send();
    /*
      {
        "_items" : [
          {
            "test" : 1,
            "_links": { delete: { "href": "/delete/1" } }
          }, 
          {
            "test" : 2,
            "_links": { "delete" : { "href": "/delete/2" } }
          }
        ],
        "_links" : { "home" : { "href" : "/home", method: "DELETE", schema: {} } }
      }
    */
```
With conditional links:
```javascript
res.collection([{test:1}, {test:2}])
.linkEach('delete', function(obj){ return '/delete/' + obj.test }, {when: function (obj) { return obj.test % 2 }})
.send();
    /*
      {
        "_items" : [
          {
            "test" : 1,
            "_links": { delete: { "href": "/delete/1" } }
          }, 
          {
            "test" : 2
          }
        ]
      }
    */
```




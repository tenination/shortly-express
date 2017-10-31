var express = require('express');
var session = require('express-session')
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');

var bcrypt = require('bcrypt-nodejs');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({secret: 'keyboard cat'}));

app.get('/', function(req, res) {

  if (req.session.user && req.session.password) {
    console.log('REQSESSIONUSER AND PASSWORD IS', req.session.user, req.session.password);
    res.redirect('/create');
  } else {
    res.redirect('/login');
  }
});

app.get('/login', function(req, res) {
  req.session.destroy(function(err) {
  });
  res.render('login');
});

app.post('/login', function(req, res, next) {

  var username = req.body.username;
  var password = req.body.password;

  new User({username: username, password: password}).fetch().then(function(found) {
    if (found) {
      req.session.user = username;
      req.session.password = password;
      //res.redirect('/create');
      res.redirect('/');
    } else {
      console.log('NICE TRY SUCKAA!!!!!')
      res.redirect('/login');
    }

  });

});

app.get('/signup', function(req, res) {
  req.session.destroy(function(err) {
  });
  res.render('signup');
});

app.post('/signup', function(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;


  new User({username: username}).fetch().then(function(found) {
    if (found) {
      res.redirect('/login');
    } else {

      bcrypt.hash(password, null, null, function(err, hash) {
        new User({username:username, password:hash}).save().then(function() {
          res.redirect('/');
        });
      })
      
      // new User({username:username, password:password}).save().then(function() {
      //   res.redirect('/');
      // });

      // bcrypt.hash(attrs.password, null, null, function(err, hash) {
      //   // Store hash in your password DB.
      //   attrs.password = hash;
      //   console.log('THIS IS EQUAL TO', this);
      //   newSet('password', hash);
      //   console.log('HASH is EQUAL TO', hash);
      //   console.log('NEW ATTR PASSWORD IS EQUAL TO', attrs.password);







      // Users.create({
      //   username: username,
      //   password: password
      // }).then(function() {
      //   console.log('User ', username, ' created with password ', password, '!');
      //   res.redirect('/');
      // });
    }
  });

  });

app.get('/create', function(req, res) {
  if (req.session.user && req.session.password) {
    res.render('index');
  } else {
    res.redirect('/login');
  }
});

app.get('/links', function(req, res) {
  if (req.session.user && req.session.user) {
    Links.reset().fetch().then(function(links) {
      res.status(200).send(links.models);
    });
  } else {
    res.redirect('/login');
  }
});

app.post('/links', function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;

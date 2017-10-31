var express = require('express');
var session = require('express-session')
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');


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

// add middleware
app.get('/', function(req, res) {
  //if (req.session.user && req.session.password) { // If username and password are found on the database...
  console.log('TESTING: Username: ', req.session.user, ' Password: ', req.session.password);
  res.redirect('/login');

  if (req.session.user && req.session.password) {
    res.redirect('/create');
  }

  // new User({username: req.session.user, password: req.session.password}).fetch().then(function(found) {
  //   if (found) {
  //     res.redirect('/create');
  //   } else {
  //     res.redirect('/login');
  //   }
  // });
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.post('/login', function(req, res, next) {

  // The following snippet gets the username and password from the user. If it matches, then it redirects
  // you to the /create page where you will be making shortly urls.
  var username = req.body.username;
  var password = req.body.password;
  if (username && password) {
    req.session.regenerate(function() {
      req.session.user = username;
      req.session.password = password;
      console.log('Username: ', req.session.user, ' Password: ', req.session.password);
      res.redirect('/');
    });
  }
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res, next) {
  // Should store username and password into database and log in as that user
  var username = req.body.username;
  var password = req.body.password;

  var user = new User();
  var data = {
    username: req.body.username,
    password: req.body.password
  };

  new User({username: username}).fetch().then(function(found) {
    console.log('USERNAME is equal to', username);
    if (found) {
      console.log('FOUND');
      // If username is found, direct user to login page.
      res.redirect('/login');
    } else {
      // If username not found, login with that username and pw and redirect to /create page.
      console.log('NOT FOUND');
      Users.create({
        username: username,
        password: password
      }).then(function() {
        console.log('User ', username, ' created with password ', password, '!');
        req.session.username = username;
        req.session.password = password;
        res.redirect('/');
      });
    }
  });


  //Find exisitng user
    //If user end response, username taken
    //else
      //just save username and pw to db
  // Users.create(data).then(function(
  //   // req.session.regenerate(function() {
  //   //   req.session.user = username;
  //   //   req.session.password = password;
  //   //   res.redirect('/create');
  //   // });
  // ))

  // Links.create({
  //   url: uri,
  //   title: title,
  //   baseUrl: req.headers.origin
  // })
  // .then(function(newLink) {
  //   res.status(200).send(newLink);
  // });


  // if (username && password) {
  //   req.session.regenerate(function() {
  //     req.session.user = username;
  //     req.session.password = password;
  //     res.redirect('/create');
  //   });
  // }
  // db.query goes here somewhere
  });

app.get('/create', function(req, res) {

  // This code is supposed to be able to redirect you to the login page if you have not yet logged in, and if you have logged in,
  // render the index page so you can create shortly urls.
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

var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  defaults: {
    username: "demo",
    password: "demo"
  },
  clicks: function() {
    return this.hasMany(Click);
  },
  initialize: function() {
    var context = this;
    this.on('creating', function(model, attrs, options) {
        //var shasum = crypto.createHash('sha1');
      //  shasum.update(model.get('url'));
      //  model.set('code', shasum.digest('hex').slice(0, 5));
      console.log('MODEL IS EQUAL TO', model);
      console.log('ATTRS password is', attrs.password);

      var bcryptPromise = Promise.promisify(bcrypt.hash);
      bcryptPromise(attrs.password, null, null).then(function(hashedPassword) {
        context.set('password', hashedPassword);
        console.log('CONTEXT GET PASSWORD', context.get('password'));
      });


      // bcrypt.hash(attrs.password, null, null, function(err, hash) {
      //   // Store hash in your password DB.
      //   attrs.password = hash;
      //   console.log('THIS IS EQUAL TO', this);
      //   newSet('password', hash);
      //   console.log('HASH is EQUAL TO', hash);
      //   console.log('NEW ATTR PASSWORD IS EQUAL TO', attrs.password);
      // });
    });
  }
});

// bcrypt.hash("bacon", null, null, function(err, hash) {
//     // Store hash in your password DB.
// });
//
// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });



module.exports = User;

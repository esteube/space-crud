var routes = require('routes')(),
        fs = require('fs'),
        db = require('monk')('localhost/users'),
     users = db.get('users'),
        qs = require('qs'),
      view = require('./view'),
      mime = require('mime'),
    bcrypt = require('bcryptjs')

routes.addRoute('/admin', (req, res, url) => {
  // 1. Check to see if there is a session with
  //    `req.session.get('email')`
  // 2. If the session is present, render the site/private
  //    template with the view module. 'view.render('path', {})`
  // 3. If the session is not present, A) "flush" the session
  //    for good measure and B) redirect to the login route
if (req.session.get('email')) {
  console.log('Made it!')
  res.setHeader('Content-Type', 'text/html')
  var template = view.render('site/private', {})
  res.end(template)
  }
 else {
    req.session.flush()
    res.writeHead(302, {'Location': '/login'})
    res.end()
  }
})

routes.addRoute('/', (req, res, url) => {
  console.log(url.route)
  // Render the homepage
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html')
    users.find({}, function (err, docs) {
      if (err) res.end('ooops from the home page')
      var template = view.render('site/index', {})
      res.end(template)
      })
    }
})

routes.addRoute('/register', (req, res, url) => {
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html')
    // 1. Respond with the `sessions/register`page with
    //    our view module. `view.render('path', {})`
      // if (err) res.end('oops from register')
      var template = view.render('sessions/register',  {title: 'Log In'})
      res.end(template)
      }
  if (req.method === 'POST') {
    // 1. Collect form   data with async accumulator
    // 2. Insert user into database
    // 3. Create the session with req.session.put('email', doc.email)
    //    Note: you will need to do this inside of the monk
    //    callback function.
    var data = ''

    req.on('data', function (chunk) {
      data += chunk
    })

    req.on('end', function () {
      var user = qs.parse(data)
      user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10))
      console.log(user, 'from register')
      users.insert(user, function(err, doc) {
        if (err) {
          res.writeHead(302, {'Location': '/'})
          res.end()
          return
        }
        req.session.put('email', doc.email)
        res.writeHead(302, {'Location': '/'})
        res.end()
      })
    })
  }
})

routes.addRoute('/login', (req, res, url) => {
  if (req.method === 'GET') {
    console.log(url.route)
    // 1. Render the login page with the view module
    // res.setHeader('Content-Type', 'text/html')
    var template = view.render('sessions/login',  {title: 'Log In'})
    res.end(template)
  }
  if (req.method === 'POST') {
    // 1. Use the async accumulator pattern to Collect
    //    form data.
    // 2. Use the email field from the form data to
    //    lookup a user in the database with monk's
    //    `findOne()` method.
    // 3. Compare the form data's password field with the
    //    stored user's password field
    // 4. If the passwords both match, then this user
    //    is who they claim to be (authenticated), so
    //    set the session with `req.session.put('email', user email)`
    //    Note: The user password here may be from the form data
    //    or from the database.
    var data = ''

    req.on('data', function (chunk) {
      data += chunk
    })

    req.on('end', function () {
      var user = qs.parse(data)
      console.log(user)
      users.findOne({ email: user.email}, function (err, doc) {
        console.log(user)
        console.log(doc)
        if (err) console.log('error in login')
        if (! doc ) {
          res.writeHead(302, {'Location': '/'})
          res.end()
          }
        else if (bcrypt.compareSync(user.password, doc.password)) {
          req.session.put('email', doc.email)
          res.writeHead(302, {'Location': '/'})
          res.end()
        } else {
          console.log('Redirecting from login')
          res.writeHead(302, {'Location': '/'})
          res.end()
        }
      })
    })
  }
})

routes.addRoute('/logout', (req, res, url) => {
  // 1. Flush the session with req.session.flush()
  // 2. Redirect to homepage
  req.session.flush()
  res.writeHead(302, {'Location': '/login'})
  res.end()
})

routes.addRoute('/public/*', (req, res, url) => {
  res.setHeader('Content-Type', mime.lookup(req.url))
  fs.readFile('.' + req.url, function (err, file) {
    if (err) {
      res.setHeader('Content-Type', 'text/html')
      res.end('404')
    }
    res.end(file)
  })
})

module.exports = routes

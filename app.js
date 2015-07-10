var http = require('http'),
    router = require('./router'),
    url = require('url'),
    mime = require('mime'),
    NodeSession = require('node-session'),
    session = new NodeSession({secret: 'Q3UBzdH9GEfiRCTKbi5MTPyChpzXLsTD'})

var server = http.createServer(function (req, res) {
  session.startSession(req, res, function() {
    var path = url.parse(req.url).pathname
    var currentRoute = router.match(path)
    if (currentRoute) {
      currentRoute.fn(req, res, currentRoute)
    } else {
      res.end('404')
    }
  })
})

server.listen(3000, function (err) {
  if (err) console.log('Doah', err)
  console.log('Woot. A server is running on port 3000')
})

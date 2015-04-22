// Initialize function handler (app) using Express
// and apply it to our HTTP server (http)
var app = require('express')();
var http = require('http').Server(app);

// Initialize Socket.IO instance to listen on our server
var io = require('socket.io')(http);

// Define server port
http.port = 3000;

// Define route handler to call when server is accessed
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// Log 'connection' and 'disconnect' socket messages to server
/*
io.on('connection', function(socket) {
   console.log('a user connected');   
   socket.on('disconnect', function() {
      console.log('a user disconnected');
   });
});
*/

// Log 'chat message' socket messages to server
/*
io.on('connection', function(socket) {
   socket.on('chat message', function(msg) {
      console.log('message: ' + msg);
   });
});
*/

// Send 'chat message' sockets to client (browser)
io.on('connection', function(socket) {
   socket.on('chat message', function(msg) {
      io.emit('chat message', msg);
   });
});

// Tell server to listen on port defined by http.port
http.listen(http.port, function(){
  console.log('listening on *:' + http.port);
});
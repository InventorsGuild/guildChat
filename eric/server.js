var app = require('express')();
var http = require('http').Server(app);

http.port = 3000;

app.get('/', function(req, res){
  res.send('<h1>Hello world from /</h1>');
  console.log("Accessed: /");
});

app.get('/chat-project', function(req, res){
  res.send('<h1>Hello world from /chat-project</h1>');
  console.log("Accessed: /chat-project");
});

http.listen(http.port, function(){
  console.log('listening on *:' + http.port);
});
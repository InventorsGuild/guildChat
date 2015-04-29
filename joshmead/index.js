var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var connectedUsersNames = [];
var guestIndex = 1;

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

/*io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});*/

io.on('connection', function(socket){
    //socket.on('join', function(rand) {
	//   socket.join(rand);
	//}
    
    socket.on('disconnect', function(data) {
	
	});
   
    socket.on('chat message', function(msg){
      socket.broadcast.emit('chat message', msg);
    });
	
	socket.on('have display name', function(name) {
	    connectedUsersNames[connectedUsersNames.length] = name;
		socket.broadcast.emit('connected user', name);
	});
	
	socket.on('need guest name', function(name) {
	    var gName = "Guest-" + guestIndex++;
	    socket.emit('guest name', gName);
		connectedUsersNames[connectedUsersNames.length] = gName;
		socket.broadcast.emit('connected user', gName); 
	});
	
	socket.on('need all connections', function(data) {
	    socket.emit('all connections', connectedUsersNames);
	});
	
	socket.on('is it on', function(data) {
	    socket.emit('i am on', data);
	})
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});

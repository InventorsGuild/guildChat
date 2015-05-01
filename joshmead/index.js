var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var connectedUsers = [];
var guestIndex = 1;

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){  
    socket.on('disconnect', function(data) {
	    for(var i=0; i<connectedUsers.length; i++) {
		    if(socket.id == connectedUsers[i].ID) {
				socket.broadcast.emit('disconnected user', connectedUsers[i].Name);			
			    connectedUsers.splice(i, 1);
				socket.broadcast.emit('all connections', connectedUsers);
			}
		}
	});
   
    socket.on('chat message', function(msg){
        socket.broadcast.emit('chat message', msg);
    });
	
	socket.on('have display name', function(name) {
	    connectedUsers[connectedUsers.length] = {Name: name, ID: socket.id};
		socket.broadcast.emit('connected user', name);
	});
	
	socket.on('need guest name', function(name) {
	    var gName = "Guest-" + guestIndex++;
	    socket.emit('guest name', gName);
		connectedUsers[connectedUsers.length] = {Name: gName, ID: socket.id};
		socket.broadcast.emit('connected user', gName); 
	});
	
	socket.on('need all connections', function(data) {
	    socket.emit('all connections', connectedUsers);
	});
	
	socket.on('new display name', function(name) {
	    for(var i=0; i<connectedUsers.length; i++) {
		    if(socket.id == connectedUsers[i].ID) {
			    connectedUsers[i].Name = name;
				io.emit('all connections', connectedUsers);
			}
		}	    
	});
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});

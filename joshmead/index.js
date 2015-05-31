var express = require('express');
var app = require('express')();
var favicon = require('serve-favicon');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var connectedUsers = [];
var guestIndex = 1;

app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(__dirname + '/public/favicon.ico'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){  
    socket.on('disconnect', function(data) {
	    for(var i=0; i<connectedUsers.length; i++) {
		    if(socket.id == connectedUsers[i].ID) {
				socket.broadcast.emit('disconnected user', connectedUsers[i]);			
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
	
	socket.on('is typing', function(choice) {
	    var user;
	    for(var i=0; i<connectedUsers.length; i++) {
		    if(socket.id == connectedUsers[i].ID) {
			    user = connectedUsers[i];
			}	
		}
		
	    if(choice == "yes") 
		    socket.broadcast.emit('typing', user);
		else
		    socket.broadcast.emit('not typing', user);
	});
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});

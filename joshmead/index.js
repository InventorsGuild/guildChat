var express = require('express');
var app = require('express')();
var favicon = require('serve-favicon');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var connectedUsers = [];
var guestIndex = 1;

//Flood Control ----------------------------------------------------------------
//Allow max of 7 messages per 10 seconds before dropping the rest of the messages
var messageRate = 7.0;
var messagePer = 10.0;

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
	    //Flood Control
	    for(var i=0; i<connectedUsers.length; i++) {
		    if(socket.id == connectedUsers[i].ID) {		
				var currentTime = Date.now();
				var timeElapsed = (currentTime - connectedUsers[i].Check) / 1000.0;
				connectedUsers[i].Check = currentTime;
				//console.log("Before:  " + connectedUsers[i].Allowance)
				connectedUsers[i].Allowance += timeElapsed * (messageRate / messagePer);
				//console.log("After:   " + connectedUsers[i].Allowance)
				if(connectedUsers[i].Allowance > messageRate)
				    connectedUsers[i].Allowance = messageRate;
				//Drop the message
				if(connectedUsers[i].Allowance < 1.0)
				    socket.emit('dropped message');
				else {
				    connectedUsers[i].Allowance -= 1.0;
				    io.emit('chat message', msg);
				}
			}
		}
        //socket.broadcast.emit('chat message', msg);
    });
	
	socket.on('have display name', function(name) {
	    connectedUsers[connectedUsers.length] = {Name: name, ID: socket.id, Allowance: messageRate, Check: Date.now()};
		socket.broadcast.emit('connected user', name);
	});
	
	socket.on('need guest name', function(name) {
	    var gName = "Guest-" + guestIndex++;
	    socket.emit('guest name', gName);
		connectedUsers[connectedUsers.length] = {Name: gName, ID: socket.id, Allowance: messageRate, Check: Date.now()};
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

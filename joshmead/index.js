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

var lastMessages = [];
var lastMessagesPtrIndex = 0;
var MESSAGE_QUEUE_SIZE = 50;

app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(__dirname + '/public/favicon.ico'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){  
    socket.on('disconnect', function(data) {
	    for(var i=0; i<connectedUsers.length; i++) {
			for(var j=0; j<connectedUsers[i].Sockets.length; j++) {
				if(socket.id == connectedUsers[i].Sockets[j]) {
				    connectedUsers[i].Sockets.splice(j, 1);
					connectedUsers[i].ConnectTimes--;
					
					if(connectedUsers[i].ConnectTimes == 0) {
						socket.broadcast.emit('disconnected user', connectedUsers[i]);			
						connectedUsers.splice(i, 1);
						socket.broadcast.emit('all connections', connectedUsers);
					}
					return;
				}
			}
		}
	});
   
    socket.on('chat message', function(msg, guid){
	    //Flood Control
	    for(var i=0; i<connectedUsers.length; i++) {
		    if(guid == connectedUsers[i].ID) {		
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
				//Send the message
				else {
					lastMessages[lastMessagesPtrIndex] = msg;
					lastMessagesPtrIndex = (lastMessagesPtrIndex+1)%MESSAGE_QUEUE_SIZE;
				    connectedUsers[i].Allowance -= 1.0;
				    io.emit('chat message', msg);
				}
			}
		}
        //socket.broadcast.emit('chat message', msg);
    });
	
	socket.on('have display name', function(name, guid) {
	    for(var i=0; i<connectedUsers.length; i++) {
		    if(guid == connectedUsers[i].ID) {
				connectedUsers[i].ConnectTimes++;
				connectedUsers[i].Sockets.push(socket.id);
				return;
			}
		}
	    connectedUsers[connectedUsers.length] = {Name: name, ID: guid, ConnectTimes: 1, Allowance: messageRate, Check: Date.now(), Sockets: [socket.id]};
		socket.broadcast.emit('connected user', name);
	});
	
	socket.on('need guest name', function(guid) {
/*	    for(var i=0; i<connectedUsers.length; i++) {
		    if(guid == connectedUsers[i].ID) {
				connectedUsers[i].ConnectTimes++;				
				connectedUsers[i].Sockets.push(socket.id);
				return;
			}
		}		*/
	    var gName = "Guest-" + guestIndex++;
	    socket.emit('guest name', gName);
		connectedUsers[connectedUsers.length] = {Name: gName, ID: guid, ConnectTimes: 1, Allowance: messageRate, Check: Date.now(), Sockets: [socket.id]};
		socket.broadcast.emit('connected user', gName); 
	});
	
	socket.on('need all connections', function(data) {
	    socket.emit('all connections', connectedUsers);
	});
	
	socket.on('new display name', function(name, guid) {
	    for(var i=0; i<connectedUsers.length; i++) {
		    if(guid == connectedUsers[i].ID) {
			    connectedUsers[i].Name = name;
				io.emit('all connections', connectedUsers);
				
				for(var j=0; j<connectedUsers[i].Sockets.length; j++) {
				    if(connectedUsers[i].Sockets[j] != socket.id)
						io.to(connectedUsers[i].Sockets[j]).emit('you changed names', name);
				}
			}
		}	    
	});
	
	socket.on('is typing', function(choice, guid) {
	    var user;
	    for(var i=0; i<connectedUsers.length; i++) {
		    if(guid == connectedUsers[i].ID) {
			    user = connectedUsers[i];
			}	
		}
		
	    if(choice == "yes") 
		    socket.broadcast.emit('typing', user);
		else
		    socket.broadcast.emit('not typing', user);
	});
	
	socket.on('need last messages', function(data) {
	    socket.emit('last messages', lastMessages, lastMessagesPtrIndex-1, MESSAGE_QUEUE_SIZE);
	});
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});

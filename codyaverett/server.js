var app = require('express')();
var http = require ('http').Server(app);

http.port = 3000;

app.get('/', function(req, res) {
    console.log("Accessed: /");
    res.send('Root is where it\'s at');
});
   
app.get('/power', function(req, res) {
    console.log("Accessed: /power");
    res.send('Power is where you are');
});

http.listen(http.port, function() {
    console.log('listening on : ' + http.port );
});
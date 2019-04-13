
var express = require('express');
var app = express();
var http = require('http').Server(app);

app.use(express.static('public'));



var io = require('socket.io')(http);

function niceLittlePoint(){
	this.size = (Math.random()*10)+ 4;
	this.color = {hue : Math.random()*360, saturation : 1, brightness : Math.random()*0.7 + 0.3};
	this.position = {x : Math.random()*50, y : Math.random()*50};
	this.accelerationlength = 0;
	this.accelerationdir = 0;
	this.vitesse = {length : 0, angle : 0};
	this.dT = Date.now();
	this.getposition = function(t){ 

		this.position.x = Math.cos(180*this.vitesse.angle/3.14)*this.vitesse.length*(t-this.dT) + this.position.x;
		this.position.y = Math.sin(180*this.vitesse.angle/3.14)*this.vitesse.length*(t-this.dT) + this.position.y;
		this.dT = t;

	}
	this.keys = {'up':false,
					'left':false,
					'right':false}

}

var nsps = new Object();
nsps.map = new Map();
nsps.handler = function(req, res, next){

	if(nsps.map.has(req.originalUrl) == false){ //if this namespace don't already exist then :
		var socketNamespace = io.of(req.originalUrl); //create name space
		var littleworld = new Map(); //where every point will be stored

		socketNamespace.on('connection', function(socket){ 
			socket.emit('welcomeHereIsTheCurrentStateOfTheWorld', {'littleworld' : Array.from(littleworld)});
			var aNiceLittlePoint = new niceLittlePoint();
			littleworld.set(socket.id, aNiceLittlePoint);
			socket.hisPoint = littleworld.get(socket.id);

			//faire un broadcast pour dire qu'il y a un nouveau

	    	
			
			
			socketNamespace.emit('newguy', {	'socketid' : socket.id,  
	    										'thepoint' : socket.hisPoint
	    									}
	    						);			
			socket.on("keydown", function (message) {
				var t = Date.now();
				var updatemessage = {'socketid' : socket.id};

				socket.hisPoint.getposition(t);
				updatemessage.newposition = socket.hisPoint.position;
				if (message.key == 'up') {
	    			socket.hisPoint.vitesse.length = 0.1; //pixel par miliseconde
	    		}
	    		if (message.key == 'left' && !socket.hisPoint.keys.left) {

	    			socket.hisPoint.keys.left = true;
	        		socket.hisPoint.vitesse.angle = socket.hisPoint.vitesse.angle + 3.14/10;
	    		}
	    		if (message.key == 'right' && !socket.hisPoint.keys.right) {

	    			socket.hisPoint.keys.right = true;
	    			socket.hisPoint.vitesse.angle = socket.hisPoint.vitesse.angle - 3.14/10;
	    		}

	    		socketNamespace.emit('update', {'socketid' : socket.id,  
	    										'updateposition' : socket.hisPoint.position,
	    										'updatespeed' : socket.hisPoint.vitesse
	    									});
			});
			socket.on("keyup", function (message) {
				var updatemessage = {'socketid' : socket.id};
				var t = Date.now();
				socket.hisPoint.getposition(t); 
				updatemessage.newposition = socket.hisPoint.position;
				if (message.key == 'up') {
	    			socket.hisPoint.vitesse.length = 0;
	    		}
	    		if (message.key == 'left') {

	    			socket.hisPoint.keys.left = false;
	    		}
	    		if (message.key == 'right') {
	    			socket.hisPoint.keys.right = false;
	    		}

	    		socketNamespace.emit('update', {'socketid' : socket.id,  
	    										'updateposition' : socket.hisPoint.position,
	    										'updatespeed' : socket.hisPoint.vitesse
	    									});
			});

			socket.on('disconnect', (reason) => {
				littleworld.delete(socket.id);
				socketNamespace.emit('delet', socket.id);

  			});
		});


		nsps.map.set(req.originalUrl, socketNamespace);
	}
	next();
}

app.get('/favicon.ico', function(req, res){
	res.end();
})
app.get('*', nsps.handler, function (req, res) {
	console.log(req.originalUrl);
	var options = {
		root: __dirname + '/',
		dotfiles: 'deny',
		headers: {
			'x-timestamp': Date.now(),
			'x-sent': true
		}
	};

	res.sendFile('noneuclidian.html', options, function(err){
		if (err) {
			console.log(err);
			res.status(err.status).end();
		}
		else {
			console.log('Sent');
		}
	});

});



io.on('connection', function(socket){
	console.log("1");
});


http.listen(8081, 'localhost', function () {

	console.log('ok');

});






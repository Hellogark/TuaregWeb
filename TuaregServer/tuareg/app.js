var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var index = require('./routes/index');
var users = require('./routes/users');
var passport=require("passport");
var session = require("express-session");
var app = express();
var modelous=require("./Model/modelousuario.js");
var msgpack = require("msgpack-response");


app.set("view engine","pug");
app.use(logger('dev'));
app.use(msgpack({auto_detect:true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("./public/"));
app.use(session({
  secret: '123zdsauqjbz89',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/', index);
app.use('/users', users);
passport.serializeUser(function(usuario,done){
	done(null,usuario._id);
});
passport.deserializeUser(function(id,done){

	modelous.Usuario.findById(id,function(err,dato){
		if(err){done(err);}
		if(!dato){
			console.log("no se pudo validar cuenta");
			done(null,false,{message:"no se pudo validar cuenta"});
		}
		console.log("Deserialize "+dato);
		done(null,dato);
	});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send("error: "+ err.message+ " \n" + res.locals.error + "\n" +err);
});

module.exports = app;

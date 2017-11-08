var passport = require("passport");
var estrategia = require("passport-local");
var modelous = require("../Model/modelousuario.js").Usuario;

passport.use("registro",new estrategia({
	usernameField:"username",
	passwordField:"password",
	passReqToCallback: true
	},
	function(req,username,password,done){
		modelous.findOne({nombre_usuario:username},function(err,dato){
			if(err){
				return done(err);
			}
			if(dato){
			 return done (null,false,{message:"Usuario ya registrado"});
			}
			
			var usuario = new  modelous({nombre_usuario:username,contra:password,verfcontra:req.body.verificacion});
			usuario.save(function(err){
				if (err){console.log("error guardando usuario"); return done(err);}
				
				return done (null,usuario);
			});
			
		});
	}
));

passport.use("login",new estrategia({
	usernameField:"username",
	passwordField:"password"
	
	},
	function(username,password,done){
		
		modelous.findOne({nombre_usuario:username},function(err,dato){
			if(err){
				console.log("error: "+err);
				return done(err);
			}
			
			if(!dato){
				console.log("Username not found");
				return done(null,false,{message:"Username no encontrado"});
			}
			
			dato.verifiContra(password,function(err,isMatch){
				if(err){done(err);}
				if(!isMatch){
					console.log(isMatch);
					return done(null,false);
				}
				return done(null,dato);
			});
			
		});
	}
));

exports.Autenticado=passport.authenticate("login",{successRedirect: '/users', failureRedirect: '/login',session:true});
exports.Registrar=passport.authenticate("registro",{successRedirect: '/users', failureRedirect: '/login',session:true});
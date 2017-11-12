var mongo= require("mongoose");

exports.db=mongo.connect('mongodb://localhost/Tuareg');
var bcrypt = require("bcrypt");
var Schema = mongo.Schema;
var usuarioSchema = new mongo.Schema({
	nombre_usuario: {
		type:String,
		unique:true,
		required:[true,"No se introdujo usuario"]
	},
	contra:{
		type:String,
		required:[true,"No se introdujo contraseña"],
		validate:{
			validator:function(valor){
					return valor === this.verfcontra; 
			},
			message: "Passwords distintas"
		}
	},
	correo:{
		type: String
	},
	estadisticas:{
		type:Schema.ObjectId , 
		ref:"estadisticas_usuario"			
	},
	lista_amigos:{
		type:Schema.ObjectId,
		ref:"list_amigos"
	}
	
});

/// Encriptación
usuarioSchema.pre("save",function(cb){
	var usrSch = this;
		
	console.log(usrSch.contra);
	if(!this.isModified("contra")) {

		return cb();
	}
		bcrypt.hash(usrSch.contra,5,function(err,hash){
			if (err){
				console.log("=(");
				return cb(err);
			}
			usrSch.contra=hash;
			cb();
		});
		

	
});
usuarioSchema.virtual("verfcontra").get(function(){
	return this._verfcontra;
}).set(function(val){
	this._verfcontra=val;
});
usuarioSchema.methods.verifiContra=function(contras,cb){
	bcrypt.compare(contras,this.contra,function(err,isMatch){
		if(err) throw(err);
		return cb(null,isMatch);
	});
}

var estadisticasSchema = new mongo.Schema({
	id_usuario:{
		type: Schema.ObjectId,
		ref:"usuario"
	},
	partidas_jugadas:{
		type:Number,
		default:0,
	},
	partidas_ganadas:{
		type:Number,
		default:0,
	},	
	partidas_perdidas:{
		type:Number,
		default:0,
	}
});

var listaAmigosSchema = new mongo.Schema({
	id_usuario:{
		type:Schema.ObjectId,
		ref:"usuario"
	},
	amigos:[{
		type: Schema.ObjectId,
		ref:"usuario"
	}]
});



exports.Usuario =mongo.model("usuario",usuarioSchema);
exports.Estadisticas=  mongo.model("estadisticas_usuario",estadisticasSchema);
exports.ListaAmigos= mongo.model("list_amigos",listaAmigosSchema);
exports.CartasTribu= mongo.model("cartas_tribu",new Schema({ any: Schema.Types.Mixed }));
//exports.CartarMerca=mongo.model("Cartas_mercancia",);

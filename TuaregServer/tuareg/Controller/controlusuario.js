
exports.getLogin= function(req,res){
	res.render("login");
};

exports.isAutenticado=require("../Autenticate/estrategia.js").Autenticado;
exports.registro=require("../Autenticate/estrategia.js").Registrar;
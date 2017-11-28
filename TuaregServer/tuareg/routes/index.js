var express = require('express');
var router = express.Router();
var controlUsuario= require("../Controller/controlusuario.js");
var usuario = require("../Model/modelousuario.js").Usuario;
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.route("/login").get(controlUsuario.getLogin).post(controlUsuario.isAutenticado);
router.post("/registrar",controlUsuario.registro);
router.get("/check",function(req,res){
	/*usuario.findOne({nombre_usuario:"braulio"},function(err,dato){
		if(err){console.log(err); res.send(err);}
		if(!dato){console.log("No encontrado");res.send("No encontrado");}
		res.send(dato);
	});
	*/
	res.send(req.session);
});

module.exports = router;

var express = require('express');
var router = express.Router();
router.use(function(req,res,next){
	if(!req.isAuthenticated()){
		res.redirect("/login");
	}
	else{
		next();
	}
});

/* GET users listing. */
router.get('/',function(req, res, next) {
  res.render('juego');
});

router.get("/logout",function(req,res){
	req.logOut();
	res.redirect("/login");
});

module.exports = router;

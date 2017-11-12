var host = window.location.hostname;
var client= new Colyseus.Client("ws://"+host+":3000");
var room = client.join("tuareg");
var cartas_medio= [["#carta1","#carta2","#carta3"],["#carta4","#carta5","#carta6"],["#carta7","#carta8","#carta9"]]
$(document).ready(function(){
	// NOTA: se cambió el height de col-md-2 de 75px a 92px	
	for (var i=1;i<10;i++){
		if(i%2==0){		
			$("#carta"+i).addClass("tribuc").animateSprite({
				fps:0,
				loop:false,
				columns:9,
				animations:{
					sprite:[45]
				}
			});		
		}
		else{
			$("#carta"+i).addClass("mercac").animateSprite({
				fps:0,
				loop:false,
				columns:6,
				animations:{
					sprite:[19]
				}
			});		
		}
	}	
});


console.log("iniciado");
room.onJoin.add(function(){
console.log("Bienvenido a tuareg");

});
room.onData.add(function(mensaje){
	console.log(mensaje.message);
});	
room.onUpdate.add(function(state,patch){
	console.log(state);
	console.log(patch);
	

	
});
//room.on('update', onUpdate.bind(this))

room.listen("tableroPrincipal/:filas/:columnas", function(change){
    if(change.operation=="replace"){
		$(cartas_medio[change.path.filas-1][change.path.columnas-1]).animateSprite("frame",change.value._id-1);
	}
	console.log(change);
});

function onUpdate(state,patch){
	console.log(patch);
}
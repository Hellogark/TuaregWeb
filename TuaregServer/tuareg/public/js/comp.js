var host = window.location.hostname;
var client= new Colyseus.Client("ws://"+host+":3000");
var room = client.join("tuareg");
var cartas=[] ;

var t=0,q=0;
$(document).ready(function(){
	console.log(cartas);	
	$(".col-md-2").click(function(){
		clicked=this;
		cartas.forEach(function(el,ino){
			el.forEach(function(eli,ini){
				if(cartas[ino][ini].id==clicked.id){
					console.log(ino+" , "+ini);
					room.send({
						action:"select",
						fila:ino,
						columna:ini
					});
				}
			});
		});	
	});
	
	var arreglo= $(".container.tablero").children().children();
	for (var i=0;i<5;i++){
		cartas[i]=arreglo.splice(0,5);
	}
	console.log(cartas[0][0].id);
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
});

//room.on('update', onUpdate.bind(this))

room.listen("tableroPrincipal/:filas/:columnas", function(change){
    if(change.operation=="replace"){
		$(cartas[change.path.filas][change.path.columnas]).animateSprite("frame",change.value._id-1);
	}
	console.log(change);
});
room.listen("jugadores/:id/:merca",function(change){
	switch(change.path.merca)
	{
		case "datiles":
			if(change.path.id==client.id){
					$("#cDatilP1").text(change.value);
			}
			else{
				$("#cDatilP2").text(change.value);
			}
		break;
		case "oro":
			if(change.path.id==client.id){
				$("#cOroyMas1P1").text(change.value);
			}
			else{
				$("#cOroyMas1P2").text(change.value);
			}
		break;
		case "pimienta":
			if(change.path.id==client.id){
				$("#cPimP1").text(change.value);
			}
			else{
				$("#cPimP2").text(change.value);
			}
		break;
		case "sal":
			if(change.path.id==client.id){
				$("#cSalP1").text(change.value);
			}
			else{
				$("#cSalP2").text(change.value);
			}
		break;	
	}
});
room.listen("turno_act",function(change){
	console.log(change);
	console.log(client.id);
	$("#nombreJ1").text("Tu");
	$("#nombreJ2").text("Contrincante");	
	if(change.operation =="replace"){
		if(change.value === client.id){
			$("#turnoJugadorLabel").text("Es tu turno");
		}
		else{
			$("#turnoJugadorLabel").text("Es turno del contrincante");
		}
		
	}
});

function onUpdate(state,patch){
	console.log(patch);
}
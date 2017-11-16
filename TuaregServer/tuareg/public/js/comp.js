var host = window.location.hostname;
var protocolo = (location.protocol==="https"? "wss":"ws" );
var client= new Colyseus.Client("ws://"+host+":3000");
var room = client.join("tuareg");
var cartas=[] ;
var cartasM=[];
var cartasT=[];

var t=0,q=0;
///////////////////////////////////////////////////////////////////
$(document).ready(function(){
	console.log(cartas);

	for(var i=0; i<6; i++ ){
		for(var j=0;j<9;j++){
			cartasT.push(j*-138+"px "+i*-92+"px");
		}
	}
	for(var i=0; i<4; i++ ){
		for(var j=0;j<6;j++){
			cartasM.push(j*-138+"px "+i*-92+"px");
		}
	}

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
			$("#carta"+i).addClass("tribuc").css("background-position",cartasT[45]);
		}
		else{
			$("#carta"+i).addClass("mercac").css("background-position",cartasM[19]);
		}
	}
	});
////////////////////////////////////////////////////////

room.onJoin.add(function(){
	console.log("Bienvenido a tuareg");
});
function escoger(opcion,fila,columna){
	$("#chose").remove();
	room.send({action:"chose",otorga:opcion,fila:fila,columna:columna});
}
room.onData.add(function(mensaje){
	console.log(mensaje);
	if(mensaje.action=="chose"){
		$("#chose").remove();
		$("body").append(
			"<div id='chose' style='position:absolute'>"+
				"<button onclick='escoger(1,"+mensaje.fila+","+mensaje.columna+")'>datiles</button>"+
				"<button onclick='escoger(2,"+mensaje.fila+","+mensaje.columna+")'>sal</button>"+
				"<button onclick='escoger(3,"+mensaje.fila+","+mensaje.columna+")'>pimienta</button>"+
			"</div>"
			);
	}

	if(mensaje.action=="refresh"){
		if(cartas[mensaje.fila][mensaje.columna].className.includes("mercac")){
			$(cartas[mensaje.fila][mensaje.columna]).removeClass("mercac");
			$(cartas[mensaje.fila][mensaje.columna]).addClass("tribuc");
			$(cartas[mensaje.fila][mensaje.columna]).css("background-position",cartasT[45]);
		}
		else if(cartas[mensaje.fila][mensaje.columna].className.includes("tribucc")){
			$(cartas[mensaje.fila][mensaje.columna]).removeClass("tribuc");
			$(cartas[mensaje.fila][mensaje.columna]).addClass("mercac");
			$(cartas[mensaje.fila][mensaje.columna]).css("background-position",cartasM[19]);

		}
		$(cartas[mensaje.fila][mensaje.columna]).children().remove();
	}
});

room.onUpdate.add(function(state,patch){
	console.log(state);
});


room.listen("tableroCartas/:filas/:columnas", function(change){

    if(change.operation=="replace"){
		$(cartas[change.path.filas][change.path.columnas]).css("background-position",(change.value.tipo== undefined ?cartasM[change.value._id-1] :cartasT[change.value._id-1]));
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

room.listen("tableroAsaltante/:fila/:columna",function(change){
	if(change.value=="A"){
		$("#Asaltante").remove();
		$(cartas[change.path.fila][change.path.columna]).append("<img id='Asaltante' class='asaltante' src='/assets/img/Asaltante.png'></img>");
	}
	console.log(change);
});

room.listen("tableroTuareg/:fila/:columna",function(change){
		if(change.operation=="replace"){
			$(cartas[change.path.fila][change.path.columna]).append("<img id='Tuareg' class='asaltante' src='/assets/img/"+change.value+".png'></img>");
		}
	console.log(change);
});

function onUpdate(state,patch){
	console.log(patch);
}

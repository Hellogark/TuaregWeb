var host = window.location.hostname;
var protocolo = (location.protocol==="https"? "wss":"ws" );
var client= new Colyseus.Client("ws://"+host+":3000");
var room = client.join("tuareg");
var cartas=[] ;
var cartastj1=[];
var cartastj2=[];
var cartasM=[];
var cartasT=[];

var t=0,q=0;
///////////////////////////////////////////////////////////////////
$(document).ready(function(){
	console.log(cartas);
	console.log(cartastj1);
	console.log(cartastj2);
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
	var arreglotj1= $(".row.tableroJugador1").children();
	console.log(arreglotj1);
	for (var i=0;i<3;i++){
		cartastj1[i]=arreglotj1.splice(0,4);
	}
	var arreglotj2= $(".row.tableroJugador2").children();
	console.log(arreglotj2);
	for (var i=0;i<3;i++){
		cartastj2[i]=arreglotj2.splice(0,4);
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
function escogerm(opcion,fila,columna){
	$("#chose").remove();
	room.send({action:"chosem",otorga:opcion,fila:fila,columna:columna});
}

function escogert(opcion,fila,columna,data){
	$("#chose").remove();
  // falta verificar opcion para saber que hacer en caso de escojer rechazar y poner en mano
	if(opcion==1 || opcion==2 ){
		$("#tableroJugador3").remove();
		var tab = "<div id='tableroJugador3' class='row tableroJugador1' style='position:absolute;top:40em;left:10em;z-index:100'>";
		tab+= $(".row.tableroJugador1").html();
		tab+="</div>"
		$("body").append(tab);
		$('body').on('click', '#tableroJugador3 > .tj1_1', function(){
			console.log("clickclickclick");
			clicked=this;
			cartastj1.forEach(function(el,ino){
				el.forEach(function(eli,ini){
					if(cartastj1[ino][ini].id==clicked.id){
						console.log(ino+" , "+ini+ " TJ");
						$("body").off("click");
						room.send({action:"choset",tarifa:opcion,cartafila:ino,cartacolumna:ini,fila:fila,columna:columna,data:data});
						$("#tableroJugador3").remove();

					}
				});
			});
		});
	}

	else {
		$("body").off("click");
		room.send({action:"choset",tarifa:opcion,fila:fila,columna:columna,data:data});
	}

}
room.onData.add(function(mensaje){
	console.log(mensaje);
	if(mensaje.action=="refreshtjm"){
		if (client.id == mensaje.clientid){
			$("#imgCartaManoJ1").children().remove();
			$("#imgCartaManoJ1").addClass("tribuc").css("background-position",cartasT[mensaje.cartaid-1]);
		}
		/*else{
			$("#imgCartaManoJ2").children().remove();
			$("#imgCartaManoJ2").addClass("tribuc").css("background-position",cartasT[mensaje.cartaid-1]);
		}*/
	}
	if(mensaje.action=="refreshtj"){
		if (client.id == mensaje.clientid){
			$(cartastj1[mensaje.fila][mensaje.columna]).children().remove();
			$(cartastj1[mensaje.fila][mensaje.columna]).addClass("tribuc").css("background-position",cartasT[mensaje.cartaid-1]);
		}
		else{
			$(cartastj2[mensaje.fila][mensaje.columna]).children().remove();
			$(cartastj2[mensaje.fila][mensaje.columna]).addClass("tribuc").css("background-position",cartasT[mensaje.cartaid-1]);
		}
	}
	if(mensaje.action=="choset"){
		$("#chose").remove();
		var chose=
		 	"<div id='chose' style='position:absolute;z-index:100'>"+
			"<input id='t1' type='button' value='Tarifa 1: "+mensaje.costo[0]+" xDatiles "+mensaje.costo[1]+" xSal "+mensaje.costo[2]+" xOro "+mensaje.costo[3]+" xPimienta"+"'>";
		if(mensaje.costo[4]>0){
			chose+= "<br><input type='button' id='t2' value='tarifa 2 :1 X Oro' >";
		}
		if(mensaje.descuento){
			chose+=	"<br><input id='t3' type='button' value='Aplicar descuento'>";
		}
		if(mensaje.tarjetaMano){
			chose+=	"<br><input id='t4' type='button' value='Poner en mano'>";
		}
		chose+="<br><input id='t5' type='button' value='Rechazar'>";

		$("body").append(chose);
		$('body').on('click', '#t1', function(){
			console.log("click");
			$("body").off("click","#t1");
			escogert(1,mensaje.fila,mensaje.columna,mensaje.data);

		});
		$('body').on('click', '#t2', function(){
			console.log("click");
			$("body").off("click","#t2");
			escogert(2,mensaje.fila,mensaje.columna,mensaje.data);

		});
		$('body').on('click', '#t3', function(){
			console.log("click");
			$("body").off("click","#t3");
			escogert(3,mensaje.fila,mensaje.columna,mensaje.data);

		});

		$('body').on('click', '#t4', function(){
			console.log("click");
			$("body").off("click","#t4");
			escogert(4,mensaje.fila,mensaje.columna,mensaje.data);

		});

		$('body').on('click', '#t5', function(){
			console.log("click");
			$("body").off("click","#t5");
			escogert(5,mensaje.fila,mensaje.columna,mensaje.data);

		});


	}
	if(mensaje.action=="chosem"){
		$("#chose").remove();
		$("body").append(
			"<div id='chose' style='position:absolute;z-index:100'>"+
				"<button onclick='escogerm(1,"+mensaje.fila+","+mensaje.columna+")'>datiles</button>"+
				"<button onclick='escogerm(2,"+mensaje.fila+","+mensaje.columna+")'>sal</button>"+
				"<button onclick='escogerm(3,"+mensaje.fila+","+mensaje.columna+")'>pimienta</button>"+
			"</div>"
			);
	}
	if(mensaje.action=="refresh" && mensaje.columna!=null && mensaje.fila!=null  ){
		if(cartas[mensaje.fila][mensaje.columna].className.includes("mercac") && !mensaje.reubica){
			$(cartas[mensaje.fila][mensaje.columna]).removeClass("mercac");
			$(cartas[mensaje.fila][mensaje.columna]).addClass("tribuc");
			$(cartas[mensaje.fila][mensaje.columna]).css("background-position",cartasT[45]);
		}
		else if(cartas[mensaje.fila][mensaje.columna].className.includes("tribuc") && !mensaje.reubica){
			$(cartas[mensaje.fila][mensaje.columna]).removeClass("tribuc");
			$(cartas[mensaje.fila][mensaje.columna]).addClass("mercac");
			$(cartas[mensaje.fila][mensaje.columna]).css("background-position",cartasM[19]);

		}
		$(cartas[mensaje.fila][mensaje.columna]).children("#Tuareg").remove();
	}
	if(mensaje.action=="showC"){
		//console.log(mensaje);
		//Mostrar la carta con z-index menor a 100
		var chose="<div id='showC' style='position:absolute;z-index:50;width:138px;height:92px;top:20em;left:20em;transform:scale(2);border-style:double'></div>";
		$("body").append(chose);
		$("#showC").addClass("mercac").css("background-position",cartasM[mensaje.carta._id-1]);
		$('body').on('click', '#showC', function(){
			room.send({action:"showC",data:mensaje.carta});
			 $("#showC").remove();
		});

	}
	if(mensaje.action=="showTr"){
		var chose="<div id='showTr' style='position:absolute;z-index:50;width:138px;height:92px;top:20em;left:20em;transform:scale(2);border-style:double'></div>";
		$("body").append(chose);
		$("#showTr").addClass("tribuc").css("background-position",cartasT[mensaje.carta._id-1]);
		$('body').on('click', '#showTr', function(){
			room.send({action:"showTr",data:mensaje.carta});
			 $("#showTr").remove();
		});
	}
	if(mensaje.action=="orfebre"){
		var chose=
				'<div class="row orfebre" id="muestraOfebre">'+
            '<div class="orfebre">'+
                '<div id="s1pv"><img src="assets/img/orfebre1.png" class="orf1"></div>'+
                '<div id="s2pv"><img src="assets/img/orfebre2.png" id="orf2"></div><img src="assets/img/Orfebre.jpg" class="orfebreFicha">'+
                '<div id="d2pv"><img src="assets/img/2pv.png" id="twopv" class="Dospv"></div>'+
                '<div id="d3Pv"><img src="assets/img/3pv.png" id="threePv" class="tresPv"></div>'+
                '<div id="d4Pv"><img src="assets/img/4pv.png" id="fourpv" class="cuatropv"></div>'+
                '<div id="d1Pv"><img src="assets/img/1pv.png" id="onepv" class="onePv"></div>'+
            '</div>'+
						'<spanf id="mensaje" style="left:50%;position: absolute;left: 50%;font-weight:bold;color: red;transform: translateX(-50%)">Selecciona oferta</spanf>'
        '</div>'
		$("body").append(chose);
		$("body").on("click",".orfebre > div",function(){
			console.log("clicked:"+'\n');
			console.log(this);
		})
	}
	if(mensaje.action=="comerciante"){
		var chose=
				'<div class="row comercanteRow">'+
            '<div id="tresMerca" class="meerca"><img src="assets/img/orfebregde.png" class="merch3">'+
                '<div class="row fichasMerca" id="cambiaMercancia">'+
                    '<div id="tMercaUno" class="mercasTres"><img src="assets/img/sal.jpg" class="mercas"></div>'+
                    '<div id="tMercaDos" class="mercas"><img src="assets/img/sal.jpg" id="tmercau" class="mercas"></div>'+
                    '<div id="tMercaTres" class="mercasTres"><img src="assets/img/sal.jpg" class="mercas"></div>'+
                '</div>'+
                '<div class="row mercas2" id="mercanciasDos">'+
                    '<div id="dMercasDos" class="mercasDos"><img src="assets/img/sal.jpg" class="mercasD"></div>'+
                    '<div id="dMercasUno" class="mercasUno"><img src="assets/img/sal.jpg" class="mercasD"></div>'+
                '</div>'+
            '</div>'+
            '<div class="colCom"><img src="assets/img/mercantes.jpg" id="fichaCom" class="fichaComercian"></div>'+
            '<div id="dosMerca" class="dosmerca"><img src="assets/img/orfebregde.png" class="merch2"></div>'+
            '<div id="acMerca3" class="accMerca3"><img src="assets/img/accMercante.png"></div>'+
            '<div id="acMerca2" class="accMerca2"><img src="assets/img/accMercante.png"></div>'+
            '<div id="cambMerca" class="cambiaMerca"><img src="assets/img/merca2.png" class="camMerca"></div>'+
        '</div>'
		$("body").append(chose);
		$("body").on("click",".comercanteRow > div",function(){
			console.log("clicked:"+'\n');
			console.log(this);
		})
	}
});

room.onUpdate.add(function(state,patch){
	console.log(state);
});
/*
room.listen("tablero_jugador1/:fila/:columna",function(change){

	$(cartastj1[change.path.fila][change.path.columna]).children().remove();
	$(cartastj1[change.path.fila][change.path.columna]).addClass("tribuc").css("background-position",cartasT[change.value._id-1]);

});
room.listen("tablero_jugador2/:fila/:columna",function(change){
	$(cartastj2[change.path.fila][change.path.columna]).children().remove();
	$(cartastj2[change.path.fila][change.path.columna]).addClass("tribuc").css("background-position",cartasT[change.value._id-1]);
});
*/
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
		case "puntosv":
			if(change.path.id==client.id){
				$("#puntosP1").text(change.value);
			}
			else{
				$("#puntosP2").text(change.value);
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
		if(change.operation=="replace" && change.value!=0){
			$(cartas[change.path.fila][change.path.columna]).append("<img id='Tuareg' class='asaltante' src='/assets/img/"+change.value+".png'></img>");
		}
	console.log(change);
});

function onUpdate(state,patch){
	console.log(patch);
}

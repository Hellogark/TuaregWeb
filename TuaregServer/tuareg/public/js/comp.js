var host = window.location.hostname;
var protocolo = (location.protocol==="https"? "wss":"ws" );
var client= new Colyseus.Client("ws://"+host+":3000");
var room = client.join("tuareg");
var cartas=[] ;
var cartastj1=[];
var cartastj2=[];
var cartasM=[];
var cartasT=[];
var opciones=[0,0];
var merchant=0;
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
								'<div id="cobra" style="top:20px;left:10px;position:absolute;border-style:double;width:50px;height:50px;text-align:center;padding-top:15px">Cobrar</div>'+
								'<div id="terminar" style="top:170px;left:10px;position:absolute;border-style:double;width:50px;height:50px;text-align:center;padding-top:15px">Terminar</div>'+
            '</div>'+
						'<spanf id="mensajeof" style="left:50%;position: absolute;left: 50%;font-weight:bold;color: red;transform: translateX(-50%)">Selecciona oferta</spanf>'+
        '</div>'
		$("body").append(chose);
		$("body").on("click",".orfebre > div",function(){
			console.log("clicked:"+'\n');
			console.log(this.id);
			switch(this.id){
				case "s1pv":
					if(opciones[0]>=3){
						opciones[0]=0;
					}
					opciones[0]+=1;
					opciones[1]=1;
					$("#s2pv").children(".qpv").remove();
					$(this).append("<img class='qpv' style='position:absolute;z-index:10;left:0' src='assets/img/2Merca"+opciones[0] +".gif'></img>");
					$("#onepv").css("visibility","inherit");
					$("#twopv").css("visibility","hidden");
					$("#threePv").css("visibility","hidden");
					$("#fourpv").css("visibility","hidden");
				break;
				case "s2pv":
					if(opciones[0]>=3){
						opciones[0]=0;
					}
					opciones[0]+=1;
					opciones[1]=3;
					$("#s1pv").children(".qpv").remove();
					$(this).append("<img class='qpv' style='position:absolute;z-index:10;left:0' src='assets/img/4Merca"+opciones[0] +".gif'></img>");
					$("#onepv").css("visibility","hidden");
					$("#twopv").css("visibility","hidden");
					$("#threePv").css("visibility","inherit");
					$("#fourpv").css("visibility","hidden");
				break;
				case "d1Pv":
					opciones[1]=1;
					if(opciones[0]==0){
						opciones[0]=1;
					}
					$("#s2pv").children(".qpv").remove();
					$("#s1pv").append("<img class='qpv' style='position:absolute;z-index:10;left:0' src='assets/img/2Merca"+opciones[0] +".gif'></img>");
					$("#onepv").css("visibility","inherit");
					$("#twopv").css("visibility","hidden");
					$("#threePv").css("visibility","hidden");
					$("#fourpv").css("visibility","hidden");
				break;
				case "d3Pv":
					opciones[1]=3;
					if(opciones[0]==0){
						opciones[0]=1;
					}
					$("#s1pv").children(".qpv").remove();
					$("#s2pv").append("<img class='qpv' style='position:absolute;z-index:10;left:0' src='assets/img/4Merca"+opciones[0] +".gif'></img>");
					$("#onepv").css("visibility","hidden");
					$("#twopv").css("visibility","hidden");
					$("#threePv").css("visibility","inherit");
					$("#fourpv").css("visibility","hidden");
				break;
				case "d2pv":
					opciones[1]=2;
					$("#onepv").css("visibility","hidden");
					$("#twopv").css("visibility","inherit");
					$("#threePv").css("visibility","hidden");
					$("#fourpv").css("visibility","hidden");
				break;
				case "d4Pv":
					opciones[1]=4;
					$("#onepv").css("visibility","hidden");
					$("#twopv").css("visibility","hidden");
					$("#threePv").css("visibility","hidden");
					$("#fourpv").css("visibility","inherit");
				break;
				case "cobra":
					console.log(opciones);
					switch(opciones[1]){
						case 1:
							switch(opciones[0]){
								case 1:
									if(mensaje.actual.datiles >= 2){
										//enviar al servidor respuesta
										console.log("si se puede");
										room.send({action:"ofebre",negocio:opciones});
									}
									else{
										$("#mensajeof").text("No tienes suficientes dátiles");
									}
								break;
								case 2:
									if(mensaje.actual.pimienta >= 2){
										//enviar al servidor respuesta
										console.log("si se puede");
										room.send({action:"ofebre",negocio:opciones});
									}
									else{
										$("#mensajeof").text("No tienes suficiente pimienta");
									}
								break;
								case 3:
									if(mensaje.actual.sal >= 2){
										//enviar al servidor respuesta
										console.log("si se puede");
										room.send({action:"ofebre",negocio:opciones});
									}
									else{
										$("#mensajeof").text("No tienes suficiente sal");
									}
								break;

							}
							$("body").children("#muestraOfebre").remove();
						break;

						case 2:
							if(mensaje.actual.oro>=1){
								//
								console.log("si se puede");
								room.send({action:"ofebre",negocio:opciones});
								$("body").children("#muestraOfebre").remove();
							}
							else{
								$("#mensajeof").text("No tienes suficiente oro");
							}
						break;

						case 3:
							switch(opciones[0]){
								case 1:
									if(mensaje.actual.datiles >= 4){
										//enviar al servidor respuesta
										console.log("si se puede");
										room.send({action:"ofebre",negocio:opciones});
									}
									else{
										$("#mensajeof").text("No tienes suficientes dátiles");
									}
								break;
								case 2:
									if(mensaje.actual.pimienta >= 4){
										//enviar al servidor respuesta
										console.log("si se puede");
										room.send({action:"ofebre",negocio:opciones});
									}
									else{
										$("#mensajeof").text("No tienes suficiente pimienta");
									}
								break;
								case 3:
									if(mensaje.actual.sal >= 4){
										//enviar al servidor respuesta
										console.log("si se puede");
										room.send({action:"ofebre",negocio:opciones});
									}
									else{
										$("#mensajeof").text("No tienes suficiente sal");
									}
								break;

							}
							$("body").children("#muestraOfebre").remove();
						break;

						case 4:
							if(mensaje.actual.oro>=2){
								//
								console.log("si se puede");
								room.send({action:"ofebre",negocio:opciones});
								$("body").children("#muestraOfebre").remove();
							}
							else{
								$("#mensajeof").text("No tienes suficiente oro");
							}
							$("body").children("#muestraOfebre").remove();
						break;
					}
				break;
				case "terminar":
					console.log(opciones);
					$("body").children("#muestraOfebre").remove();
				break;
			}
		})
	}
	if(mensaje.action=="comerciante"){
		var chose=
				'<div class="row comercanteRow">'+
            '<div id="tresMerca" class="meerca"><img src="assets/img/orfebregde.png" class="merch3"></div>'+
            '<div class="colCom"><img src="assets/img/mercantes.jpg" id="fichaCom" class="fichaComercian"></div>'+
            '<div id="dosMerca" class="dosmerca"><img src="assets/img/orfebregde.png" class="merch2"></div>'+
            '<div id="acMerca3" class="accMerca3"><img id="selMerca3" style="visibility:hidden" src="assets/img/accMercante.png"></div>'+
            '<div id="acMerca2" class="accMerca2"><img id="selMerca2" style="visibility:hidden" src="assets/img/accMercante.png"></div>'+
            '<div id="cambMerca" class="cambiaMerca"><img src="assets/img/merca2.png" class="camMerca"></div>'+
						'<div id="cobra" style="top:110px;left:10px;position:absolute;border-style:double;width:50px;height:25px;text-align:center">Cobrar</div>'+
						'<div id="terminar" style="top:140px;left:10px;position:absolute;border-style:double;width:65px;height:25px;text-align:center">Terminar</div>'+

			 '<spanf id="mensajeof" style="left:50%;position: absolute;left: 50%;font-weight:bold;font-size:20px;color: red;transform: translateX(-50%)">Selecciona oferta</spanf>'+
       '</div>'
		$("body").append(chose);
		$("body").on("click",".comercanteRow > div",function(){
			console.log("clicked:"+'\n');
			console.log(this);
			switch(this.id){
				case "tresMerca":
					if(opciones[0]>=3){
						opciones[0]=0;
					}
					opciones[0]+=1;
					opciones[1]=1;
					$("#dosMerca").children(".qpv").remove();
					$("#cambMerca").children(".qpv").remove();
					$(this).append("<img class='qpv' style='position:absolute;z-index:10;left:0' src='assets/img/3Merca"+opciones[0] +".gif'></img>");
					$(".merch3").css("visibility","visible");
					$(".selMerca3").css("visibility","visible");
					$(".merch2").css("visibility","hidden");
					$(".selMerca2").css("visibility","hidden");
				break;
				case "dosMerca":
					if(opciones[0]>=3){
						opciones[0]=0;
					}
					opciones[0]+=1;
					opciones[1]=3;
					$("#tresMerca").children(".qpv").remove();
					$(this).append("<img class='qpv' style='position:absolute;z-index:10;left:0' src='assets/img/2Merca"+opciones[0] +".gif'></img>");
					$("#cambMerca").append("<img class='qpv' style='position:absolute;z-index:10;left:0' src='assets/img/1Merca"+merchant +".jpg'></img>");
					$(".merch2").css("visibility","visible");
					$(".selMerca2").css("visibility","visible");
					$(".merch3").css("visibility","hidden");
					$(".selMerca3").css("visibility","hidden");
				break;
				case "acMerca3":
					opciones[1]=1;
					if(opciones[0]==0){
						opciones[0]=1;
					}
					if(merchant==0){
						merchant=1;
					}
					$("#dosMerca").children(".qpv").remove();
					$("#cambMerca").children(".qpv").remove();
					$("#tresMerca").append("<img class='qpv' style='position:absolute;z-index:10;left:0' src='assets/img/3Merca"+opciones[0] +".gif'></img>");
					$(".merch3").css("visibility","inherit");
					$(".selMerca3").css("visibility","inherit");
					$(".merch2").css("visibility","hidden");
					$(".selMerca2").css("visibility","hidden");
				break;
				case "acMerca2":
					opciones[1]=3;
					if(opciones[0]==0){
						opciones[0]=1;
					}
					if(merchant==0){
						merchant=1;
					}
					$("#tresMerca").children(".qpv").remove();
					$("#dosMerca").append("<img class='qpv' style='position:absolute;z-index:10;left:0' src='assets/img/2Merca"+opciones[0] +".gif'></img>");
					$("#cambMerca").append("<img class='qpv' style='position:absolute;z-index:10;left:0' src='assets/img/1Merca"+merchant +".jpg'></img>");
					$(".merch3").css("visibility","hidden");
					$(".selMerca3").css("visibility","hidden");
					$(".merch2").css("visibility","visible");
					$(".selMerca2").css("visibility","visible");
				break;
				case "cambMerca":
					opciones[1]=3;
					if(merchant>=3){
						merchant=0;
					}
					merchant+=1;
					$("#tresMerca").children(".qpv").remove();
					$(this).append("<img class='qpv' style='position:absolute;z-index:10;left:0' src='assets/img/1Merca"+merchant +".jpg'></img>");
					$("#dosMerca").append("<img class='qpv' style='position:absolute;z-index:10;left:0' src='assets/img/2Merca"+opciones[0] +".gif'></img>");
					$(".merch2").css("visibility","visible");
					$(".selMerca2").css("visibility","visible");
					$(".merch3").css("visibility","hidden");
					$(".selMerca3").css("visibility","hidden");
				break;
				case "cobra":
					console.log(opciones);
					switch(opciones[1]){
						case 1:
							switch(opciones[0]){
								case 1:
									if(mensaje.actual.datiles >= 3){
										//enviar al servidor respuesta
										console.log("si se puede");
										room.send({action:"comerciante",negocio:opciones});
										$("body").children(".comercanteRow").remove();
									}
									else{
										$("#mensajeof").text("No tienes suficientes dátiles");
									}
								break;
								case 2:
									if(mensaje.actual.pimienta >= 3){
										//enviar al servidor respuesta
										console.log("si se puede");
										room.send({action:"comerciante",negocio:opciones});
										$("body").children(".comercanteRow").remove();
									}
									else{
										$("#mensajeof").text("No tienes suficiente pimienta");
									}
								break;
								case 3:
									if(mensaje.actual.sal >= 3){
										//enviar al servidor respuesta
										console.log("si se puede");
										room.send({action:"comerciante",negocio:opciones});
									  $("body").children(".comercanteRow").remove();
									}
									else{
										$("#mensajeof").text("No tienes suficiente sal");
									}
								break;

							}

						break;

						case 3:
							switch(opciones[0]){
								case 1:
									if(mensaje.actual.datiles >= 2){
										//enviar al servidor respuesta
										console.log("si se puede");
										room.send({action:"comerciante",negocio:opciones,merchant:merchant});
										$("body").children(".comercanteRow").remove();
									}
									else{
										$("#mensajeof").text("No tienes suficientes dátiles");
									}
								break;
								case 2:
									if(mensaje.actual.pimienta >= 2){
										//enviar al servidor respuesta
										console.log("si se puede");
										room.send({action:"comerciante",negocio:opciones,merchant:merchant});
										$("body").children(".comercanteRow").remove();
									}
									else{
										$("#mensajeof").text("No tienes suficiente pimienta");
									}
								break;
								case 3:
									if(mensaje.actual.sal >= 2){
										//enviar al servidor respuesta
										console.log("si se puede");
										room.send({action:"comerciante",negocio:opciones,merchant:merchant});
										$("body").children(".comercanteRow").remove();
									}
									else{
										$("#mensajeof").text("No tienes suficiente sal");
									}
								break;

							}

						break;
					}
				break;
				case "terminar":
					console.log(opciones);
					$("body").children(".comercanteRow").remove();
				break;
			}
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

var host = window.location.hostname;
var protocolo = (location.protocol==="https"? "wss":"ws" );
var client= new Colyseus.Client("ws://"+host+":3000");
var room = client.join("tuareg");
var cartas=[] ;
var cartastj1=[];
var cartastj2=[];
var cartasM=[];
var cartasT=[];
var cartasTT=[];
var opciones=[0,0];
var merchant=0;
var cache_cartas=[];
var flagMarcadores=false;
var flagcobraborde=false;
var flagCobrando=false;
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

	for(var i=0; i<6; i++ ){
		for(var j=0;j<9;j++){
			cartasTT.push(j*-85+"px "+i*-55+"px");
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

	$("#terminarTurno").click(function(){
		$("#terminarTurno").css({"color": "", "border-color": "", "border-width": "", "border-radius": "" });
		if((!flagcobraborde || !flagMarcadores) && flagCobrando){
			var html = '<div id="dialog-confirm" title="¿Estas seguro?">'+
	  								'<p><span style="float:left; margin:12px 12px 20px 0;" class="ui-icon ui-icon-alert"></span>Aun quedan cosas que hacer en este turno</p>'+
									'</div>'
			$("body").append(html);
			$( "#dialog-confirm" ).dialog({
				resizable: false,
				height: "auto",
				width: 400,
				modal: true,
				buttons: {
					"Si": function() {
						room.send({action:"turnosig"});
						$("#dialog-confirm").remove();
						$( this ).dialog( "close" );
					},
					cancel: function() {
						$("#dialog-confirm").remove();
						$( this ).dialog( "close" );
					}
				}
			});
		}
		else{
			room.send({action:"turnosig"});
		}



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
room.onUpdate.add(function(change){
	console.log(change);
});
function escogerm(opcion,fila,columna,data){
	$("#chose").remove();
	$(".wrapper").css("pointer-events","auto");
	room.send({action:"chosem",otorga:opcion,fila:fila,columna:columna,data:data});
}

function escogert(opcion,fila,columna,data,tablero){ // para posicionar en tablero
	$("#chose").remove();
  // falta verificar opcion para saber que hacer en caso de escojer rechazar y poner en mano
	if(opcion==1 || opcion==2 ){
		$("#tableroJugador3").remove();
		var tab = "<div id='tableroJugador3' class='row tableroJugador1' style='position:fixed;z-index:100;top:50%;left:50%;transform:scale(1.5) translate(-50%,-50%)'>"+
							"<spanf style ='color:red;position:absolute;left:50%;translateX(-50%)'>¿En que fila deseas ubicar la carta?</spanf><br>"
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
						if(tablero[ino].length>=4){
							console.log("esta llena la fila , escoge otra")
						}
						else{
							$("body").off("click");
							$("button").prop("disabled",false);
							$(".wrapper").css("pointer-events","auto");
							room.send({action:"choset",tarifa:opcion,cartafila:ino,cartacolumna:ini,fila:fila,columna:columna,data:data});
							$("#tableroJugador3").remove();
						}
					}
				});
			});
		});
	}

	else {
		$("body").off("click");
		$("#showTr").off("click");
		room.send({action:"choset",tarifa:opcion,fila:fila,columna:columna,data:data});
	}

}
room.onData.add(function(mensaje){
	console.log(mensaje);
	if(mensaje.action=="refreshtjm"){
		if (client.id == mensaje.clientid && mensaje.cartaid !=46){
			$("#imgCartaManoJ1").children().remove();
			$("#imgCartaManoJ1").addClass("tribuc").css("background-position",cartasT[mensaje.cartaid-1]);
		}
		else{
			$("#imgCartaManoJ1").children().remove();
			$("#imgCartaManoJ1").append("<img src='assets/img/cartaMano.png'>");
			$("#imgCartaManoJ1").removeClass("tribuc").css("background-position","");
		}

		/*else{
			$("#imgCartaManoJ2").children().remove();
			$("#imgCartaManoJ2").addClass("tribuc").css("background-position",cartasT[mensaje.cartaid-1]);
		}*/
	}
	if(mensaje.action=="refreshtj"){
		if (client.id == mensaje.clientid){
			$(cartastj1[mensaje.fila][mensaje.columna]).children().remove();
			$(cartastj1[mensaje.fila][mensaje.columna]).addClass("tribucT").css("background-position",cartasTT[mensaje.cartaid-1]);
		}
		else{
			$(cartastj2[mensaje.fila][mensaje.columna]).children().remove();
			$(cartastj2[mensaje.fila][mensaje.columna]).addClass("tribucT").css("background-position",cartasTT[mensaje.cartaid-1]);
		}
	}
	if(mensaje.action=="choset"){
		$(".wrapper").css("pointer-events","none");
		$("button").prop("disabled",true);
		if(mensaje.isfromtablero){
			$("#showTr").remove();
			var chose="<div id='showTr' style='position:fixed;z-index:50;width:138px;height:92px;top:50%;left:50%;transform:scale(2) translate(-50%,-50%);border-style:double'></div>";
			$("body").append(chose);
			$("#showTr").addClass("tribuc").css("background-position",cartasT[mensaje.data._id-1]);
		}


		////////////////////NOTA: Se usan inputs y eventos on click por la necesidad de pasar objetos como argumentos/////////////////
		var chose="<div id='chose' style='position:absolute;z-index:100;left:50%;text-align:center;transform:translateX(-50%);top:7em'>";
		if(mensaje.actual.datiles>=mensaje.costo[0] && mensaje.actual.sal>=mensaje.costo[1] && mensaje.actual.oro>= mensaje.costo[2]&& mensaje.actual.pimienta>=mensaje.costo[3] && mensaje.espacio ){
			chose+="<input id='t1' type='button' value='Tarifa 1: "+mensaje.costo[0]+" xDatiles "+mensaje.costo[1]+" xSal "+mensaje.costo[2]+" xOro "+mensaje.costo[3]+" xPimienta"+"'>";
		}
<<<<<<< HEAD
		if(mensaje.costo[4]>0 && mensaje.actual.oro >= mensaje.costo[4]  && mensaje.espacio){
=======
		if(mensaje.costo[4]>0 && mensaje.actual.oro >= mensaje.costo[4] && mensaje.espacio){
>>>>>>> c2906be7042099ecb20ebdad7b8f340b6c1a0675
			chose+= "<br><input type='button' id='t2' value='tarifa 2 :1 X Oro' >";
		}
		if(mensaje.descuento){
			chose+=	"<br><input id='t3' type='button' value='Aplicar descuento'>";
		}
		if(mensaje.tarjetaMano){
			chose+=	"<br><input id='t4' type='button' value='Poner en mano'>";
		}
			chose+="<br><input id='t5' type='button' value='Rechazar'>";
			chose+= "<br><spanf id='comunica' style='color:red;'></spanf>";
			chose+= "</div>";
		$("#showTr").append(chose);
		/////////////////////////Eventos para los input/////////////////////////////////////////////////////////////////////////////
		$('#showTr').on('click', '#t1', function(){
			console.log("click");
			$('#showTr').off("click","#t1");
			$("#showTr").remove();
			escogert(1,mensaje.fila,mensaje.columna,mensaje.data,mensaje.actual.tablero_jugador);
		});
		$('#showTr').on('click', '#t2', function(){
			console.log("click");
			$('#showTr').off("click","#t2");
			$("#showTr").remove();
 			escogert(2,mensaje.fila,mensaje.columna,mensaje.data,mensaje.actual.tablero_jugador);


		});
		$('#showTr').on('click', '#t3', function(){
			console.log("click");
			$('#showTr').off("click","#t3");
		  $("#showTr").remove();
			 //Aplicar  descuento en una mercancia

		});

		$('#showTr').on('click', '#t4', function(){
			console.log("click");
			$('#showTr').off("click","#t4");
			$("button").prop("disabled",false);
			$(".wrapper").css("pointer-events","auto");
		  $("#showTr").remove();
			escogert(4,mensaje.fila,mensaje.columna,mensaje.data);


		});

		$('#showTr').on('click', '#t5', function(){
			console.log("click");
			$('#showTr').off("click","#t5");
			$("button").prop("disabled",false);
			$(".wrapper").css("pointer-events","auto");
			$("#showTr").remove();
			escogert(5,mensaje.fila,mensaje.columna,mensaje.data);


		});
   //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	}
	if(mensaje.action=="chosem"){
		$("#chose").remove();
		$("button").prop("disabled",true);
		$(".wrapper").css("pointer-events","none");
		$("body").append(
			"<div id='chose' style='position:fixed;z-index:100;top:50%;left:50%;transform:scale(2) translate(-50%,-50%)'>"+
				"<input type='button' id='td' value='Datil' ><br>"+
				"<input type='button' id='ts' value='Sal' ><br>"+
				"<input type='button' id='tp' value='pimienta'><br>"+
			"</div>"
			);
		$('#chose').on('click', '#td', function(){
			console.log("click escogerm");
			$('#chose').off("click","#td");
			$("button").prop("disabled",false);
			$("#chose").remove();
			escogerm(1,mensaje.fila,mensaje.columna,mensaje.data);
		});
		$('#chose').on('click', '#ts', function(){
			console.log("click escogerm");
			$('#showTr').off("click","#ts");
			$("button").prop("disabled",false);
			$("#showTr").remove();
			escogerm(2,mensaje.fila,mensaje.columna,mensaje.data);
		});
		$('#chose').on('click', '#tp', function(){
			console.log("click escogerm");
			$("button").prop("disabled",false);
			$('#chose').off("click","#tp");
			$("#chose").remove();
			escogerm(3,mensaje.fila,mensaje.columna,mensaje.data);
		});
	}
	if(mensaje.action=="refresh" && mensaje.columna!=null && mensaje.fila!=null  ){
		if(cartas[mensaje.fila][mensaje.columna].className.includes("mercac") && !mensaje.reubica){
			$(cartas[mensaje.fila][mensaje.columna]).removeClass("mercac");
			$(cartas[mensaje.fila][mensaje.columna]).addClass("tribuc");
			$(cartas[mensaje.fila][mensaje.columna]).css("background-position",cartasT[45]);
			cache_cartas.push({fila:mensaje.fila,columna:mensaje.columna,id:mensaje.id});
		}
		else if(cartas[mensaje.fila][mensaje.columna].className.includes("tribuc") && !mensaje.reubica){
			$(cartas[mensaje.fila][mensaje.columna]).removeClass("tribuc");
			$(cartas[mensaje.fila][mensaje.columna]).addClass("mercac");
			$(cartas[mensaje.fila][mensaje.columna]).css("background-position",cartasM[19]);
			cache_cartas.push({fila:mensaje.fila,columna:mensaje.columna,id:mensaje.id});
		}
	}
	if(mensaje.action=="refreshall"){
		console.log(cache_cartas);
		cache_cartas.forEach(function(el,indx,arr){
			if(cartas[el.fila][el.columna].className.includes("mercac")){
				$(cartas[el.fila][el.columna]).css("background-position",cartasM[el.id-1]);

			}
			if(cartas[el.fila][el.columna].className.includes("tribuc")){
				$(cartas[el.fila][el.columna]).css("background-position",cartasT[el.id-1]);
			}

		});
		cache_cartas=[];
	}
	if(mensaje.action=="showC"){
		//console.log(mensaje);
		//Mostrar la carta con z-index menor a 100
		$(".wrapper").css("pointer-events","none");
		var chose="<div id='showC' style='position:fixed;z-index:50;width:138px;height:92px;top:50%;left:50%;transform:scale(2) translate(-50%,-50%);border-style:double'></div>";
		$("body").append(chose);
		$("#showC").addClass("mercac").css("background-position",cartasM[mensaje.carta._id-1]);
		$('body').on('click', '#showC', function(){
			$("body").off("click");
			room.send({action:"showC",data:mensaje.carta});
			 $(".wrapper").css("pointer-events","auto");
			 $("#showC").remove();
		});

	}
	if(mensaje.action=="showTr"){
		$(".wrapper").css("pointer-events","none");
		$("button").prop("disabled",true);
		var chose="<div id='showTr' style='position:fixed;z-index:50;width:138px;height:92px;top:50%;left:50%;transform:scale(2) translate(-50%,-50%);border-style:double'></div>";
		$("body").append(chose);
		$("#showTr").addClass("tribuc").css("background-position",cartasT[mensaje.carta._id-1]);
		$('body').on('click', '#showTr', function(){
			room.send({action:"showTr",data:mensaje.carta});

		});
	}
	if(mensaje.action=="orfebre"){
		$(".wrapper").css("pointer-events","none");
		$("button").prop("disabled",true);
		var chose=
				'<div class="row orfebre" id="muestraOfebre" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%)">'+
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
		$("#muestraOfebre").on("click",".orfebre > div",function(){
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
										$("#muestraOfebre").off("click");
										$(".wrapper").css("pointer-events","auto");
										$("button").prop("disabled",false);
										$("body").children("#muestraOfebre").remove();
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
										$("#muestraOfebre").off("click");
										$(".wrapper").css("pointer-events","auto");
										$("button").prop("disabled",false);
										$("body").children("#muestraOfebre").remove();
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
										$("#muestraOfebre").off("click");
										$(".wrapper").css("pointer-events","auto");
										$("button").prop("disabled",false);
										$("body").children("#muestraOfebre").remove();
										console.log("si se puede");
										room.send({action:"ofebre",negocio:opciones});

									}
									else{
										$("#mensajeof").text("No tienes suficiente sal");
									}
								break;

							}

						break;

						case 2:
							if(mensaje.actual.oro>=1){
								//
								$("#muestraOfebre").off("click");
								$(".wrapper").css("pointer-events","auto");
								$("body").children("#muestraOfebre").remove();
								$("button").prop("disabled",false);
								console.log("si se puede");
								room.send({action:"ofebre",negocio:opciones});

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
										$("#muestraOfebre").off("click");
										$(".wrapper").css("pointer-events","auto");
										$("button").prop("disabled",false);
										$("body").children("#muestraOfebre").remove();
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
										$("#muestraOfebre").off("click");
										$(".wrapper").css("pointer-events","auto");
										$("button").prop("disabled",false);
										$("body").children("#muestraOfebre").remove();
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
										$("#muestraOfebre").off("click");
										$(".wrapper").css("pointer-events","auto");
										$("button").prop("disabled",false);
										$("body").children("#muestraOfebre").remove();
										console.log("si se puede");
										room.send({action:"ofebre",negocio:opciones});

									}
									else{
										$("#mensajeof").text("No tienes suficiente sal");
									}
								break;

							}
						break;

						case 4:
							if(mensaje.actual.oro>=2){
								//
								$("#muestraOfebre").off("click");
								$(".wrapper").css("pointer-events","auto");
								$("button").prop("disabled",false);
								$("body").children("#muestraOfebre").remove();
								console.log("si se puede");
								room.send({action:"ofebre",negocio:opciones});

							}
							else{
								$("#mensajeof").text("No tienes suficiente oro");
							}

						break;
					}
				break;
				case "terminar":
					console.log(opciones);
					$("#muestraOfebre").off("click");
					$(".wrapper").css("pointer-events","auto");
					$("button").prop("disabled",false);
					$("body").children("#muestraOfebre").remove();
					room.send({action:"terminar"});
				break;
			}
		})
	}
	if(mensaje.action=="comerciante"){
		$(".wrapper").css("pointer-events","none");
		$("button").prop("disabled",true);
		var chose=
				'<div id="comerc" class="row comercanteRow" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%)">'+
            '<div id="tresMerca" class="meerca"><img src="assets/img/orfebregde.png" class="merch3"></div>'+
            '<div class="colCom"><img src="assets/img/mercantes.jpg" id="fichaCom" class="fichaComercian"></div>'+
            '<div id="dosMerca" class="dosmerca"><img src="assets/img/orfebregde.png" class="merch2"></div>'+
            '<div id="acMerca3" class="accMerca3"><img id="selMerca3" style="visibility:hidden" src="assets/img/accMercante.png"></div>'+
            '<div id="acMerca2" class="accMerca2"><img id="selMerca2" style="visibility:hidden" src="assets/img/accMercante.png"></div>'+
            '<div id="cambMerca" class="cambiaMerca"><img src="assets/img/merca2.png" class="camMerca"></div>'+
						'<div id="cobra" style="top:110px;left:10px;position:absolute;border-style:double;width:50px;height:25px;text-align:center">Cobrar</div>'+
						'<div id="terminar" style="top:140px;left:10px;position:absolute;border-style:double;width:65px;height:25px;text-align:center">Terminar</div>'+

			 '<spanf id="mensajeof" style="left:50%;position: absolute;left: 50%;font-weight:bold;font-size:12px;color: red;transform: translateX(-50%)">Selecciona oferta</spanf>'+
       '</div>'
		$("body").append(chose);
		$("#comerc").on("click","div",function(){
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
										$("#comerc").off("click");
										$(".wrapper").css("pointer-events","auto");
										$("button").prop("disabled",false);
										$("body").children(".comercanteRow").remove();
										console.log("si se puede");
										room.send({action:"comerciante",negocio:opciones});

									}
									else{
										$("#mensajeof").text("No tienes suficientes dátiles");
									}
								break;
								case 2:
									if(mensaje.actual.pimienta >= 3){
										//enviar al servidor respuesta
										$("#comerc").off("click");
										$(".wrapper").css("pointer-events","auto");
										$("button").prop("disabled",false);
										$("body").children(".comercanteRow").remove();
										console.log("si se puede");
										room.send({action:"comerciante",negocio:opciones});

									}
									else{
										$("#mensajeof").text("No tienes suficiente pimienta");
									}
								break;
								case 3:
									if(mensaje.actual.sal >= 3){
										//enviar al servidor respuesta
										$("#comerc").off("click");
										$(".wrapper").css("pointer-events","auto");
										$("button").prop("disabled",false);
										$("body").children(".comercanteRow").remove();
										console.log("si se puede");
										room.send({action:"comerciante",negocio:opciones});
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
										$("#comerc").off("click");
										$(".wrapper").css("pointer-events","auto");
										$("button").prop("disabled",false);
										$("body").children(".comercanteRow").remove();
										console.log("si se puede");
										room.send({action:"comerciante",negocio:opciones,merchant:merchant});

									}
									else{
										$("#mensajeof").text("No tienes suficientes dátiles");
									}
								break;
								case 2:
									if(mensaje.actual.pimienta >= 2){
										//enviar al servidor respuesta
										$("#comerc").off("click");
										$(".wrapper").css("pointer-events","auto");
										$("button").prop("disabled",false);
										$("body").children(".comercanteRow").remove();
										console.log("si se puede");
										room.send({action:"comerciante",negocio:opciones,merchant:merchant});

									}
									else{
										$("#mensajeof").text("No tienes suficiente pimienta");
									}
								break;
								case 3:
									if(mensaje.actual.sal >= 2){
										//enviar al servidor respuesta
										$("#comerc").off("click");
										$(".wrapper").css("pointer-events","auto");
										$("button").prop("disabled",false);
										$("body").children(".comercanteRow").remove();
										console.log("si se puede");
										room.send({action:"comerciante",negocio:opciones,merchant:merchant});

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
					$("#comerc").off("click");
					$(".wrapper").css("pointer-events","auto");
					$("button").prop("disabled",false);
					room.send({action:"terminar"});
					$("body").children(".comercanteRow").remove();
				break;
			}
		})
	}
	if(mensaje.action=="asalto"){
		$(".wrapper").css("pointer-events","none");
		$("button").prop("disabled",true);
		switch(mensaje.posicion){
			case 4:
				$("#choseA").remove();
				$("body").append(
					"<div id='choseA' style='position:fixed;z-index:100;top:50%;left:50%;transform: translate(-50%,-50%)'>"+
						"<spanf>Escoge con que pagar el Primer Asalto</spanf><br>"+
						"<input type='button' id='td' value='Datil' ><br>"+
						"<input type='button' id='ts' value='Sal' ><br>"+
						"<input type='button' id='tp' value='Pimienta'><br>"+
						"<input type='button' id='tv' value='1 punto de victoria'>"+
					"</div>"
					);
				$('#choseA').on('click', '#td', function(){
					console.log("click escogerA");
					$('#chose').off("click","#td");
					$(".wrapper").css("pointer-events","auto");
					$("button").prop("disabled",false);
					$("#choseA").remove();
					room.send({action:"asalto",posicion:4,opcion:1});
				});
				$('#choseA').on('click', '#ts', function(){
					console.log("click escogerm");
					$('#choseA').off("click","#ts");
					$("button").prop("disabled",false);
					$(".wrapper").css("pointer-events","auto");
					$("#choseA").remove();
					room.send({action:"asalto",posicion:4,opcion:2});
				});
				$('#choseA').on('click', '#tp', function(){
					console.log("click escogerm");
					$('#choseA').off("click","#tp");
					$(".wrapper").css("pointer-events","auto");
					$("button").prop("disabled",false);
					$("#choseA").remove();
					room.send({action:"asalto",posicion:4,opcion:3});
				});
				$('#choseA').on('click', '#tv', function(){
					console.log("click escogerm");
					$('#choseA').off("click","#tv");
					$("button").prop("disabled",false);
					$(".wrapper").css("pointer-events","auto");
					$("#choseA").remove();
					room.send({action:"asalto",posicion:4,opcion:4});
				});
			break;
			case 8:
				$("#choseA").remove();
				$("body").append(
					"<div id='choseA' style='position:fixed;z-index:100;top:50%;left:50%;transform: translate(-50%,-50%)'>"+
						"<spanf>Escoge con que pagar el Segundo Asalto</spanf>"+
						"<input type='button' id='td' value='Datil' ><br>"+
						"<input type='button' id='ts' value='Sal' ><br>"+
						"<input type='button' id='tp' value='Pimienta'><br>"+
						"<input type='button' id='tv' value='1 punto de victoria'>"+
					"</div>"
					);
				$('#choseA').on('click', '#td', function(){
					console.log("click escogerA");
					$('#chose').off("click","#td");
					$(".wrapper").css("pointer-events","auto");
					$("button").prop("disabled",false);
					$("#chose").remove();
					room.send({action:"asalto",posicion:8,opcion:1});
					//comunicar eleccion
				});
				$('#choseA').on('click', '#ts', function(){
					console.log("click escogerm");
					$('#choseA').off("click","#ts");
					$(".wrapper").css("pointer-events","auto");
					$("button").prop("disabled",false);
					$("#choseA").remove();
					room.send({action:"asalto",posicion:8,opcion:2});
					//comunicar eleccion
				});
				$('#choseA').on('click', '#tp', function(){
					console.log("click escogerm");
					$('#choseA').off("click","#tp");
					$(".wrapper").css("pointer-events","auto");
					$("button").prop("disabled",false);
					$("#choseA").remove();
					room.send({action:"asalto",posicion:8,opcion:3});
					//comunicar eleccion
				});
				$('#choseA').on('click', '#tv', function(){
					console.log("click escogerm");
					$('#choseA').off("click","#tv");
					$(".wrapper").css("pointer-events","auto");
					$("button").prop("disabled",false);
					$("#choseA").remove();
					room.send({action:"asalto",posicion:8,opcion:4});
				});
			break;
			case 12:
				$("#choseA").remove();
				$("body").append(
					"<div id='choseA' style='position:fixed;z-index:100;top:50%;left:50%;transform: translate(-50%,-50%)'>"+
						"<spanf>Escoge con que pagar el Tercer Asalto</spanf>"+
						"<input type='button' id='td' value='3 Datiles' ><br>"+
						"<input type='button' id='ts' value='3 Sales' ><br>"+
						"<input type='button' id='tp' value='3 Pimientas'><br>"+
						"<input type='button' id='tv' value='2 puntos de victoria'>"+
					"</div>"
					);
				$('#choseA').on('click', '#td', function(){
					console.log("click escogerA");
					$('#chose').off("click","#td");
					$(".wrapper").css("pointer-events","auto");
					$("button").prop("disabled",false);
					$("#chose").remove();
					room.send({action:"asalto",posicion:12,opcion:1});
					//comunicar eleccion
				});
				$('#choseA').on('click', '#ts', function(){
					console.log("click escogerm");
					$('#choseA').off("click","#ts");
					$(".wrapper").css("pointer-events","auto");
					$("button").prop("disabled",false);
					$("#choseA").remove();
					room.send({action:"asalto",posicion:12,opcion:2});
					//comunicar eleccion
				});
				$('#choseA').on('click', '#tp', function(){
					console.log("click escogerm");
					$('#choseA').off("click","#tp");
					$(".wrapper").css("pointer-events","auto");
					$("button").prop("disabled",false);
					$("#choseA").remove();
					room.send({action:"asalto",posicion:12,opcion:3});
					//comunicar eleccion
				});
				$('#choseA').on('click', '#tv', function(){
					console.log("click escogerm");
					$('#choseA').off("click","#tv");
					$(".wrapper").css("pointer-events","auto");
					$("button").prop("disabled",false);
					$("#choseA").remove();
					room.send({action:"asalto",posicion:12,opcion:4});
				});
			break;
			case 16:
				$("#choseA").remove();
				$("body").append(
					"<div id='choseA' style='position:fixed;z-index:100;top:50%;left:50%;transform: translate(-50%,-50%)'>"+
						"<spanf>Escoge con que pagar el Cuarto Asalto</spanf>"+
						"<input type='button' id='to' value='1 moneda de Oro' ><br>"+
						"<input type='button' id='tv' value='3 puntos de victoria' ><br>"+
					"</div>"
					);
				$('#choseA').on('click', '#to', function(){
					console.log("click escogerA");
					$('#chose').off("click","#td");
					$(".wrapper").css("pointer-events","auto");
					$("button").prop("disabled",false);
					$("#chose").remove();
					room.send({action:"asalto",posicion:16,opcion:1});
				});
				$('#choseA').on('click', '#tv', function(){
					console.log("click escogerm");
					$('#choseA').off("click","#ts");
					$(".wrapper").css("pointer-events","auto");
					$("button").prop("disabled",false);
					$("#choseA").remove();
					room.send({action:"asalto",posicion:16,opcion:2});
				});
			break;

		}

	}
	if(mensaje.action=="finpartida"){
		$("body").children().remove();
		if(client.id == mensaje.resultado){
			$("body").append("<h1 style='color: black;z-index: 104;position: fixed;bottom: 50%; left: 50%; transform: translate(-50%,-50%);'>GANASTE</h1>");
		}
		else if(typeof(mensaje.resultado)=="string")
		{
			$("body").append("<h1 style='color: black;z-index: 104;position: fixed;bottom: 50%; left: 50%; transform: translate(-50%,-50%);'>PERDISTE</h1>");
		}
		else{
			$("body").append("<h1 style='color: black;z-index: 104;position: fixed;bottom: 50%; left: 50%; transform: translate(-50%,-50%);'>EMPATE</h1>");
		}

	}
	if(mensaje.action=="excesoM"){
		var seleccionR=[0,0,0]
		$("#chose").remove();
		$("button").prop("disabled",true);
		$(".wrapper").css("pointer-events","none");
		$("body").append(
			"<div id='chose' style='position:fixed;z-index:100;top:50%;left:50%;transform:scale(2) translate(-50%,-50%)'>"+
				"<spanf>¿Que mercancias regresarás al deposito?</spanf><br>"+
				"<spanf id='cantidad'>Faltan: "+mensaje.diferencia+"</spanf>"+
				"<input type='button' id='td' value='Datil' ><br>"+
				"<input type='button' id='ts' value='Sal' ><br>"+
				"<input type='button' id='tp' value='pimienta'><br>"+
			"</div>"
			);
		$('#chose').on('click', '#td', function(){


			//enviar selección solo si ya restaste las mercancias que faltan

			if(mensaje.actual.datiles-1 >=0){
				seleccionR[0]++;
				mensaje.diferencia--;
			}

			$("#cantidad").text("Faltan: "+mensaje.diferencia);
			if(mensaje.diferencia==0){
				console.log("click escogerm");
				$('#chose').off("click","#td");
				$("button").prop("disabled",false);
				$(".wrapper").css("pointer-events","auto");
				$("#chose").remove();
				room.send({action:"cobraexcesoM",seleccion:seleccionR});
			}

		});
		$('#chose').on('click', '#ts', function(){

			if(mensaje.actual.sal-1 >=0){
				seleccionR[1]++;
				mensaje.diferencia--;
			}
			
			$("#cantidad").text("Faltan: "+mensaje.diferencia);
			if(mensaje.diferencia==0){
				console.log("click escogerm");
				$('#chose').off("click","#td");
				$("button").prop("disabled",false);
				$(".wrapper").css("pointer-events","auto");
				$("#chose").remove();
				room.send({action:"cobraexcesoM",seleccion:seleccionR});
			}
			//enviar selección
		});
		$('#chose').on('click', '#tp', function(){

			if(mensaje.actual.pimienta-1 >=0){
				seleccionR[2]++;
				mensaje.diferencia--;
			}
			$("#cantidad").text("Faltan: "+mensaje.diferencia);
			if(mensaje.diferencia==0){
				console.log("click escogerm");
				$("button").prop("disabled",false);
				$('#chose').off("click","#tp");
				$(".wrapper").css("pointer-events","auto");
				$("#chose").remove();
				room.send({action:"cobraexcesoM",seleccion:seleccionR});
			}
			//enviar selección
		});
	}
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
room.listen("tableroCartas/:fila/:columna", function(change){

    if(change.operation=="replace"){
		$(cartas[change.path.fila][change.path.columna]).css("background-position",(change.value.tipo== undefined ?cartasM[change.value._id-1] :cartasT[change.value._id-1]));
	  }
	console.log(change);
});

room.listen("estado",function(change){ // Para determinar cuando se debe avisar al jugador que ha agotado sus acciones del turno
	if(change.value==3){
		flagCobrando=true;
	}
	else{
		flagCobrando=false;
	}
});

room.listen("jugadores/:id/:merca",function(change){
	switch(change.path.merca)
	{

		case "intersec":
			if(change.value==0 && change.path.id==client.id){
				flagMarcadores=true;
			}
			else{
				flagMarcadores=false;
			}
			/*if(flagMarcadores && flagcobraborde && flagCobrando && change.operation=="replace"){
				$("#terminarTurno").css({"color": "red", "border-color": "red", "border-width": "medium", "border-radius": "5px" });
				$("#terminarTurno").fadeIn(100).fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
			}*/
		break;
		case "cobraBorde":
			if(change.value==0 && change.path.id==client.id){
				flagcobraborde=true;
			}
			else{
				flagcobraborde=false;
			}
			/*if(flagMarcadores && flagcobraborde && flagCobrando && change.operation=="replace"){
				$("#terminarTurno").css({"color": "red", "border-color": "red", "border-width": "medium", "border-radius": "5px" });
				$("#terminarTurno").fadeIn(100).fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
			}*/
		break;
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
			//$("#fichaTurno2").css("visibility","hidden");
			//$("#fichaTurno1").css("visibility","visible");
		}
		else{
			$("#turnoJugadorLabel").text("Es turno del contrincante");
			//$("#fichaTurno2").css("visibility","visible");
			//$("#fichaTurno1").css("visibility","hidden");
		}

	}
});
room.listen("fichaInicio",function(change){
	if(change.value === client.id){
		$("#fichaTurno2").css("visibility","hidden");
		$("#fichaTurno1").css("visibility","visible");
	}
	else{

		$("#fichaTurno2").css("visibility","visible");
		$("#fichaTurno1").css("visibility","hidden");
	}
});
room.listen("tableroAsaltante/:fila/:columna",function(change){
	if(change.value=="A"){
		$("#Asaltante").remove();
		$(cartas[change.path.fila][change.path.columna]).append("<img id='Asaltante' class='asaltante' src='/assets/img/Asaltante.png'></img>");
	}
	console.log(change);
});
/*
room.listen("tableroCartas/:fila/:columna/:id",function(change){
	if(change.path.id =="_id" ){
		if(cartas[change.path.fila][change.path.columna].className.includes("mercac") ){
			$(cartas[change.path.fila][change.path.columna]).removeClass("mercac");
			$(cartas[change.path.fila][change.path.columna]).addClass("tribuc");
			$(cartas[change.path.fila][change.path.columna]).css("background-position",cartasT[45]);
			cache_cartas.push({fila:change.path.fila,columna:change.path.columna,id:change.value});
		}
		else if(cartas[change.path.fila][change.path.columna].className.includes("tribuc") ){
			$(cartas[change.path.fila][change.path.columna]).removeClass("tribuc");
			$(cartas[change.path.fila][change.path.columna]).addClass("mercac");
			$(cartas[change.path.fila][change.path.columna]).css("background-position",cartasM[19]);
			cache_cartas.push({fila:change.path.fila,columna:change.path.columna,id:change.value});
		}
		console.log("evento triggered");
	}

});*/

room.listen("tableroTuareg/:fila/:columna",function(change){
		if(change.operation=="replace" && change.value!=0){
			$(cartas[change.path.fila][change.path.columna]).append("<img id='Tuareg' class='asaltante' src='/assets/img/"+change.value+".png'></img>");
		}
		else if (change.operation=="replace" && change.value==0){
			$(cartas[change.path.fila][change.path.columna]).children("#Tuareg").remove();
		}
	console.log(change);
});

function onUpdate(state,patch){

	console.log(patch);
}

var Room = require("colyseus").Room;
var cartaTrib=require("../Model/modelousuario.js").CartasTribu;
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/Tuareg";
var shuffle = require("array-shuffle");

/*
	Cosas que se deben resetear cuando se mueva el asaltante:
		this.state.jugadores[id].c_In
		this.state.jugadores[id].f_In
		this.state.tableroInter
		this.state.estado

*/
const PATCH_RATE=20;

class Tuareg extends Room{
	constructor(options){
		super(options,1000/PATCH_RATE);

		this.setState({
			jugadores:{},
			tableroCartas:[   //para mostrar las cartas
				["#asalto4","N","d","s", "#asalto1"],
				["s",56, 56, 56,	  						"M"],
				["T",56, 56, 56,								"p"],
				["C",56, 56, 56,								"d"],
				["#asalto3","p","O","E", "#asalto2"]
			],
			tableroAsaltante:[  //para manejar las intersecciones y posicion del asaltante
				[16,"A",2,3,4],
				[15,0,0,0,5],
				[14,0,0,0,6],
				[13,0,0,0,7],
				[12,11,10,9,8]
			],
			tableroTuareg:[ // para manejar la ubicacion de los tuareg y los marcadores en el front-end
				[16,1,2,3,4],
				[15,0,0,0,5],
				[14,0,0,0,6],
				[13,0,0,0,7],
				[12,11,10,9,8]
			],
			tableroInter:[ //para identificar a que usuario pertenece cada marcador
				[16,1,2,3,4],
				[15,0,0,0,5],
				[14,0,0,0,6],
				[13,0,0,0,7],
				[12,11,10,9,8]
			],
			cartas_tribu_baraja:[],
			cartas_mercancia_baraja:[],
			cartas_tribu_recicla:[],   // cartas desechadas
			cartas_mercancia_recicla:[], //cartas desechadas
			turno_act:0,
			asaltante_pos:1,
			empate:null,
			ganador:null,
			estado:1,
			players:[], // player 0 es azul player 1 es gris
			reubica:false,
			lastTurno:false,
			asaltoscobrados:0,
			cobrandoAsalto:false,
			cobrandoExceso:false,
			excesoscobrados:0,
			fichaInicio:null,
			aumentadoefecto:false,
			comprando:false
		});


	}
	requestJoin(client){
			console.log("El cliente : "+client.clientId+" trata de entrar a una sala");
			var isDiferente;
			if(this.clients.length <2 || this.clients[0]== client.clientId){
				isDiferente=true;
			}
			else{
				isDiferente=false;
			}
			console.log("El cliente: " + client.clientId+((this.clients.length <2 && isDiferente )? " fue aceptado" :"fue rechazado"));
			return (this.clients.length <2 && isDiferente );
		}
	onJoin(client){
		client.playerIndex = Object.keys(this.state.jugadores).length;

		this.state.jugadores[client.id] ={
			datiles:2,
			oro:1,
			pimienta:2,
			sal:2,
			puntosv:4 , //[0]= fichas 1 punto , [1]=fichas 3 puntos , [2]=fichas 5 puntos
			playerIndex:client.playerIndex,
			fichasT:3,
			colorT:null,
			colorM:null,
			f_In:[],
			c_In:[],
			descuento:false,
			tarjetaMano:null,
			intersec:0,
			cobraBorde:0,
			excesoM:false,
			flagMerca:[false,false,false],
			efectoA:[false,false,false],
			tablero_jugador:[[],[],[]],
			efectoB:[false,false,false,false,false],
			efectoC:[false,false,false,false,false,false,false],
			efectoU:[false,false,false,false,false,false,false,false,false,false,false,false],
			conteodePares:[0,0,0,0,0],
			oasis:0,
			tuareg:0,
			tienda:0,
			pozo:0,
			camello:0,
			c_descuento:0,
			desc:false,
			reserva:0
		};

		this.state.jugadores[client.id].colorT=((this.state.jugadores[client.id].playerIndex==0)? "targiAzul":"targiGris"); // index 0 es player 1
		this.state.jugadores[client.id].colorM=((this.state.jugadores[client.id].playerIndex==0)? "marcadorAzul":"marcadorGris");

		if(this.clients.length == 2 ){
			this.state.fichaInicio=this.clients[0].id;
			this.state.turno_act = this.state.fichaInicio;
			console.log(this.state.turno_act);
			this.lock();
			 this.state.players=Object.keys(this.state.jugadores);
			this.barajear(this.roomId);
		}
		else{
			this.broadcast({message:"Esperando contrincante"});
		}

	}
	onMessage(client,data){
		console.log(data);
		//console.log(this.clients);
		// si la partida no ha terminado y es mi turno hacer esto
		if(data.action=="cobraexcesoM"){
			this.state.jugadores[client.id].datiles-=data.seleccion[0];
			this.state.jugadores[client.id].sal-=data.seleccion[1];
			this.state.jugadores[client.id].pimienta-=data.seleccion[2];
			this.state.excesoscobrados--;
			if(this.state.excesoscobrados ==0){
				this.state.cobrandoExceso=false;
				this.cambiarTurno(client);
			}

		}
		else if(data.action=="cambio"){
			if(data.movimientos.length ==2 ){
			//intercambiar ambas cartas
			var aux=this.state.jugadores[client.id].tablero_jugador[data.movimientos[0].fila][data.movimientos[0].columna];
				this.state.jugadores[client.id].tablero_jugador[data.movimientos[0].fila][data.movimientos[0].columna] = this.state.jugadores[client.id].tablero_jugador[data.movimientos[1].fila][data.movimientos[1].columna];
				this.state.jugadores[client.id].tablero_jugador[data.movimientos[1].fila][data.movimientos[1].columna]=aux;

				this.broadcast({action:"refreshtj",fila:data.movimientos[0].fila,columna:data.movimientos[0].columna,clientid:client.id,cartaid:this.state.jugadores[client.id].tablero_jugador[data.movimientos[0].fila][data.movimientos[0].columna]._id});
				this.broadcast({action:"refreshtj",fila:data.movimientos[1].fila,columna:data.movimientos[1].columna,clientid:client.id,cartaid:this.state.jugadores[client.id].tablero_jugador[data.movimientos[1].fila][data.movimientos[1].columna]._id});
			}
			else if(data.movimientos.length ==4){
				// cambiar todas las cartas
				this.state.jugadores[client.id].tablero_jugador[data.movimientos[1].fila][data.movimientos[1].columna]= this.state.jugadores[client.id].tablero_jugador[data.movimientos[0].fila][data.movimientos[0].columna];
				this.state.jugadores[client.id].tablero_jugador[data.movimientos[3].fila][data.movimientos[3].columna]= this.state.jugadores[client.id].tablero_jugador[data.movimientos[2].fila][data.movimientos[2].columna];
				this.state.jugadores[client.id].tablero_jugador[data.movimientos[0].fila].splice(data.movimientos[0].columna,1);
				this.state.jugadores[client.id].tablero_jugador[data.movimientos[2].fila].splice(data.movimientos[2].columna,1);
				this.broadcast({action:"refreshtj",fila:data.movimientos[0].fila,columna:data.movimientos[0].columna,clientid:client.id,cartaid:60});
				this.broadcast({action:"refreshtj",fila:data.movimientos[2].fila,columna:data.movimientos[2].columna,clientid:client.id,cartaid:60});
				this.broadcast({action:"refreshtj",fila:data.movimientos[1].fila,columna:data.movimientos[1].columna,clientid:client.id,cartaid:this.state.jugadores[client.id].tablero_jugador[data.movimientos[1].fila][data.movimientos[1].columna]._id});
				this.broadcast({action:"refreshtj",fila:data.movimientos[3].fila,columna:data.movimientos[3].columna,clientid:client.id,cartaid:this.state.jugadores[client.id].tablero_jugador[data.movimientos[3].fila][data.movimientos[3].columna]._id});

			}

		}
		else if(data.action=="mercancias1"){
			this.state.jugadores[client.id].datiles+=data.seleccion[0];
			this.state.jugadores[client.id].sal+=data.seleccion[1];
			this.state.jugadores[client.id].pimienta+=data.seleccion[2];
		}
		else if(data.action=="mercancias2"){
			var datiles=0;
			var sal=0;
			var pimienta=0;

			data.opciones.forEach(function(el,indx,arr){
				switch(el){
					case 1:
						datiles++;
					break;
					case 2:
						pimienta++;
					break;
					case 3:
						sal++;
					break;
				}
			});
			this.state.jugadores[client.id].datiles+=datiles;
			this.state.jugadores[client.id].sal+=sal;
			this.state.jugadores[client.id].pimienta+=pimienta;
			this.state.jugadores[client.id].oro+=data.oro;
			this.state.jugadores[client.id].puntosv+=data.puntov;
		}
		else if(data.action=="efectoU"  ){  // efecto U de nobles
			if(this.state.jugadores[client.id].efectoU[5] &&estado.jugadores[client.id].tarjetaMano!=null){
				this.send(cliente,{action:"mensaje",mensaje:"Descuento de 1 mercancia al usar nobles."})
				this.state.jugadores[client.id].c_descuento++;
				this.send(cliente,{action:"showTr",carta:estado.jugadores[client.id].tarjetaMano});
				estado.jugadores[client.id].tarjetaMano=null;
				this.send(cliente,{action:"refreshtjm",cartaid:46,clientid:client.id});
				this.state.jugadores[client.id].efectoU[5]=false;
			}
		}
		else if(data.action=="reserva" ){
			if(this.state.jugadores[client.id].efectoU[4] && this.state.jugadores[client.id].oro>0 && this.state.jugadores[client.id].reserva==0){
				this.state.jugadores[client.id].oro--;
				this.state.jugadores[client.id].reserva++;
			}

		}
		else if ((client.id == this.state.turno_act || this.state.estado==5)  && this.state.ganador==null && this.state.empate==null){
				//Comprobar  que es lo que actualmente se esta haciendo:
				//1)poniendo fichas tuareg
				//2)utilizando/comprando cartas
				console.log("aqui en nada");
				switch(this.state.estado){
					case 1:
						console.log("aqui en 1");
						this.ponerFichas(data,this.state,client);
					break;
					case 3:
						console.log("aqui en 3");
						this.interCobra(data,this.state,client);
						//this.cobraCartaMerca(data,this.state,client);
					break;
					case 5: //Asalto
						console.log("aqui en 5");
						this.cobraAsalto(data,this.state,client);
					break;

				}
		}


	}
	onLeave(client){
		delete this.state.jugadores[client.id];
		if(this.clients > 0){
			this.state.ganador= this.clients[0];
		}
	}
	cobraAsalto(data,estado,cliente){
		if(data.action=="asalto"){
			console.log("cobrando asalto");
			switch(data.posicion){
				case 4:
					switch(data.opcion){
						case 1:
						 estado.jugadores[cliente.id].datiles--;
						break;
						case 2:
							estado.jugadores[cliente.id].sal--;
						break;
						case 3:
							estado.jugadores[cliente.id].pimienta--;
						break;
						case 4:
							estado.jugadores[cliente.id].puntosv--;
						break;
					}
				break;
				case 8:
					switch(data.opcion){
						case 1:
						 estado.jugadores[cliente.id].datiles-=2;
						break;
						case 2:
							estado.jugadores[cliente.id].sal-=2;
						break;
						case 3:
							estado.jugadores[cliente.id].pimienta-=2;
						break;
						case 4:
							estado.jugadores[cliente.id].puntosv--;
						break;
					}
				break;
				case 12:
					switch(data.opcion){
						case 1:
						 estado.jugadores[cliente.id].datiles-=3;
						break;
						case 2:
							estado.jugadores[cliente.id].sal-=3;
						break;
						case 3:
							estado.jugadores[cliente.id].pimienta-=3;
						break;
						case 4:
							estado.jugadores[cliente.id].puntosv-=2;
						break;
					}
				break;
				case 16:
					switch(data.opcion){
						case 1:
						 estado.jugadores[cliente.id].oro--;
						break;
						case 2:
							estado.jugadores[cliente.id].puntosv-=3;
						break;

					}

				break;
			}

			//Aplicando efectoU 11
			if(estado.jugadores[cliente.id].efectoU[10]){
				estado.jugadores[cliente.id].puntosv++;
				this.send(cliente,{action:"mensaje",mensaje:"Se te da 1 punto de victoria despues de cobrar el asalto."});
			}
			//Una vez se cobran  los 2 asaltos se cambia al estado 1

			estado.asaltoscobrados++;
			if(estado.asaltoscobrados ==2){
				estado.asaltoscobrados=0;
				this.broadcast({action:"refreshall"})
				this.state.estado=1;
				this.state.jugadores[this.state.players[0]].fichasT=3;
				this.state.jugadores[this.state.players[1]].fichasT=3;
				this.state.fichaInicio=(this.state.fichaInicio== this.state.players[0])?this.state.players[1]:this.state.players[0];
				this.state.turno_act=this.state.fichaInicio;
				estado.cobrandoAsalto=false;
			if(this.state.asaltante_pos==16){
				this.findeJuego(cliente);
			}
			}
			else{
				estado.cobrandoAsalto=true;
			}
		}


	}
	reubicar(data,estado,cliente){

		estado.tableroInter[data.fila][data.columna]=0;
		estado.tableroTuareg[data.fila][data.columna]=0;
		this.broadcast({action:"refresh",fila:data.fila,columna:data.columna,reubica:estado.reubica});
		estado.jugadores[cliente.id].cobraBorde--;
		estado.estado=1;
		//estado.jugadores[cliente.id].intersec++;
	}
	cobraOfebre(data,estado,cliente){
		console.log("negociando con orfebre");
		switch(data.negocio[1]){
			case 1:
				switch(data.negocio[0]){
					case 1:
						estado.jugadores[cliente.id].datiles-=2;
					break;
					case 2:
						estado.jugadores[cliente.id].pimienta-=2;
					break;
					case 3:
						estado.jugadores[cliente.id].sal-=2;
					break;
				}
				estado.jugadores[cliente.id].puntosv++;
			break;
			case 2:
				estado.jugadores[cliente.id].oro-=1;
				estado.jugadores[cliente.id].puntosv+=2;
			break;
			case 3:
				switch(data.negocio[0]){
					case 1:
						estado.jugadores[cliente.id].datiles-=4;
					break;
					case 2:
						estado.jugadores[cliente.id].pimienta-=4;
					break;
					case 3:
						estado.jugadores[cliente.id].sal-=4;
					break;
				}
				estado.jugadores[cliente.id].puntosv+=3;
			break;
			case 4:
						estado.jugadores[cliente.id].oro-=2;
						estado.jugadores[cliente.id].puntosv+=4;
			break;
		}
		estado.jugadores[cliente.id].cobraBorde--;
	}
	cobraComerciante(data,estado,cliente){
		console.log("negociando con comerciante");
		switch(data.negocio[1]){
			case 1:
				switch(data.negocio[0]){
					case 1:
						estado.jugadores[cliente.id].datiles-=3;
					break;
					case 2:
						estado.jugadores[cliente.id].pimienta-=3;
					break;
					case 3:
						estado.jugadores[cliente.id].sal-=3;
					break;
				}
				estado.jugadores[cliente.id].oro++;
			break;

			case 3:
				switch(data.negocio[0]){
					case 1:
						estado.jugadores[cliente.id].datiles-=2;
					break;
					case 2:
						estado.jugadores[cliente.id].pimienta-=2;
					break;
					case 3:
						estado.jugadores[cliente.id].sal-=2;
					break;
				}
				switch(data.merchant){
					case 1:
						estado.jugadores[cliente.id].datiles+=1;
					break;
					case 2:
						estado.jugadores[cliente.id].pimienta+=1;
					break;
					case 3:
						estado.jugadores[cliente.id].sal+=1;
					break;
				}
			break;

		}
		estado.jugadores[cliente.id].cobraBorde--;
	}
	interCobra(data,estado,cliente){

		 if(data.action=="terminar"){
				estado.jugadores[cliente.id].cobraBorde--;
			}
		else if(data.action=="turnosig"){
			if(estado.jugadores[cliente.id].cobraBorde==0 && estado.jugadores[cliente.id].intersec==0){
					this.cambiarTurno(cliente);
			}
			else{
				//borrar todas las fichas puestas en el turno
				estado.tableroInter.forEach(function(el,indx,arr){
					el.forEach(function(el1,indx1,arr1){
						if(el1==cliente.id){
							arr[indx][indx1]=0;
						}
					});
				});
				estado.tableroTuareg.forEach(function(el,indx,arr){
					el.forEach(function(el1,indx1,arr1){
						if(el1==estado.jugadores[cliente.id].colorM || el1 == estado.jugadores[cliente.id].colorT){
							arr[indx][indx1]=0;
						}
					});
				});
				estado.jugadores[cliente.id].cobraBorde=0;
				estado.jugadores[cliente.id].intersec=0;
				if(estado.reubica){
					estado.estado=3;
				}
				this.cambiarTurno(cliente);
			}

		}
		else if(data.action=="choset"){
			if(data.columna!=null && data.fila!=null ){
				console.log()
				this.cobraCartaTribu(data,estado,cliente,true);

			}
			else {
				this.cobraCartaTribu(data,estado,cliente,false);
			}

		}
		else if(data.action=="showC"){
			this.cobraCartaMerca(data,estado,cliente,false);
		}
		else if(data.action=="chosem"){
			if(data.columna!=null && data.fila!=null){
				this.cobraCartaMerca(data,estado,cliente,true);
			}
			else{
				this.cobraCartaMerca(data,estado,cliente,false);
			}

		}
		else if(data.action=="showTr"){
			this.cobraCartaTribu(data,estado,cliente,false);
		}
		else if(estado.reubica){
			if(this.state.tableroInter[data.fila][data.columna]==cliente.id && this.state.tableroTuareg[data.fila][data.columna]!="targiAzul"){
				this.reubicar(data,estado,cliente);
			}
			else{
				//Avisar que no se puede
			}
		}
		else if(data.action=="ofebre"){
			this.cobraOfebre(data,estado,cliente);
		}
		else if(data.action=="comerciante"){
			this.cobraComerciante(data,estado,cliente);
		}
		else if(cliente.id == estado.turno_act && estado.tableroInter[data.fila][data.columna]==cliente.id){
			if(typeof(estado.tableroCartas[data.fila][data.columna])=="object" && estado.tableroCartas[data.fila][data.columna].tipo === undefined ) // es una carta de mercancia
			{
				console.log("cartaMercancia");
				this.cobraCartaMerca(data,estado,cliente,true);
			}
			else if(typeof(estado.tableroCartas[data.fila][data.columna])== "string"){
				console.log("cartaBorde");
				this.cobraCartaBorde(data,estado,cliente);
			}
			else{
				this.cobraCartaTribu(data,estado,cliente,true);
				console.log("cartaTribu");
			}
		}
	}
	cobraCartaBorde(data,estado,cliente){

			switch(this.state.tableroCartas[data.fila][data.columna]){
				case "C":
					this.send(cliente,{action:"showC",carta:estado.cartas_mercancia_baraja.pop(),actual:estado.jugadores[cliente.id]})
					//verificar si nos quedamos sin cartas
					if(estado.cartas_mercancia_baraja.length <=0){
						//tomar el cementerio de cartas, barajearlo y volverlo la nueva baraja
						estado.cartas_mercancia_baraja=estado.cartas_mercancia_recicla;
						estado.cartas_mercancia_recicla=[];
						shuffle(estado.cartas_mercancia_baraja);
					}
				break;
				case "M":
					//Merchant
					this.send(cliente,{action:"comerciante",actual:estado.jugadores[cliente.id]});
				break;
				case "O":
					//Orfebre
					this.send(cliente,{action:"orfebre",actual:estado.jugadores[cliente.id]});
				break;
				case "T":
					//Amp Tribu
					this.send(cliente,{action:"showTr",carta:estado.cartas_tribu_baraja.pop(),actual:estado.jugadores[cliente.id]})
					//verificar si nos quedamos sin cartas
					if(estado.cartas_tribu_baraja.length <=0){
						//tomar el cementerio de cartas, barajearlo y volverlo la nueva baraja
						estado.cartas_tribu_baraja=estado.cartas_tribu_recicla;
						estado.cartas_tribu_recicla=[];
						shuffle(estado.cartas_tribu_baraja);
					}

				break;
				case "E":
					//Espejismo
					if(estado.jugadores[cliente.id].intersec>0 ){
							estado.reubica=true;
					}
					else{
						estado.jugadores[cliente.id].cobraBorde--;
					}

				break;
				case "N":
					//Nobles
					if(estado.jugadores[cliente.id].tarjetaMano!=null){
						this.send(cliente,{action:"showTr",carta:estado.jugadores[cliente.id].tarjetaMano});
						estado.jugadores[cliente.id].tarjetaMano=null;
						this.send(cliente,{action:"refreshtjm",cartaid:46,clientid:cliente.id});
					}
					else{
						estado.jugadores[cliente.id].cobraBorde--;
					}


				break;
				case "d":
					estado.jugadores[cliente.id].datiles++;
					estado.jugadores[cliente.id].cobraBorde--;
				break;
				case "p":
					estado.jugadores[cliente.id].pimienta++;
					estado.jugadores[cliente.id].cobraBorde--;
				break;
				case "s":
					estado.jugadores[cliente.id].sal++;
					estado.jugadores[cliente.id].cobraBorde--;
				break;
				case "o":
					estado.jugadores[cliente.id].oro++;
					estado.jugadores[cliente.id].cobraBorde--;
				break;
				case "v":
					estado.jugadores[cliente.id].puntosv++;
					estado.jugadores[cliente.id].cobraBorde--;
				break;
			}
			estado.tableroInter[data.fila][data.columna]=0;
			estado.tableroTuareg[data.fila][data.columna]=0;
			this.broadcast({action:"refresh",fila:data.fila,columna:data.columna});

	}
	cobraCartaTribu(data,estado,cliente,isfromtablero){
		var carta=(isfromtablero) ? this.state.tableroCartas[data.fila][data.columna] : data.data;
		var descuento;
		if(data.descuento == undefined){
			descuento=[0,0,0];
		}
		else{
			descuento=data.descuento;
		}
		console.log("Aqui andamos: "+'\n');
		console.log(carta);
		console.log('\n');
		if(data.action==="choset" ){
			// Mediante data.cartafila , data.cartacolumna y data.tarifa obtener la tarifa correspondiente  aplicarla y pasar la carta al tablero mediante data.fila y data.columna , luego reemplazar carta en tableroInter
			switch(data.tarifa){
				case 1:
					console.log(carta.costo1_d);
					console.log(data);
					var columnaReal;
					estado.jugadores[cliente.id].datiles+= -carta.costo1_d+descuento[0]; // + data.descuento
					estado.jugadores[cliente.id].sal+= -carta.costo1_s+descuento[1]; // + data.descuento
					estado.jugadores[cliente.id].pimienta+= -carta.costo1_p+descuento[2]; // + data.descuento
					estado.jugadores[cliente.id].oro+= -carta.costo1_o+descuento[3];
					estado.jugadores[cliente.id].tablero_jugador[data.cartafila].push(carta); //Introducir al tablero del jugador
					this.state.comprando=false;
					//contar tipos de cartas en tablero de jugador
					switch(carta.tipo){
						case "oasis":
							estado.jugadores[cliente.id].oasis++;
						break;
						case "tienda":
							estado.jugadores[cliente.id].tienda++;
						break;
						case "tuareg":
							estado.jugadores[cliente.id].tuareg++;
						break;
						case "camello":
							estado.jugadores[cliente.id].camello++;
						break;
						case "pozo":
							estado.jugadores[cliente.id].pozo++;
						break;
					}
					var totalcartas =estado.jugadores[cliente.id].oasis+estado.jugadores[cliente.id].tienda+estado.jugadores[cliente.id].tuareg+estado.jugadores[cliente.id].camello+estado.jugadores[cliente.id].pozo;
					//contar los pares
					estado.jugadores[cliente.id].conteodePares[0]= Math.floor(estado.jugadores[cliente.id].oasis/2);
					estado.jugadores[cliente.id].conteodePares[1]= Math.floor(estado.jugadores[cliente.id].camello/2);
					estado.jugadores[cliente.id].conteodePares[2]= Math.floor(estado.jugadores[cliente.id].pozo/2);
					estado.jugadores[cliente.id].conteodePares[3]= Math.floor(estado.jugadores[cliente.id].tienda/2);
					estado.jugadores[cliente.id].conteodePares[4]= Math.floor(estado.jugadores[cliente.id].tuareg/2);
					//si la carta es de efecto aplicar flags


					columnaReal=estado.jugadores[cliente.id].tablero_jugador[data.cartafila].length-1; //Determinar columna de la ultima carta

					if(isfromtablero){
						console.log("es carta del tablero")
						this.state.tableroCartas[data.fila][data.columna]= estado.cartas_mercancia_baraja.pop();
						estado.tableroInter[data.fila][data.columna]=0;
						estado.tableroTuareg[data.fila][data.columna]=0;
						estado.jugadores[cliente.id].intersec--;
						this.broadcast({action:"refresh",fila:data.fila,columna:data.columna,id:estado.tableroCartas[data.fila][data.columna]._id});
					}
					else{
							estado.jugadores[cliente.id].cobraBorde--;
					}

					this.broadcast({action:"refreshtj",fila:data.cartafila,columna:columnaReal,clientid:cliente.id,cartaid:carta._id});
					switch(carta.efecto[0]){
						case "a":   // Efecto A
							switch(carta.efecto[1]){
								case "d":
									estado.jugadores[cliente.id].efectoA[0]=true;
								break;
								case "s":
									estado.jugadores[cliente.id].efectoA[1]=true;
								break;
								case "p":
									estado.jugadores[cliente.id].efectoA[2]=true;
								break;
							}
						break;
						case "b":
							switch(carta.efecto[1]){
								case "o":
									estado.jugadores[cliente.id].efectoB[0]=true;
								break;
								case "c":
									estado.jugadores[cliente.id].efectoB[1]=true;
								break;
								case "p":
									estado.jugadores[cliente.id].efectoB[2]=true;
								break;
								case "t":
									estado.jugadores[cliente.id].efectoB[3]=true;
								break;
								case "T":
									estado.jugadores[cliente.id].efectoB[4]=true;
								break;
							}
						break;
						case "c":
							switch(carta.efecto[1]){
								case "o":
									estado.jugadores[cliente.id].efectoC[0]=true;
								break;
								case "c":
									estado.jugadores[cliente.id].efectoC[1]=true;
								break;
								case "p":
									estado.jugadores[cliente.id].efectoC[2]=true;
								break;
								case "t":
									estado.jugadores[cliente.id].efectoC[3]=true;
								break;
								case "T":
									estado.jugadores[cliente.id].efectoC[4]=true;
								break;
								case "m":
									estado.jugadores[cliente.id].efectoC[5]=true;
								break;
								case "d":
									estado.jugadores[cliente.id].efectoC[6]=true;
								break;
							}
						break;
						case "d":
							switch(carta.efecto[1]){
								case "1":
									this.send(cliente,{action:"cambio",tablero:estado.jugadores[cliente.id].tablero_jugador,totalcartas:totalcartas});
									console.log("carta efecto D1")
								break;
								case "2":
									this.send(cliente,{action:"mercancia1",pares:Math.floor(totalcartas/2)});
								break;
								case "3":
									this.send(cliente,{action:"mercancia2"});
								break;

							}
						break;
						case "u":
							switch(carta.efecto[1]){
							case "1":
								estado.jugadores[cliente.id].efectoU[0]=true;
							break;
							case "2":
								estado.jugadores[cliente.id].efectoU[1]=true;
							break;
							case "3":
								estado.jugadores[cliente.id].efectoU[2]=true;
							break;
							case "4":
								estado.jugadores[cliente.id].efectoU[3]=true;
								this.send(cliente,{action:"mercancia1",pares:Math.floor((12-totalcartas)/2)});
							break;
							case "5":
								estado.jugadores[cliente.id].efectoU[4]=true;
								this.send(cliente,{action:"mensaje",mensaje:"Pon una moneda en la reserva dando click a tu moneda de oro."});
							break;
							case "6":
								estado.jugadores[cliente.id].efectoU[5]=true;
							break;
							case "7":
								estado.jugadores[cliente.id].efectoU[6]=true;
							break;
							case "8":
								estado.jugadores[cliente.id].efectoU[7]=true;
							break;
							case "9":
								estado.jugadores[cliente.id].efectoU[8]=true;
							break;
							case "A":
								estado.jugadores[cliente.id].efectoU[9]=true;
							break;
							case "B":
								estado.jugadores[cliente.id].efectoU[10]=true;
							break;
							case "C":
								estado.jugadores[cliente.id].efectoU[11]=true;
							break;
						}
						break;
					}
				break;
				case 2:
					console.log(data);
					var columnaReal;
					if(data.reserva){
						estado.jugadores[cliente.id].reserva=0;
					}
					else{
						estado.jugadores[cliente.id].oro-= carta.costo2_o
					}
					estado.jugadores[cliente.id].tablero_jugador[data.cartafila].push(carta);
					this.state.comprando=false;
					//Aplica efectos de cartas
					switch(carta.efecto[0]){
						case "a":   // Efecto A
							switch(carta.efecto[1]){
								case "d":
									estado.jugadores[cliente.id].efectoA[0]=true;
								break;
								case "s":
									estado.jugadores[cliente.id].efectoA[1]=true;
								break;
								case "p":
									estado.jugadores[cliente.id].efectoA[2]=true;
								break;
							}
						break;
						case "b":
							switch(carta.efecto[1]){
								case "o":
									estado.jugadores[cliente.id].efectoB[0]=true;
								break;
								case "c":
									estado.jugadores[cliente.id].efectoB[1]=true;
								break;
								case "p":
									estado.jugadores[cliente.id].efectoB[2]=true;
								break;
								case "t":
									estado.jugadores[cliente.id].efectoB[3]=true;
								break;
								case "T":
									estado.jugadores[cliente.id].efectoB[4]=true;
								break;
							}
						break;
						case "c":
							switch(carta.efecto[1]){
								case "o":
									estado.jugadores[cliente.id].efectoC[0]=true;
								break;
								case "c":
									estado.jugadores[cliente.id].efectoC[1]=true;
								break;
								case "p":
									estado.jugadores[cliente.id].efectoC[2]=true;
								break;
								case "t":
									estado.jugadores[cliente.id].efectoC[3]=true;
								break;
								case "T":
									estado.jugadores[cliente.id].efectoC[4]=true;
								break;
								case "m":
									estado.jugadores[cliente.id].efectoC[5]=true;
								break;
								case "d":
									estado.jugadores[cliente.id].efectoC[6]=true;
								break;
							}
						break;
						case "d":
							switch(carta.efecto[1]){
								case "1":
									this.send(cliente,{action:"cambio",tablero:estado.jugadores[cliente.id].tablero_jugador,totalcartas:totalcartas});
									console.log("carta efecto D1")
								break;
								case "2":
									this.send(cliente,{action:"mercancia1",pares:Math.floor(totalcartas/2)});
								break;
								case "3":
									this.send(cliente,{action:"mercancia2"});
								break;

							}
						break;
						case "u":
							switch(carta.efecto[1]){
							case "1":
								estado.jugadores[cliente.id].efectoU[0]=true;
							break;
							case "2":
								estado.jugadores[cliente.id].efectoU[1]=true;
							break;
							case "3":
								estado.jugadores[cliente.id].efectoU[2]=true;
							break;
							case "4":
								estado.jugadores[cliente.id].efectoU[3]=true;
								this.send(cliente,{action:"mercancia1",pares:Math.floor((12-totalcartas)/2)});
							break;
							case "5":
								estado.jugadores[cliente.id].efectoU[4]=true;
								this.send(cliente,{action:"mensaje",mensaje:"Pon una moneda en la reserva dando click a tu moneda de oro."});
							break;
							case "6":
								estado.jugadores[cliente.id].efectoU[5]=true;
							break;
							case "7":
								estado.jugadores[cliente.id].efectoU[6]=true;
							break;
							case "8":
								estado.jugadores[cliente.id].efectoU[7]=true;
							break;
							case "9":
								estado.jugadores[cliente.id].efectoU[8]=true;
							break;
							case "A":
								estado.jugadores[cliente.id].efectoU[9]=true;
							break;
							case "B":
								estado.jugadores[cliente.id].efectoU[10]=true;
							break;
							case "C":
								estado.jugadores[cliente.id].efectoU[11]=true;
							break;
						}
						break;
					}

					columnaReal=estado.jugadores[cliente.id].tablero_jugador[data.cartafila].length-1;

					if(isfromtablero){
						this.state.tableroCartas[data.fila][data.columna]= estado.cartas_mercancia_baraja.pop();
						estado.tableroInter[data.fila][data.columna]=0;
						estado.tableroTuareg[data.fila][data.columna]=0;
						estado.jugadores[cliente.id].intersec--;
						this.broadcast({action:"refresh",fila:data.fila,columna:data.columna,id:estado.tableroCartas[data.fila][data.columna]._id});
					}
					else{
						estado.jugadores[cliente.id].cobraBorde--;
					}
					this.broadcast({action:"refreshtj",fila:data.cartafila,columna:columnaReal,clientid:cliente.id,cartaid:carta._id});
				break;
				case 3:
					console.log(data);
					this.state.comprando=false;
				break;
				case 4:
					if(isfromtablero){
						this.state.tableroCartas[data.fila][data.columna]= estado.cartas_mercancia_baraja.pop();
						estado.tableroInter[data.fila][data.columna]=0;
						estado.tableroTuareg[data.fila][data.columna]=0;
						estado.jugadores[cliente.id].intersec--;

						this.broadcast({action:"refresh",fila:data.fila,columna:data.columna,id:estado.tableroCartas[data.fila][data.columna]._id});
					}
					else{
						estado.jugadores[cliente.id].cobraBorde--;
					}
					estado.jugadores[cliente.id].tarjetaMano=carta;
					//this.broadcast({action:"refreshtjm",clientid:cliente.id,cartaid:carta._id});
					this.send(cliente,{action:"refreshtjm",fila:data.fila,columna:data.columna,cartaid:carta._id,clientid:cliente.id});
					this.state.comprando=false;
					console.log(data);
				break;
				default:
					console.log(data);
					estado.cartas_tribu_recicla.push(carta);

					if(isfromtablero){
						estado.tableroCartas[data.fila][data.columna]= estado.cartas_mercancia_baraja.pop();
						estado.tableroInter[data.fila][data.columna]=0;
						estado.tableroTuareg[data.fila][data.columna]=0;
						estado.jugadores[cliente.id].intersec--;
						this.broadcast({action:"refresh",fila:data.fila,columna:data.columna,id:estado.tableroCartas[data.fila][data.columna]._id});
					}
					else{
						estado.jugadores[cliente.id].cobraBorde--;
					}
					this.state.comprando=false;
				break;
			}

		}


		else{
			///Calcular si tablero de jugador tiene espacio para acomodar
			var espacio;
			estado.jugadores[cliente.id].tablero_jugador.forEach(function(el,indx,arr){
				if(el.length<4){
					espacio= true;
				}
				else{
					espacio=false;
				}
			});

			///Detectar si hay descuento
			//efectos tipo b

					if (estado.jugadores[cliente.id].efectoB[0] && estado.jugadores[cliente.id].oasis>0){
						estado.jugadores[cliente.id].c_descuento+=estado.jugadores[cliente.id].oasis;
						estado.jugadores[cliente.id].efectoB[0]=false;
						estado.jugadores[cliente.id].desc=true;
					}
					if (estado.jugadores[cliente.id].efectoB[1] && estado.jugadores[cliente.id].camello>0){
						estado.jugadores[cliente.id].c_descuento+=estado.jugadores[cliente.id].camello;
						estado.jugadores[cliente.id].efectoB[1]=false;
						estado.jugadores[cliente.id].desc=true;
					}
					if (estado.jugadores[cliente.id].efectoB[2] && estado.jugadores[cliente.id].pozo>0){
						estado.jugadores[cliente.id].c_descuento+=estado.jugadores[cliente.id].pozo;
						estado.jugadores[cliente.id].efectoB[2]=false;
						estado.jugadores[cliente.id].desc=true;
					}
					if (estado.jugadores[cliente.id].efectoB[3] && estado.jugadores[cliente.id].tienda>0){
						estado.jugadores[cliente.id].c_descuento+=estado.jugadores[cliente.id].tienda;
						estado.jugadores[cliente.id].efectoB[3]=false;
						estado.jugadores[cliente.id].desc=true;
					}
					if (estado.jugadores[cliente.id].efectoB[4] && estado.jugadores[cliente.id].tuareg>0){
						estado.jugadores[cliente.id].c_descuento=estado.jugadores[cliente.id].tuareg;
						estado.jugadores[cliente.id].efectoB[4]=false;
						estado.jugadores[cliente.id].desc=true;
					}


			// Aplicando efectoU 10
			if(estado.jugadores[cliente.id].efectoU[9]){
				estado.jugadores[cliente.id].efectoU[9]=false;
				estado.c_descuento+=1;
				estado.jugadores[cliente.id].desc=true;
				this.send(cliente.id,{action:"mensaje",mensaje:"Se te descuenta una mercancia menos: 'Si utilizas la acción de Nobles para poner una carta sobre la mesa, pagas 1 mercancia menos que la indicada'"})
			}


			///
			console.log(espacio);
			/////

			if(!this.state.comprando){
				this.send(cliente,{action:"choset",fila:data.fila,columna:data.columna,costo:[carta.costo1_d,carta.costo1_s,carta.costo1_o,carta.costo1_p,carta.costo2_o ],
				descuento:estado.jugadores[cliente.id].desc,cantidad:estado.jugadores[cliente.id].c_descuento,tarjetaMano:(estado.jugadores[cliente.id].tarjetaMano===null ?true :false),data:carta,isfromtablero:isfromtablero,actual:estado.jugadores[cliente.id],espacio:espacio});
				this.state.comprando=true;
			}
			}

		//verificar si nos quedamos sin cartas
		if(estado.cartas_mercancia_baraja.length <=0){
			//tomar el cementerio de cartas, barajearlo y volverlo la nueva baraja
			estado.cartas_mercancia_baraja=estado.cartas_mercancia_recicla;
			estado.cartas_mercancia_recicla=[];
			shuffle(estado.cartas_mercancia_baraja);
		}

	}
	cobraCartaMerca(data,estado,cliente,isfromtablero){

		var carta=(isfromtablero) ? this.state.tableroCartas[data.fila][data.columna] : data.data;
		//console.log(carta.otorga);
		if(data.action=="chosem"){
			switch(data.otorga){
				case 1:
					estado.jugadores[cliente.id].datiles++;
					estado.jugadores[cliente.id].flagMerca[0]=true;
				break;
				case 2:
				estado.jugadores[cliente.id].sal++;
				estado.jugadores[cliente.id].flagMerca[1]=true;
				break;
				case 3:
				estado.jugadores[cliente.id].pimienta++;
				estado.jugadores[cliente.id].flagMerca[2]=true;
				break;
			}
			if(isfromtablero){
				estado.cartas_mercancia_recicla.push(carta);
				estado.tableroCartas[data.fila][data.columna]= estado.cartas_tribu_baraja.pop();
				estado.tableroInter[data.fila][data.columna]=0;
				estado.tableroTuareg[data.fila][data.columna]=0;
				estado.jugadores[cliente.id].intersec--;
				carta=estado.tableroCartas[data.fila][data.columna];
				this.broadcast({action:"refresh",fila:data.fila,columna:data.columna,id:estado.tableroCartas[data.fila][data.columna]._id});
			}
			else{
				estado.jugadores[cliente.id].cobraBorde--;
				estado.cartas_mercancia_recicla.push(carta);
				this.broadcast({action:"refresh",fila:data.fila,columna:data.columna});
			}

		}
		else if(carta.otorga.length>2){
			this.send(cliente,{action:"chosem",fila:data.fila,columna:data.columna,data:carta});
		}
		else if(carta.otorga.length ==1){
			switch(carta.otorga){
				case "d":
					estado.jugadores[cliente.id].datiles++;
					estado.jugadores[cliente.id].flagMerca[0]=true;
				break;
				case "p":
				estado.jugadores[cliente.id].pimienta++;
				estado.jugadores[cliente.id].flagMerca[2]=true;
				break;
				case "s":
				estado.jugadores[cliente.id].sal++;
				estado.jugadores[cliente.id].flagMerca[1]=true;
				break;
				case "o":
				estado.jugadores[cliente.id].oro++;
				break;
				case "v":
				estado.jugadores[cliente.id].puntosv++;
				break;
			}
			if(isfromtablero){
				estado.cartas_mercancia_recicla.push(carta);
				estado.tableroCartas[data.fila][data.columna]= estado.cartas_tribu_baraja.pop();
				estado.tableroInter[data.fila][data.columna]=0;
				estado.tableroTuareg[data.fila][data.columna]=0;
				estado.jugadores[cliente.id].intersec--;
				this.broadcast({action:"refresh",fila:data.fila,columna:data.columna,id:estado.tableroCartas[data.fila][data.columna]._id});
			}
			else{
				estado.jugadores[cliente.id].cobraBorde--;
				estado.cartas_mercancia_recicla.push(carta);
				this.broadcast({action:"refresh",fila:data.fila,columna:data.columna});
			}

		}
		else if(carta.otorga.length ==2 && !isNaN(carta.otorga[0])){ // si su tamaño es 2 y el primer elemento es un numero
				var cantidad = Number(carta.otorga[0]);
			switch(carta.otorga[1]){
				case "d":
					estado.jugadores[cliente.id].datiles+=cantidad;
					estado.jugadores[cliente.id].flagMerca[0]=true;
				break;
				case "p":
				estado.jugadores[cliente.id].pimienta+=cantidad;
				estado.jugadores[cliente.id].flagMerca[2]=true;
				break;
				case "s":
				estado.jugadores[cliente.id].sal+=cantidad;
				estado.jugadores[cliente.id].flagMerca[1]=true;
				break;
				case "o":
				estado.jugadores[cliente.id].oro+=cantidad;
				break;
				case "v":
				estado.jugadores[cliente.id].puntosv++;
				break;
			}
			if(isfromtablero){
				estado.cartas_mercancia_recicla.push(carta);
				estado.tableroCartas[data.fila][data.columna]= estado.cartas_tribu_baraja.pop();
				estado.tableroInter[data.fila][data.columna]=0;
				estado.tableroTuareg[data.fila][data.columna]=0;
				estado.jugadores[cliente.id].intersec--;
				this.broadcast({action:"refresh",fila:data.fila,columna:data.columna,id:estado.tableroCartas[data.fila][data.columna]._id});
			}
			else{
				estado.jugadores[cliente.id].cobraBorde--;
				estado.cartas_mercancia_recicla.push(carta);
				this.broadcast({action:"refresh",fila:data.fila,columna:data.columna});
			}

		}
		else if(carta.otorga.length ==2 && isNaN(carta.otorga[0])){ // si su tamaño es 2 y el primer elemento no es un numero
			switch(carta.otorga[0]){
				case "d":
					estado.jugadores[cliente.id].datiles++;
					estado.jugadores[cliente.id].flagMerca[0]=true;
				break;
				case "p":
				estado.jugadores[cliente.id].pimienta++;
				estado.jugadores[cliente.id].flagMerca[2]=true;
				break;
				case "s":
				estado.jugadores[cliente.id].sal++;
				estado.jugadores[cliente.id].flagMerca[1]=true;
				break;
				case "o":
				estado.jugadores[cliente.id].oro++;
				break;
				case "v":
				estado.jugadores[cliente.id].puntosv++;
				break;
			}
			switch(carta.otorga[1]){
				case "d":
					estado.jugadores[cliente.id].datiles++;
					estado.jugadores[cliente.id].flagMerca[0]=true;
				break;
				case "p":
				estado.jugadores[cliente.id].pimienta++;
				estado.jugadores[cliente.id].flagMerca[2]=true;

				break;
				case "s":
				estado.jugadores[cliente.id].sal++;
				estado.jugadores[cliente.id].flagMerca[1]=true;
				break;
				case "o":
				estado.jugadores[cliente.id].oro++;
				break;
				case "v":
				estado.jugadores[cliente.id].puntosv++;
				break;
			}
			if(isfromtablero){
				estado.cartas_mercancia_recicla.push(carta);
				estado.tableroCartas[data.fila][data.columna]= estado.cartas_tribu_baraja.pop();
				estado.tableroInter[data.fila][data.columna]=0;
				estado.tableroTuareg[data.fila][data.columna]=0;
				estado.jugadores[cliente.id].intersec--;
				this.broadcast({action:"refresh",fila:data.fila,columna:data.columna,id:estado.tableroCartas[data.fila][data.columna]._id});
			}
			else{
				estado.jugadores[cliente.id].cobraBorde--;
				estado.cartas_mercancia_recicla.push(carta);
				this.broadcast({action:"refresh",fila:data.fila,columna:data.columna});
			}


		}


		if(estado.cartas_tribu_baraja.length <=0){
			estado.cartas_tribu_baraja=estado.cartas_tribu_recicla;
			shuffle(estado.cartas_tribu_baraja);
			estado.cartas_tribu_recicla=[];
			//tomar el cementerio de cartas, barajearlo y volverlo la nueva baraja
		}
	}
	contarPuntosTableros(estado,cliente){
		var puntos=[0,0];
		var contadorCartas=[0,0]

		estado.jugadores[estado.players[0]].tablero_jugador.forEach(function(el,index,arr){
			el.forEach(function(el1,index1,arr1){
				if(el1 != null && el1 != undefined ){
					puntos[0]+=el1.puntos_v;
					contadorCartas[0]++;
				}

			});
		});
		estado.jugadores[estado.players[1]].tablero_jugador.forEach(function(el,index,arr){
			el.forEach(function(el1,index1,arr1){
				if(el1 != null && el1 != undefined ){
					puntos[1]+=el1.puntos_v;
					contadorCartas[1]++;
				}
			});
		});

		// si todas las cartas de una fila son del mismo tipo dar 4Pv
		estado.jugadores[estado.players[0]].tablero_jugador.forEach(function(el,index,arr){
			var tipo=el[0].tipo
			if(tipo==el[1].tipo && tipo==el[2].tipo && tipo==el[3].tipo){
				puntos[0]+=4;
				this.send(this.clients[0],{action:"mensaje",mensaje:"Los tipos de carta de la fila:"+index+" son iguales, +4 puntos de victora."})
			}
		});
		estado.jugadores[estado.players[1]].tablero_jugador.forEach(function(el,index,arr){
			var tipo=el[0].tipo
			if(tipo==el[1].tipo && tipo==el[2].tipo && tipo==el[3].tipo){
				puntos[1]+=4;
				this.send(this.clients[1],{action:"mensaje",mensaje:"Los tipos de carta de la fila:"+index+" son iguales, +4 puntos de victora."})
			}
		});

		// si todas las cartas de una fila tienen simbolo distinto dar 2pv pero si e efectoU 11 esta activado aumentar 4pv
		estado.jugadores[estado.players[0]].tablero_jugador.forEach(function(el,index,arr){
			var tipo=[0,0,0,0,0]; //Oasis,camello,pozo,tienda ,tuareg
			var diferente=false;
			var aumento =(estado.jugadores[estado.players[0]].efectoU[11]) ? 4 : 2;
			el.forEach(function(el1,index1,arr1){
				switch(el1.tipo){
					case "oasis":
						tipo[0]++;
					break;
					case "camello":
						tipo[1]++;
					break;
					case "pozo":
						tipo[2]++;
					break;
					case "tienda":
						tipo[3]++;
					break;
					case "tuareg":
						tipo[4]++;
					break;
				}
			});
			tipo.forEach(function(el,indx,arr){
				if(el==1){
					diferente=true;
				}
				else{
					diferente=false;

				}
			});
			if(diferente){
				puntos[0]+=aumento;
				if(aumento==2){
					this.send(this.clients[0],{action:"mensaje",mensaje:"Los tipos de carta de la fila:"+index+" son de tipos distintos, +2 puntos de victora."})
				}
				else{
					this.send(this.clients[0],{action:"mensaje",mensaje:"Los tipos de carta de la fila:"+index+" son de tipos distintos , +4 puntos de victora."})
				}

			}

		});
		estado.jugadores[estado.players[1]].tablero_jugador.forEach(function(el,index,arr){
			var tipo=[0,0,0,0,0]; //Oasis,camello,pozo,tienda ,tuareg
			var diferente=false;
			var aumento =(estado.jugadores[estado.players[1]].efectoU[11]) ? 4 : 2;
			el.forEach(function(el1,index1,arr1){
				switch(el1.tipo){
					case "oasis":
						tipo[0]++;
					break;
					case "camello":
						tipo[1]++;
					break;
					case "pozo":
						tipo[2]++;
					break;
					case "tienda":
						tipo[3]++;
					break;
					case "tuareg":
						tipo[4]++;
					break;
				}
			});
			tipo.forEach(function(el,indx,arr){
				if(el==1){
					diferente=true;
				}
				else{
					diferente=false;

				}
			});
			if(diferente){
				puntos[1]+=aumento;
				if(aumento==2){
					this.send(this.clients[0],{action:"mensaje",mensaje:"Los tipos de carta de la fila:"+index+" son de tipos distintos, +2 puntos de victora."})
				}
				else{
					this.send(this.clients[0],{action:"mensaje",mensaje:"Los tipos de carta de la fila:"+index+" son de tipos distintos , +4 puntos de victora."})
				}
			}

		});

		//contar puntos de efecto C
		this.state.jugadores[this.state.players[0]].efectoC.forEach(function(el,indx,arr){
			if(el && this.state.jugadores[this.state.players[0]].conteodePares[indx]>0 && indx<5){
				puntos[0]+=this.state.jugadores[this.state.players[0]].conteodePares[indx];
				this.send(cliente,{action:"mensaje",mensaje:"Se aumentaron tus puntos de victoria por carta efecto"});
				console.log("jugador 1 se aumentaron puntos por  carta efecto");
			}
		});
		if(this.state.jugadores[this.state.players[0]].efectoC[5] && contadorCartas[0]> contadorCartas[1]){
			puntos[0]++;
			this.send(cliente,{action:"mensaje",mensaje:"Se aumentaron tus puntos de victoria por carta efecto , tienes mas cartas en tu tablero que el contrincante"});
			console.log("jugador 1 tiene mas cartas en tablero que contrincante");
		}
		if(this.state.jugadores[this.state.players[0]].efectoC[5] && contadorCartas[0]>=10){
			puntos[0]++;
			this.send(cliente,{action:"mensaje",mensaje:"Se aumentaron tus puntos de victoria por carta efecto , tienes mas de 10 cartas en tu tablero"});
			console.log("jugador 1 tiene mas de 10 cartas tablero que contrincante");
		}

		this.state.jugadores[this.state.players[1]].efectoC.forEach(function(el,indx,arr){
			if(el && this.state.jugadores[this.state.players[1]].conteodePares[indx]>0 && indx<5){
				puntos[1]+=this.state.jugadores[this.state.players[1]].conteodePares[indx];
				this.send(cliente,{action:"mensaje",mensaje:"Se aumentaron tus puntos de victoria por carta efecto"});
				console.log("jugador 2 se aumentaron puntos por  carta efecto");
			}
		});
		if(this.state.jugadores[this.state.players[1]].efectoC[5] && contadorCartas[1]> contadorCartas[0]){
			puntos[1]++;
			this.send(cliente,{action:"mensaje",mensaje:"Se aumentaron tus puntos de victoria por carta efecto , tienes mas cartas en tu tablero que el contrincante"});
			console.log("jugador 2 tiene mas cartas en tablero que contrincante");
		}
		if(this.state.jugadores[this.state.players[1]].efectoC[5] && contadorCartas[1]>=10){
			puntos[0]++;
			this.send(cliente,{action:"mensaje",mensaje:"Se aumentaron tus puntos de victoria por carta efecto , tienes mas de 10 cartas en tu tablero"});
			console.log("jugador 2 tiene mas de 10 cartas tablero que contrincante");
		}

		//contar puntos de efecto U
		//efecto 3
		if(this.state.jugadores[this.state.players[0]].efectoU[2] ){

			this.state.jugadores[this.state.players[0]].tablero_jugador.forEach(function(el,indx,arr){
				if(el[3]._id==13){
					puntos[0]+=2;
					this.send(cliente,{action:"mensaje",mensaje:"Se aumentaron en 2tus puntos de victoria por carta efecto , la carta esta situada al final de una fila completa"});
					console.log("jugador 1 tiene la carta de efectoU _id 13 al final de una fila completa");
				}
			});

		}
		if(this.state.jugadores[this.state.players[1]].efectoU[2] ){
			this.state.jugadores[this.state.players[1]].tablero_jugador.forEach(function(el,indx,arr){
				if(el[3]._id==13){
					puntos[0]+=2;
					this.send(cliente,{action:"mensaje",mensaje:"Se aumentaron en 2tus puntos de victoria por carta efecto , la carta esta situada al final de una fila completa"});
					console.log("jugador 1 tiene la carta de efectoU _id 13 al final de una fila completa");
				}
			});
		}


		return puntos;
	}
	isTableroLleno(estado,cliente){
		var lleno=0;
		estado.jugadores[cliente.id].tablero_jugador.forEach(function(el,indx,arr){
			if (el.length >=4){
				lleno++;
			}
		})
		if(lleno <3){
			return false;
		}
		else{
			return true;
		}
	}
	moverAsaltante(cliente){

		var act_pos=this.state.asaltante_pos;
		var estado=this.state
		this.state.asaltante_pos++;
		if(this.state.asaltante_pos==16){
			//this.findeJuego(cliente);
			return -1;
		}
		this.state.tableroAsaltante.forEach(function(el,indf){
			el.forEach(function(el2,indc){
				if(el2==="A"){
					estado.tableroAsaltante[indf][indc]=act_pos
				}
				if(el2=== estado.asaltante_pos){
					estado.tableroAsaltante[indf][indc]= "A";
					return 1;
				}
			});
		})


	}
	findeJuego(cliente){
		var puntosf= this.contarPuntosTableros(this.state,cliente);
		console.log("Finalizó la partida");
		//se suman los puntos acumulados en el juego
		puntosf[0]+=this.state.jugadores[this.state.players[0]].puntosv; // puntos del jugador1
		puntosf[1]+=this.state.jugadores[this.state.players[1]].puntosv;// puntos del jugador2
		//aplicar efectos

		//si es empate gana el que tenga mas monedas de oro , si ambos tienen las mismas monedas de oro gana el que tenga mas mercancias
		if(puntosf[0] > puntosf[1]){
			this.state.ganador=this.state.players[0];
		}
		else if (puntosf[0] < puntosf[1]){
			this.state.ganador=this.state.players[1];
		}
		else{
			if(this.state.jugadores[this.state.players[0]].oro > this.state.jugadores[this.state.players[1]].oro ){
				this.state.ganador=this.state.players[0];
			}
			else if(this.state.jugadores[this.state.players[0]].oro < this.state.jugadores[this.state.players[1]].oro ){
				this.state.ganador=this.state.players[1];
			}
			else{
				var mercanciast=[0,0];
				mercanciast[0]+=this.state.jugadores[this.state.players[0]].sal;
				mercanciast[0]+=this.state.jugadores[this.state.players[0]].datiles;
				mercanciast[0]+=this.state.jugadores[this.state.players[0]].pimienta;
				mercanciast[1]+=this.state.jugadores[this.state.players[1]].sal;
				mercanciast[1]+=this.state.jugadores[this.state.players[1]].datiles;
				mercanciast[1]+=this.state.jugadores[this.state.players[1]].pimienta;
				if(mercanciast[0]>mercanciast[1]){
					this.state.ganador=this.state.players[0];
				}
				else if(mercanciast[0]<mercanciast[1]){
					this.state.ganador=this.state.players[1];
				}
				else{
					this.state.empate=true;
				}
			}
		}
		this.broadcast({action:"finpartida",resultado:(this.state.ganador!=null)?this.state.ganador:this.state.empate});
		console.log(puntosf);
		return false;
	}
	comprobarExceso(){
		var mercancias1=0; //jugador1
		var mercancias2=0; //jugador2


		mercancias1+=this.state.jugadores[this.state.players[0]].datiles;
		mercancias1+=this.state.jugadores[this.state.players[0]].sal;
		mercancias1+=this.state.jugadores[this.state.players[0]].pimienta;
		mercancias2+=this.state.jugadores[this.state.players[1]].datiles;
		mercancias2+=this.state.jugadores[this.state.players[1]].sal;
		mercancias2+=this.state.jugadores[this.state.players[1]].pimienta;
		if(mercancias1 > 10){
			this.state.cobrandoExceso=true;
			this.send(this.clients[0],{action:"mensaje",mensaje:"Cobrando Excesos de mercancia espere porfavor."});
			this.send(this.clients[0],{action:"excesoM",diferencia:mercancias1-10,actual:this.state.jugadores[this.state.players[0]]});
			this.state.excesoscobrados++;
		}
		if(mercancias2 > 10){
			this.state.cobrandoExceso=true;
			this.send(this.clients[1],{action:"mensaje",mensaje:"Cobrando Excesos de mercancia espere porfavor."});
			this.send(this.clients[1],{action:"excesoM",diferencia:mercancias2-10,actual:this.state.jugadores[this.state.players[1]]});
			this.state.excesoscobrados++;
		}
		if(this.state.jugadores[this.state.players[0]].oro > 3){
			this.state.jugadores[this.state.players[0]].oro=3;
		}
		if(this.state.jugadores[this.state.players[1]].oro > 3){
			this.state.jugadores[this.state.players[1]].oro=3;
		}
	}
	cambiarTurno(cliente){
		//lastTurno indica que el jugador 1
		console.log("aqui cambiando de turno");
		if(this.state.lastTurno){
			this.findeJuego(cliente)
		}
		//Siguiente ronda
		// si ya todos en esta ronda (compra/rechaza/cobra) hicieron lo que tenían que hacer ,cambio de ronda.
		if(this.state.estado ==3  &&!this.state.cobrandoAsalto && this.state.jugadores[this.state.players[0]].intersec<=0 && this.state.jugadores[this.state.players[1]].intersec<=0 && this.state.jugadores[this.state.players[0]].cobraBorde<=0 && this.state.jugadores[this.state.players[1]].cobraBorde<=0){
			if(!this.state.aumentadoefecto){
				if(this.state.jugadores[this.state.players[0]].efectoA[0] && this.state.jugadores[this.state.players[0]].flagMerca[0]){
					this.state.jugadores[this.state.players[0]].datiles++;
					this.send(this.clients[0],{action:"mensaje",mensaje:"Adquiriste uno mas de datiles por carta tribu tuareg"});
				}
				if(this.state.jugadores[this.state.players[0]].efectoA[1] && this.state.jugadores[this.state.players[0]].flagMerca[1]){
					this.state.jugadores[this.state.players[0]].sal++;
					this.send(this.clients[0],{mensaje:"Adquiriste uno mas de sal por carta tribu oasis"});
				}
				if(this.state.jugadores[this.state.players[0]].efectoA[2] && this.state.jugadores[this.state.players[0]].flagMerca[2]){
					this.state.jugadores[this.state.players[0]].pimienta++;
					this.send(this.clients[0],{mensaje:"Adquiriste uno mas de pimienta por carta tribu camello"});
				}
				if(this.state.jugadores[this.state.players[0]].efectoU[0] && !this.state.jugadores[this.state.players[0]].flagMerca[0] && !this.state.jugadores[this.state.players[0]].flagMerca[1] && !this.state.jugadores[this.state.players[0]].flagMerca[2] ){
					this.send(this.clients[0],{action:"showC",carta:this.state.cartas_mercancia_baraja.pop(),actual:this.state.jugadores[this.state.players[0]]})
					//verificar si nos quedamos sin cartas
					if(this.state.cartas_mercancia_baraja.length <=0){
						//tomar el cementerio de cartas, barajearlo y volverlo la nueva baraja
						estado.cartas_mercancia_baraja=estado.cartas_mercancia_recicla;
						estado.cartas_mercancia_recicla=[];
						shuffle(estado.cartas_mercancia_baraja);
					}
					this.send(this.clients[0],{mensaje:"No conseguiste ninguna mercancia esta ronda, ten una carta de mercancia"});
				}
				if(this.state.jugadores[this.state.players[1]].efectoA[0] && this.state.jugadores[this.state.players[1]].flagMerca[0]){
					this.state.jugadores[this.state.players[1]].datiles++;
					this.send(this.clients[1],{mensaje:"Adquiriste uno mas de datiles por carta tribu tuareg"});
				}
				if(this.state.jugadores[this.state.players[1]].efectoA[1] && this.state.jugadores[this.state.players[1]].flagMerca[1]){
					this.state.jugadores[this.state.players[1]].sal++;
					this.send(this.clients[1],{mensaje:"Adquiriste uno mas de sal por carta tribu oasis"});
				}
				if(this.state.jugadores[this.state.players[1]].efectoA[2] && this.state.jugadores[this.state.players[1]].flagMerca[2]){
					this.state.jugadores[this.state.players[1]].pimienta++;
					this.send(this.clients[1],{mensaje:"Adquiriste uno mas de pimienta por carta tribu camello"});
				}
				if(this.state.jugadores[this.state.players[1]].efectoU[0] && !this.state.jugadores[this.state.players[1]].flagMerca[0] && !this.state.jugadores[this.state.players[1]].flagMerca[1] && !this.state.jugadores[this.state.players[1]].flagMerca[2] ){
					this.send(this.clients[1],{action:"showC",carta:this.state.cartas_mercancia_baraja.pop(),actual:this.state.jugadores[this.state.players[1]]})
					//verificar si nos quedamos sin cartas
					if(this.state.cartas_mercancia_baraja.length <=0){
						//tomar el cementerio de cartas, barajearlo y volverlo la nueva baraja
						estado.cartas_mercancia_baraja=estado.cartas_mercancia_recicla;
						estado.cartas_mercancia_recicla=[];
						shuffle(estado.cartas_mercancia_baraja);
					}
					this.send(this.clients[1],{mensaje:"No conseguiste ninguna mercancia esta ronda, ten una carta de mercancia"});
				}

				this.state.aumentadoefecto=true;
			}

			//si hay exceso cambiar el estado del servidor
			this.comprobarExceso();

			//si no se necesita cobrar exceso entonces finalizar ronda
			if(!this.state.cobrandoExceso){
				console.log("sin exceso");





				this.state.estado++;
				this.moverAsaltante(cliente);
				//borramos variables/arreglos auxiliares
				this.state.jugadores[this.state.players[0]].c_In=[];
				this.state.jugadores[this.state.players[1]].c_In=[];
				this.state.jugadores[this.state.players[0]].f_In=[];
				this.state.jugadores[this.state.players[1]].f_In=[];
				this.state.jugadores[this.state.players[0]].flagMerca=[false,false,false];
				this.state.jugadores[this.state.players[1]].flagMercan=[false,false,false];
				//comprobar si se adquirió datiles , pimienta o sal mediante cartas merca para aplicar efecto de cartas tipo A




				this.state.excesoscobrados=0;
				this.state.aumentadoefecto=false;
				this.state.estado++;
				//Comprobar si hay asalto
				/////////Aqui realizar asalto///
				if(this.state.asaltante_pos==4 || this.state.asaltante_pos==8 || this.state.asaltante_pos==12 || this.state.asaltante_pos==16 ){
					if(!this.state.jugadores[this.state.players[0]].efectoU[1]){
						this.send(this.clients[0],{action:"asalto",posicion:this.state.asaltante_pos,act: this.state.jugadores[this.state.players[0]]});
					}
					else{
						this.state.asaltoscobrados++;
					}
					if(!this.state.jugadores[this.state.players[1]].efectoU[1]){
						this.send(this.clients[1],{action:"asalto",posicion:this.state.asaltante_pos,act:this.state.jugadores[this.state.players[1]]});
					}
					else{
						this.state.asaltoscobrados++;
					}

				}
				else{

					this.broadcast({action:"refreshall"})
					//
					this.state.estado=1;

					// Aplicando efectoU 9
					if(this.state.jugadores[this.state.players[0]].efectoU[8]){
						this.state.jugadores[this.state.players[0]].fichasT=3;
						this.state.jugadores[this.state.players[1]].fichasT=2;
						this.state.jugadores[this.state.players[0]].efectoU[8]=false;
						this.send(this.clients[1],{action:"mensaje",mensaje:"Se te resta una ficha tuareg por carta efecto de contrincate"});
					}
					else if (this.state.jugadores[this.state.players[1]].efectoU[8]){
						this.state.jugadores[this.state.players[0]].fichasT=2;
						this.state.jugadores[this.state.players[1]].fichasT=3;
						this.state.jugadores[this.state.players[1]].efectoU[8]=false;
						this.send(this.clients[0],{action:"mensaje",mensaje:"Se te resta una ficha tuareg por carta efecto de contrincate"});
					}
					else{
						this.state.jugadores[this.state.players[0]].fichasT=3;
						this.state.jugadores[this.state.players[1]].fichasT=3;
					}

					this.state.fichaInicio=(this.state.fichaInicio== this.state.players[0])?this.state.players[1]:this.state.players[0];
					this.state.turno_act=this.state.fichaInicio;
				}
			}




				//Comprobar si exedes la cantidad de mercancias y oro limite del juego

		}
		//si no, cambio de turno.
		else{
			this.state.turno_act=((this.state.players[0]==this.state.turno_act) ?this.state.players[1] :this.state.players[0] );
		}
		//comprobar si tablero esta lleno si eres jugador1 entonces es la ultima ronda , de lo contrario el juego termina en este cambio de turno.
		if(this.isTableroLleno(this.state,cliente) && this.state.estado==3 && this.state.fichaInicio==cliente.id){ // si eres el indice 0 de clients eres el jugador con la ficha de inicio
				this.state.lastTurno=true;
		}

		//siguiente turno



	}
	// Genera la intersección y ubica la marca en dos arreglos distintos: tableroInter y tableroTuareg
	applicarIntersec(estado,cliente){
		//console.log("interseccion");
		if(estado.jugadores[cliente].c_In.length>0 && estado.jugadores[cliente].f_In.length >0/* &&( estado.jugadores[cliente].f_In[0]!=  estado.jugadores[cliente].f_In[1] && estado.jugadores[cliente].c_In[0] !=  estado.jugadores[cliente].c_In[1])*/){
			if(estado.jugadores[cliente].c_In.length < estado.jugadores[cliente].f_In.length){
				estado.jugadores[cliente].f_In.forEach(function(el,ind){
					if(estado.tableroInter[el][estado.jugadores[cliente].c_In[0]]==0){
						estado.tableroInter[el][estado.jugadores[cliente].c_In[0]]=cliente;
						estado.tableroTuareg[el][estado.jugadores[cliente].c_In[0]]=estado.jugadores[cliente].colorM;
						estado.jugadores[cliente].intersec+=1;
						console.log(estado.tableroInter[el][estado.jugadores[cliente].c_In[0]]);
					}

				});
			}
			else if(estado.jugadores[cliente].c_In.length > estado.jugadores[cliente].f_In.length ){
				estado.jugadores[cliente].c_In.forEach(function(el,ind){
					if(estado.tableroInter[ estado.jugadores[cliente].f_In[0] ][ el ]==0){
						estado.tableroInter[ estado.jugadores[cliente].f_In[0] ][ el ]=cliente;
						estado.tableroTuareg[ estado.jugadores[cliente].f_In[0] ][ el ]=estado.jugadores[cliente].colorM;
						estado.jugadores[cliente].intersec+=1;
						console.log(estado.tableroInter[estado.jugadores[cliente].f_In[0]][el]);
					}

				});
			}
			else if(estado.jugadores[cliente].c_In.length == estado.jugadores[cliente].f_In.length ){
				estado.jugadores[cliente].f_In.forEach(function(el,ind){
					if(estado.tableroInter[el][estado.jugadores[cliente].c_In[0]]==0){
						estado.tableroInter[el][estado.jugadores[cliente].c_In[0]]=cliente;
						estado.tableroTuareg[el][estado.jugadores[cliente].c_In[0]]=estado.jugadores[cliente].colorM;
						estado.jugadores[cliente].intersec+=1;
						console.log(estado.tableroInter[el][estado.jugadores[cliente].c_In[0]]);
					}

				});
			}
		}

		/*else {
			// hacer intersección especial o continuar solo con bordes
			//if(estado.jugadores[cliente].c_In.length>0 && (estado.jugadores[cliente].c_In[0]==estado.jugadores[cliente].c_In[1] ))
			if(estado.jugadores[cliente].c_In.length>0 && estado.jugadores[cliente].c_In.some(function(el,index,arr){return el == arr[index+1];})){

				//tomar indices de elementos iguales
				var col;
				estado.jugadores[cliente].c_In.some(function(el,index,arr){
					if(el == arr[index+1])
					{
						col=arr[index];
					}
					return (el == arr[index+1]);

				})
				console.log(col);
				console.log("intersección especial columna");
				//if(estado.tableroInter[2][estado.jugadores[cliente].c_In[0]]==0)
				if(estado.tableroInter[2][col]==0){
					estado.tableroInter[2][col]=cliente;
					estado.tableroTuareg[2][col]=estado.jugadores[cliente].colorM
				}
				else{
					console.log("debo borrar la marca");
					estado.tableroInter[2][col]=0;
					estado.tableroTuareg[2][col]=0;
				}

				if(estado.jugadores[cliente].f_In.length>0){
						estado.tableroInter[estado.jugadores[cliente].f_In[0]][col]=cliente;
						estado.tableroTuareg[estado.jugadores[cliente].f_In[0]][col]=estado.jugadores[cliente].colorM
				}

			}
			//else if(estado.jugadores[cliente].f_In.length>0 && estado.jugadores[cliente].f_In[0]==estado.jugadores[cliente].f_In[1])
			else if(estado.jugadores[cliente].f_In.length>0 && estado.jugadores[cliente].f_In.some(function(el,index,arr){return el == arr[index+1];})){
				console.log("interseccion especial fila")
				var fila
				estado.jugadores[cliente].f_In.some(function(el,index,arr){
					if(el == arr[index+1]){
							fila=arr[index];
					}

					return (el == arr[index+1]);
				})
				console.log(fila);
				//if(estado.tableroInter[estado.jugadores[cliente].f_In[0]][2]==0)
				if(estado.tableroInter[fila][2]==0){
					estado.tableroInter[fila][2]=cliente;
					estado.tableroTuareg[fila][2]=estado.jugadores[cliente].colorM
				}
				else{
					estado.tableroInter[fila][2]=0;
					estado.tableroTuareg[fila][2]=0;
				}
				if(estado.jugadores[cliente].c_In.length>0){
						estado.tableroInter[fila][estado.jugadores[cliente].c_In[0]]=cliente;
						estado.tableroTuareg[fila][estado.jugadores[cliente].c_In[0]]=estado.jugadores[cliente].colorM
				}
			}
		}*/

	}
	frenteVacio(data,estado,cliente){  // Auxiliar de la función ponerFichas()
		if(data.fila ==0 || data.fila==4){
			return typeof(estado.tableroTuareg[((data.fila==0)?4:0)][data.columna])=="number" || estado.tableroTuareg[((data.fila==0)?4:0)][data.columna] == estado.jugadores[cliente.id].colorT ;
		}
		if(data.fila!=0 && data.fila!=4){
			return typeof(estado.tableroTuareg[data.fila][((data.columna==0)?4:0)])=="number" || estado.tableroTuareg[data.fila][((data.columna==0)?4:0)]==estado.jugadores[cliente.id].colorT;
		}
	}
	ponerFichas(data,estado,cliente){
		if(data.action=="select" && !estado.reubica && typeof(estado.tableroInter[data.fila][data.columna])!="string" && (typeof(estado.tableroCartas[data.fila][data.columna])=="string" && estado.tableroCartas[data.fila][data.columna].indexOf("asalto")==-1)  && estado.jugadores[cliente.id].fichasT > 0 && (estado.jugadores[cliente.id].efectoU[6] || estado.tableroAsaltante[data.fila][data.columna]!="A") ){
			if(this.frenteVacio(data,estado,cliente)){
				if(data.fila ==0 || data.fila==4){
					estado.jugadores[cliente.id].c_In.push(data.columna);
				}
				if(data.fila!=0 && data.fila!=4){
					estado.jugadores[cliente.id].f_In.push(data.fila);
				}
				estado.tableroTuareg[data.fila][data.columna]= estado.jugadores[cliente.id].colorT// jugador que inicia la sala es el colorT azul
				estado.tableroInter[data.fila][data.columna]=cliente.id;
				estado.jugadores[cliente.id].fichasT--;
				estado.jugadores[cliente.id].cobraBorde++;
				//posible solucion al error de las 2 fichasT
				var jugadorcontrario= (this.clients[0].id==cliente.id) ?this.clients[1].id:this.clients[0].id;
				if(estado.jugadores[jugadorcontrario].fichasT>0){
					this.cambiarTurno(cliente);
				}

				console.log(data);
			}
		}
		if(estado.jugadores[estado.players[0]].fichasT <=0 && estado.jugadores[estado.players[1]].fichasT <=0 && !estado.reubica){
			estado.estado++;
			this.applicarIntersec(estado,estado.players[0]); // intersección para jugador 1
			this.applicarIntersec(estado,estado.players[1]); // intersección para jugador 2
			estado.estado++; // Se pasa al estado 3
			estado.turno_act=estado.fichaInicio;
		}
		if(estado.reubica && estado.jugadores[cliente.id].intersec>0){
			if(estado.tableroInter[data.fila][data.columna]==0){
				estado.estado++;
				estado.tableroInter[data.fila][data.columna]=cliente.id;
				estado.tableroTuareg[data.fila][data.columna]=estado.jugadores[cliente.id].colorM;
				estado.estado++;
				estado.reubica=false;
			}
		}
		else if(estado.reubica){
			estado.estado++;
			estado.estado++;
			estado.reubica=false;
		}

	}
	barajear(sala){

		var estado=this.state;

		MongoClient.connect(url, function(err, db) {
		  if (err) {throw err};
		  db.collection("cartas_mercancia").find({}).toArray(function(err, result) {
			 console.log("barajeando en sala:  "+sala);
			if (err) {throw err};

			result=shuffle(result);
			estado.cartas_mercancia_baraja=result;
			db.collection("cartas_tribu").find({}).toArray(function(err, result) {
				if (err) {throw err};

				 result=shuffle(result);
				estado.cartas_tribu_baraja=result;
				console.log("barajeado en sala: " + sala);
				db.close();

				var Act_carta=false;


				for(var i=1;i<4;i++){
					for(var j=1;j<4;j++){
						if(Act_carta){
							estado.tableroCartas[i][j]=estado.cartas_tribu_baraja.pop();
							Act_carta=false;
						}
						else{
							estado.tableroCartas[i][j]=estado.cartas_mercancia_baraja.pop();
							Act_carta=true;
						}
					}
				}
				/*estado.tableroCartas.forEach(function(fila,indexf){
					fila.forEach(function(carta,indexc,arreglo){
						if(Act_carta){
							arreglo[indexc]=estado.cartas_tribu_baraja.pop();
							Act_carta=false;
						}
						else{
							arreglo[indexc]=estado.cartas_mercancia_baraja.pop();
							Act_carta=true;
						}

					});

				});*/

		  	});


		  });
		});

	}
}

module.exports= Tuareg;

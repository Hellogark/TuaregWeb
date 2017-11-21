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
			tablero_jugador1:[[],[],[]],
			tablero_jugador2:[[],[],[]],
			cartas_tribu_baraja:[],
			cartas_mercancia_baraja:[],
			cartas_tribu_recicla:[],   // cartas desechadas
			cartas_mercancia_recicla:[], //cartas desechadas
			turno_act:0,
			asaltante_pos:1,
			empate:null,
			ganador:null,
			estado:1,
			players:null, // player 0 es azul player 1 es gris
			reubica:false
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
			descuentos:false,
			tarjetaMano:null,
			intersec:0
		};

		this.state.jugadores[client.id].colorT=((this.state.jugadores[client.id].playerIndex==0)? "targiAzul":"targiGris");
		this.state.jugadores[client.id].colorM=((this.state.jugadores[client.id].playerIndex==0)? "marcadorAzul":"marcadorGris");

		if(this.clients.length == 2 ){
			this.state.turno_act = this.clients[Math.floor(Math.random()*1)].id;
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

		if (client.id == this.state.turno_act){
			//Comprobar  que es lo que actualmente se esta haciendo:
			//1)poniendo fichas tuareg
			//2)utilizando/comprando cartas
			switch(this.state.estado){
				case 1:
					this.ponerFichas(data,this.state,client);
				break;
				case 3:
					this.interCobra(data,this.state,client);
					//this.cobraCartaMerca(data,this.state,client);
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
	reubicar(data,estado,cliente){

		estado.tableroInter[data.fila][data.columna]=0;
		estado.tableroTuareg[data.fila][data.columna]=0;
		this.broadcast({action:"refresh",fila:data.fila,columna:data.columna,reubica:estado.reubica});
		estado.estado=1;
		estado.jugadores[cliente.id].fichasT++;

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
						estado.jugadores[cliente.id].datiles-=2;
						estado.jugadores[cliente.id].puntosv+=4;
			break;
		}
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
	}
	interCobra(data,estado,cliente){

		if(data.action=="choset"){
			if(data.columna!=null && data.fila!=null){
				console.log()
				this.cobraCartaTribu(data,estado,cliente,true);
			}
			else{
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
			this.reubicar(data,estado,cliente);
		}
		else if(data.action=="ofebre"){
			this.cobraOfebre(data,estado,cliente);
		}
		else if(data.action=="comerciante"){
			this.cobraComerciante(data,estado,cliente);
		}
		else if(cliente.id === estado.turno_act && estado.tableroInter[data.fila][data.columna]==cliente.id){
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
				break;
				case "E":
					//Espejismo
					if(estado.jugadores[cliente.id].intersec>0){
							estado.reubica=true;
					}

				break;
				case "N":
					//Nobles
					this.send(cliente,{action:"showTr",carta:estado.jugadores[cliente.id].tarjetaMano});
					carta:estado.jugadores[cliente.id].tarjetaMano=null;

				break;
				case "d":
					estado.jugadores[cliente.id].datiles++;

				break;
				case "p":
					estado.jugadores[cliente.id].pimienta++;
				break;
				case "s":
					estado.jugadores[cliente.id].sal++;
				break;
				case "o":
					estado.jugadores[cliente.id].oro++;
				break;
				case "v":
					estado.jugadores[cliente.id].puntosv++;
				break;
			}
			estado.tableroInter[data.fila][data.columna]=0;
			estado.tableroTuareg[data.fila][data.columna]=0;
			this.broadcast({action:"refresh",fila:data.fila,columna:data.columna});

	}


	cobraCartaTribu(data,estado,cliente,isfromtablero){
		var carta=(isfromtablero) ? this.state.tableroCartas[data.fila][data.columna] : data.data;
		console.log("Aqui andamos: "+'\n');
		console.log(carta);
		console.log('\n');
		if(data.action==="choset"){
			// Mediante data.cartafila , data.cartacolumna y data.tarifa obtener la tarifa correspondiente  aplicarla y pasar la carta al tablero mediante data.fila y data.columna , luego reemplazar carta en tableroInter
			switch(data.tarifa){
				case 1:
					console.log(carta.costo1_d);
					console.log(data);
					var columnaReal;
					estado.jugadores[cliente.id].datiles-= carta.costo1_d;
					estado.jugadores[cliente.id].sal-= carta.costo1_s;
					estado.jugadores[cliente.id].pimienta-= carta.costo1_p;
					estado.jugadores[cliente.id].oro-= carta.costo1_o;
					if(estado.jugadores[cliente.id].playerIndex == 0){
						estado.tablero_jugador1[data.cartafila].push(carta);
						columnaReal=estado.tablero_jugador1[data.cartafila].length-1;
					}
					else{
						estado.tablero_jugador2[data.cartafila].push(carta);
						columna=estado.tablero_jugador2[data.cartafila].length-1;
					}
					if(isfromtablero){
						console.log("es carta del tablero")
						this.state.tableroCartas[data.fila][data.columna]= estado.cartas_mercancia_baraja.pop();
						estado.tableroInter[data.fila][data.columna]=0;
						estado.tableroTuareg[data.fila][data.columna]=0;
						estado.jugadores[cliente.id].intersec--;
						this.broadcast({action:"refresh",fila:data.fila,columna:data.columna});
					}
					this.broadcast({action:"refreshtj",fila:data.cartafila,columna:columnaReal,clientid:cliente.id,cartaid:carta._id});

				break;
				case 2:
					console.log(data);
					var columnaReal;
					estado.jugadores[cliente.id].oro-= carta.costo2_o;
					if(estado.jugadores[cliente.id].playerIndex == 0){
						estado.tablero_jugador1[data.cartafila].push(carta);
						columnaReal=estado.tablero_jugador1[data.cartafila].length-1;
					}
					else{
						estado.tablero_jugador2[data.cartafila].push(carta);
						columna=estado.tablero_jugador2[data.cartafila].length-1;
					}
					if(isfromtablero){
						this.state.tableroCartas[data.fila][data.columna]= estado.cartas_mercancia_baraja.pop();
						estado.tableroInter[data.fila][data.columna]=0;
						estado.tableroTuareg[data.fila][data.columna]=0;
						estado.jugadores[cliente.id].intersec--;
						this.broadcast({action:"refresh",fila:data.fila,columna:data.columna});
					}
					this.broadcast({action:"refreshtj",fila:data.cartafila,columna:columnaReal,clientid:cliente.id,cartaid:carta._id});

				break;
				case 3:
					console.log(data);
				break;
				case 4:
					if(isfromtablero){
						this.state.tableroCartas[data.fila][data.columna]= estado.cartas_mercancia_baraja.pop();
						estado.tableroInter[data.fila][data.columna]=0;
						estado.tableroTuareg[data.fila][data.columna]=0;
						estado.jugadores[cliente.id].intersec--;
						this.broadcast({action:"refresh",fila:data.fila,columna:data.columna});
					}
					estado.jugadores[cliente.id].tarjetaMano=carta;
					//this.broadcast({action:"refreshtjm",clientid:cliente.id,cartaid:carta._id});
					this.broadcast({action:"refreshtjm",fila:data.fila,columna:data.columna,cartaid:carta._id,clientid:cliente.id});

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
						this.broadcast({action:"refresh",fila:data.fila,columna:data.columna});
					}

				break;

			}

		}
		else{
			this.send(cliente,{action:"choset",fila:data.fila,columna:data.columna,costo:[carta.costo1_d,carta.costo1_s,carta.costo1_o,carta.costo1_p,carta.costo2_o ],
			descuento:estado.jugadores[cliente.id].descuentos,tarjetaMano:(estado.jugadores[cliente.id].tarjetaMano===null ?true :false),data:carta});
		}

	}
	cobraCartaMerca(data,estado,cliente,isfromtablero){

		var carta=(isfromtablero) ? this.state.tableroCartas[data.fila][data.columna] : data.data;
		//console.log(carta.otorga);
		if(data.action=="chosem"){
			switch(data.otorga){
				case 1:
					estado.jugadores[cliente.id].datiles++;
				break;
				case 3:
				estado.jugadores[cliente.id].pimienta++;
				break;
				case 2:
				estado.jugadores[cliente.id].sal++;
				break;
				case "o":
				estado.jugadores[cliente.id].oro++;
				break;
				case "v":
				estado.jugadores[cliente.id].puntosv++;
				break;
			}
			if(isfromtablero){
				estado.tableroCartas[data.fila][data.columna]= estado.cartas_tribu_baraja.pop();
				estado.tableroInter[data.fila][data.columna]=0;
				estado.tableroTuareg[data.fila][data.columna]=0;
				estado.jugadores[cliente.id].intersec--;
			}
			estado.cartas_mercancia_recicla.push(carta);
			this.broadcast({action:"refresh",fila:data.fila,columna:data.columna});
		}
		else if(carta.otorga.length>2){
			this.send(cliente,{action:"chosem",fila:data.fila,columna:data.columna});
		}
		else if(carta.otorga.length ==1){
			switch(carta.otorga){
				case "d":
					estado.jugadores[cliente.id].datiles++;
				break;
				case "p":
				estado.jugadores[cliente.id].pimienta++;
				break;
				case "s":
				estado.jugadores[cliente.id].sal++;
				break;
				case "o":
				estado.jugadores[cliente.id].oro++;
				break;
				case "v":
				estado.jugadores[cliente.id].puntosv++;
				break;
			}
			if(isfromtablero){
				estado.tableroCartas[data.fila][data.columna]= estado.cartas_tribu_baraja.pop();
				estado.tableroInter[data.fila][data.columna]=0;
				estado.tableroTuareg[data.fila][data.columna]=0;
				estado.jugadores[cliente.id].intersec--;

			}
			estado.cartas_mercancia_recicla.push(carta);
			this.broadcast({action:"refresh",fila:data.fila,columna:data.columna});
		}
		else if(carta.otorga.length ==2 && !isNaN(carta.otorga[0])){ // si su tamaño es 2 y el primer elemento es un numero
				var cantidad = Number(carta.otorga[0]);
			switch(carta.otorga[1]){
				case "d":
					estado.jugadores[cliente.id].datiles+=cantidad;
				break;
				case "p":
				estado.jugadores[cliente.id].pimienta+=cantidad;
				break;
				case "s":
				estado.jugadores[cliente.id].sal+=cantidad;
				break;
				case "o":
				estado.jugadores[cliente.id].oro+=cantidad;
				break;
				case "v":
				estado.jugadores[cliente.id].puntosv++;
				break;
			}
			if(isfromtablero){
				estado.tableroCartas[data.fila][data.columna]= estado.cartas_tribu_baraja.pop();
				estado.tableroInter[data.fila][data.columna]=0;
				estado.tableroTuareg[data.fila][data.columna]=0;
				estado.jugadores[cliente.id].intersec--;

			}
			estado.cartas_mercancia_recicla.push(carta);
			this.broadcast({action:"refresh",fila:data.fila,columna:data.columna});
		}
		else if(carta.otorga.length ==2 && isNaN(carta.otorga[0])){ // si su tamaño es 2 y el primer elemento no es un numero
			switch(carta.otorga[0]){
				case "d":
					estado.jugadores[cliente.id].datiles++;
				break;
				case "p":
				estado.jugadores[cliente.id].pimienta++;
				break;
				case "s":
				estado.jugadores[cliente.id].sal++;
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
				break;
				case "p":
				estado.jugadores[cliente.id].pimienta++;
				break;
				case "s":
				estado.jugadores[cliente.id].sal++;
				break;
				case "o":
				estado.jugadores[cliente.id].oro++;
				break;
				case "v":
				estado.jugadores[cliente.id].puntosv++;
				break;
			}
			if(isfromtablero){
				estado.tableroCartas[data.fila][data.columna]= estado.cartas_tribu_baraja.pop();
				estado.tableroInter[data.fila][data.columna]=0;
				estado.tableroTuareg[data.fila][data.columna]=0;
				estado.jugadores[cliente.id].intersec--;

			}
			estado.cartas_mercancia_recicla.push(carta);
			this.broadcast({action:"refresh",fila:data.fila,columna:data.columna});
		}

	}

	moverAsaltante(){
		if(this.state.asaltante_pos==16){
			return -1;
		}
		var act_pos=this.state.asaltante_pos;
		var estado=this.state
		this.state.asaltante_pos++;
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

	cambiarTurno(){
		this.state.turno_act=((this.state.jugadores[this.state.turno_act].playerIndex==0)? this.clients[1].id :this.clients[0].id );
	}


	applicarIntersec(estado,cliente){	// Genera la intersección y ubica la marca en dos arreglos distintos: tableroInter y tableroTuareg
		//console.log("interseccion");
		if(estado.jugadores[cliente].c_In.length>0 && estado.jugadores[cliente].f_In.length >0/* &&( estado.jugadores[cliente].f_In[0]!=  estado.jugadores[cliente].f_In[1] && estado.jugadores[cliente].c_In[0] !=  estado.jugadores[cliente].c_In[1])*/){
			if(estado.jugadores[cliente].c_In.length < estado.jugadores[cliente].f_In.length){
				estado.jugadores[cliente].f_In.forEach(function(el,ind){
					estado.tableroInter[el][estado.jugadores[cliente].c_In[0]]=cliente;
					estado.tableroTuareg[el][estado.jugadores[cliente].c_In[0]]=estado.jugadores[cliente].colorM;
					estado.jugadores[cliente].intersec+=1;
					console.log(estado.tableroInter[el][estado.jugadores[cliente].c_In[0]]);
				});
			}
			if(estado.jugadores[cliente].c_In.length > estado.jugadores[cliente].f_In.length){
				estado.jugadores[cliente].c_In.forEach(function(el,ind){
					estado.tableroInter[ estado.jugadores[cliente].f_In[0] ][ el ]=cliente;
					estado.tableroTuareg[ estado.jugadores[cliente].f_In[0] ][ el ]=estado.jugadores[cliente].colorM;
					estado.jugadores[cliente].intersec+=1;
					console.log(estado.tableroInter[estado.jugadores[cliente].f_In[0]][el]);
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
		if(data.action=="select" && !estado.reubica && typeof(estado.tableroInter[data.fila][data.columna])!="string" && estado.tableroCartas[data.fila][data.columna].indexOf("asalto")==-1  && estado.jugadores[cliente.id].fichasT > 0 &&estado.tableroAsaltante[data.fila][data.columna]!="A" ){
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

				this.cambiarTurno();
				console.log(data);
			}
		}
		if(estado.jugadores[estado.players[0]].fichasT <=0 && estado.jugadores[estado.players[1]].fichasT <=0 && !estado.reubica){
			estado.estado++;
			this.applicarIntersec(estado,estado.players[0]); // intersección para jugador 1
			this.applicarIntersec(estado,estado.players[1]); // intersección para jugador 2
			estado.estado++;
		}
		if(estado.reubica && estado.jugadores[cliente.id].intersec>0){
			estado.estado++;
			estado.tableroInter[data.fila][data.columna]=cliente.id;
			estado.tableroTuareg[data.fila][data.columna]=estado.jugadores[cliente.id].colorM;
			estado.estado++;
			estado.reubica=false;
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

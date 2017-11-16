var Room = require("colyseus").Room;
var cartaTrib=require("../Model/modelousuario.js").CartasTribu;
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://192.168.0.8:27017/Tuareg";
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
				["#asalto4","#Nobles","#datil1Borde","#sal1borde","#asalto1"],
				["#sal2borde",56, 56, 56,"#comerciante"],
				["#ampTribu",56, 56, 56,"#pimineta1Borde"],
				["#caravana",56, 56, 56,"#datil2Borde"],
				["#asalto3","#pimienta2Borde","#orfebre","#Espejismo","#asalto2"]
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
			tablero_jugador1:[[0],[0],[0]],
			tablero_jugador2:[[0],[0],[0]],
			cartas_tribu_baraja:[0],
			cartas_mercancia_baraja:[0],
			cartas_tribu_recicla:[0],   // cartas desechadas
			cartas_mercancia_recicla:[0], //cartas desechadas
			turno_act:0,
			asaltante_pos:1,
			empate:null,
			ganador:null,
			estado:1,
			players:null, // player 0 es azul player 1 es gris
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
			fichas_victoria:[1,1,0] , //[0]= fichas 1 punto , [1]=fichas 3 puntos , [2]=fichas 5 puntos
			playerIndex:client.playerIndex,
			fichasT:3,
			colorT:null,
			colorM:null,
			f_In:[],
			c_In:[]
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
	interCobra(data,estado,cliente){
		if(cliente.id === estado.turno_act && estado.tableroInter[data.fila][data.columna]==cliente.id){
			if(estado.tableroCartas[data.fila][data.columna].tipo === undefined) // es una carta de mercancia
			{
				console.log("cartaMercancia");
				this.cobraCartaMerca(data,estado,cliente);
			}
			else if(typeof(estado.tableroCartas[data.fila][data.columna])== "string"){
				console.log("cartaBorde");
			}
			else{
				this.cobraCartaBorde(data,estado,cliente);
				console.log("cartaTribu");
			}
		}
	}
	cobraCartaBorde(){
		
	}
	cobraCartaMerca(data,estado,cliente){
		if(data.action=="chose"){
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
			}
			estado.cartas_mercancia_recicla.push(estado.tableroCartas[data.fila][data.columna]);
			estado.tableroCartas[data.fila][data.columna]= estado.cartas_mercancia_baraja.pop();
			estado.tableroInter[data.fila][data.columna]=0;
			this.broadcast({action:"refresh",fila:data.fila,columna:data.columna});


		}
		else if(this.state.tableroCartas[data.fila][data.columna].otorga.length>2){
			this.send(cliente,{action:"chose",fila:data.fila,columna:data.columna});
		}
		else if(this.state.tableroCartas[data.fila][data.columna].otorga.length ==1){
			switch(this.state.tableroCartas[data.fila][data.columna].otorga){
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
			}
			estado.cartas_mercancia_recicla.push(estado.tableroCartas[data.fila][data.columna]);
			estado.tableroCartas[data.fila][data.columna]= estado.cartas_mercancia_baraja.pop();
			estado.tableroInter[data.fila][data.columna]=0;
			this.broadcast({action:"refresh",fila:data.fila,columna:data.columna});
		}

		else if(this.state.tableroCartas[data.fila][data.columna].otorga.length ==2 && !isNaN(this.state.tableroCartas[data.fila][data.columna].otorga[0])){ // si su tamaño es 2 y el primer elemento es un numero
				var cantidad = Number(this.state.tableroCartas[data.fila][data.columna].otorga[0]);
			switch(this.state.tableroCartas[data.fila][data.columna].otorga[1]){
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
			}
			estado.cartas_mercancia_recicla.push(estado.tableroCartas[data.fila][data.columna]);
			estado.tableroCartas[data.fila][data.columna]= estado.cartas_mercancia_baraja.pop();
			estado.tableroInter[data.fila][data.columna]=0;
			this.broadcast({action:"refresh",fila:data.fila,columna:data.columna});
		}
		else if(this.state.tableroCartas[data.fila][data.columna].otorga.length ==2 && isNaN(this.state.tableroCartas[data.fila][data.columna].otorga[0])){ // si su tamaño es 2 y el primer elemento no es un numero
			switch(this.state.tableroCartas[data.fila][data.columna].otorga[0]){
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
			}
			switch(this.state.tableroCartas[data.fila][data.columna].otorga[1]){
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
			}
			estado.cartas_mercancia_recicla.push(estado.tableroCartas[data.fila][data.columna]);
			estado.tableroCartas[data.fila][data.columna]= estado.cartas_mercancia_baraja.pop();
			estado.tableroInter[data.fila][data.columna]=0;
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
		console.log("intercepcion");
		if(estado.jugadores[cliente].c_In.length>0 && estado.jugadores[cliente].f_In.length >0){
			if(estado.jugadores[cliente].c_In.length < estado.jugadores[cliente].f_In.length){
				estado.jugadores[cliente].f_In.forEach(function(el,ind){
					estado.tableroInter[el][estado.jugadores[cliente].c_In[0]]=cliente;
					estado.tableroTuareg[el][estado.jugadores[cliente].c_In[0]]=estado.jugadores[cliente].colorM;
					console.log(estado.tableroInter[el][estado.jugadores[cliente].c_In[0]]);
				});
			}
			if(estado.jugadores[cliente].c_In.length > estado.jugadores[cliente].f_In.length){
				estado.jugadores[cliente].c_In.forEach(function(el,ind){
					estado.tableroInter[ estado.jugadores[cliente].f_In[0] ][ el ]=cliente;
					estado.tableroTuareg[ estado.jugadores[cliente].f_In[0] ][ el ]=estado.jugadores[cliente].colorM;
					console.log(estado.tableroInter[estado.jugadores[cliente].f_In[0]][el]);
				});
			}
		}
		else {
			// hacer intersección especial o continuar solo con bordes
			if(estado.jugadores[cliente].c_In.length>0 && estado.jugadores[cliente].c_In[0]==estado.jugadores[cliente].c_In[1]){
				console.log("intersección especial columna");
				estado.tableroInter[2][estado.jugadores[cliente].c_In[0]]=cliente;
				estado.tableroTuareg[2][estado.jugadores[cliente].c_In[0]]=estado.jugadores[cliente].colorM
			}
			else if(estado.jugadores[cliente].f_In.length>0 && estado.jugadores[cliente].f_In[0]==estado.jugadores[cliente].f_In[1]){
				console.log("interseccion especial fila")
				estado.tableroInter[estado.jugadores[cliente].f_In[0]][2]=cliente;
				estado.tableroTuareg[estado.jugadores[cliente].f_In[0]][2]=estado.jugadores[cliente].colorM
			}
		}

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
		if(data.action=="select" && typeof(estado.tableroInter[data.fila][data.columna])!="string" && !estado.tableroCartas[data.fila][data.columna].includes("asalto")  && estado.jugadores[cliente.id].fichasT > 0 &&estado.tableroAsaltante[data.fila][data.columna]!="A"){
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
		if(estado.jugadores[estado.players[0]].fichasT <=0 && estado.jugadores[estado.players[1]].fichasT <=0 ){
			estado.estado++;
			this.applicarIntersec(estado,estado.players[0]); // intersección para jugador 1
			this.applicarIntersec(estado,estado.players[1]); // intersección para jugador 2
			estado.estado++;
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

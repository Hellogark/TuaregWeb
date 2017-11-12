var Room = require("colyseus").Room;
var cartaTrib=require("../Model/modelousuario.js").CartasTribu;
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/Tuareg";
var shuffle = require("array-shuffle");

const PATCH_RATE=20;

class Tuareg extends Room{
	constructor(options){
		super(options,1000/PATCH_RATE);
		
		this.setState({
			jugadores:{},
			tableroPrincipal:[
				["#asalto4","#Nobles","#datil1Borde","#sal1borde","#asalto2"],
				["#sal2borde",56, 56, 56,"#comerciante"],
				["#ampTribu",56, 56, 56,"#pimineta1Borde"],
				["#caravana",56, 56, 56,"#datil2Borde"],
				["#EII","#pimienta2Borde","#orfebre","#Espejismo","#asalto3"]
			],
			tablero_jugador1:[[0],[0],[0]],
			tablero_jugador2:[[0],[0],[0]],
			cartas_tribu_baraja:[0],
			cartas_mercancia_baraja:[0],
			cartas_tribu_recicla:[0],   // cartas desechadas
			cartas_mercancia_recicla:[0], //cartas desechadas
			turno_act:0,
			empate:null,
			ganador:null
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
			pimineta:2,
			sal:2,
			fichas_victoria:[1,1,0] , //[0]= fichas 1 punto , [1]=fichas 3 puntos , [2]=fichas 5 puntos 			
			playerIndex:client.playerIndex
		};			
			
		

			
		if(this.clients.length == 2 ){
			this.state.turno_act = client.id;
			this.lock();
			this.barajear(this.roomId);
		}
		else{
			this.broadcast({message:"Esperando contrincante"});
		}	
			
	}
	onMessage(client,data){
	
	}
	
	onLeave(client){
		delete this.state.jugadores[client.id];
		if(this.clients > 0){
			this.state.ganador= this.clients[0];
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
							estado.tableroPrincipal[i][j]=estado.cartas_tribu_baraja.pop();
							Act_carta=false;
						}
						else{
							estado.tableroPrincipal[i][j]=estado.cartas_mercancia_baraja.pop();
							Act_carta=true;
						}
					}
				}
				/*estado.tableroPrincipal.forEach(function(fila,indexf){
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

var a=10;
module.exports= Tuareg;
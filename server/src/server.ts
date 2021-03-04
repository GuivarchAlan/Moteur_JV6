import * as path from "path";
import { stringify } from "querystring";
import * as Messages from "../../common/messages";
import { NetworkLeaderBoard } from "../../common/messages";
import { FileProvider } from "./fileprovider";
import { HttpServer } from "./httpserver";
import { Deserializer, Serializer } from "./serializer";
import { Socket, WebSocket } from "./websocket";

const PORT = 8080;

const server = new HttpServer();
// tslint:disable-next-line:no-unused-expression
new FileProvider(path.resolve("../client"), server);
const ws = new WebSocket(server);

interface ISocketData {
  otherPlayer?: Socket;
  name?: string;
}

interface ILeaderBoard {
  name: string;
  score: number;
}

const socketData = new Map<Socket, ISocketData>();
function getSocketData(socket: Socket): ISocketData {
  let data = socketData.get(socket);
  if (!data) {
    data = {};
    socketData.set(socket, data);
  }
  return data;
}

const pendingPlayers = new Set<Socket>();

const leaderBoard : Map<number,ILeaderBoard> = new Map<number,ILeaderBoard>();

var minLeaderBoard :number = 0;
// Cette méthode permet d'envoyer un message à un client.
// Elle s'occupe d'exécuter la sérialisation et l'envoi
// en binaire sur le réseau.
function sendMessage(socket: Socket, message: Messages.NetworkMessage) {
  const serializer = new Serializer();
  message.serialize(serializer);
  socket.send(serializer.toBinary());
}

// Cette méthode est appelée lorsqu'un bloc de données
// binaires est reçu. On y décode alors le message qui y
// est stocké, et on exécute le traitement pertinent en
// réaction à ce message.
function processData(socket: Socket, data: Buffer, id: number) {
  const deserializer = new Deserializer(data);
  const message = Messages.NetworkMessage.create(deserializer);
  onMessage(socket, message, id);
}

// Lorsqu'un message est reçu, cette méthode est appelée
// et, selon le message reçu, une action est exécutée.
function onMessage(socket: Socket, message: Messages.NetworkMessage | null, id: number) {
  
  if (message instanceof Messages.NetworkLogin) {
    onNetworkLogin(socket, message, id);
  }
  if (message instanceof Messages.NetworkInputChanged) {
    sendMessage(getSocketData(socket).otherPlayer!, message);
  }
  if (message instanceof Messages.NetworkScore) {
    updateLeaderBoard(socket,message,id);
  }
}
// permet de mettre à jour le LeaderBoard si nécessaire
function updateLeaderBoard(socket: Socket, message: Messages.NetworkScore, id: number) {
  var toChange = false;
  var toRemove = "";
  if (leaderBoard.size < 3) {
    leaderBoard.set(id, {name : message.name,score : message.score});
    minLeaderBoard = message.score;
    // mettre à jour le plus petit score
    leaderBoard.forEach((value) => {
      if (value.score < minLeaderBoard) {
        minLeaderBoard = value.score;
      }
      toChange = true;
    });
  }
  else if(message.score > minLeaderBoard){
    //remplacer le plus petit score et l'envoyer aux joueurs
    leaderBoard.forEach((value,key) => {
      if (value.score == minLeaderBoard && !toChange) {
        toRemove = value.name;
        leaderBoard.delete(key);
        leaderBoard.set(id, {name : message.name,score : message.score});
        toChange = true;
      }
    });
    // mettre à jour le plus petit score 
    minLeaderBoard = message.score;
    leaderBoard.forEach((value) => {
      if (value.score < minLeaderBoard) {
        minLeaderBoard = value.score;
      }
      toChange = true;
    });
  }
  if (toChange) {
    // si un changement est fait sur le leaderBoard envoie des scores à modifier aux joueurs
    const msg = new NetworkLeaderBoard();
    msg.build({name: message.name, score: message.score, toremove: toRemove})
    socketData.forEach((sockData, sock) => {
      sendMessage(sock,msg);
      console.log("score envoyé à " + sockData.name);
  });
  }
}

// Quand un joueur établit sa connection, il envoie un
// message l'identifiant.
function onNetworkLogin(socket: Socket, message: Messages.NetworkLogin, id: number) {
  getSocketData(socket).name = message.name;

  // Si aucun joueur n'est en attente, on place le nouveau
  // joueur en attente.

  if (pendingPlayers.size === 0) {
    pendingPlayers.add(socket);
    return;
  }
  
  // Si il y a des joueurs en attente, on associe un de
  // ces joueurs à celui-ci.
  const pendingArray = Array.from(pendingPlayers);
  const otherPlayer = pendingArray.shift()!;
  pendingPlayers.delete(otherPlayer);

  const data = getSocketData(socket);
  const otherData = getSocketData(otherPlayer);
  data.otherPlayer = otherPlayer;
  otherData.otherPlayer = socket;

  // envoie du leaderBoard aux nouveaux joueurs

  if (leaderBoard.size > 0) {
    leaderBoard.forEach((value,key) => {
      const msg = new NetworkLeaderBoard();
      msg.build({name: value.name, score: value.score, toremove: ""});
      sendMessage(socket,msg);
      sendMessage(otherPlayer,msg);
    });
  }



  // On envoie alors la liste des joueurs de la partie
  // à chacun des participants.
  const names = [
    otherData.name!,
    data.name!,
  ];

  const p1 = new Messages.NetworkStart();
  const p2 = new Messages.NetworkStart();
  p1.build({playerIndex: 0, names});
  p2.build({playerIndex: 1, names});

  sendMessage(otherPlayer, p1);
  sendMessage(socket, p2);
}

ws.onConnection = (id) => {
  console.log("Nouvelle connexion de " + id);
};

ws.onMessage = (id, socket, data) => {
  console.log("Message de " + id);
  processData(socket, data, id);
};

ws.onClose = (id, socket) => {
  console.log("Fermeture de " + id);

  const data = getSocketData(socket);
  if (data.otherPlayer) {
    socketData.delete(data.otherPlayer);
    data.otherPlayer.close();
  }

  socketData.delete(socket);
  pendingPlayers.delete(socket);
};

server.listen(PORT)
  .then(() => {
    console.log("HTTP server ready on port " + PORT);
  });

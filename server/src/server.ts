import * as path from "path";
import * as Messages from "../../common/messages";
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
function processData(socket: Socket, data: Buffer) {
  const deserializer = new Deserializer(data);
  const message = Messages.NetworkMessage.create(deserializer);
  onMessage(socket, message);
}

// Lorsqu'un message est reçu, cette méthode est appelée
// et, selon le message reçu, une action est exécutée.
function onMessage(socket: Socket, message: Messages.NetworkMessage | null) {
  if (message instanceof Messages.NetworkLogin) {
    onNetworkLogin(socket, message);
  }
  if (message instanceof Messages.NetworkInputChanged) {
    sendMessage(getSocketData(socket).otherPlayer!, message);
  }
}

// Quand un joueur établit sa connection, il envoie un
// message l'identifiant.
function onNetworkLogin(socket: Socket, message: Messages.NetworkLogin) {
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
  processData(socket, data);
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

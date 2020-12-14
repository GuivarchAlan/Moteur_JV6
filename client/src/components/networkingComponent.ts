import { NetworkMessage } from "../../../common/messages";
import { EventTrigger } from "../eventTrigger";
import { GlobalConfig } from "../main";
import { Deserializer, Serializer } from "../serializer";
import { Component } from "./component";

// # Classe *NetworkingComponent*
// Ce composant s'occupe des communications réseau.
export class NetworkingComponent extends Component<object> {
  public messageEvent = new EventTrigger();
  private socket!: WebSocket;
  private pendingMessages: Blob[] = [];

  // ## Méthode *create*
  // Cette méthode est appelée pour configurer le composant avant
  // que tous les composants d'un objet aient été créés.
  public create() {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(`ws://${GlobalConfig.server}`, "ChickenDodge");
      this.socket.onopen = resolve;
      this.socket.onerror = reject;
      this.socket.onmessage = (evt) => {
        this.onMessage(evt.data);
      };
    })
    .then(() => {
      for (const blob of this.pendingMessages) {
        this.socket.send(blob);
      }
      this.pendingMessages.length = 0;
    });
  }

  // ## Méthode *send*
  // Cette méthode est appelée par les autres composants afin
  // d'envoyer un message au serveur.
  public send(message: NetworkMessage) {
    const serializer = new Serializer();
    message.serialize(serializer);
    const blob = serializer.toBinary();
    if (this.socket.readyState === this.socket.CONNECTING) {
      this.pendingMessages.push(blob);
    } else {
      this.socket.send(blob);
    }
  }

  // ## Méthode *onMessage*
  // Cette méthode reçoit les messages reçus du réseau, crée le
  // message désiré dans notre format, et l'envoie aux modules
  // concernés.
  private onMessage(blob: Blob) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const deserializer = new Deserializer(reader.result as ArrayBuffer);
      const msg = NetworkMessage.create(deserializer);
      this.messageEvent.trigger(msg);
    };
    reader.readAsArrayBuffer(blob);
  }
}

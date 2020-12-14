import { NetworkLogin, NetworkMessage, NetworkStart } from "../../../common/messages";
import { EventTrigger } from "../eventTrigger";
import { GlobalConfig } from "../main";
import { Component, IComponent } from "./component";
import { IInputComponent } from "./inputComponent";
import { NetworkingComponent } from "./networkingComponent";
import { PlayerComponent } from "./playerComponent";

export interface IPlayerManagerComponent extends IComponent {
  readyEvent: EventTrigger;
}

interface IPlayerEntry {
  player: PlayerComponent;
  input: IInputComponent;
}

// # Classe *NetworkPlayerManagerComponent*
// Ce composant configure les joueurs locaux et réseau.
interface IPlayerDescEntry {
  player: string;
  input: string;
}

interface INetPlayerDesc {
  networking: string;
  players: IPlayerDescEntry[];
}

export class NetworkPlayerManagerComponent extends Component<INetPlayerDesc> {
  public readyEvent = new EventTrigger();
  private networking!: NetworkingComponent;
  private players: IPlayerEntry[] = [];

  // ## Méthode *setup*
  // Cette méthode configure le composant. Elle négocie avec le
  // serveur qui sera le joueur local et le joueur distant.
  public setup(descr: INetPlayerDesc) {
    this.networking = Component.findComponent<NetworkingComponent>(descr.networking)!;
    this.networking.messageEvent.add(this, this.onMessage);
    this.players = [];
    for (const pDescr of descr.players) {
      this.players.push({
        input: Component.findComponent<IInputComponent>(pDescr.input)!,
        player: Component.findComponent<PlayerComponent>(pDescr.player)!,
      });
    }

    const playerName = GlobalConfig.alias;
    const msg = new NetworkLogin();
    msg.build({ name: playerName });
    this.networking.send(msg);
  }

  // ## Méthode *onMessage*
  // Cette méthode est déclenchée quand un message réseau est reçu.
  // Si on a un message de type NetworkStart, on configure les
  // joueurs et on déclenche l'événement indiquant qu'on est prêt
  // à lancer la partie.
  private onMessage(msg: NetworkMessage) {
    if (!(msg instanceof NetworkStart)) {
      return;
    }

    msg.names.forEach((p, index) => {
      const isLocal = (index === msg.playerIndex);
      this.players[index].player.name = p;
      this.players[index].player.isLocal = isLocal;
      this.players[index].input.isLocal = isLocal;
    });

    this.readyEvent.trigger(msg.playerIndex);
  }
}

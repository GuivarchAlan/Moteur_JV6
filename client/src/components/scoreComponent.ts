import { EventTrigger } from "../eventTrigger";
import { Component } from "./component";
import { TextSpriteComponent } from "./textSpriteComponent";
import { NetworkScore } from "../../../common/messages";
import { NetworkingComponent } from "./networkingComponent";
import { PlayerComponent } from "./playerComponent";

// # Classe *ScoreComponent*
interface IScoreComponentDesc {
  networking: string;
  scoreSprite: string;
  player: string;
}

export class ScoreComponent extends Component<IScoreComponentDesc> {
  private scoreChangedEvent = new EventTrigger();
  private scoreSprite!: TextSpriteComponent;
  private _value!: number;
  private networking!: NetworkingComponent;
  private player!: PlayerComponent;

  // Cette méthode conserve le composant de texte qui affiche
  // le pointage, initialise sa valeur et conserve un NetworkComponent pour envoyé le score du joueur au serveur.
  public setup(descr: IScoreComponentDesc) {
    this.scoreSprite = Component.findComponent<TextSpriteComponent>(descr.scoreSprite)!;
    this.networking = Component.findComponent<NetworkingComponent>(descr.networking)!;
    this.player = Component.findComponent<PlayerComponent>(descr.player)!;
    this.value = 0;
  }

  // ## Propriété *value*
  // Cette méthode met à jour le pointage et l'affichage de
  // ce dernier.
  get value() {
    return this._value;
  }

  set value(newVal) {
    this._value = newVal;
    this.scoreChangedEvent.trigger(this.value);
    this.scoreSprite.text = this.value.toString();
    if (this.player.isLocal) {
      const msg = new NetworkScore();
      msg.build({name : this.player.name, score: this.value});
      this.networking.send(msg);
    }
  }
}

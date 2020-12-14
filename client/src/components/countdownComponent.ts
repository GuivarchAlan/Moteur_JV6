import { IEntity } from "../entity";
import { EventTrigger } from "../eventTrigger";
import { Localisation } from "../localisation";
import { IEntityDesc, Scene } from "../scene";
import { ILogicComponent } from "../systems/logicSystem";
import { Timing } from "../timing";
import { AudioComponent } from "./audioComponent";
import { Component } from "./component";
import { IPlayerManagerComponent } from "./networkPlayerManagerComponent";

// # Classe *CountdownComponent*
// Ce composant affiche un décompte et envoie un événement
// lorsqu'il a terminé.
interface ICountdownComponentDesc {
  sprites: string[];
  waitSprite: string;
  playerSpritePrefix: string;
  spriteTemplate: IEntityDesc;
  delay: number;
  handler?: string;
  playerWait?: string;
}

export class CountdownComponent extends Component<ICountdownComponentDesc> implements ILogicComponent {
  private handler = new EventTrigger();
  private sprites: string[] = [];
  private waitSprite!: string;
  private playerSpritePrefix!: string;
  private delay!: number;
  private spriteTemplate!: IEntityDesc;
  private index = -1;
  private shownTime!: number;
  private current?: IEntity;

  // ## Méthode *create*
  // Cette méthode est appelée pour configurer le composant avant
  // que tous les composants d'un objet aient été créés.
  public create(descr: ICountdownComponentDesc) {
    this.sprites = [];
    for (const s of descr.sprites) {
      this.sprites.push(Localisation.get(s));
    }
    this.waitSprite = Localisation.get(descr.waitSprite);
    this.playerSpritePrefix = descr.playerSpritePrefix;
    this.delay = descr.delay;
    this.spriteTemplate = descr.spriteTemplate;
  }

  // ## Méthode *setup*
  // Cette méthode est appelée pour configurer le composant après
  // que tous les composants d'un objet aient été créés. Si on
  // doit attendre après le réseau, on affiche un message à cette
  // fin et on désactive le composant pendant ce temps.
  public setup(descr: ICountdownComponentDesc) {
    if (descr.handler) {
      const tokens = descr.handler.split(".");
      this.handler.add(this.owner.getComponent(tokens[0]), tokens[1]);
    }

    if (descr.playerWait) {
      const comp = Component.findComponent<IPlayerManagerComponent>(descr.playerWait)!;
      this.showNamedImage(this.waitSprite);
      this.enabled = false;
      comp.readyEvent.add(this, this.onPlayerReady);
    }
  }

  // ## Méthode *update*
  // À chaque itération, on vérifie si on a attendu le délai
  // désiré, et on change d'image si c'est le cas.
  public update(timing: Timing) {
    if ((timing.now.getTime() - this.shownTime) < this.delay) {
      return;
    }
    this.index++;
    if (this.current) {
      this.owner.removeChild(this.current);
      delete this.current;
    }

    if (this.index >= this.sprites.length) {
      this.handler.trigger();
      this.enabled = false;
    } else {
      return this.showImage();
    }
  }

  // ## Méthode *onPlayerReady*
  // Cette méthode est appelée quand on a trouvé un joueur avec qui
  // faire une partie. On affiche alors à l'écran un message nous
  // identifiant.
  private onPlayerReady(localIndex: number) {
    const sprite = Localisation.get(this.playerSpritePrefix + localIndex);
    this.sprites.unshift(sprite);
    this.enabled = true;
  }

  // ## Méthode *showImage*
  // Affiche une image parmi les sprites désirées, si il y en
  // a encore à afficher.
  private showImage() {
    this.shownTime = (new Date()).getTime();
    this.showNamedImage(this.sprites[this.index]);
    // # Joue le son de décompte audio
    AudioComponent.play("countdown");
  }

  // ## Méthode *showNamedImage*
  // Affiche une image, directement à partir de son nom
  private showNamedImage(textureName: string) {
    this.spriteTemplate.components!.RawSprite.texture = textureName;
    this.current = Scene.current.createChild(this.spriteTemplate, "sprite", this.owner);
  }
}

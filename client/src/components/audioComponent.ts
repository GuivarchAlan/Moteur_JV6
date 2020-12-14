import { Resources } from "../resources";
import { audioGlobalContext as globalContext } from "../utils";
import { Component } from "./component";

// Conserve une référence vers le composant audio principal
let mainAudio: AudioComponent | undefined;

// # Classe *AudioComponent*
// Ce composant représente un module permettant de jouer des sons.
interface IAudioComponentDesc {
  main?: boolean;
  description: string;
}

interface IEventDescr {
  source: string;
  volume: number;
  audioBuffer?: AudioBuffer;
}

interface IEvents {
  [name: string]: IEventDescr;
}

export class AudioComponent extends Component<IAudioComponentDesc> {
  // ## Méthode statique *play*
  // Cette méthode joue le son désiré sur le composant principal.
  public static play(name: string, volume = 1.0) {
    mainAudio!.play(name, volume);
  }
  private events: IEvents = {};

  // ## Méthode *create*
  // Cette méthode est appelée pour configurer le composant avant
  // que tous les composants d'un objet aient été créés.
  public create(descr: IAudioComponentDesc) {
    if (descr.main) {
      mainAudio = this;
    }
  }

  // ## Méthode *setup*
  // Cette méthode charge le fichier de description et les sons
  // qui y sont associés.
  public setup(descr: IAudioComponentDesc) {
    const descriptionFile = Resources.load<string>(descr.description)!;
    const events = JSON.parse(descriptionFile) as IEvents;
    for (const name in events) {
      if (!events.hasOwnProperty(name)) {
        continue;
      }
      const evtDesc = events[name];
      evtDesc.audioBuffer = Resources.load<AudioBuffer>(evtDesc.source);
      this.events[name] = evtDesc;
    }
  }

  // ## Méthode *play*
  // Cette méthode joue le son désiré selon son nom.
  public play(name: string, volume = 1.0) {
    if (!this.events[name]) {
      return;
    }

    const source = globalContext.createBufferSource();
    source.buffer = this.events[name].audioBuffer!;
    const gainNode = globalContext.createGain();
    gainNode.gain.value = this.events[name].volume * volume;
    source.connect(gainNode);
    gainNode.connect(globalContext.destination);
    source.start(0);
  }
}

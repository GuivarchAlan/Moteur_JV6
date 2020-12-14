import { NetworkMessage /* etc. */ } from "../../../common/messages";
import { Component } from "./component";
import { NetworkingComponent } from "./networkingComponent";

interface IScoreEntry {
  node: HTMLElement;
  scoreNode: HTMLElement;
  value: number;
}

interface IScoreMap {
  [name: string]: IScoreEntry;
}

interface IScoreSortEntry {
  name: string;
  data: IScoreEntry;
}

// # Classe *NetworkLeaderboardComponent*
// Ce composant reçoit les mises à jour du tableau des meneurs
// et les affiche sur la page du jeu.
interface INetLeaderboardDesc {
  networking: string;
  field: string;
  template: string;
}

export class NetworkLeaderboardComponent extends Component<INetLeaderboardDesc> {
  private scores: IScoreMap = {};
  private networking!: NetworkingComponent;
  private target!: HTMLElement;
  private template!: HTMLElement;

  // ## Méthode *setup*
  // Cette méthode configure le composant. Elle récupère les
  // éléments de la page où afficher le tableau, et configure
  // la réception des messages réseau.
  public setup(descr: INetLeaderboardDesc) {
    this.networking = Component.findComponent<NetworkingComponent>(descr.networking)!;
    this.target = document.getElementById(descr.field)!;
    this.template = document.getElementById(descr.template)!;

    this.networking.messageEvent.add(this, this.onMessage);

    // # TODO: À enlever lorsque l'implémentation est complète
    this.debugStartTest("Test 1", 1234, 0.2);
    this.debugStartTest("Test 2", 750, 0.4);
  }

  // ## Méthode *onMessage*
  // Cette méthode est déclenchée quand un message réseau est reçu
  private onMessage(msg: NetworkMessage) {
    // # TODO: Implémenter le fonctionnement
  }

  // ## Méthode *debugStartTest*
  // Cette méthode met à jour un score fictif afin de valider le
  // fonctionnement du système. À effacer lorsque l'implémentation
  // est complète.
  private debugStartTest(name: string, score: number, freq: number) {
    setInterval(() => {
      this.setScore(name, score);
      score += 250;
    }, 1000.0 / freq);
  }

  // ## Méthode *setScore*
  // Cette méthode met à jour une entrée du tableau des meneurs,
  // et crée cette entrée si elle n'existe pas.
  private setScore(name: string, value: number) {
    if (!this.scores[name]) {
      const element = this.template.cloneNode(true) as HTMLElement;
      element.classList.remove("template");
      const nameNode = element.getElementsByClassName("name")[0] as HTMLElement;
      nameNode.innerText = name;
      this.scores[name] = {
        node: element,
        scoreNode: element.getElementsByClassName("score")[0] as HTMLElement,
        value,
      };
    }

    this.scores[name].value = value;
    this.scores[name].scoreNode.innerText = value.toString();

    const map: IScoreSortEntry[] = [];
    for (const pName in this.scores) {
      if (!this.scores.hasOwnProperty(pName)) {
        continue;
      }
      map.push({
        data: this.scores[pName],
        name: pName,
      });
    }

    map.sort((a, b) => {
      if (a.data.value > b.data.value) {
        return -1;
      } else {
        return 1;
      }
    });

    while (this.target.hasChildNodes()) {
      this.target.removeChild(this.target.lastChild!);
    }

    for (const element of map) {
      this.target.appendChild(element.data.node);
    }
  }
}

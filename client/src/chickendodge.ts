import { ILocaleFiles, Localisation } from "./localisation";
import { IConfig, run } from "./main";
import { Resources } from "./resources";

const locales: ILocaleFiles = {
  en: "locales/en.json",
  fr: "locales/fr.json",
};

type IStartFn = () => void;
let startFn: IStartFn;

export function start() {
  startFn();
}

export function preload() {
  return Resources.init("data/resources.json");
}

export function init() {
  const equipe = Resources.load<string>("equipe.txt")!;
  console.log(equipe);
  if (equipe === "Coéquipiers") {
    alert("N'oubliez pas d'inscrire les membres de votre équipe dans le fichier client/data/equipe.txt!");
  }

  Localisation.init(locales);
  const localized = document.getElementsByClassName("localized") as HTMLCollectionOf<HTMLElement>;
  for (const item of localized) {
    item.innerText = Localisation.get(item.innerText);
  }
  document.getElementById("body")!.style.display = "initial";

  startFn = () => {
    const alias = (document.getElementById("player_alias") as HTMLInputElement)!.value.trim();
    const server = (document.getElementById("server") as HTMLInputElement)!.value.trim();

    if (alias.length === 0) {
      return alert(Localisation.get("EMPTY_ALIAS"));
    }
    if (server.length === 0) {
      return alert(Localisation.get("EMPTY_SERVER"));
    }

    const config: IConfig = {
      alias,
      canvasId: "canvas",
      launchScene: "scenes/play.json",
      server,
    };

    Localisation.setContext("PLAYER_1", alias);

    document.getElementById("config")!.style.display = "none";
    document.getElementById("canvas")!.style.display = "block";

    return run(config);
  };
}

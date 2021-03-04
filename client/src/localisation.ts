import { Resources } from "./resources";

export interface ILocaleFiles {
  [lang: string]: string;
}

export interface ILocaleContext {
  [key: string]: string;
}

interface ILocaleData {
  [key: string]: string;
}

interface IQueryParams {
  [key: string]: string;
}

const globalContext: ILocaleContext = {};
let localeStrings: ILocaleData = {};

// ## Fonction *getQueryParams*
// Cette fonction retourne un objet contenant les paramètres passés
// à l'URL de la page.
function getQueryParams() {
  const query = document.location.search;
  const queryParams: IQueryParams = {};

  const regex = new RegExp("([^?=&]+)(=([^&]*))?", "g");
  query.replace(regex, (match, p1, p2, p3) => {
    queryParams[p1] = p3;
    return "";
  });

  return queryParams;
}

// # Classe *Localisation*
// Cette classe comprend les méthodes nécessaires pour
// charger et traiter la régionalisation.
export class Localisation {
  // ## Méthode statique *init*
  // La méthode d'initialisation prend en paramètre un tableau
  // associatif décrivant les différents fichiers de localisation.
  // On détermine le fichier de locales à utiliser selon la langue
  // du navigateur ou un paramètre passé dans l'URL.
  public static init(locales: ILocaleFiles) {
    const queryParams = getQueryParams();
    let language = queryParams.locale || navigator.language;
    language = language.substring(0, 2);
    if (!locales[language]) {
      language = Object.keys(locales)[0];
    }

    const content = Resources.load<string>(locales[language])!;
    localeStrings = JSON.parse(content) as ILocaleData;
  }

  // ## Fonction statique *get*
  // Cette fonction retourne la chaîne correspondante à la clé demandée.
  // Si cette chaîne comprend des champs substitués, ceux-ci sont remplacés.
  public static get(key: string, queryContext: ILocaleContext = {}) {
    for (const k in globalContext) {
      if (!globalContext.hasOwnProperty(k)) {
        continue;
      }
      if (queryContext[k]) {
        continue;
      }

      queryContext[k] = globalContext[k];
    }

    if (!localeStrings[key]) {
      console.error(`Failed to find locale for ${key}`);
      return key;
    }

    // ***TODO***: Implémenter la substitution de clés
    console.log("queryContext: ", queryContext);

    /*
    remplace les elements "{key}" de localeStrings par leur valeur dans queryContext
    */ 
    var keys = Object.keys(localeStrings);
    for(var index in keys){
       var k = keys[index];
       var elem = localeStrings[k];
       var i = elem.indexOf("{");
       while(i != -1) {
          var j = elem.indexOf("}");
          if (j < i) {
             break;
          }
          /*
          Remplace seulement si on sait par quoi le remplacer.
          */
          if(queryContext[elem.substring(i+1,j)]) {
            elem = elem.replace(elem.substring(i,j+1),queryContext[elem.substring(i+1,j)]);
          }
          else {
            break;
          }
          var i = elem.indexOf("{");
       }
       localeStrings[k] = elem;
    }

    return localeStrings[key];
  }

  // ## Méthode statique *setContext*
  // Cette méthode assigne une valeur au contexte
  // global qui sera substituée par défaut.
  public static setContext(key: string, val: string) {
    globalContext[key] = val;
  }

  // ## Méthode statique *getContext*
  // Cette méthode obtient une valeur du contexte global.
  public static getContext(key: string) {
    return globalContext[key];
  }
}

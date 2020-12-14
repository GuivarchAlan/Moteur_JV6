import { IDeserializer, ISerializer } from "./serializer";

// ## Tableau associatif *typeMap*
// Ce tableau conserve la correspondance entre les codes de type
// et les classes de message appropriées.
interface ITypeMap {
  [key: number]: new() => NetworkMessage;
}

const typeMap: ITypeMap = {};

interface INetworkMessageClass<T extends NetworkMessage> {
  typeCode: number;
  new(): T;
}

// # Classe *NetworkMessage*
// Cette classe est une classe de base pour l'ensemble des
// messages réseau.
export abstract class NetworkMessage {

  // ## Méthode statique *register*
  // Cette méthode statique permet d'enregistrer la correspondance
  // entre les codes de type et les classes de messages.
  public static register<T extends NetworkMessage>(klass: INetworkMessageClass<T>) {
    typeMap[klass.typeCode] = klass;
  }

  // ## Fonction statique *create*
  // La fonction *create* crée une instance de la bonne classe
  // de message à partir de son code de type, et remplit les
  // valeurs avec les données reçues.
  public static create(deserializer: IDeserializer) {
    const typeCode = deserializer.peekU8();
    if (!typeMap[typeCode]) {
      return null;
    }

    const msg = new typeMap[typeCode]();
    msg.deserialize(deserializer);
    return msg;
  }
  public typeCode!: number;

  // ## Méthode *build*
  // Cette méthode, à surcharger dans les classes enfant,
  // sert à initialiser les valeurs lors de la création d'un
  // nouveau message.
  public abstract build(msg: any): void;

  // ## Méthode *serialize*
  // Cette méthode, à surcharger dans les classes enfant,
  // permet d'enregistrer le contenu du message dans un
  // format pouvant être transféré.
  public serialize(serializer: ISerializer) {
    serializer.writeU8(this.typeCode);
  }

  // ## Méthode *deserialize*
  // Cette méthode, à surcharger dans les classes enfant,
  // permet de reconstituer le contenu du message à partir
  // des données reçues.
  public deserialize(deserializer: IDeserializer) {
    this.typeCode = deserializer.readU8();
  }
}

interface ILoginDesc {
  name: string;
}

// # Classe *NetworkLogin*
// Ce message permet de transférer les informations nécessaires
// lors de la connexion d'un joueur.
export class NetworkLogin extends NetworkMessage {
  // ## Constante *typeCode*
  // Représente l'identifiant numérique de ce message
  public static typeCode = 1;

  public name!: string;

  // ## Méthode *build*
  // Initialise les valeurs lors de la création d'une nouvelle
  // instance de ce message.
  public build(msg: ILoginDesc) {
    this.typeCode = NetworkLogin.typeCode;
    this.name = msg.name;
  }

  // ## Méthode *serialize*
  // Cette méthode permet d'enregistrer le contenu du message
  // dans un format pouvant être transféré.
  public serialize(serializer: ISerializer) {
    super.serialize(serializer);
    serializer.writeString(this.name);
  }

  // ## Méthode *deserialize*
  // Cette méthode permet de reconstituer le contenu du message
  // à partir des données reçues.
  public deserialize(deserializer: IDeserializer) {
    super.deserialize(deserializer);
    this.name = deserializer.readString();
  }
}

interface IStartDesc {
  playerIndex: number;
  names: string[];
}

// # Classe *NetworkStart*
// Ce message permet indique aux clients que la partie est prête
// à commencer. On y stocke la liste des joueurs et le numéro du joueur.
export class NetworkStart extends NetworkMessage {
  // ## Constante *typeCode*
  // Représente l'identifiant numérique de ce message
  public static typeCode = 2;

  public playerIndex!: number;
  public names!: string[];

  // ## Méthode *build*
  // Initialise les valeurs lors de la création d'une nouvelle
  // instance de ce message.
  public build(msg: IStartDesc) {
    this.typeCode = NetworkStart.typeCode;
    this.playerIndex = msg.playerIndex;
    this.names = msg.names;
  }

  // ## Méthode *serialize*
  // Cette méthode permet d'enregistrer le contenu du message
  // dans un format pouvant être transféré.
  public serialize(serializer: ISerializer) {
    super.serialize(serializer);
    serializer.writeU8(this.playerIndex);
    serializer.writeU8(this.names.length);
    this.names.forEach((n) => {
      serializer.writeString(n);
    });
  }

  // ## Méthode *deserialize*
  // Cette méthode permet de reconstituer le contenu du message
  // à partir des données reçues.
  public deserialize(deserializer: IDeserializer) {
    super.deserialize(deserializer);
    this.playerIndex = deserializer.readU8();
    const nbNames = deserializer.readU8();
    this.names = [];
    for (let i = 0; i < nbNames; ++i) {
      this.names.push(deserializer.readString());
    }
  }
}

interface IInputSymbol {
  [key: string]: boolean;
}

// # Classe *NetworkInputChanged*
// Ce message représente un changement dans les entrées du joueur.
export class NetworkInputChanged extends NetworkMessage {
  // ## Constante *typeCode*
  // Représente l'identifiant numérique de ce message
  public static typeCode = 100;

  public symbols!: IInputSymbol;

  // ## Méthode *build*
  // Initialise les valeurs lors de la création d'une nouvelle
  // instance de ce message.
  public build(symbols: IInputSymbol) {
    this.typeCode = NetworkInputChanged.typeCode;
    this.symbols = symbols;
  }

  // ## Méthode *serialize*
  // Cette méthode permet d'enregistrer le contenu du message
  // dans un format pouvant être transféré.
  public serialize(serializer: ISerializer) {
    super.serialize(serializer);
    const count = Object.keys(this.symbols).length;
    serializer.writeU8(count);
    Object.keys(this.symbols).forEach((k) => {
      serializer.writeString(k);
      serializer.writeU8(this.symbols[k] ? 1 : 0);
    });
  }

  // ## Méthode *deserialize*
  // Cette méthode permet de reconstituer le contenu du message
  // à partir des données reçues.
  public deserialize(deserializer: IDeserializer) {
    super.deserialize(deserializer);
    const count = deserializer.readU8();
    this.symbols = {};
    for (let i = 0; i < count; ++i) {
      const k = deserializer.readString();
      const v = deserializer.readU8();
      this.symbols[k] = (v !== 0);
    }
  }
}

// # Enregistrement des types de message
// Ces instructions sont exécutées lors du chargement de ce
// fichier de script, et permettent d'enregistrer les types
// de message connus.
NetworkMessage.register(NetworkLogin);
NetworkMessage.register(NetworkStart);
NetworkMessage.register(NetworkInputChanged);

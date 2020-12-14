import { IDeserializer, ISerializer } from "../../common/serializer";

// # Classe *Serializer*
// Classe utilitaire pour la sérialisation de données en un
// format binaire.
export class Serializer implements ISerializer {
  private data: Array<Uint8Array | Uint32Array> = [];

  public writeU8(v: number) {
    this.data.push(new Uint8Array([v]));
  }

  public writeU32(v: number) {
    this.data.push(new Uint32Array([v]));
  }

  public writeString(s: string) {
    const encoder = new TextEncoder();
    const buf = encoder.encode(s);
    this.writeU8(buf.length);
    this.data.push(buf);
  }

  public toBinary() {
    return new Blob(this.data);
  }
}

// # Classe *Deserializer*
// Classe utilitaire pour la désérialisation de données en un
// format binaire.
export class Deserializer implements IDeserializer {
  private dv: DataView;
  private offset = 0;

  constructor(arrayBuffer: ArrayBuffer) {
    this.dv = new DataView(arrayBuffer);
  }

  public peekU8() {
    return this.dv.getUint8(this.offset);
  }

  public readU8() {
    const ret = this.peekU8();
    this.offset++;
    return ret;
  }

  public peekU32() {
    return this.dv.getUint32(this.offset, true);
  }

  public readU32() {
    const ret = this.peekU32();
    this.offset += 4;
    return ret;
  }

  public readString() {
    const length = this.readU8();
    const decoder = new TextDecoder("utf8");
    const strView = new DataView(this.dv.buffer, this.dv.byteOffset + this.offset, length);
    const ret = decoder.decode(strView);
    this.offset += length;
    return ret;
  }
}

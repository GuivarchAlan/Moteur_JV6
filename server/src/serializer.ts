import { IDeserializer, ISerializer } from "../../common/serializer";

// # Classe *Serializer*
// Classe utilitaire pour la sérialisation de données en un
// format binaire.
export class Serializer implements ISerializer {
  private data: Buffer[] = [];

  public writeU8(v: number) {
    this.data.push(new Buffer([v]));
  }

  public writeU32(v: number) {
    const buf = new Buffer(4);
    buf.writeUInt32LE(v, 0);
    this.data.push(buf);
  }

  public writeString(s: string) {
    const buf = new Buffer(s, "utf8");
    this.writeU8(buf.length);
    this.data.push(buf);
  }

  public toBinary() {
    return Buffer.concat(this.data);
  }
}

// # Classe *Deserializer*
// Classe utilitaire pour la désérialisation de données en un
// format binaire.
export class Deserializer implements IDeserializer {
  public offset = 0;

  constructor(private buffer: Buffer) {
  }

  public peekU8() {
    return this.buffer.readUInt8(this.offset);
  }

  public readU8() {
    const ret = this.peekU8();
    this.offset++;
    return ret;
  }

  public peekU32() {
    return this.buffer.readUInt32LE(this.offset);
  }

  public readU32() {
    const ret = this.peekU32();
    this.offset += 4;
    return ret;
  }

  public readString() {
    const length = this.readU8();
    const ret = this.buffer.toString("utf8", this.offset, this.offset + length);
    this.offset += length;
    return ret;
  }
}

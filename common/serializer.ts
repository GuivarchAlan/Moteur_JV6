export interface ISerializer {
  writeU8(val: number): void;
  writeU32(val: number): void;
  writeString(val: string): void;
}

export interface IDeserializer {
  peekU8(): number;
  readU8(): number;
  peekU32(): number;
  readU32(): number;
  readString(): string;
}

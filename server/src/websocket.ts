import * as ws from "ws";
import { HttpServer } from "./httpserver";

export type Socket = ws;

type IOnConnection = (id: number, socket: ws) => void;

type IOnMessage = (id: number, socket: ws, data: Buffer) => void;

type IOnClose = (id: number, socket: ws, evt: {}) => void;

type IOnError = (id: number, socket: ws, evt: {}) => void;

export class WebSocket {
  private wsServer: ws.Server;
  private nextId = 1;

  constructor(private httpServer: HttpServer) {
    if (!httpServer) {
      throw new Error("Le serveur doit être spécifié!");
    }

    this.wsServer = new ws.Server({
      server: httpServer.server,
    });

    this.wsServer.on("connection", (socket) => {
      const id = this.nextId++;

      socket.onmessage = (evt) => {
        this.onMessage(id, socket, Buffer.from(evt.data as Buffer));
      };
      socket.onclose = (evt) => {
        this.onClose(id, socket, evt);
      };
      socket.onerror = (evt) => {
        this.onError(id, socket, evt);
      };
      this.onConnection(id, socket);
    });
  }
  // tslint:disable:no-empty
  public onConnection: IOnConnection = () => { };
  public onMessage: IOnMessage = () => { };
  public onClose: IOnClose = () => { };
  public onError: IOnError = () => { };
  // tslint:enable:no-empty

  public close() {
    this.wsServer.close();
  }
}

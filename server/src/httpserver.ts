import * as http from "http";

export type IHandler = (req: http.IncomingMessage, res: http.ServerResponse) => Promise<any>;

interface IMethodHandler {
  [method: string]: IHandler[];
}

export class HttpServer {

  public readonly server: http.Server;
  private methodHandlers: IMethodHandler = {};

  constructor() {
    this.server = http.createServer((req, res) => this.onRequest(req, res));
  }

  public registerRequestHandler(method: string, handler: IHandler) {
    if (!this.methodHandlers[method]) {
      this.methodHandlers[method] = [];
    }

    this.methodHandlers[method].push(handler);
  }
  public listen(port: number) {
    return new Promise((resolve) => {
      this.server.listen(port, resolve);
    });
  }

  public close() {
    return new Promise((resolve) => {
      this.server.close(resolve);
    });
  }

  private onRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    const handlers = this.methodHandlers[req.method as string] || [];
    let p: Promise<any> = Promise.reject({});
    handlers.forEach((h) => {
      p = p.catch(() => {
        return h(req, res);
      });
    });

    return p.catch(() => {
      res.statusCode = 404;
      res.end();
    });
  }
}

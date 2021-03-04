import { IEntity } from "../entity";
import { IDisplayComponent } from "../systems/displaySystem";
import { Component } from "./component";
import { SpriteComponent } from "./spriteComponent";
import * as GraphicsAPI from "../graphicsAPI";
import { TextureComponent } from "./textureComponent";

// # Classe *LayerComponent*
// Ce composant représente un ensemble de sprites qui
// doivent normalement être considérées comme étant sur un
// même plan.
export class LayerComponent extends Component<object> implements IDisplayComponent {
  // ## Méthode *display*
  // La méthode *display* est appelée une fois par itération
  // de la boucle de jeu.
  public display(dT: number) {
  
    const layerSprites = this.listSprites();
    if (layerSprites.length === 0) {
      return;
    }
    const spriteSheet = layerSprites[0].spriteSheet;

    const GL = GraphicsAPI.context;
   
    const globalVertex = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, globalVertex);

    var verticesArray = new Float32Array(layerSprites.length * 4 * TextureComponent.vertexSize);

    for (let index = 0; index < layerSprites.length; index++) {
      var vertices = layerSprites[index].getVertices();
      verticesArray.set(vertices,index * 4 * TextureComponent.vertexSize);
    }
    GL.bufferData(GL.ARRAY_BUFFER,verticesArray,GL.DYNAMIC_DRAW);

    const globalIndex = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, globalIndex);
    var indices = new Uint16Array(6*layerSprites.length);

    for (let index = 0; index < layerSprites.length * 6; index+=6) {
      indices[index] = 0 + index/6*4;
      indices[index + 1] = 1 + index/6*4;
      indices[index + 2] = 2 + index/6*4;
      indices[index + 3] = 2 + index/6*4;
      indices[index + 4] = 3 + index/6*4;
      indices[index + 5] = 0 + index/6*4; 
    }

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, globalIndex);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,indices,GL.DYNAMIC_DRAW);

    spriteSheet.bind();
    GL.drawElements(GL.TRIANGLES, 6 * layerSprites.length, GL.UNSIGNED_SHORT, 0);
    spriteSheet.unbind();
  }

  // ## Fonction *listSprites*
  // Cette fonction retourne une liste comportant l'ensemble
  // des sprites de l'objet courant et de ses enfants.
  private listSprites() {
    const sprites: SpriteComponent[] = [];

    const queue: IEntity[] = [this.owner];
    while (queue.length > 0) {
      const node = queue.shift() as IEntity;
      for (const child of node.children) {
        if (child.active) {
          queue.push(child);
        }
      }

      for (const comp of node.components) {
        if (comp instanceof SpriteComponent && comp.enabled) {
          sprites.push(comp);
        }
      }
    }

    return sprites;
  }
}

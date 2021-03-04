import { ColliderComponent } from "../components/colliderComponent";
import { Scene } from "../scene";
import { ISystem } from "./system";
import * as QuadTree from "../quadTree"
import * as GraphicsAPI from "../graphicsAPI";
import { Rectangle } from "../components/rectangle";

// # Classe *PhysicSystem*
// Représente le système permettant de détecter les collisions
export class PhysicSystem implements ISystem {
  // Méthode *iterate*
  // Appelée à chaque tour de la boucle de jeu
  public iterate(dT: number) {
    
    const rootSquare = new Rectangle(new Rectangle({x:0,y:0,width: GraphicsAPI.canvas.width,height: GraphicsAPI.canvas.height}));
    let quadTree = new QuadTree.QuadTree(rootSquare);

    
    for (const e of Scene.current.entities()) {
      for (const comp of e.components) {
        if (comp instanceof ColliderComponent && comp.enabled) {
          quadTree.insert(comp);
        }
      }
    }
   /* 
    var quadtreeCanvas = <HTMLCanvasElement>document.getElementById('quadtree');
    var quadtreeContext = <CanvasRenderingContext2D>quadtreeCanvas.getContext("2d");
    if((<HTMLInputElement>document.getElementById('quadtree-debug')).checked){
      quadtreeContext.strokeStyle = "blue"; // détoure des cellules
      quadtreeContext.fillStyle = "red"; // rectangle des colliders
      quadtreeContext.clearRect(0, 0,  GraphicsAPI.canvas.width, GraphicsAPI.canvas.height); // Reprend la taille du quadtree

      //offset canvas
      var offset = new QuadTree.Vec2(0,0);
      if(quadTree.bounds.xMin < 0) offset.x += Math.abs(quadTree.bounds.xMin);
      if(quadTree.bounds.yMin < 0) offset.y += Math.abs(quadTree.bounds.yMin);
    
      quadTree.draw(quadtreeContext, offset);
      
    }else{
      quadtreeContext.clearRect(0, 0,  GraphicsAPI.canvas.width, GraphicsAPI.canvas.height);
    }
    */
   /* recupere les elements dans chaque feuille du QuadTree */
    let collisions: ColliderComponent[][] = [];
    collisions = quadTree.query(quadTree.bounds,collisions);
    /* on parcourt chaques feuilles pour tester les collisions des ColliderComponents à l'interieur*/
    collisions.forEach(element => {
      if (element.length > 1) {
        for (let i = 0; i < element.length; i++) {
          const c1 = element[i];
          if (!c1.enabled || !c1.owner.active) {
            continue;
          }

          for (let j = i + 1; j < element.length; j++) {
            const c2 = element[j];
            if (!c2.enabled || !c2.owner.active) {
              continue;
            }
            /*si c1 et c2 sont des element pouvant entree en collison et si leur area se superpose alors 
            on applique la collision 
            */
            if (c1.mask & c2.flag && c1.area.intersectsWith(c2.area)) {
              if (c1.handler) {
                c1.handler.onCollision(c2);
              }
              if (c2.handler) {
                c2.handler.onCollision(c1);
              }
            }
          }
        }
      }
      
    });
  }
}

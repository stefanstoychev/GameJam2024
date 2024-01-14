import { MyGameObject } from "../MyGameObject";
import * as BABYLON from '@babylonjs/core/Legacy/legacy';

export class MyPathTile extends MyGameObject {

    constructor(public name: String) {
        super();
    }

    override load(scene: BABYLON.Scene, position: BABYLON.Vector3, onLoad: Function) {
        var obstacle = this;

        BABYLON.SceneLoader.ImportMesh(null, "./hex/", "hex.glb", scene, function (meshes, particleSystems, skeletons) {

            meshes.forEach((mesh) => {

                if (mesh.name == "__root__") {
                    mesh.position = position;
                    mesh.rotation = new BABYLON.Vector3(0, 0, 0);
                    mesh.scaling = new BABYLON.Vector3(1, 1, 1);

                    obstacle.rootMesh = mesh;
                }
            });
    
            onLoad();
        });
    }

    override setMaterial(material: BABYLON.StandardMaterial) {
        
        this.rootMesh!.getChildMeshes()[0].material = material;
    }

    public clone(): MyGameObject {
        if(this.rootMesh){

            var meshClone = this.rootMesh.clone(this.rootMesh.name, this.rootMesh.parent)!;
            
            var tileClone = new MyPathTile("meshClone");
            tileClone.rootMesh = meshClone;
            tileClone.hexCoord = this.hexCoord;

            return tileClone;
        }
            
        throw Error("no mesh found");
    }

}
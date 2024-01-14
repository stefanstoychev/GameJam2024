import { MyGameObject } from "../MyGameObject";
import * as BABYLON from '@babylonjs/core/Legacy/legacy';

export class MyObstacleBlue extends MyGameObject {

    constructor(public name: String){
        super();
    }

    
    override load(scene: BABYLON.Scene, position: BABYLON.Vector3) {
        var obstacle = this;

        BABYLON.SceneLoader.ImportMesh(null, "./hex/", "hex.glb", scene, function (meshes, particleSystems, skeletons) {

            var obstacleMaterial = new BABYLON.StandardMaterial("obstacleBlue", scene);
            obstacleMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
            obstacleMaterial.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
            obstacleMaterial.emissiveColor = BABYLON.Color3.Blue();

            meshes.forEach((mesh) => {

                if (mesh.name == "__root__") {
                    mesh.position = position;
                    mesh.rotation = new BABYLON.Vector3(0, 0, 0);
                    mesh.scaling = new BABYLON.Vector3(1, 1, 1);

                    obstacle.rootMesh = mesh;
                }
                else {
                    mesh.material = obstacleMaterial;
                }
            });
        });
    }
}
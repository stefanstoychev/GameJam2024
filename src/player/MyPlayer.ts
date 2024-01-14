import { MyGameObject } from "../MyGameObject";
import * as BABYLON from '@babylonjs/core/Legacy/legacy';

export class MyPlayer extends MyGameObject {

    constructor(public name: String){
        super();
    }

    override load(scene: BABYLON.Scene, position: BABYLON.Vector3) {

        BABYLON.SceneLoader.ImportMesh(null, "./fox/", "Fox.glb", scene, function (meshes, particleSystems, skeletons) {

            meshes.forEach((mesh) => {

                if (mesh.name == "__root__") {

                    mesh.position = position;
                    mesh.rotation = new BABYLON.Vector3(0, 0, 0);
                    mesh.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
                }

            });

            const run = scene.getAnimationGroupByName("Survey");

            if (run)
                run.start(true, 1.0, run.from, run.to, false);
        });
    }
}
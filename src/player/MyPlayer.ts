import { MyGameObject } from "../MyGameObject";
import * as BABYLON from '@babylonjs/core/Legacy/legacy';

export class MyPlayer extends MyGameObject {

    public maxMoves = 4;
    
    public moves = 4;

    constructor(public name: String){
        super();
    }

    override load(scene: BABYLON.Scene, position: BABYLON.Vector3) {

        var player = this;

        BABYLON.SceneLoader.ImportMesh(null, "./fox/", "Fox.glb", scene, function (meshes, particleSystems, skeletons) {

            meshes.forEach((mesh) => {

                if (mesh.name == "__root__") {

                    mesh.position = position;
                    mesh.rotation = new BABYLON.Vector3(0, 0, 0);
                    mesh.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);

                    player.rootMesh = mesh;
                }

            });

            const run = scene.getAnimationGroupByName("Survey");

            if (run)
                run.start(true, 1.0, run.from, run.to, false);
        });
    }

    walk(scene: BABYLON.Scene){
        
        const run = scene.getAnimationGroupByName("Walk");

        if (run)
            run.start(true, 1.0, run.from, run.to, false);
    }

    survey(scene: BABYLON.Scene){
        
        const run = scene.getAnimationGroupByName("Survey");

        if (run)
            run.start(true, 1.0, run.from, run.to, false);
    }
}
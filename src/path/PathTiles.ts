import { Scene, Vector3 } from "@babylonjs/core";
import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { Hex, Layout } from "../lib";
import { MyGameObject } from "../MyGameObject";
import { MyPathTile } from "./MyPathTile";

export class PathTiles {

    maxTilePath = 20;
    tiles: MyGameObject[] = [];

    reachableMaterial? : BABYLON.StandardMaterial;
    unreachableMaterial? : BABYLON.StandardMaterial;
    unselectedMaterial? : BABYLON.StandardMaterial;

    constructor(public layout: Layout, public prefab: MyGameObject){

    }

    public load(scene: Scene) {

        this.reachableMaterial = new BABYLON.StandardMaterial("reachableMaterial", scene);
        this.reachableMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        this.reachableMaterial.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        this.reachableMaterial.emissiveColor = BABYLON.Color3.Green();

        this.unreachableMaterial = new BABYLON.StandardMaterial("unreachableMaterial", scene);
        this.unreachableMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        this.unreachableMaterial.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        this.unreachableMaterial.emissiveColor = BABYLON.Color3.Yellow();

        this.unselectedMaterial = new BABYLON.StandardMaterial("unselectedMaterial", scene);
        this.unselectedMaterial.alpha = 0;

        for (let index = 0; index < this.maxTilePath; index++) {
            const element = this.prefab.clone();
            this.tiles.push(element);
        }
    }

    public showPath(path: Hex[], reach: number) {

        for (let index = 0; index < this.maxTilePath; index++) {
            var tile = this.tiles[index] as MyPathTile;

            if(index < path.length) {
                const hex = path[index];

                let point = this.layout.hexToPixel(hex);

                tile.moveTo(point.x, 0, point.y);
                if(index<reach)
                    tile.setMaterial(this.reachableMaterial!);
                else
                    tile.setMaterial(this.unreachableMaterial!)


            } else {
                tile.setMaterial(this.unselectedMaterial!);
            }
        }
    }
}
import * as BABYLON from '@babylonjs/core/Legacy/legacy';

import { Hex, Layout, Point } from "./lib";

export class MyGameObject {
    
    constructor(public hexCoord: Hex = new Hex(0,0,0), public rootMesh?: BABYLON.AbstractMesh) {
    }

    public load(scene: BABYLON.Scene, position: BABYLON.Vector3, onLoad?: Function) {
    }

    public moveTo(x:number, y:number, z:number){

        if(this.rootMesh)
            this.rootMesh.position = new BABYLON.Vector3(x,y,z);
    }

    public moveToHex(hex:Hex, layout: Layout){
        this.hexCoord = hex;

        var point = layout.hexToPixel(hex);

        if(this.rootMesh){     
            this.rootMesh.position = new BABYLON.Vector3(point.x,this.rootMesh.position.y,point.y);
        }
    }

    public toPointXZ() : Point{
        if(!this.rootMesh)
            throw Error("no mesh found");

        let position = this.rootMesh.position;
        
        return new Point(position.x, position.z);
    }

    public setMaterial(material: BABYLON.StandardMaterial) {

    }

    public clone() : MyGameObject {

        if(this.rootMesh){
            var meshClone = this.rootMesh.clone(this.rootMesh.name, this.rootMesh.parent)!;
            return new MyGameObject(this.hexCoord, meshClone);
        }
            
        throw Error("no mesh found");

    }
}
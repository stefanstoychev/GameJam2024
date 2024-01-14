import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import "@babylonjs/loaders/glTF";

import { DoubledCoord, Hex, Layout, Orientation, Point } from './lib';
import { AStarHex, HexNode } from './AStarHex';
import { MyGameObject } from './MyGameObject';
import { MyObstacleBlue } from './obstacles/MyObstacleBlue';
import { MyObstacleRed } from './obstacles/MyObstacleRed';
import { MyPlayer } from './player/MyPlayer';
import { PathTiles } from './path/PathTiles';
import { MyPathTile } from './path/MyPathTile';

export class MyGameApp {

    engine: BABYLON.Engine;

    scene: BABYLON.Scene;

    layout: Layout = new Layout(Layout.pointy, new Point(1, 1), new Point(0, 0));

    path: Hex[] = [];

    prevPointerHex: Hex = new Hex(0, 0, 0);

    pathMeshes: BABYLON.AbstractMesh[] = [];

    obstaclePresets: MyGameObject[] = [];

    obstacles: MyGameObject[] = [];

    constructor(readonly canvas: HTMLCanvasElement) {
        this.engine = new BABYLON.Engine(canvas)
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
        this.scene = this.createScene(this.engine, this.canvas)

    }

    debug(debugOn: boolean = true) {
        if (debugOn) {
            this.scene.debugLayer.show({ overlay: true });
        } else {
            this.scene.debugLayer.hide();
        }
    }

    run() {
        this.debug(true);
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    createScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
        // create scene
        const scene = new BABYLON.Scene(engine);

        // This creates and positions an ArcRotateCamera
        var camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 3, Math.PI / 3, 10, BABYLON.Vector3.Zero(), scene);;

        camera.setTarget(BABYLON.Vector3.Zero());
        camera.attachControl(canvas, true);

        // create light
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        // Ground
        var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 1000, height: 1000 }, scene);

        var groundMaterial = new BABYLON.StandardMaterial("ground", scene);
        groundMaterial.alpha = 0.0;

        ground.material = groundMaterial;

        var player = new MyPlayer("fox");

        player.load(scene, new BABYLON.Vector3(0, 0, 0));

        var pathTile = new MyPathTile("pathTile");

        var path = new PathTiles(this.layout, pathTile);

        pathTile.load(scene, new BABYLON.Vector3(0, 0, 0), () => {
            path.load(scene);
        });

        let brush: MyGameObject;

        var obstaclePresets = this.obstaclePresets;

        //load obstacles

        var obstacleBlue = new MyObstacleBlue("blue");
        obstaclePresets.push(obstacleBlue);

        brush = obstacleBlue;

        var obstacleRed = new MyObstacleRed("red");
        obstaclePresets.push(obstacleRed);

        obstaclePresets.forEach(element => {
            element.load(scene, new BABYLON.Vector3(300.0, 300.0, 300.0));
        });

        scene.onPointerObservable.add((pointerInfo) => {

            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh == ground; });

                    if (!pickinfo.hit)
                        break;

                    var mesh = pickinfo.pickedMesh;

                    if (mesh == null)
                        break;

                    var pickedPoint = pickinfo.pickedPoint;

                    if (pickedPoint == null)
                        break;


                case BABYLON.PointerEventTypes.POINTERMOVE:

                    var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh == ground; });

                    if (!pickinfo.hit)
                        break;

                    var mesh = pickinfo.pickedMesh;

                    if (mesh == null)
                        break;

                    var pickedPoint = pickinfo.pickedPoint;

                    if (pickedPoint == null)
                        break;

                    var hexCoord = this.layout.pixelToHex(new Point(pickedPoint.x, pickedPoint.z));

                    hexCoord = hexCoord.round();

                    if (hexCoord.equals(this.prevPointerHex)) {
                        break;
                    }

                    this.prevPointerHex = hexCoord;

                    var pathHex: HexNode[] | null = [];

                    var hexCoord = this.layout.pixelToHex(new Point(pickedPoint.x, pickedPoint.z));

                    hexCoord = hexCoord.round();

                    var point = this.layout.hexToPixel(hexCoord)

                    if (brush)
                        brush.moveTo(point.x, 0.2, point.y);

                    let validEnd = true;

                    for (let obstacle of this.obstacles) {

                        if (obstacle.hexCoord?.equals(hexCoord))
                            validEnd = false;

                    }

                    if (!validEnd)
                        break;

                    const astarHex = new AStarHex(this.obstacles.map((x) => x.hexCoord!));

                    pathHex = astarHex.findPath(player.hexCoord!, hexCoord);

                    path.showPath(pathHex!.map((x) => x.hex), 4);

                    break;
            }
        });

        scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:

                    switch (kbInfo.event.key) {
                        case "o":
                        case "O":

                            var index = this.obstaclePresets.indexOf(brush);

                            index = (index + 1) % this.obstaclePresets.length;

                            brush = this.obstaclePresets[index];

                            for (var obstaclePreset of obstaclePresets) {
                                if (brush == obstaclePreset)
                                    continue;

                                obstaclePreset.moveTo(300.0, 300.0, 300.0);
                            }

                            this.prevPointerHex = new Hex(0, 0, 0);

                            break;

                        case "i":
                        case "I":

                            var position = brush.toPointXZ();

                            var hexCoord = this.layout.pixelToHex(position);

                            hexCoord = hexCoord.round();

                            var newTile = brush.clone();

                            let coords = this.layout.hexToPixel(hexCoord);

                            if (newTile) {

                                newTile.hexCoord = hexCoord;
                                newTile.moveTo(coords.x, 0, coords.y);

                                this.obstacles.push(newTile);
                            }


                    }
                    break;
            }
        });

        return scene;
    };
}
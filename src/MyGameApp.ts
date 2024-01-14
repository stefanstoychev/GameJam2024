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

        //Player
        var player = new MyPlayer("fox");

        player.load(scene, new BABYLON.Vector3(0, 0, 0));

        //Path
        var pathTile = new MyPathTile("pathTile");

        var path = new PathTiles(this.layout, pathTile);

        pathTile.load(scene, new BABYLON.Vector3(300.0, 300.0, 300.0), () => {
            path.load(scene);
        });

        let brush: MyGameObject;

        var obstaclePresets = this.obstaclePresets;

        //Obstacles

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
                case BABYLON.PointerEventTypes.POINTERDOUBLETAP:
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

                    var validEnd = true;

                    for (let obstacle of this.obstacles) {

                        if (obstacle.hexCoord?.equals(hexCoord))
                            validEnd = false;

                    }

                    if (!validEnd)
                        break;

                    const astarHex = new AStarHex(this.obstacles.map((x) => x.hexCoord!));

                    pathHex = astarHex.findPath(player.hexCoord!, hexCoord);

                    path.showPath(pathHex!.map((x) => x.hex), player.moves);

                    pathHex = pathHex?.splice(0,player.maxMoves)!;

                    var endHex = pathHex.at(-1)?.hex!;

                    // PATH DEFINITION

                    const nbPoints = 5; // the number of points between each Vector3 control points
                    const points = pathHex?.map((x) => {
                        var point = this.layout.hexToPixel(x.hex);

                        return new BABYLON.Vector3(point.x, 0, point.y);
                    });

                    // an array of Vector3 the curve must pass through : the control points
                    const closed = false;                     // closes the curve when true
                    const curve = BABYLON.Curve3.CreateCatmullRomSpline(points!, nbPoints, closed);


                    // Transform the curves into a proper Path3D object and get its orientation information
                    var path3d = new BABYLON.Path3D(curve.getPoints());
                    var tangents = path3d.getTangents();
                    var normals = path3d.getNormals();
                    var binormals = path3d.getBinormals();
                    var curvePath = path3d.getCurve();

                    // Define the position and orientation animations that will be populated
                    // according to the Path3D properties 
                    const frameRate = 90;
                    const posAnim = new BABYLON.Animation("cameraPos", "position", frameRate, BABYLON.Animation.ANIMATIONTYPE_VECTOR3);
                    const posKeys = [];
                    const rotAnim = new BABYLON.Animation("cameraRot", "rotationQuaternion", frameRate, BABYLON.Animation.ANIMATIONTYPE_QUATERNION);
                    const rotKeys = [];

                    for (let i = 0; i < curvePath.length; i++) {
                        const position = curvePath[i];
                        const tangent = tangents[i];
                        const binormal = binormals[i];

                        const rotation = BABYLON.Quaternion.FromLookDirectionRH(tangent, binormal);

                        posKeys.push({ frame: i * frameRate, value: position });
                        rotKeys.push({ frame: i * frameRate, value: rotation });

                    }

                    posAnim.setKeys(posKeys);
                    rotAnim.setKeys(rotKeys);

                    player.rootMesh?.animations.pop();
                    player.rootMesh?.animations.pop();

                    player.rootMesh?.animations.push(posAnim);
                    player.rootMesh?.animations.push(rotAnim);


                    player.walk(this.scene);

                    scene.beginAnimation(player.rootMesh, 0, frameRate * (curvePath.length - 1) * nbPoints, false, nbPoints,
                        () => {
                            player.moveToHex(endHex, this.layout);
                            player.survey(this.scene);
                            return;
                        });

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

                    var validEnd = true;

                    for (let obstacle of this.obstacles) {

                        if (obstacle.hexCoord?.equals(hexCoord))
                            validEnd = false;

                    }

                    if (!validEnd)
                        break;

                    var myastarHex = new AStarHex(this.obstacles.map((x) => x.hexCoord!));

                    pathHex = myastarHex.findPath(player.hexCoord!, hexCoord);

                    path.showPath(pathHex!.map((x) => x.hex), player.moves);

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
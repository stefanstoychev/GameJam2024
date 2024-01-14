import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import "@babylonjs/loaders/glTF";

import { DoubledCoord, Hex, Layout, Orientation, Point } from './lib';
import { AStarHex, HexNode } from './AStarHex';

export class AppOne {

    engine: BABYLON.Engine;

    scene: BABYLON.Scene;

    layout: Layout = new Layout(Layout.pointy, new Point(1, 1), new Point(0, 0));

    path: Hex[] = [];

    obstacles: Hex[] = [];

    playerTile: Hex = new Hex(0, 0, 0);

    prevPointerHex: Hex = new Hex(0, 0, 0);

    pathMeshes: BABYLON.AbstractMesh[] = [];

    obstaclePresets: BABYLON.AbstractMesh[] = [];


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
        groundMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        groundMaterial.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        groundMaterial.emissiveColor = BABYLON.Color3.Blue();

        ground.material = groundMaterial;


        var pathMaterial = new BABYLON.StandardMaterial("path", scene);
        pathMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        pathMaterial.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        pathMaterial.emissiveColor = BABYLON.Color3.Green();

        this.addPlayer(scene, this.playerTile);

        for (var i = 0; i < 5; i++) {
            this.addPathTile(scene, new Hex(-i, 0, i), pathMaterial);
        }

        let selection: BABYLON.AbstractMesh;

        var obstaclePresets = this.obstaclePresets;

        //load obstacles

        BABYLON.SceneLoader.ImportMesh(null, "./hex/", "hex.glb", scene, function (meshes, particleSystems, skeletons) {

            var obstacleMaterial = new BABYLON.StandardMaterial("obstacleRed", scene);
            obstacleMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
            obstacleMaterial.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
            obstacleMaterial.emissiveColor = BABYLON.Color3.Red();

            meshes.forEach((mesh) => {

                if (mesh.name == "__root__") {
                    mesh.position = new BABYLON.Vector3(300.0,300.0,300.0);
                    mesh.rotation = new BABYLON.Vector3(0, 0, 0);
                    mesh.scaling = new BABYLON.Vector3(1, 1, 1);

                    obstaclePresets.push(mesh);

                    selection = mesh;
                }
                else {
                    mesh.material = obstacleMaterial;
                }
            });
        });

        BABYLON.SceneLoader.ImportMesh(null, "./hex/", "hex.glb", scene, function (meshes, particleSystems, skeletons) {

            var obstacleMaterial = new BABYLON.StandardMaterial("obstacleBlue", scene);
            obstacleMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
            obstacleMaterial.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
            obstacleMaterial.emissiveColor = BABYLON.Color3.Blue();

            meshes.forEach((mesh) => {

                if (mesh.name == "__root__") {
                    mesh.position = new BABYLON.Vector3(300.0,300.0,300.0);
                    mesh.rotation = new BABYLON.Vector3(0, 0, 0);
                    mesh.scaling = new BABYLON.Vector3(1, 1, 1);

                    obstaclePresets.push(mesh);
                }
                else {
                    mesh.material = obstacleMaterial;
                }
            });
        });

        scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh == ground; });
                    if (pickinfo.hit) {
                        var mesh = pickinfo.pickedMesh;

                        if (mesh != null) {

                            let pickedPoint = pickinfo.pickedPoint;

                            if (pickedPoint == null)
                                return;
                        }
                    }

                    break;

                case BABYLON.PointerEventTypes.POINTERMOVE:

                    var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh == ground; });

                    if (!pickinfo.hit)
                        break;

                    var mesh = pickinfo.pickedMesh;

                    if (mesh == null)
                        break;


                    let pickedPoint = pickinfo.pickedPoint;

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

                    if (selection)
                        selection.position = new BABYLON.Vector3(point.x, 0.2, point.y);

                    let validEnd = true;

                    for (let obstacle of this.obstacles) {

                        if (obstacle.equals(hexCoord)) {
                            validEnd = false;
                        }

                    }

                    if (!validEnd)
                        break;

                    const astarHex = new AStarHex(this.obstacles);

                    pathHex = astarHex.findPath(this.playerTile, hexCoord);

                    if (pathHex != null) {
                        console.log(`Path found:  lenght: ${this.pathMeshes.length}`);

                        for (var i = 0; i < this.pathMeshes.length; i++) {

                            var coord = this.layout.hexToPixel(this.playerTile);

                            if (i < pathHex.length) {

                                let node = pathHex[i];

                                coord = this.layout.hexToPixel(node.hex);

                            }

                            this.pathMeshes[i].position = new BABYLON.Vector3(coord.x, 0, coord.y);
                        }

                    } else {
                        console.log("No path found.");
                    }


                    break;
            }
        });

        scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        case "o":
                        case "O":

                            var index = this.obstaclePresets.indexOf(selection);

                            index = (index + 1) % this.obstaclePresets.length;

                            selection = this.obstaclePresets[index];

                            for (var obstaclePreset of obstaclePresets) {
                                if (selection == obstaclePreset)
                                    continue;

                                obstaclePreset.position = new BABYLON.Vector3(300.0, 300.0, 300.0);
                            }
                            
                            this.prevPointerHex = new Hex(0, 0, 0);

                            break;

                        case "i":
                        case "I":

                            var position = new Point(selection.position.x, selection.position.z);

                            var hexCoord = this.layout.pixelToHex(position);

                            hexCoord = hexCoord.round();

                            var newTile = selection.clone("sd", selection.parent);

                            let coords = this.layout.hexToPixel(hexCoord);

                            if (newTile)
                                newTile.position = new BABYLON.Vector3(coords.x, 0, coords.y);

                            this.obstacles.push(hexCoord);
                        case "m":
                        case "M":
                            //this.isAddingObracle = false;

                            selection.material = pathMaterial;
                            break;
                    }
                    break;
            }
        });

        return scene;
    };

    private addFloorTile(scene: BABYLON.Scene, hex: Hex, material: BABYLON.StandardMaterial, meshed: BABYLON.AbstractMesh[]) {

        let coords = this.layout.hexToPixel(hex);

        BABYLON.SceneLoader.ImportMesh(null, "./hex/", "hex.glb", scene, function (meshes, particleSystems, skeletons) {

            meshes.forEach((mesh) => {

                if (mesh.name == "__root__") {

                    mesh.position = new BABYLON.Vector3(coords.x, 0, coords.y);
                    mesh.rotation = new BABYLON.Vector3(0, 0, 0);
                    mesh.scaling = new BABYLON.Vector3(1, 1, 1);

                } else {

                    mesh.material = material;
                }

            });
        });
    }

    private addPathTile(scene: BABYLON.Scene, hex: Hex, material: BABYLON.StandardMaterial) {

        let coords = this.layout.hexToPixel(hex);

        let pathMeshes = this.pathMeshes;

        BABYLON.SceneLoader.ImportMesh(null, "./hex/", "hex.glb", scene, function (meshes, particleSystems, skeletons) {

            meshes.forEach((mesh) => {

                if (mesh.name == "__root__") {

                    mesh.position = new BABYLON.Vector3(coords.x, 0, coords.y);
                    mesh.rotation = new BABYLON.Vector3(0, 0, 0);
                    mesh.scaling = new BABYLON.Vector3(1, 1, 1);

                    pathMeshes.push(mesh);

                } else {

                    mesh.material = material;
                }

            });
        });
    }

    private addPlayer(scene: BABYLON.Scene, hex: Hex) {
        let coords = this.layout.hexToPixel(hex);

        BABYLON.SceneLoader.ImportMesh(null, "./fox/", "Fox.glb", scene, function (meshes, particleSystems, skeletons) {

            meshes.forEach((mesh) => {

                if (mesh.name == "__root__") {

                    mesh.position = new BABYLON.Vector3(coords.x, 0, coords.y);
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
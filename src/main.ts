import { MyGameApp as App } from './MyGameApp';

console.log(`main.ts starting ${App.name}`);
window.addEventListener('DOMContentLoaded', () => {
    let canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
    let app = new App(canvas);
    app.run();
});
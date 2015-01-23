
var stage = new PIXI.Stage(0x66FF99);
var renderer = PIXI.autoDetectRenderer(800,600);

document.body.appendChild(renderer.view);


requestAnimFrame( update );

function update() {
    

    renderer.render(stage)
    requestAnimFrame(update);
}

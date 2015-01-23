var stage = new PIXI.Stage(0x66FF99);
var height = 600, width = 800;
var renderer = PIXI.autoDetectRenderer(width, height);

document.body.appendChild(renderer.view);

var t_teddy = PIXI.Texture.fromImage("teddy.png");
var teddy = new PIXI.Sprite(t_teddy);
teddy.anchor.x = 0.5;
teddy.anchor.y = 0.5;

teddy.position.x = width/2;
teddy.position.y = height/2;
teddy.speed = {x:0, y:0}

stage.addChild(teddy);

var lastTime = Date.now(),
    dt = 0;

requestAnimFrame( update );

var isMoving = false;

function update() {
    var now = Date.now();
    dt = now - lastTime;

    teddy.position.x += teddy.speed.x * 500 * dt/1000
    teddy.position.y += teddy.speed.y * 500 * dt/1000

    teddy.speed.x -= teddy.speed.x * (0.8 * dt/200);
    teddy.speed.y -= teddy.speed.y * (0.8 * dt/200);

    renderer.render(stage)
    requestAnimFrame(update);
    kd.tick();
    lastTime = Date.now();
}

kd.A.down(function() {
    teddy.speed.x -= 0.2;
});
kd.D.down(function() {
    teddy.speed.x += 0.2;
});
kd.W.down(function() {
    teddy.speed.y -= 0.2;
});
kd.S.down(function() {
    teddy.speed.y += 0.2;
});

var height = 600, width = 800;

var game = new Phaser.Game(width, height, Phaser.AUTO, 'Fast Teddy', {
    preload: preload,
    create: create,
    render: render,
    update: update
});

function preload() {
    // game.load.spritesheet('teddy', 'teddy.png', 64, 64);
    //game.load.image('background', 'bg.png');
    game.load.image('teddy', 'teddy.png');
    game.load.image('rabbit', 'rabbit.png');
    game.load.image('bullet', 'rabbit.png');
    game.load.image('enemyBullet', 'rabbit.png');
    game.load.image('explosion', 'rabbit.png');

    game.load.audio('music', 'music.ogg');
}

var ply;
var enemies;
var livingEnemies;
var bullets;
var bulletTime = 0;
var bulletWait = 200;
var buttons;
var fireButton;
var explosions;
var score = 0;
var scoreStr = '';
var scoreText;
var lives;
var enemyBullets;
var firingTimer = 0;
var stateText;
var shooting = false;

var font = {font: '34px Arial', fill: "#fff"};

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    music = game.add.audio('music');
    //music.play();

    //background_image = game.add.tileSprite(0,0,width,height, 'background');

    // bullets
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(30, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 1);
    bullets.setAll('outOfBoundsKill', true);
    bullets.setAll('checkWorldBounds', true);

    // enemy bullets
    enemyBullets = game.add.group();
    enemyBullets.enableBody = true;
    enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
    enemyBullets.createMultiple(30, 'enemyBullet');
    enemyBullets.setAll('anchor.x', 0.5);
    enemyBullets.setAll('anchor.y', 1);
    enemyBullets.setAll('outOfBoundsKill', true);
    enemyBullets.setAll('checkWorldBounds', true);

    // player
    ply = game.add.sprite(width/2, height/2, 'teddy');
    ply.anchor.setTo(.5, .5);
    ply.facing = "left";
    game.physics.enable(ply, Phaser.Physics.ARCADE);
    ply.body.setSize(42, 56);
    ply.body.collideWorldBounds = true;

    // enemies
    enemies = game.add.group();
    enemies.enableBody = true;
    enemies.physicsBodyType = Phaser.Physics.ARCADE;

    // score
    scoreStr = "Score: ";
    scoreText = game.add.text(10, 10, scoreStr + score, font);

    // lives
    lives = game.add.group();
    game.add.text(width - 100 - 32, 10, 'Lives: ', font);

    for (var i=0;i<3;i++) {
        var ted = lives.create(width - 100 + (32*i), 64, 'teddy');
        ted.anchor.setTo(.5,.5);
        ted.alpha = .4;
    }

    // explosions
    explosions = game.add.group();
    explosions.createMultiple(15, 'explosion');
    explosions.forEach(setupEnemy, this);

    // buttons!
    cursors = game.input.keyboard.createCursorKeys();
    wasd = {
        up: game.input.keyboard.addKey(Phaser.Keyboard.W),
        down:game.input.keyboard.addKey(Phaser.Keyboard.S),
        left:game.input.keyboard.addKey(Phaser.Keyboard.A),
        right:game.input.keyboard.addKey(Phaser.Keyboard.D)
    }
    //fireButtonLeft = game.input
}
function setupEnemy(enemy) {
    enemy.anchor.x = enemy.anchor.y = .5;
    enemy.animations.add('explosion');
}

function update() {

    if(ply.alive) {
        //ply.body.velocity.setTo(0, 0);
        ply.body.velocity.x -= ply.body.velocity.x * 0.9 * game.time.elapsed/100;
        ply.body.velocity.y -= ply.body.velocity.y * 0.9 * game.time.elapsed/100;

        if (wasd.left.isDown)
            ply.body.velocity.x -= 200;
        if (wasd.right.isDown)
            ply.body.velocity.x += 200;
        if (wasd.down.isDown)
            ply.body.velocity.y += 200;
        if (wasd.up.isDown)
            ply.body.velocity.y -= 200;

        shooting = (
                cursors.up.isDown ||
                cursors.down.isDown ||
                cursors.left.isDown ||
                cursors.right.isDown
                )

        if (shooting)
            shoot({
                up: cursors.up.isDown,
                down: cursors.down.isDown,
                left: cursors.left.isDown,
                right: cursors.right.isDown});

        //game.physics.arcade.overlap(bullets, enemies, collisionHandler, null, this);
        //game.physics.arcade.overlap(enemyBullets, ply, enemyHitsPly, null, this);
    }
}
function render() {

}
function shoot(dirs) {
    if (game.time.now > bulletTime) {
        bullet = bullets.getFirstExists(false);
        if (bullet) {
            bullet.reset(ply.x, ply.y);
            bullet.body.velocity.y = dirs.up * -400 + dirs.down * 400;
            bullet.body.velocity.x = dirs.left * -400 + dirs.right * 400;

            if (bullet.body.velocity.x == 0 && bullet.body.velocity.y == 0) {
                bullet.kill();
                return;
            }

            //down = PI
            //up = 0
            //right PI/2
            //left (3*PI)/2
            var PI = Math.PI;
            bullet.rotation = (dirs.up * PI * 2) || (dirs.down * PI) ||
                              (dirs.left * (3*PI)/2) || (dirs.right * PI/2);

            bulletTime = game.time.now + bulletWait;
        }
    }
}

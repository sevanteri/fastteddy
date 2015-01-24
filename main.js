var height = 600, width = 800;

var game = new Phaser.Game(width, height, Phaser.AUTO, 'Fast Teddy', {
    preload: preload,
    create: create,
    render: render,
    update: update
});

function preload() {
    game.load.spritesheet('teddy', 'teddy.png', 64, 64, 30);
    //game.load.image('background', 'bg.png');
    game.load.image('rabbit', 'rabbit.png');
    game.load.image('bullet', 'bullet.png');
    game.load.image('enemyBullet', 'rabbit.png');
    game.load.image('explosion', 'rabbit.png');

    game.load.audio('music', 'music.ogg');
}

var ply;
var firingTimer = 0;
var shooting = false;

var enemies;
var enemyWait = 1000;
var enemyTime = 0;
var enemyBullets;

var bullets;
var bulletTime = 0;
var bulletWait = 200;

var cursors;
var wasd;

var explosions;

var score = 0;
var scoreStr = '';
var scoreText;

var lives;
var stateText;

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
    ply.animations.add('walkd', [6,7,8,9,10,11], 10, true);
    ply.animations.add('walku', [12,13,14,15,16,17], 10, true);
    ply.animations.add('walkl', [18,19,20,21,22,23], 10, true);
    ply.animations.add('walkr', [24,25,26,27,28,29], 10, true);
    ply.animations.add('standd', [0]);
    ply.animations.add('standu', [1]);
    ply.animations.add('standl', [2]);
    ply.animations.add('standr', [3]);
    ply.animations.play('standd');

    // enemies
    enemies = game.add.group();
    enemies.enableBody = true;
    enemies.physicsBodyType = Phaser.Physics.ARCADE;
    game.physics.enable(enemies, Phaser.Physics.ARCADE);
    enemies.setAll('body.maxAngular', 500);
    enemies.setAll('body.angularDrag', 500);
    enemies.createMultiple(10, 'rabbit');
    enemies.setAll('anchor.x', .5);
    enemies.setAll('anchor.y', .5);

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

        if (wasd.left.isDown) {
            ply.body.velocity.x -= 100;
            ply.animations.play('walkl');
        }
        if (wasd.right.isDown) {
            ply.body.velocity.x += 100;
            ply.animations.play('walkr');
        }
        if (wasd.down.isDown) {
            ply.body.velocity.y += 100;
            ply.animations.play('walkd');
        }
        if (wasd.up.isDown) {
            ply.body.velocity.y -= 100;
            ply.animations.play('walku');
        }
        if (wasd.up.isUp &&
            wasd.down.isUp &&
            wasd.left.isUp &&
            wasd.right.isUp)
        {
            var curA = ply.animations.currentAnim.name;
            ply.animations.play('stand' + curA.substr(-1));
        }

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

        spawnEnemy();
        enemies.forEach(moveEnemy, this);

        game.physics.arcade.overlap(bullets, enemies, collisionHandler, null, this);
        //game.physics.arcade.overlap(enemyBullets, ply, enemyHitsPly, null, this);
    }
}
function render() {}
function shoot(dirs) {
    if (game.time.now > bulletTime) {
        bullet = bullets.getFirstExists(false);
        if (bullet) {
            bullet.reset(ply.x, ply.y);
            bullet.body.velocity.y = dirs.up * -500 + dirs.down * 500;
            bullet.body.velocity.x = dirs.left * -500 + dirs.right * 500;

            if (bullet.body.velocity.x == 0 && bullet.body.velocity.y == 0) {
                bullet.kill();
                return;
            }

            var PI = Math.PI;
            bullet.rotation =
                ((dirs.up && dirs.left) || (dirs.down && dirs.right)) * PI/4 ||
                ((dirs.up && dirs.right) || (dirs.down && dirs.left)) * -PI/4 ||
                (dirs.up || dirs.down) * PI/2;

            bulletTime = game.time.now + bulletWait;
        }
    }
}
var R = Math.random;
function spawnEnemy() {
    if (game.time.now > enemyTime) {
        var enemy = enemies.getFirstExists(false);
        if (enemy) {

            var side = Math.floor(R() * 3 + 1);
            var x = R() * (width-64 - 64) + 64;
            var y = R() * (height-64 - 64) + 64;

            if (side == 1)
                enemy.reset(64, y);
            else if (side == 2)
                enemy.reset(x, 64);
            else if (side == 3)
                enemy.reset(width - 64, y);
            else if (side == 4)
                enemy.reset(x, height - 64);

            enemyTime = game.time.now + enemyWait;
        }
    }
}
function moveEnemy(enemy) {
    if (enemy.alive) {
        game.physics.arcade.moveToObject(enemy, ply, 300);
    }
}
function collisionHandler(bullet, enemy) {
    bullet.kill();
    enemy.kill();

    score += 50;
    scoreText.text = scoreStr + score;
}

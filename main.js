var height = 600, width = 800;

var game = new Phaser.Game(width, height, Phaser.AUTO, 'Fast Teddy', {
    preload: preload,
    create: create,
    render: render,
    update: update
});

function preload() {
    game.load.spritesheet('teddy', 'teddy.png', 64, 64, 30);
    game.load.spritesheet('rabbit', 'rabbit.png', 64, 64, 24);
    game.load.spritesheet('boss', 'boss.png', 128, 128, 4);
    game.load.image('background', 'bg.png');
    game.load.image('bullet', 'bullet.png');
    game.load.image('enemyBullet', 'rabbit.png');
    game.load.image('explosion', 'rabbit.png');

    game.load.audio('music', 'music.ogg');
}

var ply;
var shooting = false;
var moving = false;
var invincibilityWait = 2000;
var invincibilityTime = 0;
var movingSpeed = 100;

var enemies;
var enemyWait = 1000;
var enemyTime = 0;
var enemyBullets;
var killCount = 0;

var boss;
var bossHealt = 0;
var bossLives = 1;
var bossFight = false;

var bullets;
var bulletTime = 0;
var bulletWait = 400;

var cursors;
var wasd;

var explosions;

var score = 0;
var scoreStr = '';
var scoreText;

var lives;
var stateText;
var running = true;

var font = {font: '34px Arial', fill: "#fff"};

var frames = [0,1,2,3,4,5];
var framesFunc = function(r) { return frames.map(function(c) { return c + 6 * r }) };

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    music = game.add.audio('music');
    music.play('', 0, 1, true);

    background_image = game.add.tileSprite(0,0,width,height, 'background');

    // bullets
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(30, 'bullet');
    bullets.forEach(setupBullet, this);

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
    game.physics.enable(ply, Phaser.Physics.ARCADE);
    ply.body.setSize(38,59);
    ply.body.collideWorldBounds = true;
    ply.animations.add('walkd', framesFunc(1), 10, true);
    ply.animations.add('walku', framesFunc(2), 10, true);
    ply.animations.add('walkl', framesFunc(3), 10, true);
    ply.animations.add('walkr', framesFunc(4), 10, true);
    ply.animations.add('standd', [0]);
    ply.animations.add('standu', [1]);
    ply.animations.add('standl', [2]);
    ply.animations.add('standr', [3]);
    ply.animations.play('standd');

    // boss
    boss = game.add.sprite(140, 140, 'boss');
    boss.anchor.setTo(.5,.5);
    game.physics.enable(boss, Phaser.Physics.ARCADE);
    boss.animations.add('lol');
    boss.animations.play('lol', 2, true);
    boss.body.collideWorldBounds = true;
    boss.body.setSize(64,64);
    boss.kill();

    // enemies
    enemies = game.add.group();
    enemies.enableBody = true;
    enemies.physicsBodyType = Phaser.Physics.ARCADE;
    game.physics.enable(enemies, Phaser.Physics.ARCADE);
    enemies.createMultiple(10, 'rabbit');
    enemies.forEach(setupEnemy, this);

    // score
    scoreStr = "Score: ";
    scoreText = game.add.text(10, 10, scoreStr + score, font);
    enemyTime = game.time.now + enemyWait;

    // lives
    lives = game.add.group();
    game.add.text(width - 100 - 32, 10, 'Lives: ', font);

    // win lose text
    stateText = game.add.text(
            game.world.centerX,
            game.world.centerY,
            ' ',
            {font: '84px Arial', fill: '#FFF'}
    );
    stateText.anchor.setTo(0.5,0.5);
    stateText.visible = false;

    for (var i=0;i<3;i++) {
        var ted = lives.create(width - 100 + (32*i), 64, 'teddy');
        ted.anchor.setTo(.5,.5);
        ted.alpha = .4;
    }

    // explosions
    //explosions = game.add.group();
    //explosions.createMultiple(15, 'explosion');

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
    enemy.anchor.setTo(.5,.5);
    enemy.body.setSize(38,59);
    enemy.animations.add('walkd', framesFunc(0), 10, true);
    enemy.animations.add('walku', framesFunc(1), 10, true);
    enemy.animations.add('walkl', framesFunc(2), 10, true);
    enemy.animations.add('walkr', framesFunc(3), 10, true);
}

function setupBullet(bullet) {
    bullet.anchor.setTo(.5,1);
    bullet.outOfBoundsKill = true;
    bullet.checkWorlBounds = true;
}

function update() {

    if(ply.alive) {
        //ply.body.velocity.setTo(0, 0);
        ply.body.velocity.x -= (ply.body.velocity.x * 0.9 * game.time.elapsed/100);
        ply.body.velocity.y -= (ply.body.velocity.y * 0.9 * game.time.elapsed/100);
        //ply.body.velocity.x = Math.round(ply.body.velocity.x);
        //ply.body.velocity.y = Math.round(ply.body.velocity.y);

        moving = (wasd.up.isUp ||
                wasd.down.isUp ||
                wasd.left.isUp ||
                wasd.right.isUp);
        shooting = (
                cursors.up.isDown ||
                cursors.down.isDown ||
                cursors.left.isDown ||
                cursors.right.isDown
                )

        if (wasd.left.isDown) {
            ply.body.velocity.x -= movingSpeed;
            if (!shooting && !wasd.up.isDown && !wasd.down.isDown)
                ply.animations.play('walkl');
        }
        if (wasd.right.isDown) {
            ply.body.velocity.x += movingSpeed;
            if (!shooting && !wasd.up.isDown && !wasd.down.isDown)
                ply.animations.play('walkr');
        }
        if (wasd.down.isDown) {
            ply.body.velocity.y += movingSpeed;
            if (!shooting)
                ply.animations.play('walkd');
        }
        if (wasd.up.isDown) {
            ply.body.velocity.y -= movingSpeed;
            if (!shooting)
                ply.animations.play('walku');
        }

        if (!moving) {
            var curA = ply.animations.currentAnim.name;
            ply.animations.play('stand' + curA.substr(-1));
        }

        ply.alpha = (game.time.now < invincibilityTime) ? 0.6 : 1;

        if (shooting)
            shoot({
                up: cursors.up.isDown,
                down: cursors.down.isDown,
                left: cursors.left.isDown,
                right: cursors.right.isDown});

        if (!bossFight) {
            spawnEnemy();
            enemies.forEach(moveEnemy, this);
            game.physics.arcade.overlap(enemies, ply, collisionEnemyPly, null, this);
            game.physics.arcade.overlap(bullets, enemies, collisionBulletEnemy, null, this);
        } else {

            game.physics.arcade.overlap(bullets, boss, collisionBulletBoss, null, this);
            game.physics.arcade.overlap(boss, ply, collisionEnemyPly, null, this);
        }

    }
}
function render() {}
function shoot(dirs) {
    if (game.time.now > bulletTime) {
        bullet = bullets.getFirstExists(false);
        if (bullet) {
            var animStr = moving ? "walk" : "stand";
            if (dirs.up)
                ply.animations.play(animStr + 'u');
            else if (dirs.down)
                ply.animations.play(animStr + 'd');
            else if (dirs.left)
                ply.animations.play(animStr + 'l');
            else if (dirs.right)
                ply.animations.play(animStr + 'r');

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
            var x = R() * (width-32 - 32) + 32;
            var y = R() * (height-32 - 32) + 32;

            if (side == 1)
                enemy.reset(32, y);
            else if (side == 2)
                enemy.reset(x, 32);
            else if (side == 3)
                enemy.reset(width - 32, y);
            else if (side == 4)
                enemy.reset(x, height - 32);

            enemyTime = game.time.now + enemyWait;
        }
    }
}
function moveEnemy(enemy) {
    if (enemy.alive) {
        game.physics.arcade.moveToObject(enemy, ply, 300);

        if (enemy.body.velocity.y > 0 &&
                 Math.abs(enemy.body.velocity.y) > Math.abs(enemy.body.velocity.x))
            enemy.animations.play('walkd');
        else if (enemy.body.velocity.y < 0 &&
                 Math.abs(enemy.body.velocity.y) > Math.abs(enemy.body.velocity.x))
            enemy.animations.play('walku');
        else if (enemy.body.velocity.x > 0 &&
                 Math.abs(enemy.body.velocity.y) < Math.abs(enemy.body.velocity.x))
            enemy.animations.play('walkr');
        else if (enemy.body.velocity.x < 0 &&
                 Math.abs(enemy.body.velocity.y) < Math.abs(enemy.body.velocity.x))
            enemy.animations.play('walkl');

    }
}
function startBossFight() {
    bossFight = true;
    enemies.callAll('kill');
    bossHealth = bossLives;
    boss.revive();
}
function collisionBulletEnemy(bullet, enemy) {
    bullet.kill();
    enemy.kill();

    score += 50 * lives.countLiving();
    scoreText.text = scoreStr + score;
    killCount++;

    if (killCount > 2) {
        startBossFight();
    }
}
function collisionEnemyPly(enemy, pl) {
    if (game.time.now > invincibilityTime) {
        var live = lives.getFirstAlive();
        if (live)
            live.kill();

        invincibilityTime = game.time.now + invincibilityWait;

        if (lives.countLiving() < 1) {
            ply.kill();
            stateText.text = "  Game over.\nClick to restart";
            stateText.visible = true;

            game.input.onTap.addOnce(restart, this);
        }
    }
}
function collisionBulletBoss(bullet, boss) {
    bullet.kill();
    bossHealth--;

    if (bossHealth < 1) {
        boss.kill();

        stateText.text = '    You win!\nClick to restart';
        stateText.visible = true;
        game.input.onTap.addOnce(restart, this);
    }
}
function restart() {
    lives.callAll('revive');
    enemies.callAll('kill');
    ply.revive();
    score = 0;
    killCount = 0;
    bossFight = 0;
    scoreText.text = scoreStr + score;
    stateText.visible = false;
    enemyTime = game.time.now + enemyWait;
}

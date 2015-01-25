var height = 600, width = 800;

var game = new Phaser.Game(width, height, Phaser.AUTO, 'Fast Teddy', {
    preload: preload,
    create: create,
    render: render,
    update: update
});

function preload() {
    game.load.spritesheet('teddy', 'teddy.png', 64, 64, 34);
    game.load.spritesheet('rabbit', 'rabbit.png', 64, 64, 28);
    game.load.spritesheet('boss', 'boss.png', 128, 128, 8);
    game.load.image('background', 'bg.png');
    game.load.image('bullet', 'bullet.png');
    game.load.image('enemyBullet', 'boss_spruit.png');
    game.load.image('explosion', 'rabbit.png');
    game.load.image('healthbar', 'heppabaari.png');

    game.load.audio('music', 'music.ogg');
}

var ply;
var shooting = false;
var moving = false;
var invincibilityWait = 2000;
var invincibilityTime = 0;
var movingSpeed = 100;

var enemies;
var deadEnemies;
var startEnemyWait = 1000;
var enemyWait = startEnemyWait;
var enemyTime = 0;
var enemyBullets;
var killCount = 0;
var killTarget = 20;

var boss;
var startBossLives = 25;
var bossLives = startBossLives;
var bossFight = false;
var bossShootTime = 0;
var bossShootWait = 20;
var startBossBulletSpeed = 300;
var bossBulletSpeed = startBossBulletSpeed;
var bossLevel = 0;

var bossHp;
var healthBarBG;
var healthBar;

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
    deadEnemies = game.add.group();

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


    // boss
    boss = game.add.sprite(140, 140, 'boss');
    boss.anchor.setTo(.5,.5);
    game.physics.enable(boss, Phaser.Physics.ARCADE);
    boss.animations.add('lol', [0,1,2,3], 2, true);
    boss.animations.add('death', [4,5,6,7], 4, false);
    boss.animations.play('lol');
    boss.body.collideWorldBounds = true;
    boss.body.setSize(64,64);
    boss.kill();
    boss.Tween = game.add.tween(boss);


    // player
    ply = game.add.sprite(width/2, height/2, 'teddy');
    ply.anchor.setTo(.5, .5);
    game.physics.enable(ply, Phaser.Physics.ARCADE);
    ply.body.setSize(30,45);
    ply.body.collideWorldBounds = true;
    ply.animations.add('walkd', framesFunc(1), 10, true);
    ply.animations.add('walku', framesFunc(2), 10, true);
    ply.animations.add('walkl', framesFunc(3), 10, true);
    ply.animations.add('walkr', framesFunc(4), 10, true);
    ply.animations.add('standd', [0]);
    ply.animations.add('standu', [1]);
    ply.animations.add('standl', [2]);
    ply.animations.add('standr', [3]);
    ply.animations.add('death', [30,31,32,33], 4, false);
    ply.animations.play('standd');

    // enemies
    enemies = game.add.group();
    enemies.enableBody = true;
    enemies.physicsBodyType = Phaser.Physics.ARCADE;
    game.physics.enable(enemies, Phaser.Physics.ARCADE);
    enemies.createMultiple(killTarget, 'rabbit');
    enemies.forEach(setupEnemy, this);

    // score
    scoreStr = "Score: ";
    scoreText = game.add.text(10, 10, scoreStr + score, font);
    enemyTime = game.time.now + enemyWait;

    // lives
    lives = game.add.group();
    game.add.text(width - 100 - 32, 10, 'Lives: ', font);

    // boss health bar
    bossHp = game.add.group();
    var hpbg = game.add.graphics(width/2 - 3*32, 23 + 2);
    hpbg.beginFill(0xCFDFD0);
    hpbg.lineStyle(1, 0x000000, 1);
    hpbg.moveTo(0, 0);
    hpbg.lineTo(6*32, 0);
    hpbg.lineTo(6*32, 16);
    hpbg.lineTo(0, 16);
    hpbg.endFill();
    bossHp.add(hpbg);

    healthBar = game.add.graphics(width/2 - 3*32, 23 + 2);
    healthBar.beginFill(0xA61405);
    healthBar.lineStyle(1, 0xA21203, 1);
    healthBar.moveTo(0, 0);
    healthBar.lineTo(6*32, 0);
    healthBar.lineTo(6*32, 16);
    healthBar.lineTo(0, 16);
    healthBar.endFill();
    bossHp.add(healthBar);

    healthBarBG = game.add.sprite(width/2, 2, 'healthbar');
    healthBarBG.anchor.setTo(0.5, 0);
    bossHp.add(healthBarBG);
    bossHp.visible = false;

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
    enemy.animations.add('death', [24,25,26,27], 4, false);
}

function setupBullet(bullet) {
    bullet.anchor.setTo(.5,1);
    bullet.outOfBoundsKill = true;
    bullet.checkWorldBounds = true;
}

function update() {

    if(ply.alive) {
        //ply.body.velocity.setTo(0, 0);
        ply.body.velocity.x -= (ply.body.velocity.x * 0.9 * game.time.elapsed/100);
        ply.body.velocity.y -= (ply.body.velocity.y * 0.9 * game.time.elapsed/100);
        //ply.body.velocity.x = Math.round(ply.body.velocity.x);
        //ply.body.velocity.y = Math.round(ply.body.velocity.y);

        moving = (wasd.up.isDown ||
                wasd.down.isDown ||
                wasd.left.isDown ||
                wasd.right.isDown);
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
            game.physics.arcade.overlap(enemyBullets, ply, collisionBossBulletPly, null, this);
            game.physics.arcade.overlap(bullets, boss, collisionBulletBoss, null, this);
            game.physics.arcade.overlap(ply, boss, collisionEnemyPly, null, this);
            bossShoot();
            if (!boss.alive)
                boss.Tween.stop();
        }

    }
}
function render() {}
function shoot(dirs) {
    if (game.time.now > bulletTime) {
        var bullet = bullets.getFirstExists(false);
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
function bossShoot() {
    if (boss.alive && bossFight && game.time.now > bossShootTime) {
        var bullet = enemyBullets.getFirstExists(false);
        if (bullet) {
            bullet.reset(boss.x, boss.y);
            game.physics.arcade.moveToObject(bullet, ply, bossBulletSpeed);

            bossShootTime = game.time.now + bossShootWait;
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
    boss.reset(140, 140);
    boss.animations.play('lol');
    boss.revive(bossLives);
    boss.alive = true;
    bossHp.visible = true;
    moveBoss();
}
function moveBoss() {
    boss.Tween = game.add.tween(boss);
    boss.Tween.to({y: height - 140}, 5000 - bossLevel*200)
        .to({x: width - 140}, 8000 - bossLevel*200)
        .to({y: 140}, 5000 - bossLevel*200)
        .to({x:  140}, 8000 - bossLevel*200)
        .loop()
        .start();
}
function collisionBulletEnemy(bullet, enemy) {
    if (enemy.alive) {
        bullet.kill();
        deadEnemies.add(enemy);
        enemy.alive = false;
        enemy.animations.play('death');
        enemy.body.velocity.x = enemy.body.velocity.y = 0;

        score += 50 * lives.countLiving();
        scoreText.text = scoreStr + score;
        killCount++;

        if (killCount >= killTarget) {
            startBossFight();
        }
    }
}
function collisionBossBulletPly(pl, bullet) {
    collisionEnemyPly(pl, bullet);
    bullet.kill();
}
function collisionEnemyPly(pl, enemy) {
    if (game.time.now > invincibilityTime && enemy.alive) {
        var live = lives.getFirstAlive();
        if (live)
            live.kill();

        invincibilityTime = game.time.now + invincibilityWait;

        if (lives.countLiving() < 1) {
            ply.alive = false;
            ply.body.velocity = {x:0,y:0};
            ply.animations.play('death');
            stateText.text = "  Game over.\nClick to restart";
            stateText.visible = true;

            game.input.onTap.addOnce(restart, this);
        }
    }
}
function collisionBulletBoss(b, bullet) {
    if (boss.alive) {
        bullet.kill();
        b.health -= 1;

        healthBar.width = b.health/bossLives;

        if (b.health < 1) {

            b.alive = false;
            b.animations.play('death');
            b.Tween.stop();
            score += 1000 * lives.countLiving();
            scoreText.text = scoreStr + score;
            stateText.text = '     You win!\n      Click to\ncontinue killing';
            stateText.visible = true;
            game.input.onTap.addOnce(replay, this);
        }
    }
}
function restart() {
    lives.callAll('revive');

    while (deadEnemies.children.length > 0) {
        enemies.addMultiple(deadEnemies.children);
    }

    enemies.callAll('kill');
    ply.revive();
    boss.kill();
    score = 0;
    killCount = 0;
    bossLevel = 0;

    bossLives = startBossLives;
    bossBulletSpeed = startBossBulletSpeed;
    enemyWait = startEnemyWait;

    bossFight = false;
    scoreText.text = scoreStr + score;
    stateText.visible = false;
    enemyTime = game.time.now + enemyWait;
    bossHp.visible = false;

}
function replay() {
    lives.callAll('revive');
    while (deadEnemies.children.length > 0) {
        enemies.addMultiple(deadEnemies.children);
    }
    enemies.callAll('kill');
    boss.kill();
    killCount = 0;
    bossFight = false;
    stateText.visible = false;

    enemyWait *= 0.9;
    enemyTime = game.time.now + enemyWait;
    bossLives += 5;
    bossBulletSpeed *= 1.1;
    bossLevel++;
    bossHp.visible = false;
}

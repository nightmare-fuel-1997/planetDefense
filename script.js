// Projectile trail particle class
class TrailParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 3;
    this.alpha = 1;
    this.decay = 0.05;
  }

  update() {
    this.alpha -= this.decay;
  }

  draw(context) {
    context.save();
    context.globalAlpha = this.alpha;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fillStyle = "gold";
    context.fill();
    context.restore();
  }
}

// Score popup animation class
class ScorePopup {
  constructor(x, y, score) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.alpha = 1;
    this.velocityY = -2;
    this.life = 60; // frames
  }

  update() {
    this.y += this.velocityY;
    this.alpha -= 0.02;
    this.life--;
  }

  draw(context) {
    if (this.life > 0) {
      context.save();
      context.globalAlpha = this.alpha;
      context.fillStyle = "gold";
      context.font = "20px Impact";
      context.textAlign = "center";
      context.fillText(`+${this.score}`, this.x, this.y);
      context.restore();
    }
  }
}

class Planet {
  constructor(game) {
    this.game = game;
    this.x = this.game.width / 2;
    this.y = this.game.height / 2;
    this.radius = 80;
    this.image = document.getElementById("planet");
    this.damageFlash = 0; // for damage effect
  }

  draw(context) {
    // Apply damage flash effect
    if (this.damageFlash > 0) {
      context.save();
      context.globalAlpha = this.damageFlash / 10;
      context.fillStyle = "red";
      context.beginPath();
      context.arc(this.x, this.y, this.radius + 20, 0, Math.PI * 2);
      context.fill();
      context.restore();
      this.damageFlash--;
    }

    context.drawImage(this.image, this.x - 100, this.y - 100);

    if (this.game.debug) {
      // debug circle
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      context.stroke();
    }
  }
}

class Player {
  constructor(game) {
    this.game = game;
    this.x = this.game.width / 2;
    this.y = this.game.height / 2;
    this.radius = 40;
    this.image = document.getElementById("player");
    this.aim;
    this.angle = 0;
    this.muzzleFlash = 0; // for muzzle flash effect
  }
  draw(context) {
    context.save();
    context.translate(this.x, this.y);
    context.rotate(this.angle);

    // Draw muzzle flash
    if (this.muzzleFlash > 0) {
      context.save();
      context.globalAlpha = this.muzzleFlash / 5;
      context.fillStyle = "yellow";
      context.beginPath();
      context.arc(this.radius, 0, 15, 0, Math.PI * 2);
      context.fill();
      context.restore();
      this.muzzleFlash--;
    }

    context.drawImage(this.image, -this.radius, -this.radius);

    if (this.game.debug) {
      context.beginPath();
      context.arc(0, 0, this.radius, 0, Math.PI * 2);
      context.stroke();
    }

    context.restore();
  }
  // player moves so we need an update method
  update() {
    this.aim = this.game.calcAim(this.game.planet, this.game.mouse);
    this.x =
      this.game.planet.x +
      (this.game.planet.radius + this.radius) * this.aim[0];
    this.y =
      this.game.planet.y +
      (this.game.planet.radius + this.radius) * this.aim[1];
    this.angle = Math.atan2(this.aim[3], this.aim[2]);
  }
  shoot() {
    const projectile = this.game.getProjectile();
    if (projectile) {
      projectile.start(
        this.x + this.radius * this.aim[0],
        this.y + this.radius * this.aim[1],
        this.aim[0],
        this.aim[1]
      );
      this.muzzleFlash = 5; // trigger muzzle flash
      this.game.shotsFired++; // track shots for stats
    }
  }
}

class Projectile {
  constructor(game) {
    this.game = game;
    this.x;
    this.y;
    this.radius = 5;
    this.speedX = 1;
    this.speedY = 1;
    this.speedModifier = 5;
    this.free = true;
    this.trail = []; // trail particles
  }

  start(x, y, speedX, speedY) {
    this.free = false;
    this.x = x;
    this.y = y;
    this.speedX = speedX * this.speedModifier;
    this.speedY = speedY * this.speedModifier;
    this.trail = []; // reset trail
  }

  reset() {
    this.free = true;
    this.trail = [];
  }

  draw(context) {
    if (!this.free) {
      // Draw trail particles
      this.trail.forEach(particle => particle.draw(context));

      // Draw projectile with glow
      context.save();
      context.shadowBlur = 10;
      context.shadowColor = "gold";
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      context.fillStyle = "gold";
      context.fill();
      context.restore();
    }
  }

  update() {
    if (!this.free) {
      this.x += this.speedX;
      this.y += this.speedY;

      // Add trail particle
      this.trail.push(new TrailParticle(this.x, this.y));

      // Update and remove old trail particles
      this.trail = this.trail.filter(particle => {
        particle.update();
        return particle.alpha > 0;
      });
    }
    //reset if off screen
    if (
      this.x < 0 ||
      this.x > this.game.width ||
      this.y < 0 ||
      this.y > this.game.height
    ) {
      this.reset();
    }
  }
}

class Enemy {
  constructor(game) {
    this.game = game;
    this.x = 100;
    this.y = 100;
    this.radius = 40;
    this.width = this.radius * 2;
    this.height = this.radius * 2;
    this.speedX = 0;
    this.speedY = 0;
    this.speedModifier = Math.random() * 0.7 + 0.1;
    this.angle = 0;
    this.collided = false;
    this.free = true;
  }
  start() {
    this.free = false;
    this.collided = false;
    this.frameX = 0;
    this.lives = this.maxLives;
    this.frameY = Math.floor(Math.random() * 4);
    //spawn at random edge
    if (Math.random() < 0.5) {
      //top or bottom
      this.x = Math.random() * this.game.width;
      this.y =
        Math.random() < 0.5 ? 0 - this.radius : this.game.height + this.radius;
    } else {
      //left or right
      this.x =
        Math.random() < 0.5 ? 0 - this.radius : this.game.width + this.radius;
      this.y = Math.random() * this.game.height;
    }
    const aim = this.game.calcAim(this, this.game.planet);
    this.speedX = aim[0] * this.speedModifier;
    this.speedY = aim[1] * this.speedModifier;
    this.angle = Math.atan2(aim[3], aim[2]) + Math.PI * 0.5;
  }
  reset() {
    this.free = true;
  }
  hit(damage) {
    this.lives -= damage;
    if (this.lives >= 1) this.frameX++;
  }
  draw(context) {
    if (!this.free) {
      context.save();
      context.translate(this.x, this.y);
      context.rotate(this.angle);
      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.height * this.frameY,
        this.width,
        this.height,
        -this.radius,
        -this.radius,
        this.width,
        this.height
      );
      if (this.game.debug) {
        context.beginPath();
        context.arc(0, 0, this.radius, 0, Math.PI * 2);
        context.fillStyle = "red";
        context.stroke();
        context.fillText(this.lives, 0, 0);
      }
      context.restore();
    }
  }
  update() {
    if (!this.free) {
      this.x += this.speedX;
      this.y += this.speedY;
      //check collision with planet
      if (this.game.checkCollision(this, this.game.planet) && this.lives >= 1) {
        this.lives = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.collided = true;
        this.game.lives--;
        this.game.planet.damageFlash = 10; // trigger damage flash
        this.game.screenShake = 10; // trigger screen shake
      }
      //check collision with player
      if (this.game.checkCollision(this, this.game.player) && this.lives >= 1) {
        this.lives = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.collided = true;
        this.game.lives--;
        this.game.planet.damageFlash = 10; // trigger damage flash
        this.game.screenShake = 10; // trigger screen shake
      }

      //check collision with projectiles
      this.game.projectilePool.forEach((projectile) => {
        if (
          !projectile.free &&
          this.game.checkCollision(this, projectile) &&
          this.lives >= 1
        ) {
          projectile.reset();
          this.hit(1);
        }
      });
      //handle sprite animation
      if (this.lives <= 0 && this.game.spriteUpdate) {
        this.frameX++;
      }
      if (this.frameX > this.maxFrame) {
        if (!this.collided) {
          this.game.score += this.maxLives;
          this.game.kills++; // track kills for stats
          this.game.scorePopups.push(new ScorePopup(this.x, this.y, this.maxLives)); // create score popup
          this.game.lastKillTime = Date.now(); // for combo tracking
          this.game.combo++;
        }
        this.reset();
      }
    }
  }
}

class Astroid extends Enemy {
  constructor(game) {
    super(game);
    this.image = document.getElementById("astroid");
    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    this.maxFrame = 7;
    this.lives = 1;
    this.maxLives = this.lives;
  }
}

class Lobstermorph extends Enemy {
  constructor(game) {
    super(game);
    this.image = document.getElementById("lobstermorph");
    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    this.maxFrame = 14;
    this.lives = 8;
    this.maxLives = this.lives;
  }
}
class Beetlemorph extends Enemy {
  constructor(game) {
    super(game);
    this.image = document.getElementById("beetleMorph");
    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    this.maxFrame = 3;
    this.lives = 1;
    this.maxLives = this.lives;
  }
}

class Rhinomorph extends Enemy {
  constructor(game) {
    super(game);
    this.image = document.getElementById("rhinoMorph");
    console.log(this.image);

    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    this.maxFrame = 6;
    this.lives = 4;
    this.maxLives = this.lives;
  }
}
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.planet = new Planet(this);
    this.player = new Player(this);
    this.debug = true;

    this.projectilePool = [];
    this.numberOfProjectiles = 20;
    this.createProjectilePool();

    this.enemyPool = [];
    this.numberOfEnemies = 20;
    this.createEnemyPool();
    this.enemyPool[0].start();
    this.enemyTimer = 0;
    this.enemyInterval = 1000;

    // to control sprite animation speed
    this.spriteUpdate = false;
    this.spriteTimer = 0;
    this.spriteInterval = 100;
    this.score = 0;
    this.winnigScore = 30;
    this.lives = 5;

    // New cosmetic features
    this.screenShake = 0;
    this.scorePopups = [];
    this.combo = 0;
    this.lastKillTime = 0;
    this.maxCombo = 0;
    this.shotsFired = 0;
    this.kills = 0;
    this.waveNumber = 1;
    this.gameStartTime = Date.now();
    this.highScore = localStorage.getItem('planetDefenseHighScore') || 0;

    // Parallax background stars
    this.stars = [];
    this.createStars();

    this.mouse = {
      x: 0,
      y: 0,
    };
    window.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
    window.addEventListener("mousedown", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.player.shoot();
    });
    window.addEventListener("keyup", (e) => {
      if (e.key === "d") {
        this.debug = !this.debug;
      }
    });
  }
  render(context, deltaTime) {
    // Draw parallax stars first (background)
    this.drawStars(context);

    // Apply screen shake
    if (this.screenShake > 0) {
      context.save();
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      context.translate(shakeX, shakeY);
      this.screenShake--;
    }

    this.planet.draw(context);
    this.drawStatusText(context);
    this.player.draw(context);
    this.player.update();

    //these 2 below only run when we have projectiles/enemies in the pool
    this.projectilePool.forEach((projectile) => {
      projectile.draw(context);
      projectile.update();
    });
    this.enemyPool.forEach((enemy) => {
      enemy.draw(context);
      enemy.update();
    });

    // Draw score popups
    this.scorePopups.forEach((popup, index) => {
      popup.update();
      popup.draw(context);
      if (popup.life <= 0) {
        this.scorePopups.splice(index, 1);
      }
    });

    // Reset combo if no kill in 2 seconds
    if (Date.now() - this.lastKillTime > 2000) {
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      this.combo = 0;
    }

    //spawn enemies
    if (!this.gameOver) {
      if (this.enemyTimer < this.enemyInterval) {
        this.enemyTimer += deltaTime;
      } else {
        this.enemyTimer = 0;
        const enemy = this.getEnemy();
        if (enemy) enemy.start();
      }
    }

    // Draw warning indicators for off-screen enemies
    this.drawWarningIndicators(context);

    // Draw minimap
    this.drawMinimap(context);

    // draw line from planet to mouse
    if (this.debug) {
      context.beginPath();
      context.moveTo(this.planet.x, this.planet.y);
      context.lineTo(this.mouse.x, this.mouse.y);
      context.stroke();
    }

    // Restore context if screen shake was applied
    if (this.screenShake >= 0) {
      context.restore();
    }
    // periodically update sprite frames
    if (this.spriteTimer < this.spriteInterval) {
      this.spriteTimer += deltaTime;
      this.spriteUpdate = false;
    } else {
      this.spriteTimer = 0;
      this.spriteUpdate = true;
    }
    // win or lose condition
    if (
      (this.score >= this.winnigScore && !this.gameOver) ||
      (this.lives <= 0 && !this.gameOver)
    ) {
      this.gameOver = true;
      // Update high score
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('planetDefenseHighScore', this.highScore);
      }
    }
  }

  drawStatusText(context) {
    context.save();
    context.textAlign = "left";

    // Score
    context.font = "28px Impact";
    context.fillText(`Score: ${this.score}`, 20, 40);

    // High Score
    context.font = "20px Impact";
    context.fillStyle = "gold";
    context.fillText(`High Score: ${this.highScore}`, 20, 70);
    context.fillStyle = "white";

    // Wave number
    context.font = "24px Impact";
    context.fillText(`Wave: ${this.waveNumber}`, 20, 100);

    // Health bar for planet
    context.fillText("Planet Health:", 20, 130);
    const barWidth = 200;
    const barHeight = 20;
    const healthPercentage = this.lives / 5;

    // Health bar background
    context.fillStyle = "rgba(255, 0, 0, 0.3)";
    context.fillRect(20, 140, barWidth, barHeight);

    // Health bar fill
    context.fillStyle = healthPercentage > 0.5 ? "lime" : healthPercentage > 0.25 ? "yellow" : "red";
    context.fillRect(20, 140, barWidth * healthPercentage, barHeight);

    // Health bar border
    context.strokeStyle = "white";
    context.lineWidth = 2;
    context.strokeRect(20, 140, barWidth, barHeight);

    // Combo indicator
    if (this.combo > 1) {
      context.save();
      context.textAlign = "center";
      context.font = "40px Impact";
      context.fillStyle = "gold";
      context.shadowBlur = 10;
      context.shadowColor = "gold";
      context.fillText(`${this.combo}x COMBO!`, this.width / 2, 60);
      context.restore();
    }

    // Game over screen with stats
    if (this.gameOver) {
      context.textAlign = "center";
      let message1;
      let message2;
      const timeSurvived = Math.floor((Date.now() - this.gameStartTime) / 1000);
      const accuracy = this.shotsFired > 0 ? Math.floor((this.kills / this.shotsFired) * 100) : 0;

      // Animated title
      const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.05;
      context.save();
      context.translate(this.width / 2, this.height / 2 - 160);
      context.scale(pulseScale, pulseScale);

      if (this.score >= this.winnigScore) {
        message1 = "You saved the planet!";
        message2 = "Congratulations!";
        context.fillStyle = "gold";
        context.shadowBlur = 20;
        context.shadowColor = "gold";
      } else {
        message1 = "Planet destroyed!";
        message2 = "Game Over";
        context.fillStyle = "red";
        context.shadowBlur = 20;
        context.shadowColor = "red";
      }

      context.font = "80px Impact";
      context.fillText(message1, 0, 0);
      context.restore();

      context.fillStyle = "white";
      context.shadowBlur = 0;
      context.font = "50px Impact";
      context.fillText(message2, this.width / 2, this.height / 2 - 90);

      // Stats display
      context.font = "30px Impact";
      context.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2);
      context.fillText(`Kills: ${this.kills}`, this.width / 2, this.height / 2 + 40);
      context.fillText(`Accuracy: ${accuracy}%`, this.width / 2, this.height / 2 + 80);
      context.fillText(`Max Combo: ${this.maxCombo}x`, this.width / 2, this.height / 2 + 120);
      context.fillText(`Time: ${timeSurvived}s`, this.width / 2, this.height / 2 + 160);

      if (this.score >= this.highScore) {
        context.fillStyle = "gold";
        context.font = "25px Impact";
        context.fillText("NEW HIGH SCORE!", this.width / 2, this.height / 2 + 200);
      }
    }
    context.restore();
  }

  // Draw warning indicators for off-screen enemies
  drawWarningIndicators(context) {
    this.enemyPool.forEach(enemy => {
      if (!enemy.free) {
        const padding = 30;
        let warningX, warningY;
        let showWarning = false;

        if (enemy.x < 0) {
          warningX = padding;
          warningY = Math.max(padding, Math.min(this.height - padding, enemy.y));
          showWarning = true;
        } else if (enemy.x > this.width) {
          warningX = this.width - padding;
          warningY = Math.max(padding, Math.min(this.height - padding, enemy.y));
          showWarning = true;
        } else if (enemy.y < 0) {
          warningX = Math.max(padding, Math.min(this.width - padding, enemy.x));
          warningY = padding;
          showWarning = true;
        } else if (enemy.y > this.height) {
          warningX = Math.max(padding, Math.min(this.width - padding, enemy.x));
          warningY = this.height - padding;
          showWarning = true;
        }

        if (showWarning) {
          context.save();
          context.fillStyle = "rgba(255, 0, 0, 0.6)";
          context.beginPath();
          context.arc(warningX, warningY, 10, 0, Math.PI * 2);
          context.fill();
          context.restore();
        }
      }
    });
  }

  // Draw minimap
  drawMinimap(context) {
    const minimapSize = 150;
    const minimapX = this.width - minimapSize - 20;
    const minimapY = this.height - minimapSize - 20;
    const scale = minimapSize / this.width;

    context.save();
    // Minimap background
    context.fillStyle = "rgba(0, 0, 0, 0.5)";
    context.fillRect(minimapX, minimapY, minimapSize, minimapSize);
    context.strokeStyle = "white";
    context.strokeRect(minimapX, minimapY, minimapSize, minimapSize);

    // Draw planet on minimap
    context.fillStyle = "blue";
    context.beginPath();
    context.arc(
      minimapX + this.planet.x * scale,
      minimapY + this.planet.y * scale,
      3,
      0,
      Math.PI * 2
    );
    context.fill();

    // Draw player on minimap
    context.fillStyle = "green";
    context.beginPath();
    context.arc(
      minimapX + this.player.x * scale,
      minimapY + this.player.y * scale,
      2,
      0,
      Math.PI * 2
    );
    context.fill();

    // Draw enemies on minimap
    context.fillStyle = "red";
    this.enemyPool.forEach(enemy => {
      if (!enemy.free) {
        context.beginPath();
        context.arc(
          minimapX + enemy.x * scale,
          minimapY + enemy.y * scale,
          2,
          0,
          Math.PI * 2
        );
        context.fill();
      }
    });

    context.restore();
  }  // gives us the distance and direction from point a to point b
  // helps us with making two object move toward each other or away from each other
  calcAim(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.hypot(dx, dy);
    const aimX = (dx / distance) * -1;
    const aimY = (dy / distance) * -1;
    return [aimX, aimY, dx, dy];
  }

  checkCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.hypot(dx, dy);
    const sumOffRadii = a.radius + b.radius;
    return distance < sumOffRadii;
  }
  //the method that creates the projectile pool
  createProjectilePool() {
    for (let i = 0; i < this.numberOfProjectiles; i++) {
      this.projectilePool.push(new Projectile(this));
    }
  }
  //the method that gets a free projectile from the pool
  getProjectile() {
    for (let projectile of this.projectilePool) {
      if (projectile.free) {
        return projectile;
      }
    }
  }

  //the method that creates the enemy pool
  createEnemyPool() {
    for (let i = 0; i < this.numberOfEnemies; i++) {
      let randomNumber = Math.random();
      if (randomNumber < 0.25) {
        this.enemyPool.push(new Astroid(this));
      }else if (randomNumber < 0.5){
        this.enemyPool.push(new Beetlemorph(this));
      }else if (randomNumber < 0.75){
        this.enemyPool.push(new Rhinomorph(this));
      }else{
        this.enemyPool.push(new Lobstermorph(this));
      }


    }
  }

  // Create parallax star field
  createStars() {
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.5 + 0.3
      });
    }
  }

  // Draw animated stars
  drawStars(context) {
    context.save();
    this.stars.forEach(star => {
      // Parallax effect based on mouse position
      const offsetX = (this.mouse.x - this.width / 2) * star.speed * 0.01;
      const offsetY = (this.mouse.y - this.height / 2) * star.speed * 0.01;

      context.globalAlpha = star.opacity;
      context.fillStyle = "white";
      context.beginPath();
      context.arc(star.x + offsetX, star.y + offsetY, star.radius, 0, Math.PI * 2);
      context.fill();

      // Twinkle effect
      star.opacity += (Math.random() - 0.5) * 0.02;
      star.opacity = Math.max(0.1, Math.min(0.8, star.opacity));
    });
    context.restore();
  }

  getEnemy() {
    for (let enemy of this.enemyPool) {
      if (enemy.free) {
        return enemy;
      }
    }
  }
}

window.addEventListener("load", function () {
  const canvas = this.document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");
  canvas.width = 800;
  canvas.height = 800;
  ctx.strokeStyle = "white";
  ctx.fillStyle = "white";
  ctx.lineWidth = 2;
  ctx.font = "50px Helvetica";
  ctx.textAlign = "center";
  ctx.baseline = "middle";

  const game = new Game(canvas);
  let lastTime = 0;
  let animationId = null;
  let isPaused = false;

  // Custom crosshair cursor
  let mousePos = { x: 0, y: 0 };
  canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
  });

  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.render(ctx, deltaTime);

    // Draw custom crosshair
    ctx.save();
    ctx.strokeStyle = "lime";
    ctx.lineWidth = 2;
    const crosshairSize = 15;
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(mousePos.x - crosshairSize, mousePos.y);
    ctx.lineTo(mousePos.x + crosshairSize, mousePos.y);
    ctx.stroke();
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(mousePos.x, mousePos.y - crosshairSize);
    ctx.lineTo(mousePos.x, mousePos.y + crosshairSize);
    ctx.stroke();
    // Center dot
    ctx.fillStyle = "lime";
    ctx.beginPath();
    ctx.arc(mousePos.x, mousePos.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (!isPaused) {
      animationId = requestAnimationFrame(animate);
    }
  }

  // Start game when button is clicked
  const startButton = document.getElementById('start-button');
  const introOverlay = document.getElementById('intro-overlay');
  const gameControls = document.getElementById('game-controls');
  const pauseButton = document.getElementById('pause-button');
  const restartButton = document.getElementById('restart-button');

  startButton.addEventListener('click', function() {
    // Fade out effect
    introOverlay.style.animation = 'fadeOut 0.5s ease-out';
    setTimeout(() => {
      introOverlay.style.display = 'none';
      gameControls.style.display = 'flex';
      isPaused = false;
      lastTime = 0;
      animationId = requestAnimationFrame(animate);
    }, 500);
  });

  // Pause/unpause game
  pauseButton.addEventListener('click', function() {
    isPaused = !isPaused;
    if (isPaused) {
      pauseButton.textContent = 'RESUME';
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    } else {
      pauseButton.textContent = 'PAUSE';
      lastTime = performance.now();
      animationId = requestAnimationFrame(animate);
    }
  });

  // Restart game
  restartButton.addEventListener('click', function() {
    // Cancel current animation
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    // Show intro and hide controls
    introOverlay.style.display = 'flex';
    gameControls.style.display = 'none';
    pauseButton.textContent = 'PAUSE';
    isPaused = false;
    // Reload the page to reset everything
    location.reload();
  });
});

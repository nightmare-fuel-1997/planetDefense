class Planet {
  constructor(game) {
    this.game = game;
    this.x = this.game.width / 2;
    this.y = this.game.height / 2;
    this.radius = 80;
    this.image = document.getElementById("planet");
  }

  draw(context) {
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
  }
  draw(context) {
    context.save();
    context.translate(this.x, this.y);
    context.rotate(this.angle);
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
    if (projectile)
      projectile.start(
        this.x + this.radius * this.aim[0],
        this.y + this.radius * this.aim[1],
        this.aim[0],
        this.aim[1]
      );
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
  }

  start(x, y, speedX, speedY) {
    this.free = false;
    this.x = x;
    this.y = y;
    this.speedX = speedX * this.speedModifier;
    this.speedY = speedY * this.speedModifier;
  }

  reset() {
    this.free = true;
  }

  draw(context) {
    if (!this.free) {
      context.save();
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
    this.speedX = aim[0];
    this.speedY = aim[1];
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
      }
      //check collision with player
      if (this.game.checkCollision(this, this.game.player) && this.lives >= 1) {
        this.lives = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.collided = true;
        this.game.lives--;
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
        this.reset();
        if (!this.collided) this.game.score += this.maxLives;
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
    this.enemyInterval = 1700;

    // to control sprite animation speed
    this.spriteUpdate = false;
    this.spriteTimer = 0;
    this.spriteInterval = 100;
    this.score = 0;
    this.winnigScore = 30;
    this.lives = 5;

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

    // draw line from planet to mouse
    if (this.debug) {
      context.beginPath();
      context.moveTo(this.planet.x, this.planet.y);
      context.lineTo(this.mouse.x, this.mouse.y);
      context.stroke();
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
    if (this.score >= this.winnigScore && !this.gameOver || this.lives <= 0 && !this.gameOver) {
      this.gameOver = true;
    }
  }

  drawStatusText(context) {
    context.save();
    context.textAlign = "left";
    context.font = "25px";
    context.fillText(`Score: ${this.score}`, 20, 40);
    for (let i = 0; i < this.lives; i++) {
        context.fillRect(20 + 15 * i, 60, 10, 30)
    }
    if (this.gameOver) {
      context.textAlign = "center";
      let message1;
      let message2;
      if (this.score >= this.winnigScore) {
        message1 = "You saved the planet!";
        message2 = "Congratulations!";
      } else {
        message1 = "Planet destroyed!";
        message2 = "Game Over";
      }
      context.font = "80px Impact";
      context.fillText(message1, this.width / 2, this.height / 2 - 160);
      context.font = "50px Impact";
      context.fillText(message2, this.width / 2, this.height / 2 + 160);
    }
    context.restore();
  }

  // gives us the distance and direction from point a to point b
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
      // this.enemyPool.push(new Astroid(this));
      this.enemyPool.push(new Lobstermorph(this));
    }
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
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.render(ctx, deltaTime);
    requestAnimationFrame(animate);
  }
  this.requestAnimationFrame(animate);
});

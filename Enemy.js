import { Circle } from "./assets/js/collisions/Collisions.mjs";
import { EnemyStates } from "./enums";

class Enemy {
  constructor(game) {
    this.game = game;
    this.spriteWidth = 192;
    this.spriteHeight = 192;
    this.scale = 0.5;
    this.width = this.spriteWidth * this.scale;
    this.height = this.spriteHeight * this.scale;
    this.x;
    this.y;
    this.speedX = 0;
    this.speedY = 0;
    this.maxSpeed = 3;
    this.frameX = 0;
    this.frameY = 0;
    this.spriteFrames = 5;
    this.fps = 30;
    this.frameInterval = 1000 / this.fps;
    this.frameTimer = 0;
  }

  setState(state) {
    this.currentState = this.states[state];
    this.currentState.start();
  }

  isInView() {
    if (
      this.x + this.width < this.game.viewportX ||
      this.x > this.game.viewportX + this.game.width
    )
      return false;
    if (
      this.y + this.height < this.game.viewportY ||
      this.y > this.game.viewportY + this.game.height
    )
      return false;
    return true;
  }
}

export class TNT extends Enemy {
  constructor(game, imageObject, x, y) {
    super(game);
    this.x = x;
    this.y = y;
    this.flipDirection = false;
    this.image = imageObject.image;
    this.searchRadius = 300;
    this.hitbox = {
      x: this.x + 48 - this.game.viewportX,
      y: this.y + 50 - this.game.viewportY,
      hitboxRadius: 13,
    }; /*
    this.collisionBody = new Circle(
      this.hitbox.x,
      this.hitbox.y,
      this.hitbox.hitboxRadius
    );*/
    this.baseline = this.hitbox.y + this.hitbox.hitboxRadius;
    this.states = [
      new TNTIdle(this.game, this),
      new TNTAttack(this.game, this),
    ];
    this.currentState;
    this.setState(EnemyStates.IDLE);
  }

  update(deltaTime) {
    //update hitbox position
    this.hitbox.x = this.x + 48 - this.game.viewportX;
    this.hitbox.y = this.y + 50 - this.game.viewportY;
    //this.collisionBody.x = this.hitbox.x;
    //this.collisionBody.y = this.hitbox.y;
    //sprite animation
    if (this.frameTimer > this.frameInterval) {
      if (this.frameX < this.spriteFrames) {
        this.frameX++;
      } else {
        this.frameX = 0;
        if (this.currentState === this.states[EnemyStates.ATTACK]) {
          this.currentState.throw();
        }
      }
      this.frameTimer = 0;
    } else {
      this.frameTimer += deltaTime;
    }
    this.currentState.update(deltaTime);
  }

  draw(ctx) {
    if (this.isInView() === false) return;
    /*
    if (
      this.facing === EnemyDir.LEFT
    ) {
      this.flipDirection = true;
    } else {
      this.flipDirection = false;
    }*/

    if (this.flipDirection === false) {
      ctx.drawImage(
        this.image,
        this.spriteWidth * this.frameX,
        this.spriteHeight * this.frameY,
        this.spriteWidth,
        this.spriteHeight,
        this.x - this.game.viewportX,
        this.y - this.game.viewportY,
        this.width,
        this.height
      );
    } else {
      ctx.setTransform(-1, 0, 0, 1, 0, 0); //-1 flips horizontal
      ctx.drawImage(
        this.image,
        this.spriteWidth * this.frameX,
        this.spriteHeight * this.frameY,
        this.spriteWidth,
        this.spriteHeight,
        -this.x - this.width + this.game.viewportX,
        this.y - this.game.viewportY,
        this.width,
        this.height
      );
      ctx.setTransform(1, 0, 0, 1, 0, 0); //reset
    }
    //debug hitbox
    if (this.game.debug) {
      ctx.beginPath();
      ctx.arc(
        this.hitbox.x,
        this.hitbox.y,
        this.hitbox.hitboxRadius,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  }
}

class EnemyState {
  constructor(game, enemy) {
    this.game = game;
    this.enemy = enemy;
    this.switchTime;
    this.timer = 0;
  }
}

class TNTIdle extends EnemyState {
  start() {
    this.tnt.spriteFrames = 5;
    this.tnt.frameX = 0;
    this.tnt.frameY = 0;
    this.switchTime = Math.random() * 5000 + 5000;
    this.timer = 0;
  }

  update(deltaTime) {
    if (this.timer - deltaTime > this.switchTime) {
      if (this.archer.facing === ArcherDir.LEFT) {
        this.archer.facing = ArcherDir.RIGHT;
      } else {
        this.archer.facing = ArcherDir.LEFT;
      }
      this.timer = 0;
    } else {
      this.timer += deltaTime;
    }
  }
}

class TNTAttack extends EnemyState {
  start() {
    this.enemy.spriteFrames = 7;
    this.enemy.frameX = 0;
  }

  throw() {
    const dynamite = this.game.getProjectile("dynamite");
    if (dynamite) {
      dynamite.start(this.enemy);
    }
    this.enemy.shooting = true;
    this.enemy.setState(EnemyStates.IDLE);
  }

  update(deltaTime) {
    //
  }
}

export class Projectile {
  constructor(game, imageObject) {
    this.game = game;
    this.image = imageObject.image;
    this.tnt;
    this.x;
    this.y;
    this.spriteWidth = 64;
    this.spriteHeight = 64;
    this.scale = 0.5;
    this.width = this.spriteWidth * this.scale;
    this.height = this.spriteHeight * this.scale;
    this.hitbox = {
      x: 15,
      y: 3,
      hitboxRadius: 4,
    };
    this.baseline = this.height;
    this.speedX;
    this.speedY;
    this.angle = 0;
    this.speedModifier = 3;
    this.free = true;
  }

  start(tnt) {
    this.free = false;
    this.tnt = tnt;
    this.x = this.tnt.hitbox.x;
    this.y = this.tnt.hitbox.y;
    this.speedX = this.tnt.aim[0];
    this.speedY = this.tnt.aim[1];
  }

  reset() {
    this.tnt.shooting = false;
    this.free = true;
  }

  isInView() {
    if (
      this.x + this.width < this.game.viewportX ||
      this.x > this.game.viewportX + this.game.width
    )
      return false;
    if (
      this.y + this.height < this.game.viewportY ||
      this.y > this.game.viewportY + this.game.height
    )
      return false;
    return true;
  }

  update() {
    if (this.free) return; //if not in use, dont update
    //move dynamite
    this.x += this.speedX * this.speedModifier;
    this.y += this.speedY * this.speedModifier;
    const dx = this.x - this.tnt.hitbox.x;
    const dy = this.y - this.tnt.hitbox.y;
    const distance = Math.hypot(dx, dy);
    if (distance > this.tnt.searchRadius) this.reset();
  }

  draw(ctx) {
    if (this.free) return;
    //rotate arrow
    ctx.setTransform(
      Math.cos(this.angle),
      Math.sin(this.angle),
      -Math.sin(this.angle),
      Math.cos(this.angle),
      this.x,
      this.y
    );/
    ctx.drawImage(
      this.image,
      0,
      0,
      this.spriteWidth,
      this.spriteHeight,
      -12, //0, //this.x,
      -15, //this.y,
      this.width,
      this.height
    );
    if (this.game.debug) {
      ctx.beginPath();
      ctx.arc(
        this.hitbox.x,
        this.hitbox.y,
        this.hitbox.hitboxRadius,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
    //console.log(this.x);
    ctx.setTransform(1, 0, 0, 1, 0, 0); //reset
  }
}

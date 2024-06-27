import { Circle } from "./assets/js/collisions/Collisions.mjs";
import { worldMap } from "./assets/maps/map.js";
import { BarrelStates, EnemyDir, EnemyStates, TorchStates } from "./enums.js";
import { HealthBar, assets } from "./utils.js";

class Enemy {
  constructor(game) {
    this.game = game;
    this.spriteWidth = 192;
    this.spriteHeight = 192;
    this.scale = 0.75;
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
    this.x = x - this.width / 2;
    this.y = y - this.height / 4;
    this.flipDirection = false;
    this.image = imageObject.image;
    this.searchRadius = 300;
    this.hitbox = {
      x: this.x + this.width / 2 - this.game.viewportX,
      y: this.y + this.height / 2 - this.game.viewportY,
      hitboxRadius: 18,
    }; /*
    this.collisionBody = new Circle(
      this.hitbox.x,
      this.hitbox.y,
      this.hitbox.hitboxRadius
    );*/
    this.baseline = this.hitbox.y + this.hitbox.hitboxRadius;
    this.aim;
    this.shooting = false;
    this.states = [
      new TNTIdle(this.game, this),
      null, //usually a move state
      new TNTAttack(this.game, this),
    ];
    this.currentState;
    this.setState(EnemyStates.IDLE);
  }

  update(deltaTime) {
    this.aim = this.game.calcDistAngle(this.game.playerChar, this);
    //update hitbox position
    this.hitbox.x = this.x + this.width / 2 - this.game.viewportX;
    this.hitbox.y = this.y + this.height / 2 - this.game.viewportY;
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
    //check distance between tnt & player
    if (
      this.aim[4] < this.searchRadius &&
      this.currentState !== this.states[EnemyStates.ATTACK] &&
      this.shooting === false
    ) {
      this.aim[0] < 0
        ? (this.facing = EnemyDir.LEFT)
        : (this.facing = EnemyDir.RIGHT);
      this.setState(EnemyStates.ATTACK);
    }
    this.currentState.update(deltaTime);
  }

  draw(ctx) {
    //if (this.isInView() === false) return;

    if (this.facing === EnemyDir.LEFT) {
      this.flipDirection = true;
    } else {
      this.flipDirection = false;
    }

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
    this.enemy.spriteFrames = 5;
    this.enemy.frameX = 0;
    this.enemy.frameY = 0;
    this.switchTime = Math.random() * 5000 + 5000;
    this.timer = 0;
  }

  update(deltaTime) {
    if (this.timer - deltaTime > this.switchTime) {
      if (this.enemy.facing === EnemyDir.LEFT) {
        this.enemy.facing = EnemyDir.RIGHT;
      } else {
        this.enemy.facing = EnemyDir.LEFT;
      }
      this.timer = 0;
    } else {
      this.timer += deltaTime;
    }
  }
}

class TNTAttack extends EnemyState {
  start() {
    this.enemy.spriteFrames = 6;
    this.enemy.frameX = 0;
    this.enemy.frameY = 2;
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

export class Torch extends Enemy {
  constructor(game, imageObject, x, y) {
    super(game);
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.endX = x + worldMap.tilewidth * 6;
    this.targetX = this.endX;
    this.scale = 0.5;
    this.width = this.spriteWidth * this.scale;
    this.height = this.spriteHeight * this.scale;
    this.flipDirection = false;
    this.image = imageObject.image;
    this.searchRadius = 200;
    this.hitbox = {
      x: this.x + this.width / 2 - this.game.viewportX,
      y: this.y + this.height / 2 - this.game.viewportY,
      hitboxRadius: 16,
      attackRadius: 34,
    }; /*
    this.collisionBody = new Circle(
      this.hitbox.x,
      this.hitbox.y,
      this.hitbox.hitboxRadius
    );*/
    this.baseline = this.hitbox.y + this.hitbox.hitboxRadius;
    this.aim;
    this.chasingPlayer = false;
    this.maxSpeed = Math.random() * 0.5 + 1;
    this.states = [
      new TorchIdle(game, this),
      new TorchMove(game, this),
      new TorchAttack(game, this),
      new TorchAttacked(game, this),
      new TorchDying(game, this),
    ];
    this.currentState;
    this.setState(TorchStates.MOVE);
    this.totalHealth = 75;
    this.health = this.totalHealth;
    this.healthbar = new HealthBar(game, this);
  }

  update(deltaTime) {
    this.aim = this.game.calcDistAngle(this.game.playerChar, this);

    //update hitbox position
    this.hitbox.x = this.x + this.width / 2 - this.game.viewportX;
    this.hitbox.y = this.y + this.height / 2 - this.game.viewportY;
    //this.collisionBody.x = this.hitbox.x;
    //this.collisionBody.y = this.hitbox.y;

    //sprite animation
    if (this.frameTimer > this.frameInterval) {
      if (this.frameX < this.spriteFrames) {
        this.frameX++;
      } else {
        this.frameX = 0;
        if (
          this.currentState === this.states[TorchStates.ATTACK] ||
          this.currentState === this.states[TorchStates.ATTACKED]
        ) {
          this.setState(TorchStates.MOVE);
        }
      }
      this.frameTimer = 0;
    } else {
      this.frameTimer += deltaTime;
    }

    if (
      this.currentState !== this.states[TorchStates.ATTACKED] ||
      this.currentState === this.states[TorchStates.DYING]
    ) {
      //check distance between torch & player
      if (
        this.aim[4] < this.searchRadius &&
        (this.currentState !== this.states[TorchStates.ATTACK] ||
          this.currentState !== this.states[TorchStates.DYING]) &&
        this.chasingPlayer === false
      ) {
        this.chasingPlayer = true;
        if (this.currentState !== this.states[TorchStates.MOVE])
          this.setState(TorchStates.MOVE);
      }
      if (
        this.aim[4] < this.hitbox.attackRadius &&
        this.currentState !== this.states[TorchStates.ATTACK]
      ) {
        this.setState(TorchStates.ATTACK);
      }
    }

    this.currentState.update(deltaTime);
  }

  draw(ctx) {
    if (this.isInView() === false) return;

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

    if (this.health < this.totalHealth) this.healthbar.update(deltaTime);

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
      ctx.beginPath();
      ctx.arc(
        this.hitbox.x,
        this.hitbox.y,
        this.hitbox.attackRadius,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  }
}

class TorchIdle extends EnemyState {
  constructor(game, enemy) {
    super(game, enemy);
  }

  start() {
    this.enemy.spriteFrames = 6;
    this.enemy.frameX = 0;
    this.enemy.frameY = 0;
    this.switchTime = Math.random() * 1000 + 500;
    this.timer = 0;
    this.enemy.image = assets.images.torchRed.image;
  }

  update(deltaTime) {
    if (this.timer > this.switchTime) {
      this.enemy.setState(TorchStates.MOVE);
      this.timer = 0;
    } else {
      this.timer += deltaTime;
    }
  }
}

class TorchMove extends EnemyState {
  constructor(game, enemy) {
    super(game, enemy);
  }

  start() {
    this.enemy.spriteFrames = 5;
    this.enemy.frameX = 0;
    this.enemy.frameY = 1;
  }

  update(deltaTime) {
    if (!this.enemy.chasingPlayer) {
      if (this.enemy.targetX === this.enemy.startX) {
        this.enemy.x -= this.enemy.maxSpeed;
        this.enemy.flipDirection = true;
        if (this.enemy.x < this.enemy.targetX) {
          this.enemy.targetX = this.enemy.endX;
          this.enemy.setState(TorchStates.IDLE);
        }
      } else {
        this.enemy.x += this.enemy.maxSpeed;
        this.enemy.flipDirection = false;
        if (this.enemy.x > this.enemy.targetX) {
          this.enemy.targetX = this.enemy.startX;
          this.enemy.setState(TorchStates.IDLE);
        }
      }
      if (this.enemy.y !== this.enemy.startY) {
        this.enemy.y > this.enemy.startY
          ? (this.enemy.y -= this.enemy.maxSpeed)
          : (this.enemy.y += this.enemy.maxSpeed);
      }
    } else {
      //chase player
      this.enemy.flipDirection = this.enemy.aim[2] < 0 ? true : false;
      if (
        Math.abs(this.enemy.aim[2]) >
        this.enemy.hitbox.attackRadius - this.enemy.hitbox.hitboxRadius
      )
        this.enemy.x += this.enemy.maxSpeed * this.enemy.aim[0];
      if (
        Math.abs(this.enemy.aim[3]) >
        this.enemy.hitbox.attackRadius - this.enemy.hitbox.hitboxRadius
      )
        this.enemy.y += this.enemy.maxSpeed * this.enemy.aim[1];
    }
  }
}

class TorchAttack extends EnemyState {
  constructor(game, enemy) {
    super(game, enemy);
  }

  start() {
    this.enemy.spriteFrames = 5;
    this.enemy.frameX = 0;

    const angle = -Math.atan2(this.enemy.aim[3], this.enemy.aim[2]);

    if (angle > Math.PI * (1 / 8) && angle < Math.PI * (3 / 8)) {
      this.enemy.frameY = 4; //up
    } else if (angle > -Math.PI * (3 / 8) && angle < -Math.PI * (1 / 8)) {
      this.enemy.frameY = 3; //down
    } else {
      this.enemy.frameY = 2; //right
    }
  }

  update(deltaTime) {
    //
  }
}

class TorchAttacked extends EnemyState {
  constructor(game, enemy) {
    super(game, enemy);
  }

  start() {
    //set up so an empty sprite frame flashes
    this.enemy.spriteFrames = 6;
    this.enemy.frameX = 5;
    this.enemy.frameY = 2;
  }

  update(deltaTime) {
    if (this.enemy.health <= 0) {
      this.enemy.setState(TorchStates.DYING);
    }
  }
}

class TorchDying extends EnemyState {
  constructor(game, enemy) {
    super(game, enemy);
  }

  start() {
    this.enemy.spriteFrames = 6;
    this.enemy.frameX = 0;
    this.enemy.frameY = 0;
    this.enemy.image = assets.images.dead.image;
  }

  update(deltaTime) {
    //
  }
}

export class Barrel extends Enemy {
  constructor(game, imageObject, x, y) {
    super(game);
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.scale = 0.5;
    this.spriteWidth = 128;
    this.spriteHeight = 128;
    this.width = this.spriteWidth * this.scale;
    this.height = this.spriteHeight * this.scale;
    this.flipDirection = false;
    this.image = imageObject.image;
    this.searchRadius = 150;
    this.hitbox = {
      x: this.x + this.width / 2 - this.game.viewportX,
      y: this.y + this.height / 2 - this.game.viewportY,
      hitboxRadius: 16,
      attackRadius: 34,
    }; /*
    this.collisionBody = new Circle(
      this.hitbox.x,
      this.hitbox.y,
      this.hitbox.hitboxRadius
    );*/
    this.baseline = this.hitbox.y + this.hitbox.hitboxRadius;
    this.aim;
    this.chasingPlayer = false;
    this.maxSpeed = Math.random() * 0.5 + 1;
    this.states = [
      new BarrelIdle(game, this),
      new BarrelMove(game, this),
      new BarrelAttack(game, this),
      new BarrelExplode(game, this),
    ];
    this.currentState;
    this.setState(BarrelStates.IDLE);
    this.dead = false;
    this.deadTimer = 0;
    this.deadTime = 2500; //25sec
  }

  update(deltaTime) {
    if (this.dead) {
      this.deadTimer += deltaTime;
      if (this.deadTimer > this.deadTime) {
        this.dead = false;
        this.chasingPlayer = false;
        this.deadTimer = 0;
        this.x = this.startX;
        this.y = this.startY;
        this.hitbox.x = this.x + this.width / 2 - this.game.viewportX;
        this.hitbox.y = this.y + this.height / 2 - this.game.viewportY;
        this.scale = 0.5;
        this.spriteWidth = 128;
        this.spriteHeight = 128;
        this.width = this.spriteWidth * this.scale;
        this.height = this.spriteHeight * this.scale;
        this.setState(BarrelStates.IDLE);
      }
      return;
    }
    this.aim = this.game.calcDistAngle(this.game.playerChar, this);

    //update hitbox position
    this.hitbox.x = this.x + this.width / 2 - this.game.viewportX;
    this.hitbox.y = this.y + this.height / 2 - this.game.viewportY;
    //this.collisionBody.x = this.hitbox.x;
    //this.collisionBody.y = this.hitbox.y;

    //sprite animation
    if (this.frameTimer > this.frameInterval) {
      if (this.frameX < this.spriteFrames) {
        this.frameX++;
      } else {
        if (
          this.currentState === this.states[BarrelStates.IDLE] &&
          (this.currentState.pop || this.currentState.unpop)
        ) {
          //
        } else if (this.currentState === this.states[BarrelStates.EXPLODE]) {
          this.dead = true;
        } else {
          this.frameX = 0;
          /*if (this.currentState === this.states[BarrelStates.ATTACK]) {
            this.setState(BarrelStates.MOVE);
          }*/
        }
      }
      this.frameTimer = 0;
    } else {
      this.frameTimer += deltaTime;
    }

    if (this.currentState === this.states[BarrelStates.EXPLODE]) return;

    //check distance between barrel & player
    if (
      this.aim[4] < this.searchRadius &&
      this.currentState !== this.states[BarrelStates.ATTACK] &&
      this.chasingPlayer === false
    ) {
      this.chasingPlayer = true;
      if (this.currentState !== this.states[BarrelStates.MOVE])
        this.setState(BarrelStates.MOVE);
    }
    if (
      this.aim[4] < this.hitbox.attackRadius &&
      this.currentState !== this.states[BarrelStates.ATTACK]
    ) {
      this.setState(BarrelStates.ATTACK);
    }

    this.currentState.update(deltaTime);
  }

  draw(ctx) {
    if (this.isInView() === false || this.dead) return;

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
      ctx.beginPath();
      ctx.arc(
        this.hitbox.x,
        this.hitbox.y,
        this.hitbox.attackRadius,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  }
}

class BarrelIdle extends EnemyState {
  constructor(game, enemy) {
    super(game, enemy);
    this.pauseTime = 3000;
    this.pauseTimer = 0;
    this.idleTime = 5000;
    this.idleTimer = 0;
    this.pop = false;
    this.pause = false;
    this.unPop = false;
    this.idle = true;
  }

  start() {
    this.enemy.spriteFrames = 0;
    this.enemy.frameX = 0;
    this.enemy.frameY = 0;
    this.switchTime = Math.random() * 2000 + 1000;
    this.timer = 0;
    this.enemy.image = assets.images.barrelRed.image;
  }

  update(deltaTime) {
    if (this.idle) {
      this.idleTimer += deltaTime;
      if (this.idleTimer > this.idleTime) {
        this.idle = false;
        this.idleTimer = 0;
        this.pop = true;
        this.enemy.spriteFrames = 5;
        this.enemy.frameX = 0;
        this.enemy.frameY = 1;
      }
    } else if (this.pop) {
      if (this.enemy.frameX >= this.enemy.spriteFrames) {
        this.pop = false;
        this.pause = true;
        this.enemy.spriteFrames = 0;
        this.enemy.frameX = 0;
        this.enemy.frameY = 2;
      }
    } else if (this.pause) {
      this.pauseTimer += deltaTime;
      if (this.pauseTimer > this.pauseTime) {
        this.pause = false;
        this.pauseTimer = 0;
        this.unPop = true;
        this.enemy.spriteFrames = 5;
        this.enemy.frameX = 0;
        this.enemy.frameY = 3;
      }
    } else if (this.unPop) {
      if (this.enemy.frameX >= this.enemy.spriteFrames) {
        this.unPop = false;
        this.idle = true;
        this.enemy.spriteFrames = 0;
        this.enemy.frameX = 0;
        this.enemy.frameY = 0;
      }
    }
    if (!this.idle) {
      if (this.timer > this.switchTime) {
        this.enemy.flipDirection = !this.enemy.flipDirection;
        this.timer = 0;
      } else {
        this.timer += deltaTime;
      }
    }
  }
}

class BarrelMove extends EnemyState {
  constructor(game, enemy) {
    super(game, enemy);
  }

  start() {
    this.enemy.spriteFrames = 2;
    this.enemy.frameX = 0;
    this.enemy.frameY = 4;
  }

  update(deltaTime) {
    if (!this.enemy.chasingPlayer) {
      if (this.enemy.x !== this.enemy.startX) {
        if (this.enemy.x > this.enemy.startX) {
          this.enemy.flipDirection = true;
          this.enemy.x -= this.enemy.maxSpeed;
        } else {
          this.enemy.flipDirection = false;
          this.enemy.x += this.enemy.maxSpeed;
        }
        if (this.enemy.y !== this.enemy.startY) {
          this.enemy.y > this.enemy.startY
            ? (this.enemy.y -= this.enemy.maxSpeed)
            : (this.enemy.y += this.enemy.maxSpeed);
        }
      }
    } else {
      //chase player
      this.enemy.flipDirection = this.enemy.aim[2] < 0 ? true : false;
      if (
        Math.abs(this.enemy.aim[2]) >
        this.enemy.hitbox.attackRadius - this.enemy.hitbox.hitboxRadius
      )
        this.enemy.x += this.enemy.maxSpeed * this.enemy.aim[0];
      if (
        Math.abs(this.enemy.aim[3]) >
        this.enemy.hitbox.attackRadius - this.enemy.hitbox.hitboxRadius
      )
        this.enemy.y += this.enemy.maxSpeed * this.enemy.aim[1];
    }
  }
}

class BarrelAttack extends EnemyState {
  constructor(game, enemy) {
    super(game, enemy);
    this.attackTimer = 0;
    this.makeExplody = 1500;
  }

  start() {
    this.enemy.spriteFrames = 2;
    this.enemy.frameX = 0;
    this.enemy.frameY = 5;
    this.attackTimer = 0;
    this.explosion = false;
  }

  update(deltaTime) {
    if (this.attackTimer > this.makeExplody) {
      this.enemy.setState(BarrelStates.EXPLODE);
    } else {
      this.attackTimer += deltaTime;
    }
  }
}

class BarrelExplode extends EnemyState {
  constructor(game, enemy) {
    super(game, enemy);
  }

  start() {
    this.enemy.spriteWidth = 192;
    this.enemy.spriteHeight = 192;
    this.enemy.scale = 0.85; //0.333
    this.enemy.x -= 50;
    this.enemy.y -= 50;
    this.enemy.width = this.enemy.spriteWidth * this.enemy.scale;
    this.enemy.height = this.enemy.spriteHeight * this.enemy.scale;
    this.enemy.spriteFrames = 8;
    this.enemy.frameX = 0;
    this.enemy.frameY = 0;
    this.enemy.image = assets.images.explosion.image;
  }

  update(deltaTime) {
    //
  }
}

import { Circle } from "./assets/js/collisions/Collisions.mjs";
import { ArcherState, ArcherDir, PawnStates } from "./enums.js";

class Ally {
  constructor(game) {
    this.game = game;
    this.spriteWidth = 192;
    this.spriteHeight = 192;
    this.scale = 0.5;
    this.width = this.spriteWidth * this.scale;
    this.height = this.spriteHeight * this.scale;
    this.x = 200;
    this.y = 300;
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

export class Archer extends Ally {
  constructor(game, imageObject) {
    super(game);
    this.flipDirection = false;
    this.facing = Math.random() > 0.5 ? ArcherDir.RIGHT : ArcherDir.LEFT;
    this.image = imageObject.image;
    this.searchRadius = 300;
    this.hitbox = {
      x: this.x + 48 - this.game.viewportX,
      y: this.y + 50 - this.game.viewportY,
      hitboxRadius: 13,
    };
    this.collisionBody = new Circle(
      this.hitbox.x,
      this.hitbox.y,
      this.hitbox.hitboxRadius
    );
    this.baseline = this.hitbox.y + this.hitbox.hitboxRadius;
    this.aim;
    this.shooting = false;
    this.states = [
      new ArcherIdle(this.game, this),
      new ArcherAttack(this.game, this),
    ];
    this.currentState;
    this.setState(ArcherState.IDLE);
  }

  update(deltaTime) {
    if (this.isInView() === false) return;

    this.aim = this.game.calcDistAngle(this.game.playerChar, this);
    //update hitbox position
    this.hitbox.x = this.x + 48 - this.game.viewportX;
    this.hitbox.y = this.y + 50 - this.game.viewportY;
    this.collisionBody.x = this.hitbox.x;
    this.collisionBody.y = this.hitbox.y;
    //sprite animation
    if (this.frameTimer > this.frameInterval) {
      if (this.frameX < this.spriteFrames) {
        this.frameX++;
      } else {
        this.frameX = 0;
        if (this.currentState === this.states[ArcherState.ATTACK]) {
          this.currentState.shoot();
        }
      }
      this.frameTimer = 0;
    } else {
      this.frameTimer += deltaTime;
    }
    //check distance between archer & player
    if (
      this.aim[4] < this.searchRadius &&
      this.currentState !== this.states[ArcherState.ATTACK] &&
      this.shooting === false
    ) {
      //this.setState(ArcherState.ATTACK);
    }
    this.currentState.update(deltaTime);
  }

  draw(ctx) {
    if (this.isInView() === false) return;

    if (
      this.facing === ArcherDir.UP_LEFT ||
      this.facing === ArcherDir.DOWN_LEFT ||
      this.facing === ArcherDir.LEFT
    ) {
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
      //idle, attack left
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

class ArcherAllyState {
  constructor(game, archer) {
    this.game = game;
    this.archer = archer;
    this.switchTime;
    this.timer = 0;
  }
}

class ArcherIdle extends ArcherAllyState {
  start() {
    this.archer.spriteFrames = 5;
    this.archer.frameX = 0;
    this.archer.frameY = 0;
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
      this.switchTime = Math.random() * 5000 + 5000;
      this.timer = 0;
    } else {
      this.timer += deltaTime;
    }
  }
}

class ArcherAttack extends ArcherAllyState {
  start() {
    this.archer.spriteFrames = 7;
    this.archer.frameX = 0;
    const angle = -Math.atan2(this.archer.aim[3], this.archer.aim[2]);

    if (angle <= Math.PI * (5 / 8) && angle > Math.PI * (3 / 8)) {
      this.archer.facing = ArcherDir.UP;
      this.archer.frameY = 2;
    } else if (angle <= Math.PI * (7 / 8) && angle > Math.PI * (5 / 8)) {
      this.archer.facing = ArcherDir.UP_LEFT;
      this.archer.frameY = 3;
    } else if (angle <= -Math.PI * (7 / 8) || angle > Math.PI * (7 / 8)) {
      this.archer.facing = ArcherDir.LEFT;
      this.archer.frameY = 4;
    } else if (angle <= -Math.PI * (5 / 8) && angle > -Math.PI * (7 / 8)) {
      this.archer.facing = ArcherDir.DOWN_LEFT;
      this.archer.frameY = 5;
    } else if (angle <= -Math.PI * (3 / 8) && angle > -Math.PI * (5 / 8)) {
      this.archer.facing = ArcherDir.DOWN;
      this.archer.frameY = 6;
    } else if (angle <= -Math.PI * (1 / 8) && angle > -Math.PI * (3 / 8)) {
      this.archer.facing = ArcherDir.DOWN_RIGHT;
      this.archer.frameY = 5;
    } else if (angle <= Math.PI * (1 / 8) && angle > -Math.PI * (1 / 8)) {
      this.archer.facing = ArcherDir.RIGHT;
      this.archer.frameY = 4;
    } else if (angle <= Math.PI * (3 / 8) && angle > Math.PI * (1 / 8)) {
      this.archer.facing = ArcherDir.UP_RIGHT;
      this.archer.frameY = 3;
    }
  }

  shoot() {
    const arrow = this.game.getProjectile("arrow");
    if (arrow) {
      arrow.start(this.archer);
    }
    this.archer.shooting = true;
    this.archer.setState(ArcherState.IDLE);
  }

  update(deltaTime) {
    //
  }
}

export class Projectile {
  constructor(game, imageObject) {
    this.game = game;
    this.image = imageObject.image;
    this.archer;
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

  start(archer) {
    this.free = false;
    this.archer = archer;
    this.x = this.archer.hitbox.x;
    this.y = this.archer.hitbox.y;
    this.speedX = this.archer.aim[0];
    this.speedY = this.archer.aim[1];
    this.angle = Math.atan2(this.archer.aim[3], this.archer.aim[2]);
  }

  reset() {
    this.archer.shooting = false;
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
    //move arrow
    this.x += this.speedX * this.speedModifier;
    this.y += this.speedY * this.speedModifier;
    const dx = this.x - this.archer.hitbox.x;
    const dy = this.y - this.archer.hitbox.y;
    const distance = Math.hypot(dx, dy);
    if (distance > this.archer.searchRadius) this.reset();
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
    ); /*
    console.log(
      this.game.height / 2 -
        this.game.playerChar.height / 2 -
        this.game.playerChar.y
    );*/
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

export class BuilderPawn extends Ally {
  constructor(game, building, imageObject) {
    super(game);
    this.building = building;
    this.x = this.building.x - this.width / 2;
    this.y = this.building.y + 100;
    this.frameY = 2;
    this.image = imageObject.image;
    this.hitbox = {
      x: this.x + 48 - this.game.viewportX,
      y: this.y + 50 - this.game.viewportY,
      hitboxRadius: 13,
    };
    this.collisionBody = new Circle(
      this.hitbox.x,
      this.hitbox.y,
      this.hitbox.hitboxRadius
    );
    this.baseline = this.hitbox.y + this.hitbox.hitboxRadius;
  }

  update(deltaTime) {
    if (this.isInView() === false) return;

    //update hitbox position
    this.hitbox.x = this.x + 48 - this.game.viewportX;
    this.hitbox.y = this.y + 50 - this.game.viewportY;
    this.collisionBody.x = this.hitbox.x;
    this.collisionBody.y = this.hitbox.y;
    //sprite animation
    if (this.frameTimer > this.frameInterval) {
      if (this.frameX < this.spriteFrames) {
        this.frameX++;
      } else {
        this.frameX = 0;
      }
      this.frameTimer = 0;
    } else {
      this.frameTimer += deltaTime;
    }
  }

  draw(ctx) {
    if (this.isInView() === false) return;

    ctx.drawImage(
      this.image,
      this.spriteWidth * this.frameX,
      this.spriteHeight * this.frameY,
      this.spriteWidth,
      this.spriteHeight,
      this.x - this.game.viewportX,
      this.y - this.game.viewportY,
      this.width, //81px
      this.height
    );
  }
}

class PawnState {
  constructor(game, pawn) {
    this.game = game;
    this.pawn = pawn;
  }
}

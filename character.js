import { Circle } from "./assets/js/collisions/Collisions.mjs";
import { Directions, PlayerState } from "./enums.js";

export default class Character {
  constructor(game, imageObject) {
    this.game = game;
    this.spriteWidth = 192;
    this.spriteHeight = 192;
    this.scale = 0.5;
    this.width = this.spriteWidth * this.scale;
    this.height = this.spriteHeight * this.scale;
    this.x = this.game.worldWidth - this.game.width; // / 2;
    this.y = this.game.height * 1.8; // - this.height / 2;
    this.hitbox = {
      x: this.game.width / 2,
      y: this.game.height / 2,
      hitboxRadius: 15,
      attackRadius: 38,
    };
    this.collisionBody = new Circle(
      this.hitbox.x,
      this.hitbox.y,
      this.hitbox.hitboxRadius
    );
    this.baseline = this.hitbox.y + this.hitbox.hitboxRadius;
    this.game.collisionSystem[this.game.currentLevel].insert(
      this.collisionBody
    );
    this.attackDamage = 25;
    this.speedX = 0;
    this.speedY = 0;
    this.maxSpeed = 3;
    this.frameX = 0;
    this.frameY = 0;
    this.spriteFrames = 5;
    this.flipDirection = false;
    this.lastKey = ""; //dir char is facing
    this.image = imageObject.image;
    this.fps = 30;
    this.frameInterval = 1000 / this.fps;
    this.frameTimer = 0;
    this.totalHealth = 150;
    this.health = this.totalHealth;
    this.states = [
      new CharacterIdle(this.game, this),
      new CharacterMove(this.game, this),
      new CharacterAttack(this.game, this),
    ];
    this.currentState = this.states[PlayerState.IDLE];
  }

  setState(state) {
    this.currentState = this.states[state];
    this.currentState.start();
  }

  getHitboxAngles() {
    let startAngle;
    let endAngle;
    if (this.lastKey === Directions.UP) {
      startAngle = Math.PI * (4 / 3);
      endAngle = Math.PI * (5 / 3);
    } else if (this.lastKey === Directions.DOWN) {
      startAngle = Math.PI / 3;
      endAngle = Math.PI * (2 / 3);
    } else if (
      this.lastKey === Directions.LEFT ||
      this.flipDirection === true
    ) {
      startAngle = Math.PI * (5 / 6);
      endAngle = Math.PI * (7 / 6);
    } else {
      //facing right
      startAngle = -Math.PI / 6;
      endAngle = Math.PI / 6;
    }
    return { startAngle, endAngle };
  }

  update(deltaTime) {
    //update position
    this.x += this.maxSpeed * this.game.dirKeys.h.val;
    this.y += this.maxSpeed * this.game.dirKeys.v.val;
    //update hitbox position
    this.hitbox.x = this.game.nearXedge
      ? this.x < this.game.width
        ? this.x + this.width / 2
        : this.x + this.width / 2 - this.game.worldWidth + this.game.width
      : this.game.width / 2;
    this.hitbox.y = this.game.nearYedge
      ? this.y < this.game.height
        ? this.y + this.height / 2
        : this.y + this.height / 2 - this.game.worldHeight + this.game.height
      : this.game.height / 2;
    //update baseline for sorting
    this.baseline =
      this.game.viewportY + this.hitbox.y + this.hitbox.hitboxRadius;
    //update collision positions
    this.collisionBody.x = this.hitbox.x;
    this.collisionBody.y = this.hitbox.y;
    //this.game.updateCollisionBodyPositions();

    //keep player inside world map width
    if (this.x < 0) {
      this.x = 0;
    } else if (this.x > this.game.worldWidth - this.width) {
      this.x = this.game.worldWidth - this.width;
    }
    //keep player inside world map height
    if (this.y < 0) {
      this.y = 0;
    } else if (this.y > this.game.worldHeight - this.height) {
      this.y = this.game.worldHeight - this.height;
    }
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
    this.currentState.update();
  }

  draw(ctx) {
    if (this.game.dirKeys.h.val === -1) {
      this.flipDirection = true;
    } else if (this.game.dirKeys.h.val === 1) {
      this.flipDirection = false;
    }

    let posX;
    let posY;
    if (this.game.nearYedge) {
      if (this.y < this.game.height) {
        //top edge
        posY = this.y;
      } else {
        //bottom edge
        posY = this.y - this.game.worldHeight + this.game.height;
      }
    } else {
      posY = this.game.height / 2 - this.height / 2;
    }
    //if facing right
    if (this.flipDirection === false) {
      if (this.game.nearXedge) {
        if (this.x < this.game.width) {
          //left edge
          posX = this.x;
        } else {
          //right edge
          posX = this.x - this.game.worldWidth + this.game.width;
        }
      } else {
        posX = this.game.width / 2 - this.width / 2;
      }
      ctx.drawImage(
        this.image,
        this.spriteWidth * this.frameX,
        this.spriteHeight * this.frameY,
        this.spriteWidth,
        this.spriteHeight,
        posX,
        posY,
        this.width,
        this.height
      );
    } else {
      //walk, idle, attack left
      if (this.game.nearXedge) {
        if (this.x < this.game.width) {
          //left edge
          posX = -this.x - this.width;
        } else {
          //right edge
          posX = -this.x - this.width + this.game.worldWidth - this.game.width;
        }
      } else {
        posX = -this.game.width / 2 - this.width / 2;
      }
      ctx.setTransform(-1, 0, 0, 1, 0, 0); //-1 flips horizontal
      ctx.drawImage(
        this.image,
        this.spriteWidth * this.frameX,
        this.spriteHeight * this.frameY,
        this.spriteWidth,
        this.spriteHeight,
        posX,
        posY,
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
      if (this.currentState === this.states[PlayerState.ATTACK])
        this.currentState.draw(ctx);
    }
  }
}

class CharacterState {
  constructor(game, character) {
    this.game = game;
    this.char = character;
  }
}

class CharacterIdle extends CharacterState {
  start() {
    this.char.frameX = 0;
    this.char.frameY = 0;
  }

  update() {
    if (this.game.dirKeys.h.val !== 0 || this.game.dirKeys.v.val !== 0) {
      this.char.setState(PlayerState.MOVE);
    }
  }
}

class CharacterMove extends CharacterState {
  start() {
    this.char.frameX = 0;
    this.char.frameY = 1; //move sideways
  }

  update() {
    if (this.game.dirKeys.h.val === 0 && this.game.dirKeys.v.val === 0) {
      this.char.setState(PlayerState.IDLE);
    }
  }
}

class CharacterAttack extends CharacterState {
  start() {
    this.char.frameX = 0;
    if (this.char.lastKey === Directions.UP) {
      Math.random() < 0.5 ? (this.char.frameY = 6) : (this.char.frameY = 7);
    } else if (this.char.lastKey === Directions.DOWN) {
      Math.random() < 0.5 ? (this.char.frameY = 4) : (this.char.frameY = 5);
    } else {
      Math.random() < 0.5 ? (this.char.frameY = 2) : (this.char.frameY = 3);
    }
  }

  update() {
    if (this.char.frameX === this.char.spriteFrames) {
      this.game.actionKey = undefined;
      if (this.game.dirKeys.h.val !== 0 || this.game.dirKeys.v.val !== 0) {
        this.char.setState(PlayerState.MOVE);
      } else {
        this.char.setState(PlayerState.IDLE);
      }
    }
  }

  draw(ctx) {
    //only draws on debug
    const { startAngle, endAngle } = this.char.getHitboxAngles();
    ctx.beginPath();
    ctx.arc(
      this.char.hitbox.x, //this.game.width / 2,
      this.char.hitbox.y, //this.game.height / 2,
      this.char.hitbox.attackRadius,
      startAngle,
      endAngle
    );
    ctx.stroke();
  }
}

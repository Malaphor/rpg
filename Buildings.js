import { Archer, BuilderPawn } from "./Ally.js";
import { Circle, Polygon } from "./assets/js/collisions/Collisions.mjs";
import { BuildingStates } from "./enums.js";
import { BlueButton, HealthBar, assets } from "./utils.js";

export class Building {
  constructor(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.tileWidth = 64;
    this.health;
    this.isBeingAttacked = false;
    this.fireImage = assets.images.fire.image;
    this.spriteWidth = 128;
    this.spriteHeight = 128;
    this.scale = 0.5;
    this.fireWidth = this.spriteWidth * this.scale;
    this.fireHeight = this.spriteHeight * this.scale;
    this.fireSpriteFrames = 6;
    this.fireFrameX = 0;
    this.fps = 30;
    this.frameInterval = 1000 / this.fps; //for rebuilding
    this.fireFrameInterval = 1000 / this.fps;
    this.fireFrameTimer = 0;
  }

  update(deltaTime) {
    this.collisionBody.x = this.x + this.xOffset - this.game.viewportX;
    this.collisionBody.y = this.y + this.yOffset - this.game.viewportY;
    if (this.hitbox) {
      this.hitbox.x = this.x + this.xOffset - this.game.viewportX;
      this.hitbox.y = this.y + this.yOffset - this.game.viewportY;
    }

    if (this.currentState) this.currentState.update(deltaTime);
    if (this.button && this.button.visible) this.button.update(deltaTime);
    if (this.archer) this.archer.update(deltaTime);
  }

  draw(ctx) {
    if (this.isInView() === false) return;
    ctx.drawImage(
      this.image,
      0,
      0,
      this.width,
      this.height,
      this.x - this.game.viewportX,
      this.y - this.game.viewportY,
      this.width,
      this.height
    );
    if (this.currentState) this.currentState.draw(ctx);
    if (
      this.healthBar &&
      this.currentState !== this.states[BuildingStates.BROKEN] &&
      this.health < this.totalHealth
    )
      this.healthBar.draw(ctx);
    if (this.button && this.button.visible) this.button.draw(ctx);
    if (this.archer) this.archer.draw(ctx);

    if (this.game.debug) {
      if (this.hitbox && this.hitbox.hitboxRadius) {
        ctx.beginPath();
        ctx.arc(
          this.hitbox.x,
          this.hitbox.y,
          this.hitbox.hitboxRadius,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      } else if (this.hitbox) {
        ctx.strokeRect(
          this.hitbox.x,
          this.hitbox.y,
          this.hitbox.width,
          this.hitbox.height
        );
      }
      if (this.collisionBody) {
        ctx.beginPath();
        //this.collisionBody.draw(ctx);
        ctx.stroke();
      }
    }
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

export class House extends Building {
  constructor(
    game,
    defaultImageObject,
    brokenImageObject,
    buildImageObject,
    x,
    y
  ) {
    super(game, x, y);
    this.images = [
      defaultImageObject.image,
      brokenImageObject.image,
      buildImageObject.image,
    ];
    this.image = this.images[BuildingStates.DEFAULT];
    this.width = 2 * this.tileWidth;
    this.height = 3 * this.tileWidth;
    this.xOffset = 20;
    this.yOffset = 64;
    this.hitbox = {
      x: this.x + this.xOffset,
      y: this.y + this.yOffset,
      width: 88,
      height: 100,
    };
    this.collisionBody = new Polygon(
      this.x + this.xOffset,
      this.y + this.yOffset,
      [
        [0, 0],
        [88, 0],
        [88, 100],
        [0, 100],
      ]
    );
    this.game.collidableObjects.insert(this.collisionBody);
    this.baseline = this.y + 164;
    this.button = new BlueButton(game, this, "E", 40, 50);
    this.totalHealth = 100;
    this.health = this.totalHealth;
    this.healthBar = new HealthBar(this.game, this);
    this.states = [new Default(this), new Broken(this), new Build(this)];
    this.currentState = this.states[BuildingStates.DEFAULT];
    this.pawn = new BuilderPawn(this.game, this, assets.images.pawnBlue);
    this.fireX = this.x + this.width / 2;
    this.fireY = this.y + this.height - 85;
  }
}

export class Tower extends Building {
  constructor(
    game,
    defaultImageObject,
    brokenImageObject,
    buildImageObject,
    x,
    y
  ) {
    super(game, x, y);
    this.images = [
      defaultImageObject.image,
      brokenImageObject.image,
      buildImageObject.image,
    ];
    this.image = this.images[BuildingStates.DEFAULT];
    this.width = 2 * this.tileWidth;
    this.height = 4 * this.tileWidth;
    this.xOffset = 64;
    this.yOffset = 192;
    this.hitbox = {
      x: this.x + this.xOffset,
      y: this.y + this.yOffset,
      hitboxRadius: 40,
    };
    this.collisionBody = new Circle(
      this.hitbox.x,
      this.hitbox.y,
      this.hitbox.hitboxRadius
    );
    this.game.collidableObjects.insert(this.collisionBody);
    this.baseline = this.hitbox.y;
    this.totalHealth = 200;
    this.health = this.totalHealth;
    this.healthBar = new HealthBar(this.game, this, 35);
    this.states = [new Default(this), new Broken(this), new Build(this)];
    this.currentState = this.states[BuildingStates.DEFAULT];
    this.pawn = new BuilderPawn(this.game, this, assets.images.pawnBlue);
    this.archer = new Archer(
      this.game,
      assets.images.archerBlue,
      this.x + this.width / 2,
      this.y + 40
    );
    this.button = new BlueButton(game, this, "E", 40, 120);
    this.fireX = this.x + 55;
    this.fireY = this.y + 47;
  }
}

export class Castle extends Building {
  constructor(game, defaultImageObject, brokenImageObject, x, y) {
    super(game, x, y);
    this.images = [defaultImageObject.image, brokenImageObject.image];
    this.image = this.images[BuildingStates.DEFAULT];
    this.width = 5 * this.tileWidth;
    this.height = 4 * this.tileWidth;
    this.xOffset = 32;
    this.yOffset = 96; //164
    this.hitbox = {
      x: this.x + this.xOffset,
      y: this.y + this.yOffset,
      width: 256,
      height: 142,
    };
    this.collisionBody = new Polygon(
      this.x + this.xOffset,
      this.y + this.yOffset,
      [
        [0, 0],
        [256, 0],
        [256, 142],
        [0, 142],
      ]
    );
    this.game.collidableObjects.insert(this.collisionBody);
    this.baseline = this.y + 196;
    this.totalHealth = 500;
    this.health = this.totalHealth;
    this.healthBar = new HealthBar(this.game, this, 25);
    this.states = [new Default(this), new Broken(this)];
    this.currentState = this.states[BuildingStates.DEFAULT];
  }
}

export class GoblinHouse extends Building {
  constructor(game, defaultImageObject, brokenImageObject, x, y) {
    super(game, x, y);
    this.images = [defaultImageObject.image, brokenImageObject.image];
    this.image = this.images[BuildingStates.DEFAULT];
    this.width = 2 * this.tileWidth;
    this.height = 3 * this.tileWidth;
    this.xOffset = 64;
    this.yOffset = 128;
    this.hitbox = {
      x: this.x + this.xOffset,
      y: this.y + this.yOffset,
      hitboxRadius: 40,
    };
    this.collisionBody = new Circle(
      this.hitbox.x,
      this.hitbox.y,
      this.hitbox.hitboxRadius
    );
    this.game.collidableObjects.insert(this.collisionBody);
    this.baseline = this.hitbox.y + this.hitbox.hitboxRadius;
    this.totalHealth = 150;
    this.health = this.totalHealth;
    this.healthBar = new HealthBar(this.game, this);
    this.states = [new Default(this), new Broken(this)];
    this.currentState = this.states[BuildingStates.DEFAULT];
  }
}

export class GoblinTower extends Building {
  constructor(game, defaultImageObject, brokenImageObject, x, y) {
    super(game, x, y);
    this.images = [defaultImageObject.image, brokenImageObject.image];
    this.image = this.images[BuildingStates.DEFAULT];
    this.width = 4 * this.tileWidth;
    this.height = 3 * this.tileWidth;
    this.xOffset = 85;
    this.yOffset = 64;
    this.hitbox = {
      x: this.x + this.xOffset,
      y: this.y + this.yOffset,
      width: 86,
      height: 90,
    };
    this.collisionBody = new Polygon(
      this.x + this.xOffset,
      this.y + this.yOffset,
      [
        [0, 0],
        [86, 0],
        [86, 90],
        [0, 90],
      ]
    );
    this.game.collidableObjects.insert(this.collisionBody);
    this.baseline = this.y + 168;
    this.spriteFrames = 3;
    this.frameX = 0;
    this.frameInterval = 1000 / 20;
    this.frameTimer = 0;
    this.totalHealth = 250;
    this.fireX = this.x + this.width / 2;
    this.fireY = this.y + this.height - 85;
    this.health = this.totalHealth;
    this.healthBar = new HealthBar(this.game, this, 0);
    this.states = [new Default(this), new Broken(this)];
    this.currentState = this.states[BuildingStates.DEFAULT];
  }

  update(deltaTime) {
    this.collisionBody.x = this.x + this.xOffset - this.game.viewportX;
    this.collisionBody.y = this.y + this.yOffset - this.game.viewportY;
    this.hitbox.x = this.x + this.xOffset - this.game.viewportX;
    this.hitbox.y = this.y + this.yOffset - this.game.viewportY;

    this.currentState.update(deltaTime);

    if (this.currentState === this.states[BuildingStates.DEFAULT]) {
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
  }

  draw(ctx) {
    if (this.isInView() === false) return;
    ctx.drawImage(
      this.image,
      this.frameX * this.width,
      0,
      this.width,
      this.height,
      this.x - this.game.viewportX,
      this.y - this.game.viewportY,
      this.width,
      this.height
    );
    if (this.currentState) this.currentState.draw(ctx);
    if (this.healthBar && this.health < this.totalHealth)
      this.healthBar.draw(ctx);
    if (this.game.debug) {
      if (this.hitbox) {
        ctx.beginPath();
        ctx.arc(
          this.hitbox.x - this.game.viewportX,
          this.hitbox.y - this.game.viewportY,
          this.hitbox.hitboxRadius,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
      if (this.collisionBody) {
        ctx.beginPath();
        this.collisionBody.draw(ctx);
        ctx.stroke();
      }
    }
  }
}

export class ActiveGoldMine extends Building {
  constructor(game, imageObject, x, y) {
    super(game, x, y);
    this.image = imageObject.image;
    this.width = 3 * this.tileWidth;
    this.height = 2 * this.tileWidth;
    this.xOffset = 20;
    this.yOffset = 32;
    this.collisionBody = new Polygon(
      this.x + this.xOffset,
      this.y + this.yOffset,
      [
        [0, 0],
        [152, 0],
        [152, 64],
        [0, 64],
      ]
    );
    this.game.collidableObjects.insert(this.collisionBody);
    this.baseline = this.y + 96;
  }
}

export class InactiveGoldMine extends Building {
  constructor(game, imageObject, x, y) {
    super(game, x, y);
    this.image = imageObject.image;
    this.width = 3 * this.tileWidth;
    this.height = 2 * this.tileWidth;
    this.xOffset = 20;
    this.yOffset = 32;
    this.collisionBody = new Polygon(
      this.x + this.xOffset,
      this.y + this.yOffset,
      [
        [0, 0],
        [152, 0],
        [152, 64],
        [0, 64],
      ]
    );
    this.game.collidableObjects.insert(this.collisionBody);
    this.baseline = this.y + 96;
  }
}

class BuildingState {
  constructor(building) {
    this.building = building;
    this.timer = 0;
    this.coolDownTime = 500;
  }
}

class Default extends BuildingState {
  start() {
    this.building.image = this.building.images[BuildingStates.DEFAULT];
    this.building.frameX = 0;
    this.timer = 0;
    this.coolDownTime = 500;
  }

  update(deltaTime) {
    if (this.building.isBeingAttacked) {
      if (this.timer > this.coolDownTime) {
        this.building.isBeingAttacked = false;
        this.timer = 0;
      } else {
        this.timer += deltaTime;
      }
    }
    //sprite animation
    if (this.building.fireFrameTimer > this.building.fireFrameInterval) {
      if (this.building.fireFrameX < this.building.fireSpriteFrames) {
        this.building.fireFrameX++;
      } else {
        this.building.fireFrameX = 0;
      }
      this.building.fireFrameTimer = 0;
    } else {
      this.building.fireFrameTimer += deltaTime;
    }
    if (this.building.health <= 0)
      this.building.setState(BuildingStates.BROKEN);
  }

  draw(ctx) {
    if (this.building.health < this.building.totalHealth / 2) {
      ctx.drawImage(
        this.building.fireImage,
        this.building.spriteWidth * this.building.fireFrameX,
        0,
        this.building.spriteWidth,
        this.building.spriteHeight,
        this.building.fireX - this.building.game.viewportX,
        this.building.fireY - this.building.game.viewportY,
        this.building.fireWidth,
        this.building.fireHeight
      );
    }
  }
}

class Broken extends BuildingState {
  start() {
    this.building.image = this.building.images[BuildingStates.BROKEN];
  }

  update() {
    //
  }

  draw(ctx) {
    //
  }
}

class Build extends BuildingState {
  start() {
    this.building.image = this.building.images[BuildingStates.BUILD];
    this.timer = 0;
    this.building.pawn.visible = true;
    this.building.button.visible = false;
  }

  update(deltaTime) {
    if (this.building.health < this.building.totalHealth) {
      this.building.pawn.update(deltaTime);
      if (this.timer > this.building.frameInterval) {
        this.building.health += 1;
        this.timer = 0;
      } else {
        this.timer += deltaTime;
      }
    } else {
      this.timer = 0;
      this.building.health = this.building.totalHealth;
      this.building.setState(BuildingStates.DEFAULT);
      this.building.pawn.visible = false;
    }
  }

  draw(ctx) {
    this.building.pawn.draw(ctx);
  }
}

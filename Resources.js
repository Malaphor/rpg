import { ResourceStates, SheepStates, TreeStates } from "./enums.js";
import { BlueButton, assets } from "./utils.js";

export class Resource {
  constructor(game, x, y, name, imageObjectIdle, imageObjectIdleSpawn) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.name = name;
    this.images = [imageObjectIdle.image, imageObjectIdleSpawn.image];
    this.spriteWidth = 128;
    this.spriteHeight = 128;
    this.width = 50;
    this.height = 50;
    this.spriteFrames = 6;
    this.frameX = 0;
    this.frameTimer = 0;
    this.fps = 30;
    this.frameInterval = 1000 / this.fps;
    this.states = [
      new ResourceIdle(this.game, this),
      new ResourceSpawn(this.game, this),
    ];
    this.currentState = this.states[ResourceStates.IDLE];
    this.visible = false;
    this.resourceTimer = 0;
    this.timeBeforeDisapper = 20000; //20sec
    this.button = new BlueButton(game, this, "E");
  }

  setState(state) {
    this.currentState = this.states[state];
    this.currentState.start();
  }

  update(deltaTime) {
    if (!this.visible) return;
    //sprite animation
    if (this.currentState === this.states[ResourceStates.SPAWN]) {
      if (this.frameTimer > this.frameInterval) {
        if (this.frameX < this.spriteFrames) {
          this.frameX++;
        } else {
          this.currentState = this.states[ResourceStates.IDLE];
        }
        this.frameTimer = 0;
      } else {
        this.frameTimer += deltaTime;
      }
    } else {
      if (this.resourceTimer > this.timeBeforeDisapper) {
        this.visible = false;
        this.button.visible = false;
        this.resourceTimer = 0;
      } else {
        this.resourceTimer += deltaTime;
        this.button.update(deltaTime);
      }
    }
  }

  draw(ctx) {
    if (!this.visible) return;
    this.currentState.draw(ctx);
    this.button.draw(ctx);
  }

  addToInventory(resource) {
    const resourceIndex = this.game.inventory.findIndex(
      (element) => element.name === resource.name
    );
    if (this.game.inventory[resourceIndex].quantity > 99) {
      this.game.inventory[resourceIndex].quantity = 99;
    } else {
      this.game.inventory[resourceIndex].quantity++;
    }
    const saveData = JSON.parse(localStorage.getItem("tinySwordsSaveData"));
    localStorage.setItem(
      "tinySwordsSaveData",
      JSON.stringify({
        ...saveData,
        [resource.name]: this.game.inventory[resourceIndex].quantity,
      })
    );
    this.visible = false;
  }
}

class ResourceState {
  constructor(game, resource) {
    this.game = game;
    this.resource = resource;
  }
}

class ResourceIdle extends ResourceState {
  constructor(game, resource) {
    super(game, resource);
  }

  start() {
    this.resourceTimer = 0;
  }

  draw(ctx) {
    ctx.drawImage(
      this.resource.images[ResourceStates.IDLE],
      this.resource.x - this.game.viewportX,
      this.resource.y - this.game.viewportY,
      this.resource.width,
      this.resource.height
    );
  }
}

class ResourceSpawn extends ResourceState {
  constructor(game, resource) {
    super(game, resource);
  }

  start() {
    this.frameX = 0;
    this.frameTimer = 0;
    this.resource.visible = true;
  }

  draw(ctx) {
    ctx.drawImage(
      this.resource.images[ResourceStates.SPAWN],
      this.resource.frameX * this.resource.spriteWidth,
      0,
      this.resource.spriteWidth,
      this.resource.spriteHeight,
      this.resource.x - this.game.viewportX,
      this.resource.y - this.game.viewportY,
      this.resource.width,
      this.resource.height
    );
  }
}

export class TreeResource {
  constructor(game, x, y, imageObject) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.image = imageObject.image;
    this.width = 3 * 64;
    this.height = 3 * 64;
    this.xOffset = this.width / 2;
    this.yOffset = this.height - 32;
    this.hitbox = {
      x: this.x + this.xOffset,
      y: this.y + this.yOffset,
      hitboxRadius: 14,
    };
    this.spriteFrames = 3;
    this.frameX = 0;
    this.frameY = 0;
    this.fps = 10 + Math.random() * 5;
    this.frameInterval = 1000 / this.fps;
    this.frameTimer = 0;
    this.resource = new Resource(
      game,
      this.x + this.width / 2,
      this.y + this.height / 2,
      "wood",
      assets.images.wood,
      assets.images.woodSpawn
    );
    this.states = [
      new TreeStateIdle(game, this),
      new TreeStateAttacked(game, this),
      new TreeStateDead(game, this),
    ];
    this.currentState = this.states[TreeStates.ATTACKED];
    this.totalHealth = 4;
    this.health = this.totalHealth;
    this.isBeingAttacked = false;
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

  update(deltaTime) {
    this.hitbox.x = this.x + this.xOffset - this.game.viewportX;
    this.hitbox.y = this.y + this.yOffset - this.game.viewportY;
    if (this.resource.visible) this.resource.update(deltaTime);
    this.currentState.update(deltaTime);
    if (this.isInView() === false) return;
    //sprite animation
    if (this.frameTimer > this.frameInterval) {
      if (this.frameX < this.spriteFrames) {
        this.frameX++;
      } else {
        this.frameX = 0;
        if (this.currentState === this.states[TreeStates.ATTACKED]) {
          this.setState(TreeStates.IDLE);
        }
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
      this.frameX * this.width,
      this.frameY * this.height,
      this.width,
      this.height,
      this.x - this.game.viewportX,
      this.y - this.game.viewportY,
      this.width,
      this.height
    );
    if (this.resource.visible) this.resource.draw(ctx);
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

class TreeState {
  constructor(game, tree) {
    this.game = game;
    this.tree = tree;
    this.coolDownTime = 100;
    this.respawnTime = 30000; //30sec
    this.deadTimer = 0;
  }
}

class TreeStateIdle extends TreeState {
  constructor(game, tree) {
    super(game, tree);
  }

  start() {
    this.tree.spriteFrames = 3;
    this.tree.frameX = 0;
    this.tree.frameY = 0;
    this.tree.frameInterval = 1000 / this.tree.fps;
    this.tree.isBeingAttacked = false;
    this.coolDownTime = 500;
  }

  update(deltaTime) {
    if (this.coolDownTime <= 0) {
      if (this.tree.isBeingAttacked) this.tree.setState(TreeStates.ATTACKED);
    } else {
      this.tree.isBeingAttacked = false;
      this.coolDownTime -= deltaTime;
    }
  }
}

class TreeStateAttacked extends TreeState {
  constructor(game, tree) {
    super(game, tree);
  }

  start() {
    this.tree.spriteFrames = 1;
    this.tree.frameX = 0;
    this.tree.frameY = 1;
    this.tree.frameInterval = 100;
    this.tree.health--;
  }

  update() {
    if (this.tree.health === 0) {
      this.tree.setState(TreeStates.DEAD);
    }
  }
}

class TreeStateDead extends TreeState {
  constructor(game, tree) {
    super(game, tree);
  }

  start() {
    this.tree.spriteFrames = 0;
    this.tree.frameX = 0;
    this.tree.frameY = 2;
    this.deadTimer = 0;
    this.tree.resource.setState(ResourceStates.SPAWN);
  }

  update(deltaTime) {
    if (this.deadTimer > this.respawnTime) {
      this.tree.health = this.tree.totalHealth;
      this.tree.setState(TreeStates.IDLE);
    } else {
      this.deadTimer += deltaTime;
    }
  }
}

export class SheepResource {
  constructor(game, x, y, imageObject) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.image = imageObject.image;
    this.width = 2 * 64;
    this.height = 2 * 64;
    this.xOffset = this.width / 2;
    this.yOffset = this.height / 2;
    this.hitbox = {
      x: this.x + this.xOffset,
      y: this.y + this.yOffset,
      hitboxRadius: 14,
    };
    this.spriteFrames = 7;
    this.frameX = 0;
    this.frameY = 0;
    this.fps = 30;
    this.frameInterval = 1000 / this.fps;
    this.frameTimer = 0;
    this.resource = new Resource(
      game,
      this.x + this.width / 2,
      this.y + this.height / 2,
      "meat",
      assets.images.meat,
      assets.images.meatSpawn
    );
    this.states = [
      new SheepStateIdle(this.game, this),
      new SheepStateAttacked(this.game, this),
      new SheepStateDead(this.game, this),
    ];
    this.currentState = this.states[SheepStates.IDLE];
    this.totalHealth = 3;
    this.health = this.totalHealth;
    this.isBeingAttacked = false;
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

  update(deltaTime) {
    this.hitbox.x = this.x + this.xOffset - this.game.viewportX;
    this.hitbox.y = this.y + this.yOffset - this.game.viewportY;
    if (this.resource.visible) this.resource.update(deltaTime);
    this.currentState.update(deltaTime);
    if (this.isInView() === false) return;
    //sprite animation
    if (this.frameTimer > this.frameInterval) {
      if (this.frameX < this.spriteFrames) {
        this.isBeingAttacked ? (this.frameX += 2) : this.frameX++;
      } else {
        if (this.currentState !== this.states[SheepStates.DEAD])
          this.frameX = 0;
        if (this.currentState === this.states[SheepStates.ATTACKED]) {
          this.setState(SheepStates.IDLE);
        }
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
      this.frameX * this.width,
      this.frameY * this.height,
      this.width,
      this.height,
      this.x - this.game.viewportX,
      this.y - this.game.viewportY,
      this.width,
      this.height
    );
    if (this.resource.visible) this.resource.draw(ctx);
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

class SheepState {
  constructor(game, sheep) {
    this.game = game;
    this.sheep = sheep;
    this.coolDownTime = 100;
    this.respawnTime = 30000; //30sec
    this.deadTimer = 0;
  }
}

class SheepStateIdle extends SheepState {
  constructor(game, sheep) {
    super(game, sheep);
  }

  start() {
    this.sheep.spriteFrames = 7;
    this.sheep.frameX = 0;
    this.sheep.frameY = 0;
    this.sheep.isBeingAttacked = false;
    this.coolDownTime = 500;
  }

  update(deltaTime) {
    if (this.coolDownTime <= 0) {
      if (this.sheep.isBeingAttacked) this.sheep.setState(SheepStates.ATTACKED);
    } else {
      this.sheep.isBeingAttacked = false;
      this.coolDownTime -= deltaTime;
    }
  }
}

class SheepStateAttacked extends SheepState {
  constructor(game, sheep) {
    super(game, sheep);
  }

  start() {
    this.sheep.spriteFrames = 5;
    this.sheep.frameX = 1;
    this.sheep.frameY = 1;
    this.sheep.health--;
  }

  update() {
    if (this.sheep.health === 0) {
      this.sheep.setState(SheepStates.DEAD);
    }
  }
}

class SheepStateDead extends SheepState {
  constructor(game, sheep) {
    super(game, sheep);
  }

  start() {
    this.sheep.spriteFrames = 0;
    this.sheep.frameX = 6;
    this.sheep.frameY = 1;
    this.deadTimer = 0;
    this.sheep.resource.setState(ResourceStates.SPAWN);
  }

  update(deltaTime) {
    if (this.deadTimer > this.respawnTime) {
      this.sheep.health = this.sheep.totalHealth;
      this.sheep.setState(SheepStates.IDLE);
    } else {
      this.deadTimer += deltaTime;
    }
  }
}

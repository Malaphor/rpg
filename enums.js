export const Directions = {
  LEFT: "arrowleft",
  RIGHT: "arrowright",
  UP: "arrowup",
  DOWN: "arrowdown",
};

export const Actions = {
  ATTACK: "a",
  ACTION: "e", //pick up resource or repair building
  PLAYPAUSE: " ",
  DEBUG: "d",
  CONFIRM: "enter",
  CANCEL: "backspace",
};

export const PlayerState = {
  IDLE: 0,
  MOVE: 1,
  ATTACK: 2,
};

export const ArcherState = {
  IDLE: 0,
  ATTACK: 1,
};

export const ArcherDir = {
  UP_RIGHT: 0,
  RIGHT: 1,
  DOWN_RIGHT: 2,
  DOWN: 3,
  DOWN_LEFT: 4,
  LEFT: 5,
  UP_LEFT: 6,
  UP: 7,
};

export const PawnStates = {
  IDLE: 0,
  REPAIR: 1,
};

export const BuildingStates = {
  DEFAULT: 0,
  BROKEN: 1,
  BUILD: 2,
};

export const ResourceStates = {
  IDLE: 0,
  SPAWN: 1,
};

export const TreeStates = {
  IDLE: 0,
  ATTACKED: 1,
  DEAD: 2,
};

export const SheepStates = {
  IDLE: 0,
  ATTACKED: 1,
  DEAD: 2,
};

export const EnemyStates = {
  IDLE: 0,
  MOVE: 1,
  ATTACK: 2,
  DYING: 3,
};

export const EnemyDir = {
  LEFT: 0,
  RIGHT: 1,
};

export const DynamiteStates = {
  MOVING: 0,
  EXPLODING: 1,
};

export const TorchStates = {
  IDLE: 0,
  MOVE: 1,
  ATTACK: 2,
  DYING: 3,
};

export enum GamepadHandlerEventCode {
  Connect = 'connect',
  Disconnect = 'disconnect',
}

export class GamepadHandler {
  static _instance: GamepadHandler;
  gamepads!: { [key: string]: Gamepad };
  _paused!: boolean;
  _callbacks!: { [key in GamepadHandlerEventCode]: GamepadEventCallback[] };
  _supported!: boolean;

  constructor() {
    if (GamepadHandler._instance) {
      return GamepadHandler._instance;
    }
    this.gamepads = {};
    this._paused = false;
    this._callbacks = {
      connect: [],
      disconnect: [],
    };
    this._supported = navigator && navigator.getGamepads !== undefined;
    GamepadHandler._instance = this;
  }

  get paused() {
    return this._paused;
  }

  get supported() {
    return this._supported;
  }

  start() {
    this._paused = false;
    this._run();
  }

  stop() {
    this._paused = true;
  }

  poll() {
    // must call getGamepads() to force each gamepad object to update for some browsers (Chrome)
    const gamepads = navigator.getGamepads ? [...navigator.getGamepads()] : [];
    const connectedIndices = [];
    for (const index in gamepads) {
      const gamepad = gamepads[index];
      if (index && gamepad !== null) {
        if (gamepad.index !== undefined) {
          if (gamepad.index in this.gamepads) {
            this.gamepads[gamepad.index].update(gamepad);
          } else {
            this.gamepads[gamepad.index] = new Gamepad(gamepad);
            const event = new GamepadConnectionEvent(this.gamepads[gamepad.index], GamepadHandlerEventCode.Connect);
            event._dispatch(this._callbacks[GamepadHandlerEventCode.Connect]);
          }
        }
        connectedIndices.push(index);
      }
    }
    // check if any tracked gamepads are now absent/disconnected from the browser's gamepads
    for (const index in this.gamepads) {
      if (!connectedIndices.includes(index)) {
        // this.gamepads[index]._last.connected = false; // cannot assign to readonly property
        const event = new GamepadConnectionEvent(this.gamepads[index], GamepadHandlerEventCode.Disconnect);
        event._dispatch(this._callbacks[GamepadHandlerEventCode.Disconnect]);
        delete this.gamepads[index];
      }
    }
  }

  // connect: callback(gamepad)
  // disconnect: callback(gamepad)
  addEventListener(type: GamepadHandlerEventCode, listener: GamepadEventCallback) {
    this._callbacks[type].push(listener);
  }

  removeEventListener(type: GamepadHandlerEventCode, listener: GamepadEventCallback) {
    this._callbacks[type] = this._callbacks[type].filter((callback) => callback !== listener);
  }

  _run() {
    if (this._supported && !this._paused) {
      this.poll();
      requestAnimationFrame(() => this._run());
    }
  }
}

export enum GamepadEventCode {
  ButtonPress = 'buttonpress',
  ButtonRelease = 'buttonrelease',
  ButtonValueChange = 'buttonvaluechange',
  AxisChange = 'axischange',
  JoystickMove = 'joystickmove',
}

type GamepadEventCallback = (e: _GamepadEvent) => void;

export class Gamepad {
  gamepad: globalThis.Gamepad;
  _last?: globalThis.Gamepad;
  _callbacks: { [key in GamepadEventCode]: Map<number[] | number, GamepadEventCallback[]> };
  _deadzone?: number;
  _deadzones: { [key: number]: number };

  constructor(gamepad: globalThis.Gamepad) {
    this.gamepad = gamepad;
    this._callbacks = {
      // map required for array keys on joystickmove, used for convenience elsewhere
      buttonpress: new Map(),
      buttonrelease: new Map(),
      buttonvaluechange: new Map(),
      axischange: new Map(),
      joystickmove: new Map(),
    };
    this._deadzones = {};
    this._setLastValues();
  }

  _setLastValues() {
    this._last = {
      ...this.gamepad,
      connected: this.gamepad.connected,
      axes: this.gamepad.axes.slice(),
      buttons: Object.keys(this.gamepad.buttons).map((i) => ({
        pressed: this.gamepad.buttons[parseInt(i)].pressed,
        value: this.gamepad.buttons[parseInt(i)].value,
        touched: false,
      })),
    };
  }

  get joystickDeadzone() {
    return this._deadzone || 0.1;
  }

  set joystickDeadzone(deadzone) {
    this._checkDeadzone(deadzone);
    this._deadzone = deadzone;
  }

  getAxisDeadzone(index: number) {
    return this._deadzones[index];
  }

  setAxisDeadzone(index: number, deadzone: number) {
    this._checkDeadzone(deadzone);
    this._deadzones[index] = deadzone;
  }

  getButton(index: number) {
    return this.gamepad.buttons[index];
  }

  getAxis(index: number) {
    return this.gamepad.axes[index];
  }

  isConnected() {
    // uses _last so the value can be set from gamepads 'disconnect' event
    // necessary for browsers that do not automatically update gamepad values
    // return this._last.connected
    return this.gamepad.connected && this._last?.connected;
  }

  getMapping() {
    return this.gamepad.mapping;
  }

  _checkDeadzone(deadzone: number) {
    if (deadzone >= 1.0 || deadzone < 0) {
      throw new Error('deadzone must be in range [0, 1)');
    }
  }

  update(gamepad: globalThis.Gamepad) {
    const updatesReferences = gamepad.timestamp === this.gamepad.timestamp;
    let oldGamepad, newGamepad;
    if (!updatesReferences) {
      // chrome gamepad instances are snapshots
      oldGamepad = this.gamepad;
      newGamepad = gamepad;
      this.gamepad = gamepad;
    } else {
      // firefox gamepad instances are live objects
      oldGamepad = this._last;
      newGamepad = this.gamepad;
    }
    if (newGamepad.connected && oldGamepad?.connected) {
      this._compareButtons(newGamepad.buttons, oldGamepad.buttons);
      this._compareAxes(newGamepad.axes, oldGamepad.axes);
      this._compareJoysticks(newGamepad.axes, oldGamepad.axes);
    }
    this._setLastValues();
  }

  _compareJoysticks(newAxes: readonly number[], oldAxes: readonly number[]) {
    (this._callbacks[GamepadEventCode.JoystickMove] as Map<number[], GamepadEventCallback[]>).forEach(
      (callbacks, indices: number[]) => {
        const newHorizontal = this._applyJoystickDeadzone(newAxes[indices[0]]);
        const newVertical = this._applyJoystickDeadzone(newAxes[indices[1]]);
        const oldHorizontal = this._applyJoystickDeadzone(oldAxes[indices[0]]);
        const oldVertical = this._applyJoystickDeadzone(oldAxes[indices[1]]);
        if (newHorizontal !== oldHorizontal || newVertical !== oldVertical) {
          const event = new GamepadJoystickEvent(
            this,
            GamepadEventCode.JoystickMove,
            indices[0],
            indices[1],
            newHorizontal,
            newVertical,
          );
          event._dispatch(callbacks);
        }
      },
    );
  }

  _applyJoystickDeadzone(value: number) {
    return this._applyDeadzone(value, this.joystickDeadzone);
  }

  _applyAxisDeadzone(value: number, index: number) {
    return index in this._deadzones ? this._applyDeadzone(value, this._deadzones[index]) : value;
  }

  _applyDeadzone(value: number, deadzone: number) {
    return Math.abs(value) > deadzone ? value - Math.sign(value) * deadzone : 0;
  }

  _compareAxes(newAxes: readonly number[], oldAxes: readonly number[]) {
    const callbackMap = this._callbacks[GamepadEventCode.AxisChange];
    for (let i = 0; i < newAxes.length; i++) {
      const newValue = this._applyAxisDeadzone(newAxes[i], i);
      const oldValue = this._applyAxisDeadzone(oldAxes[i], i);
      if (newValue !== oldValue) {
        const event = new GamepadValueEvent(this, GamepadEventCode.AxisChange, i, newAxes[i]);
        this._dispatchEvent(event, callbackMap, i);
      }
    }
  }

  _compareButtons(newValues: readonly globalThis.GamepadButton[], oldValues: readonly globalThis.GamepadButton[]) {
    this._checkButtons(GamepadEventCode.ButtonPress, newValues, oldValues, (nv, ov) => nv.pressed && !ov.pressed);
    this._checkButtons(GamepadEventCode.ButtonRelease, newValues, oldValues, (nv, ov) => !nv.pressed && ov.pressed);
    this._checkButtons(GamepadEventCode.ButtonValueChange, newValues, oldValues, (nv, ov) => nv.value !== ov.value);
  }

  _checkButtons(
    eventType: GamepadEventCode,
    newValues: readonly globalThis.GamepadButton[],
    oldValues: readonly globalThis.GamepadButton[],
    predicate: (nv: GamepadButton, ov: GamepadButton) => boolean,
  ) {
    const callbackMap = this._callbacks[eventType];
    for (let i = 0; i < newValues.length; i++) {
      if (predicate(newValues[i], oldValues[i])) {
        const event = new GamepadValueEvent(this, eventType, i, newValues[i].value);
        this._dispatchEvent(event, callbackMap, i);
      }
    }
  }

  _dispatchEvent(
    event: GamepadValueEvent,
    callbackMap: Map<number[] | number, GamepadEventCallback[]>,
    index: number | number[],
  ) {
    if (callbackMap.has(index)) {
      // specific listeners
      const cb = callbackMap.get(index);
      if (cb) event._dispatch(cb);
    }
    if (callbackMap.has(-1)) {
      // non-specific listeners
      const cb = callbackMap.get(-1);
      if (cb) event._dispatch(cb);
    }
  }

  // event types: buttonpress, buttonrelease, buttonvaluechange, axischange, joystickmove
  // specify index to track only a specific button
  // joystickmove event requires a two-length array for index
  addEventListener(type: GamepadEventCode, listener: GamepadEventCallback, index: number | number[] = -1) {
    this._checkJoystickEvent(type, index);
    if (!this._callbacks[type].has(index)) {
      this._callbacks[type].set(index, []);
    }
    this._callbacks[type].get(index)?.push(listener);
  }

  removeEventListener(type: GamepadEventCode, listener: GamepadEventCallback, index: number | number[] = -1) {
    this._checkJoystickEvent(type, index);
    const filtered = this._callbacks[type].get(index)?.filter((callback) => callback !== listener);
    if (filtered !== undefined) this._callbacks[type].set(index, filtered);
  }

  _checkJoystickEvent(type: GamepadEventCode, index: number | number[]) {
    if (type === GamepadEventCode.JoystickMove && !Array.isArray(index)) {
      throw new Error('joystickmove events require a two-length index array');
    }
  }

  addJoystickEventListener(
    type: GamepadEventCode,
    listener: GamepadEventCallback,
    horizontalIndex: number,
    verticalIndex: number,
  ) {
    this.addEventListener(type, listener, [horizontalIndex, verticalIndex]);
  }

  removeJoystickEventListener(
    type: GamepadEventCode,
    listener: GamepadEventCallback,
    horizontalIndex: number,
    verticalIndex: number,
  ) {
    this.removeEventListener(type, listener, [horizontalIndex, verticalIndex]);
  }
}

// avoid naming collision with DOM GamepadEvent
export class _GamepadEvent {
  gamepad: Gamepad;
  type: GamepadEventCode | GamepadHandlerEventCode;
  _consumed: boolean;

  constructor(gamepad: Gamepad, type: GamepadEventCode | GamepadHandlerEventCode) {
    this.gamepad = gamepad;
    this.type = type.toLowerCase() as GamepadEventCode | GamepadHandlerEventCode;
    this._consumed = false;
  }

  consume() {
    this._consumed = true;
  }

  isConsumed() {
    return this._consumed;
  }

  _dispatch(listeners: GamepadEventCallback[]) {
    for (let i = 0; i < listeners.length && !this.isConsumed(); i++) {
      listeners[i](this);
    }
  }
}

class GamepadConnectionEvent extends _GamepadEvent {
  constructor(gamepad: Gamepad, type: GamepadHandlerEventCode) {
    super(gamepad, type);
  }
}

class GamepadValueEvent extends _GamepadEvent {
  index: number;
  value: number;
  constructor(gamepad: Gamepad, type: GamepadEventCode, index: number, value: number) {
    super(gamepad, type);
    this.index = index;
    this.value = value;
  }
}

class GamepadJoystickEvent extends _GamepadEvent {
  indices: [number, number];
  values: [number, number];
  horizontalIndex: number;
  verticalIndex: number;
  horizontalValue: number;
  verticalValue: number;

  constructor(
    gamepad: Gamepad,
    type: GamepadEventCode,
    hIndex: number,
    vIndex: number,
    hValue: number,
    vValue: number,
  ) {
    super(gamepad, type);
    this.indices = [hIndex, vIndex];
    this.values = [hValue, vValue];
    this.horizontalIndex = hIndex;
    this.verticalIndex = vIndex;
    this.horizontalValue = hValue;
    this.verticalValue = vValue;
  }
}

// TODO: additional mappings with button names and images in gamepad-mappings.js
export const StandardMapping = {
  Button: {
    BUTTON_BOTTOM: 0,
    BUTTON_RIGHT: 1,
    BUTTON_LEFT: 2,
    BUTTON_TOP: 3,
    BUMPER_LEFT: 4,
    BUMPER_RIGHT: 5,
    TRIGGER_LEFT: 6,
    TRIGGER_RIGHT: 7,
    BUTTON_CONTROL_LEFT: 8,
    BUTTON_CONTROL_RIGHT: 9,
    BUTTON_JOYSTICK_LEFT: 10,
    BUTTON_JOYSTICK_RIGHT: 11,
    D_PAD_UP: 12,
    D_PAD_BOTTOM: 13,
    D_PAD_LEFT: 14,
    D_PAD_RIGHT: 15,
    BUTTON_CONTROL_MIDDLE: 16,
  },

  // negative left and up, positive right and down
  Axis: {
    JOYSTICK_LEFT_HORIZONTAL: 0,
    JOYSTICK_LEFT_VERTICAL: 1,
    JOYSTICK_RIGHT_HORIZONTAL: 2,
    JOYSTICK_RIGHT_VERTICAL: 3,
    JOYSTICK_LEFT: [0, 1],
    JOYSTICK_RIGHT: [2, 3],
  },
};

/**
 * Export the module (Node) or place it into the global scope (Browser).
 *
 * This approach may not cover all use cases; see Underscore.js
 * or Q.js for more comprehensive approaches that could be used if needed.
 */
// (function () {
//   if (typeof module !== 'undefined' && module.exports) {
//     module.exports = exports = Gamepads;
//     module.exports.StandardMapping = exports.StandardMapping = StandardMapping;
//   } else {
//     root.Gamepads = root.gamepads = Gamepads;
//     root.StandardMapping = StandardMapping;
//   }
// })();
// module.defaul

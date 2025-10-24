class GamepadDriver {
    constructor({
        deadzone = 0.03,
        maximize = 0.97
    } = {}) {
        this.deadzone = deadzone;
        this.maximize = maximize;
        this.gamepads = new Map();
        this.listeners = {};
        this._loop = this._loop.bind(this);

        window.addEventListener("gamepadconnected", e => this._connect(e.gamepad));
        window.addEventListener("gamepaddisconnected", e => this._disconnect(e.gamepad));

        requestAnimationFrame(this._loop);
    }

    // --- Public API ---
    on(event, handler) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(handler);
    }

    off(event, handler) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(h => h !== handler);
    }

    count() {
        return this.gamepads.size;
    }

    // --- Internal ---
    _fire(event, data) {
        (this.listeners[event] || []).forEach(fn => fn(data));
    }

    _connect(gp) {
        this.gamepads.set(gp.index, {
            pad: gp,
            lastButtons: gp.buttons.map(b => b.value),
            lastAxes: gp.axes.slice(),
        });
        this._fire("connected", gp);
    }

    _disconnect(gp) {
        this.gamepads.delete(gp.index);
        this._fire("disconnected", gp);
    }

    _loop() {
        const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];

        for (const gp of pads) {
            if (!gp) continue;
            if (!this.gamepads.has(gp.index)) this._connect(gp);

            const state = this.gamepads.get(gp.index);
            if (!state) continue;

            gp.buttons.forEach((b, i) => {
                const val = b.value;
                const last = state.lastButtons[i];
                if (val !== last) {
                    if (val > 0.5 && last <= 0.5) this._fire("buttondown", {
                        gamepad: gp,
                        index: i
                    });
                    if (val <= 0.5 && last > 0.5) this._fire("buttonup", {
                        gamepad: gp,
                        index: i
                    });
                    state.lastButtons[i] = val;
                }
            });

            gp.axes.forEach((a, i) => {
                const val = this._applyDeadzone(a);
                const last = state.lastAxes[i];
                if (val !== last) {
                    this._fire("axismove", {
                        gamepad: gp,
                        axis: i,
                        value: val
                    });
                    state.lastAxes[i] = val;
                }
            });
        }

        requestAnimationFrame(this._loop);
    }

    _applyDeadzone(v) {
        const dz = this.deadzone,
            mx = this.maximize;
        if (Math.abs(v) < dz) return 0;
        if (Math.abs(v) > mx) return Math.sign(v);
        return v;
    }
}

/*
// --- Example usage ---
const gamepads = new GamepadDriver();

gamepads.on("connected", gp => console.log("🎮 Connected:", gp.id));
gamepads.on("buttondown", e => console.log("⬇️ Button", e.index));
gamepads.on("buttonup", e => console.log("⬆️ Button", e.index));
gamepads.on("axismove", e => console.log("🌀 Axis", e.axis, e.value.toFixed(2)));

const buttons = {
    1: "A",
    2: "Y",
    4: "L",
    5: "R",
    6: "ZL",
    7: "ZR",
    10: "LS",
    11: "RS",
    12: "UP",
    13: "DOWN",
    14: "LEFT",
    15: "RIGHT"
};

const axis = {
    0: {
        "name": "LSX",
        "min": -1, // Left
        "max": 1  // Right
    },
    1: {
        "name": "LSY",
        "min": -1, // Up
        "max": 1  // Down
    }
};
*/
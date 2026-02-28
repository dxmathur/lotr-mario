// engine.js — Input, Physics, Collision, Camera

const TILE = 32;
const GRAVITY = 0.45;
const MAX_FALL = 14;
const FRICTION = 0.85;
const COYOTE_FRAMES = 8;
const JUMP_BUFFER_FRAMES = 8;

// ── Input ──
const Input = {
    keys: {},
    justPressed: {},
    _prev: {},

    init() {
        window.addEventListener('keydown', e => {
            e.preventDefault();
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', e => {
            e.preventDefault();
            this.keys[e.code] = false;
        });
        window.addEventListener('blur', () => {
            this.keys = {};
        });
    },

    update() {
        for (const k in this.keys) {
            this.justPressed[k] = this.keys[k] && !this._prev[k];
        }
        this._prev = { ...this.keys };
    },

    isDown(code) { return !!this.keys[code]; },
    wasPressed(code) { return !!this.justPressed[code]; },

    left() { return this.isDown('ArrowLeft') || this.isDown('KeyA'); },
    right() { return this.isDown('ArrowRight') || this.isDown('KeyD'); },
    jump() { return this.isDown('Space') || this.isDown('ArrowUp') || this.isDown('KeyW'); },
    jumpPressed() { return this.wasPressed('Space') || this.wasPressed('ArrowUp') || this.wasPressed('KeyW'); },
    ability() { return this.wasPressed('KeyE') || this.wasPressed('ShiftLeft') || this.wasPressed('ShiftRight'); },
    pause() { return this.wasPressed('Escape') || this.wasPressed('KeyP'); },
    enter() { return this.wasPressed('Enter'); },
};

// ── Physics helpers ──
const Physics = {
    applyGravity(entity, dt) {
        entity.vy += GRAVITY * dt;
        if (entity.vy > MAX_FALL) entity.vy = MAX_FALL;
    },

    moveX(entity, level, dt) {
        entity.x += entity.vx * dt;
        const tiles = this.getOverlappingTiles(entity, level);
        for (const t of tiles) {
            if (t.solid) {
                if (entity.vx > 0) {
                    entity.x = t.x * TILE - entity.w;
                } else if (entity.vx < 0) {
                    entity.x = (t.x + 1) * TILE;
                }
                entity.vx = 0;
            }
        }
    },

    moveY(entity, level, dt) {
        const prevY = entity.y;
        entity.y += entity.vy * dt;
        entity.onGround = false;
        const tiles = this.getOverlappingTiles(entity, level);
        for (const t of tiles) {
            if (t.solid) {
                if (entity.vy > 0) {
                    entity.y = t.y * TILE - entity.h;
                    entity.vy = 0;
                    entity.onGround = true;
                } else if (entity.vy < 0) {
                    entity.y = (t.y + 1) * TILE;
                    entity.vy = 0;
                    if (t.type === 2 && entity.isPlayer) {
                        // Brick break
                        level.breakTile(t.x, t.y);
                    }
                }
            }
            // One-way platforms: only solid when landing from above
            if (t.type === 5 && entity.vy > 0) {
                const platTop = t.y * TILE;
                const prevBottom = prevY + entity.h;
                if (prevBottom <= platTop + 2) {
                    entity.y = platTop - entity.h;
                    entity.vy = 0;
                    entity.onGround = true;
                }
            }
        }
    },

    getOverlappingTiles(entity, level) {
        const results = [];
        const l = Math.floor(entity.x / TILE);
        const r = Math.floor((entity.x + entity.w - 1) / TILE);
        const t = Math.floor(entity.y / TILE);
        const b = Math.floor((entity.y + entity.h - 1) / TILE);
        for (let ty = t; ty <= b; ty++) {
            for (let tx = l; tx <= r; tx++) {
                const tile = level.getTile(tx, ty);
                if (tile > 0) {
                    results.push({
                        x: tx, y: ty, type: tile,
                        solid: tile === 1 || tile === 2 || tile === 3 // only ground/brick/stone
                    });
                }
            }
        }
        return results;
    },

    aabb(a, b) {
        return a.x < b.x + b.w &&
               a.x + a.w > b.x &&
               a.y < b.y + b.h &&
               a.y + a.h > b.y;
    },

    stompCheck(player, enemy) {
        return player.vy > 0 &&
               player.y + player.h - player.vy <= enemy.y + 8;
    }
};

// ── Camera ──
const Camera = {
    x: 0,
    y: 0,
    shakeX: 0,
    shakeY: 0,
    shakeTimer: 0,
    shakeIntensity: 0,
    screenW: 800,
    screenH: 480,

    follow(target, levelWidth) {
        const targetX = target.x + target.w / 2 - this.screenW / 2;
        const targetY = target.y + target.h / 2 - this.screenH / 2 + 40;
        this.x += (targetX - this.x) * 0.1;
        this.y += (targetY - this.y) * 0.08;
        // Clamp
        if (this.x < 0) this.x = 0;
        if (this.x > levelWidth - this.screenW) this.x = levelWidth - this.screenW;
        // Vertical clamp
        const levelH = 15 * TILE;
        if (this.y > levelH - this.screenH) this.y = levelH - this.screenH;
        if (this.y < 0) this.y = 0;
    },

    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
    },

    update(dt) {
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }
    },

    getX() { return Math.round(this.x + this.shakeX); },
    getY() { return Math.round(this.y + this.shakeY); },

    reset() {
        this.x = 0;
        this.y = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeTimer = 0;
    }
};

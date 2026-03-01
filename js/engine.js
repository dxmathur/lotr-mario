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

    _pendingRelease: [],

    simulatePress(code) {
        this.keys[code] = true;
        this._pendingRelease.push(code);
    },

    update() {
        for (const k in this.keys) {
            this.justPressed[k] = this.keys[k] && !this._prev[k];
        }
        this._prev = { ...this.keys };
        // Release simulated one-frame presses
        for (const code of this._pendingRelease) {
            this.keys[code] = false;
        }
        this._pendingRelease.length = 0;
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

// ── Display (responsive scaling) ──
const Display = {
    canvas: null,
    isMobile: false,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    GAME_W: 800,
    GAME_H: 480,

    init(canvas) {
        this.canvas = canvas;
        const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
        this.isMobile = hasTouch && coarsePointer;
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resize(), 300);
        });
        // Prevent pull-to-refresh and overscroll
        document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
        document.addEventListener('gesturestart', e => e.preventDefault());
    },

    resize() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const aspect = this.GAME_W / this.GAME_H;
        let w, h;
        if (vw / vh > aspect) {
            h = vh;
            w = h * aspect;
        } else {
            w = vw;
            h = w / aspect;
        }
        this.scale = w / this.GAME_W;
        this.offsetX = (vw - w) / 2;
        this.offsetY = (vh - h) / 2;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
    },

    toGameX(pageX) {
        return (pageX - this.offsetX) / this.scale;
    },

    toGameY(pageY) {
        return (pageY - this.offsetY) / this.scale;
    },

    isPortrait() {
        return window.innerHeight > window.innerWidth;
    }
};

// ── Touch Controls ──
const TouchControls = {
    active: false,
    activeTouches: {},
    // Button definitions in game coordinates
    buttons: {
        left:  { x: 20,  y: 380, w: 70, h: 70, label: '<' },
        right: { x: 110, y: 380, w: 70, h: 70, label: '>' },
        jump:  { x: 660, y: 370, w: 85, h: 85, label: 'B' },
        ability: { x: 565, y: 390, w: 65, h: 65, label: 'A' },
        pause: { x: 740, y: 5, w: 50, h: 30, label: '||' },
    },
    pressed: {},

    init() {
        this.active = Display.isMobile;
        if (!this.active) return;

        const canvas = Display.canvas;
        canvas.addEventListener('touchstart', e => this.onTouch(e), { passive: false });
        canvas.addEventListener('touchmove', e => this.onTouch(e), { passive: false });
        canvas.addEventListener('touchend', e => this.onTouchEnd(e), { passive: false });
        canvas.addEventListener('touchcancel', e => this.onTouchEnd(e), { passive: false });
    },

    onTouch(e) {
        e.preventDefault();
        // Update all active touches
        for (const t of e.touches) {
            this.activeTouches[t.identifier] = {
                gx: Display.toGameX(t.pageX),
                gy: Display.toGameY(t.pageY)
            };
        }
        this.updateButtonStates();
    },

    onTouchEnd(e) {
        e.preventDefault();
        // Rebuild active touches from remaining touches
        const remaining = {};
        for (const t of e.touches) {
            remaining[t.identifier] = {
                gx: Display.toGameX(t.pageX),
                gy: Display.toGameY(t.pageY)
            };
        }
        // Detect ended touches — forward taps outside buttons to Screens
        for (const id in this.activeTouches) {
            if (!(id in remaining)) {
                const touch = this.activeTouches[id];
                if (!this.hitTestAny(touch.gx, touch.gy)) {
                    Screens.handleTap(touch.gx, touch.gy, Game.state);
                }
            }
        }
        this.activeTouches = remaining;
        this.updateButtonStates();
    },

    hitTestAny(gx, gy) {
        for (const key in this.buttons) {
            const b = this.buttons[key];
            if (gx >= b.x && gx <= b.x + b.w && gy >= b.y && gy <= b.y + b.h) {
                return true;
            }
        }
        return false;
    },

    updateButtonStates() {
        // Reset all
        const newPressed = {};
        for (const key in this.buttons) newPressed[key] = false;

        // Check each touch against each button
        for (const id in this.activeTouches) {
            const t = this.activeTouches[id];
            for (const key in this.buttons) {
                const b = this.buttons[key];
                if (t.gx >= b.x && t.gx <= b.x + b.w && t.gy >= b.y && t.gy <= b.y + b.h) {
                    newPressed[key] = true;
                }
            }
        }

        // Map to Input.keys
        Input.keys['ArrowLeft'] = newPressed.left;
        Input.keys['ArrowRight'] = newPressed.right;
        Input.keys['Space'] = newPressed.jump;

        // Ability — trigger only on press start
        if (newPressed.ability && !this.pressed.ability) {
            Input.keys['KeyE'] = true;
            Input._pendingRelease.push('KeyE');
        }

        // Pause — trigger only on press start
        if (newPressed.pause && !this.pressed.pause) {
            Input.keys['Escape'] = true;
            Input._pendingRelease.push('Escape');
        }

        this.pressed = newPressed;
    },

    _roundRect(ctx, x, y, w, h, r) {
        if (ctx.roundRect) {
            ctx.roundRect(x, y, w, h, r);
        } else {
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }
    },

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        for (const key in this.buttons) {
            const b = this.buttons[key];
            const isPressed = this.pressed[key];
            const r = 10;

            // Background
            ctx.fillStyle = isPressed ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.12)';
            ctx.beginPath();
            this._roundRect(ctx, b.x, b.y, b.w, b.h, r);
            ctx.fill();

            // Border
            ctx.strokeStyle = isPressed ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            this._roundRect(ctx, b.x, b.y, b.w, b.h, r);
            ctx.stroke();

            // Label
            ctx.fillStyle = isPressed ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)';
            ctx.font = key === 'pause' ? 'bold 14px monospace' : 'bold 22px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2);
        }
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.restore();
    }
};

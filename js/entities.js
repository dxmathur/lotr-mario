// entities.js — Player, Enemy, Projectile, Collectible, Particle classes

class Player {
    constructor(x, y, charConfig) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.w = charConfig.w;
        this.h = charConfig.h;
        this.char = charConfig;
        this.isPlayer = true;
        this.onGround = false;
        this.facing = 1; // 1 = right, -1 = left
        this.lives = 3;
        this.score = 0;
        this.rings = 0;
        this.hp = 3;
        this.maxHp = 3;
        this.dead = false;
        this.deathTimer = 0;
        this.invincible = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.jumpHeld = false;
        this.jumpCutoff = false;

        // Ability
        this.abilityCooldown = 0;
        this.abilityActive = 0;
        this.abilityState = null;
    }

    update(dt, level) {
        if (this.dead) {
            this.deathTimer -= dt;
            this.vy += GRAVITY * 0.5 * dt;
            this.y += this.vy * dt;
            return;
        }

        // Invincibility frames
        if (this.invincible > 0) this.invincible -= dt;

        // Ability cooldown
        if (this.abilityCooldown > 0) this.abilityCooldown -= dt;
        if (this.abilityActive > 0) this.abilityActive -= dt;

        // Horizontal movement
        const speed = this.char.speed;
        if (Input.left()) {
            this.vx -= speed * 0.5 * dt;
            if (this.vx < -speed) this.vx = -speed;
            this.facing = -1;
        } else if (Input.right()) {
            this.vx += speed * 0.5 * dt;
            if (this.vx > speed) this.vx = speed;
            this.facing = 1;
        } else {
            this.vx *= Math.pow(FRICTION, dt);
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }

        // Coyote time
        if (this.onGround) {
            this.coyoteTimer = COYOTE_FRAMES;
        } else {
            if (this.coyoteTimer > 0) this.coyoteTimer -= dt;
        }

        // Jump buffering
        if (Input.jumpPressed()) {
            this.jumpBufferTimer = JUMP_BUFFER_FRAMES;
        }
        if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;

        // Variable height jump
        if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
            this.vy = this.char.jumpForce;
            this.jumpBufferTimer = 0;
            this.coyoteTimer = 0;
            this.jumpHeld = true;
            this.jumpCutoff = false;
        }

        // Jump cut (variable height)
        if (this.jumpHeld && !Input.jump() && this.vy < this.char.jumpForce * 0.4) {
            this.vy *= 0.5;
            this.jumpHeld = false;
            this.jumpCutoff = true;
        }
        if (this.onGround) {
            this.jumpHeld = false;
            this.jumpCutoff = false;
        }

        // Physics
        Physics.applyGravity(this, dt);
        Physics.moveX(this, level, dt);
        Physics.moveY(this, level, dt);

        // Fall death
        if (this.y > level.height * TILE + 64) {
            this.die();
        }

        // Left bound
        if (this.x < 0) this.x = 0;

        // Animation
        this.animTimer += dt;
        if (this.animTimer > 8) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 3;
        }
    }

    getFrame() {
        if (this.dead) return 3;
        if (!this.onGround) return 3; // jump frame
        if (Math.abs(this.vx) > 0.3) return this.animFrame; // walk
        return 0; // idle
    }

    useAbility(game) {
        if (this.abilityCooldown > 0 || this.dead) return false;
        const char = this.char;
        this.abilityCooldown = char.abilityCooldown;

        switch (char.id) {
            case 'frodo':
                // Ring of Power — invisibility/invincibility
                this.abilityActive = char.abilityDuration;
                this.invincible = char.abilityDuration;
                return true;

            case 'aragorn':
                // Sword Dash — horizontal charge
                this.abilityActive = char.abilityDuration;
                this.vx = this.facing * 12;
                this.invincible = char.abilityDuration;
                this.abilityState = { type: 'dash' };
                return true;

            case 'gandalf':
                // Fireball — bouncing projectile
                game.spawnProjectile(
                    this.x + (this.facing > 0 ? this.w : -8),
                    this.y + this.h / 2 - 8,
                    this.facing * 6, -3,
                    'fireball', this
                );
                return true;

            case 'legolas':
                // Arrow Shot — fast ranged
                game.spawnProjectile(
                    this.x + (this.facing > 0 ? this.w : -8),
                    this.y + this.h / 2 - 4,
                    this.facing * 10, 0,
                    'arrow', this
                );
                return true;

            case 'gimli':
                // Ground Pound — downward slam
                if (!this.onGround) {
                    this.vy = 15;
                    this.abilityState = { type: 'groundpound', active: true };
                    return true;
                }
                return false;

            case 'sauron':
                // Dark Blast — wide AOE
                game.spawnProjectile(
                    this.x + (this.facing > 0 ? this.w : -16),
                    this.y + this.h / 2 - 12,
                    this.facing * 5, 0,
                    'darkblast', this
                );
                return true;

            case 'saruman':
                // Staff Beam — piercing projectile
                game.spawnProjectile(
                    this.x + (this.facing > 0 ? this.w : -8),
                    this.y + this.h / 2 - 4,
                    this.facing * 8, 0,
                    'beam', this
                );
                return true;

            case 'gollum':
                // Stealth Leap — fast dash + brief invincibility
                this.abilityActive = char.abilityDuration;
                this.invincible = char.abilityDuration;
                this.vx = this.facing * 10;
                this.vy = -6;
                return true;
        }
        return false;
    }

    takeDamage() {
        if (this.invincible > 0 || this.dead) return;
        this.hp--;
        this.invincible = 60;
        Camera.shake(5, 10);
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        if (this.dead) return;
        this.dead = true;
        this.deathTimer = 90;
        this.vy = -8;
        this.vx = 0;
        this.lives--;
    }

    respawn(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.dead = false;
        this.hp = this.maxHp;
        this.invincible = 60;
        this.deathTimer = 0;
        this.abilityCooldown = 0;
        this.abilityActive = 0;
    }

    stomp() {
        this.vy = -8;
        this.score += 100;
    }
}


class Enemy {
    constructor(x, y, type, isBoss) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.isBoss = isBoss || false;
        this.vx = 0;
        this.vy = 0;
        this.dead = false;
        this.deadTimer = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        this.facing = -1;
        this.activated = false;
        this.shootTimer = 0;
        this.sinOffset = Math.random() * Math.PI * 2;
        this.startY = y;
        this.time = 0;

        // Type-specific setup
        switch (type) {
            case 'walker':
                this.w = 24;
                this.h = 24;
                this.hp = 1;
                this.vx = -1;
                this.speed = 1;
                this.damage = 1;
                break;
            case 'flyer':
                this.w = 24;
                this.h = 20;
                this.hp = 1;
                this.vx = -1;
                this.speed = 1;
                this.damage = 1;
                break;
            case 'heavy':
                this.w = isBoss ? 40 : 32;
                this.h = isBoss ? 40 : 32;
                this.hp = isBoss ? 6 : 3;
                this.vx = -0.5;
                this.speed = 0.5;
                this.damage = 2;
                break;
            case 'shooter':
                this.w = 24;
                this.h = 24;
                this.hp = 2;
                this.vx = 0;
                this.speed = 0;
                this.damage = 1;
                this.shootTimer = 90;
                break;
            case 'chaser':
                this.w = 28;
                this.h = 28;
                this.hp = 2;
                this.vx = 0;
                this.speed = 3;
                this.damage = 2;
                break;
        }
    }

    update(dt, level, player, game) {
        if (this.dead) {
            this.deadTimer -= dt;
            this.vy += GRAVITY * dt;
            this.y += this.vy * dt;
            return this.deadTimer <= 0;
        }

        // Check if on screen (activate range)
        const dist = Math.abs(player.x - this.x);
        if (dist > 800 && this.type !== 'chaser') return false;

        this.animTimer += dt;
        if (this.animTimer > 10) {
            this.animTimer = 0;
            this.animFrame++;
        }

        switch (this.type) {
            case 'walker':
                this.vx = this.speed * this.facing;
                Physics.applyGravity(this, dt);
                Physics.moveX(this, level, dt);
                Physics.moveY(this, level, dt);
                // Turn at edges
                if (this.onGround) {
                    const checkX = this.facing > 0 ? this.x + this.w + 2 : this.x - 2;
                    const belowTile = level.getTile(Math.floor(checkX / TILE), Math.floor((this.y + this.h + 2) / TILE));
                    if (belowTile === 0) this.facing *= -1;
                }
                // Turn at walls
                const wallTile = level.getTile(
                    Math.floor((this.facing > 0 ? this.x + this.w + 1 : this.x - 1) / TILE),
                    Math.floor((this.y + this.h / 2) / TILE)
                );
                if (wallTile > 0 && wallTile !== 4) this.facing *= -1;
                break;

            case 'flyer':
                this.vx = this.speed * this.facing;
                this.x += this.vx * dt;
                this.y = this.startY + Math.sin((this.animTimer * 0.3 + this.sinOffset)) * 30;
                // Turn at walls
                const fwallTile = level.getTile(
                    Math.floor((this.facing > 0 ? this.x + this.w + 1 : this.x - 1) / TILE),
                    Math.floor((this.y + this.h / 2) / TILE)
                );
                if (fwallTile > 0 && fwallTile !== 4) this.facing *= -1;
                break;

            case 'heavy':
                this.vx = this.speed * this.facing;
                Physics.applyGravity(this, dt);
                Physics.moveX(this, level, dt);
                Physics.moveY(this, level, dt);
                const hwallTile = level.getTile(
                    Math.floor((this.facing > 0 ? this.x + this.w + 1 : this.x - 1) / TILE),
                    Math.floor((this.y + this.h / 2) / TILE)
                );
                if (hwallTile > 0 && hwallTile !== 4) this.facing *= -1;
                break;

            case 'shooter':
                Physics.applyGravity(this, dt);
                Physics.moveY(this, level, dt);
                this.facing = player.x > this.x ? 1 : -1;
                this.shootTimer -= dt;
                if (this.shootTimer <= 0 && dist < 400) {
                    this.shootTimer = 120;
                    if (game) {
                        game.spawnProjectile(
                            this.x + (this.facing > 0 ? this.w : -8),
                            this.y + this.h / 2 - 4,
                            this.facing * 4, 0,
                            'enemyshot', this
                        );
                    }
                }
                break;

            case 'chaser':
                if (!this.activated && dist < 250) {
                    this.activated = true;
                }
                if (this.activated) {
                    this.facing = player.x > this.x ? 1 : -1;
                    this.vx = this.speed * this.facing;
                    Physics.applyGravity(this, dt);
                    Physics.moveX(this, level, dt);
                    Physics.moveY(this, level, dt);
                    // Jump toward player
                    if (this.onGround && player.y < this.y - 32) {
                        this.vy = -10;
                    }
                } else {
                    Physics.applyGravity(this, dt);
                    Physics.moveY(this, level, dt);
                }
                break;
        }

        // Fall death
        if (this.y > level.height * TILE + 64) return true;

        return false;
    }

    hit(damage) {
        this.hp -= damage || 1;
        if (this.hp <= 0) {
            this.dead = true;
            this.deadTimer = 30;
            this.vy = -5;
            return true;
        }
        return false;
    }
}


class Projectile {
    constructor(x, y, vx, vy, type, owner) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type;
        this.owner = owner;
        this.life = 180;
        this.w = type === 'darkblast' ? 24 : 12;
        this.h = type === 'darkblast' ? 24 : 8;
        this.piercing = type === 'beam';
        this.bouncing = type === 'fireball';
        this.isEnemy = type === 'enemyshot';
    }

    update(dt, level) {
        this.life -= dt;
        if (this.life <= 0) return true;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.bouncing) {
            this.vy += GRAVITY * 0.3 * dt;
            // Bounce off ground
            const tileBelow = level.getTile(
                Math.floor((this.x + this.w / 2) / TILE),
                Math.floor((this.y + this.h) / TILE)
            );
            if (tileBelow > 0 && tileBelow !== 4) {
                this.vy = -Math.abs(this.vy) * 0.8;
                if (Math.abs(this.vy) < 1) this.vy = -3;
            }
        }

        // Hit wall
        const wallTile = level.getTile(
            Math.floor((this.x + this.w / 2) / TILE),
            Math.floor((this.y + this.h / 2) / TILE)
        );
        if (wallTile > 0 && wallTile !== 4 && wallTile !== 5 && !this.piercing) {
            return true;
        }

        // Off screen
        if (this.x < Camera.x - 100 || this.x > Camera.x + 900) return true;

        return false;
    }
}


class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'ring', 'heart'
        this.w = type === 'heart' ? 16 : 20;
        this.h = type === 'heart' ? 16 : 20;
        this.collected = false;
        this.bobTimer = Math.random() * Math.PI * 2;
        this.baseY = y;
    }

    update(dt) {
        if (this.collected) return;
        this.bobTimer += dt * 0.1;
        this.y = this.baseY + Math.sin(this.bobTimer) * 3;
    }

    collect(player) {
        if (this.collected) return;
        this.collected = true;
        if (this.type === 'ring') {
            player.rings++;
            player.score += 10;
        } else if (this.type === 'heart') {
            player.hp = Math.min(player.hp + 1, player.maxHp);
        }
    }
}


class Particle {
    constructor(x, y, vx, vy, color, life, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = size || 3;
    }

    update(dt) {
        this.life -= dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 0.05 * dt;
        return this.life <= 0;
    }

    draw(ctx, camX, camY) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(
            Math.round(this.x - camX),
            Math.round(this.y - camY),
            this.size, this.size
        );
        ctx.globalAlpha = 1;
    }
}

// main.js — Game loop, state machine, collision orchestration

const Game = {
    canvas: null,
    ctx: null,
    state: 'title', // title, select, intro, playing, paused, levelcomplete, gameover
    lastTime: 0,

    // Game state
    currentChar: null,
    currentCharId: null,
    currentLevel: null,
    currentLevelIdx: 0,
    player: null,
    enemies: [],
    projectiles: [],
    collectibles: [],
    particles: [],
    ambientParticles: [],
    completedLevels: {},

    // Load save
    loadSave() {
        try {
            const save = localStorage.getItem('lotr-mario-save');
            if (save) {
                this.completedLevels = JSON.parse(save);
            }
        } catch (e) { /* ignore */ }
    },

    saveSave() {
        try {
            localStorage.setItem('lotr-mario-save', JSON.stringify(this.completedLevels));
        } catch (e) { /* ignore */ }
    },

    init() {
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');
        Renderer.init(this.canvas);
        Display.init(this.canvas);
        Input.init();
        TouchControls.init();
        initSprites();
        this.loadSave();
        this.lastTime = performance.now();
        requestAnimationFrame(t => this.loop(t));
    },

    loop(timestamp) {
        const rawDt = (timestamp - this.lastTime) / 16.667; // Normalize to ~60fps
        const dt = Math.min(rawDt, 3); // Cap delta time
        this.lastTime = timestamp;

        Input.update();
        this.update(dt);
        this.render();

        requestAnimationFrame(t => this.loop(t));
    },

    update(dt) {
        switch (this.state) {
            case 'title':
                if (Input.enter()) {
                    this.state = 'select';
                    Screens.selectIndex = 0;
                    Screens.selectRow = 0;
                    Screens.selectCol = 0;
                }
                break;

            case 'select':
                Screens.updateCharacterSelect();
                if (Input.wasPressed('Enter')) {
                    this.currentCharId = Screens.getSelectedCharacter();
                    this.currentChar = CHARACTERS[this.currentCharId];
                    this.currentLevelIdx = this.getNextUncompletedLevel(this.currentCharId);
                    this.state = 'intro';
                }
                if (Input.wasPressed('Escape')) {
                    this.state = 'title';
                }
                break;

            case 'intro':
                if (Input.enter()) {
                    this.startLevel();
                    this.state = 'playing';
                }
                if (Input.wasPressed('Escape')) {
                    this.state = 'select';
                }
                break;

            case 'playing':
                this.updatePlaying(dt);
                break;

            case 'paused':
                if (Input.pause()) {
                    this.state = 'playing';
                }
                if (Input.wasPressed('KeyQ')) {
                    this.state = 'select';
                }
                break;

            case 'levelcomplete':
                if (Input.enter() && Screens.levelCompleteTimer > 60) {
                    // Mark level complete
                    if (!this.completedLevels[this.currentCharId]) {
                        this.completedLevels[this.currentCharId] = {};
                    }
                    this.completedLevels[this.currentCharId][this.currentLevelIdx] = true;
                    this.saveSave();

                    // Next level or back to select
                    if (this.currentLevelIdx < 2) {
                        this.currentLevelIdx++;
                        this.state = 'intro';
                    } else {
                        this.state = 'select';
                    }
                }
                break;

            case 'gameover':
                if (Input.enter() && Screens.gameOverTimer > 90) {
                    this.state = 'select';
                }
                break;
        }
    },

    getNextUncompletedLevel(charId) {
        const completed = this.completedLevels[charId] || {};
        for (let i = 0; i < 3; i++) {
            if (!completed[i]) return i;
        }
        return 0; // All completed, replay from beginning
    },

    startLevel() {
        const level = createLevel(this.currentCharId, this.currentLevelIdx);
        this.currentLevel = level;
        this.player = new Player(
            level.playerStart.x,
            level.playerStart.y,
            this.currentChar
        );
        this.enemies = [];
        this.projectiles = [];
        this.collectibles = [];
        this.particles = [];
        this.ambientParticles = [];

        // Spawn enemies
        for (const e of level.enemies) {
            this.enemies.push(new Enemy(e.x, e.y, e.type, e.isBoss));
        }

        // Scan for ring tiles and create collectibles
        for (let y = 0; y < level.height; y++) {
            for (let x = 0; x < level.width; x++) {
                if (level.tiles[y][x] === 4) {
                    this.collectibles.push(new Collectible(
                        x * TILE + 6, y * TILE + 6, 'ring'
                    ));
                    level.tiles[y][x] = 0; // Remove from tilemap
                }
            }
        }

        // Add heart pickups
        const heartCount = 3 + this.currentLevelIdx;
        for (let i = 0; i < heartCount; i++) {
            const hx = (3 + Math.floor(Math.random() * (level.width - 6))) * TILE;
            this.collectibles.push(new Collectible(hx, 10 * TILE, 'heart'));
        }

        Camera.reset();
        Screens.resetTimers();

        // Initialize ambient particles
        this.initAmbientParticles();
    },

    initAmbientParticles() {
        const theme = this.currentChar.themes[this.currentLevelIdx];
        if (theme.particles === 'none') return;

        for (let i = 0; i < 30; i++) {
            this.ambientParticles.push(new Particle(
                Math.random() * this.currentLevel.pixelWidth(),
                Math.random() * this.canvas.height,
                (Math.random() - 0.5) * 0.3,
                theme.particles === 'ash' ? 0.2 + Math.random() * 0.3 :
                theme.particles === 'leaves' ? 0.1 + Math.random() * 0.2 :
                (Math.random() - 0.5) * 0.1,
                theme.particleColor,
                999999, // Long-lived
                theme.particles === 'leaves' ? 4 : 2
            ));
        }
    },

    updatePlaying(dt) {
        if (Input.pause()) {
            this.state = 'paused';
            return;
        }

        const level = this.currentLevel;
        const player = this.player;
        const theme = this.currentChar.themes[this.currentLevelIdx];

        // Ability
        if (Input.ability()) {
            player.useAbility(this);
        }

        // Ground pound landing check (Gimli)
        if (player.abilityState && player.abilityState.type === 'groundpound' &&
            player.abilityState.active && player.onGround) {
            player.abilityState.active = false;
            Camera.shake(10, 18);
            // Seismic shockwave damage — wider range
            for (const e of this.enemies) {
                if (!e.dead && Math.abs(e.x - player.x) < 160 && Math.abs(e.y - player.y) < 60) {
                    e.hit(3);
                    player.score += 200;
                    this.spawnDeathParticles(e.x, e.y, '#ff8844');
                }
            }
            // Seismic particles
            for (let i = 0; i < 15; i++) {
                this.particles.push(new Particle(
                    player.x + player.w / 2 + (Math.random() - 0.5) * 100,
                    player.y + player.h,
                    (Math.random() - 0.5) * 5,
                    -Math.random() * 4,
                    '#cc6622',
                    20 + Math.random() * 20,
                    5
                ));
            }
        }

        // Aragorn Flame Charge — dash + fire trail particles
        if (player.abilityActive > 0 && player.abilityState && player.abilityState.type === 'flamedash') {
            player.abilityState.timer += dt;
            // Damage enemies on contact
            for (const e of this.enemies) {
                if (!e.dead && Physics.aabb(player, e)) {
                    e.hit(3);
                    player.score += 200;
                    this.spawnDeathParticles(e.x, e.y, '#ff6600');
                }
            }
            // Fire trail particles
            if (player.abilityState.timer % 2 < 1) {
                this.particles.push(new Particle(
                    player.x + player.w / 2 + (Math.random() - 0.5) * 10,
                    player.y + player.h - 4,
                    (Math.random() - 0.5) * 2,
                    -Math.random() * 2,
                    Math.random() > 0.5 ? '#ff4400' : '#ffaa00',
                    15 + Math.random() * 15,
                    4
                ));
            }
        }

        // Frodo Sting — auto-attack nearby enemies while invisible
        if (player.abilityActive > 0 && player.abilityState && player.abilityState.type === 'sting') {
            for (const e of this.enemies) {
                if (!e.dead && Math.abs(e.x - player.x) < 80 && Math.abs(e.y - player.y) < 60) {
                    // Sting auto-hit every 20 frames
                    if (Math.floor(player.abilityActive) % 20 === 0) {
                        e.hit(1);
                        player.score += 100;
                        // Blue Sting slash effect
                        this.particles.push(new Particle(
                            e.x + e.w / 2, e.y + e.h / 2,
                            (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3,
                            '#4488ff', 10, 5
                        ));
                        if (e.hp <= 0) {
                            this.spawnDeathParticles(e.x, e.y, '#4488ff');
                        }
                    }
                }
            }
        }

        // Gollum Frenzy — contact damage while berserk
        if (player.abilityActive > 0 && player.abilityState && player.abilityState.type === 'frenzy') {
            // Speed boost during frenzy
            if (Input.left()) player.vx = -player.char.speed * 1.6;
            if (Input.right()) player.vx = player.char.speed * 1.6;
            // Contact damage
            for (const e of this.enemies) {
                if (!e.dead && Physics.aabb(player, e)) {
                    e.hit(2);
                    player.score += 150;
                    this.spawnDeathParticles(e.x, e.y, '#ffff00');
                }
            }
            // Frenzy particles
            if (Math.random() > 0.5) {
                this.particles.push(new Particle(
                    player.x + Math.random() * player.w,
                    player.y + Math.random() * player.h,
                    (Math.random() - 0.5) * 2, -Math.random() * 2,
                    '#ffff00', 8, 3
                ));
            }
        }

        // Update player
        player.update(dt, level);

        // Player death handling
        if (player.dead && player.deathTimer <= 0) {
            if (player.lives > 0) {
                player.respawn(level.playerStart.x, level.playerStart.y);
                Camera.reset();
            } else {
                this.state = 'gameover';
                Screens.resetTimers();
                return;
            }
        }

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const remove = this.enemies[i].update(dt, level, player, this);
            if (remove) {
                this.enemies.splice(i, 1);
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const remove = this.projectiles[i].update(dt, level);
            if (remove) {
                this.projectiles.splice(i, 1);
                continue;
            }

            const proj = this.projectiles[i];

            // Player projectile hitting enemies
            if (!proj.isEnemy) {
                for (const e of this.enemies) {
                    if (!e.dead && Physics.aabb(proj, e)) {
                        const killed = e.hit(proj.damage || 1);
                        if (killed) {
                            player.score += e.isBoss ? 500 : 150;
                            this.spawnDeathParticles(e.x, e.y, theme.particleColor);
                        } else if (proj.freezeDuration > 0 && !e.frozen) {
                            // Mind blast freezes enemies
                            e.frozen = proj.freezeDuration;
                            e.frozenVx = e.vx;
                            e.vx = 0;
                        }
                        if (!proj.piercing) {
                            this.projectiles.splice(i, 1);
                            break;
                        }
                    }
                }
            }

            // Enemy projectile hitting player
            if (proj.isEnemy && !player.dead) {
                if (Physics.aabb(proj, player)) {
                    player.takeDamage();
                    this.projectiles.splice(i, 1);
                }
            }
        }

        // Update collectibles
        for (const item of this.collectibles) {
            item.update(dt);
            if (!item.collected && !player.dead && Physics.aabb(player, item)) {
                item.collect(player);
                this.spawnCollectParticles(item.x, item.y, item.type === 'ring' ? '#FFD700' : '#ff3366');
            }
        }

        // Player-Enemy collision
        if (!player.dead) {
            for (const e of this.enemies) {
                if (e.dead) continue;
                if (Physics.aabb(player, e)) {
                    if (Physics.stompCheck(player, e)) {
                        // Stomp
                        const killed = e.hit(1);
                        player.stomp();
                        Camera.shake(3, 5);
                        if (killed) {
                            this.spawnDeathParticles(e.x, e.y, theme.particleColor);
                        }
                    } else {
                        // Take damage
                        player.takeDamage();
                    }
                }
            }
        }

        // Hazard collision (spikes, lava)
        if (!player.dead) {
            const tiles = Physics.getOverlappingTiles(player, level);
            for (const t of tiles) {
                if (t.type === 6 || t.type === 7) { // Spike or lava
                    player.takeDamage();
                    if (t.type === 7) {
                        player.vy = -8; // Bounce out of lava
                    }
                }
            }
        }

        // Flag collision (level end)
        if (!player.dead) {
            const tiles = Physics.getOverlappingTiles(player, level);
            for (const t of tiles) {
                if (t.type === 8) {
                    this.state = 'levelcomplete';
                    Screens.resetTimers();
                    return;
                }
            }
        }

        // Camera
        Camera.follow(player, level.pixelWidth());
        Camera.update(dt);

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (this.particles[i].update(dt)) {
                this.particles.splice(i, 1);
            }
        }

        // Update ambient particles
        for (const p of this.ambientParticles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            // Wrap around
            if (p.x < Camera.x - 50) p.x = Camera.x + this.canvas.width + 50;
            if (p.x > Camera.x + this.canvas.width + 50) p.x = Camera.x - 50;
            if (p.y > this.canvas.height + 20) p.y = -20;
            if (p.y < -50) p.y = this.canvas.height + 20;
        }
    },

    spawnProjectile(x, y, vx, vy, type, owner) {
        this.projectiles.push(new Projectile(x, y, vx, vy, type, owner));
    },

    spawnDeathParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(
                x + Math.random() * 20,
                y + Math.random() * 20,
                (Math.random() - 0.5) * 4,
                -Math.random() * 4,
                color,
                20 + Math.random() * 20,
                3
            ));
        }
    },

    spawnCollectParticles(x, y, color) {
        for (let i = 0; i < 5; i++) {
            this.particles.push(new Particle(
                x + Math.random() * 10,
                y + Math.random() * 10,
                (Math.random() - 0.5) * 2,
                -Math.random() * 3 - 1,
                color,
                15 + Math.random() * 10,
                2
            ));
        }
    },

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Portrait mode — show rotate prompt
        if (Display.isMobile && Display.isPortrait()) {
            Renderer.clear();
            Screens.drawRotatePrompt(ctx, w, h);
            return;
        }

        Renderer.clear();

        switch (this.state) {
            case 'title':
                Screens.drawTitle(ctx, w, h);
                break;

            case 'select':
                Screens.drawCharacterSelect(ctx, w, h, this.completedLevels);
                break;

            case 'intro':
                Screens.drawLevelIntro(
                    ctx, w, h,
                    this.currentChar.name,
                    LEVEL_DEFS[this.currentCharId][this.currentLevelIdx].name,
                    this.currentLevelIdx,
                    this.currentChar
                );
                break;

            case 'playing':
            case 'paused':
            case 'levelcomplete':
                this.renderGame();
                if (this.state === 'playing') {
                    TouchControls.draw(ctx);
                }
                if (this.state === 'paused') {
                    Screens.drawPause(ctx, w, h);
                }
                if (this.state === 'levelcomplete') {
                    Screens.drawLevelComplete(
                        ctx, w, h,
                        this.player.score,
                        this.player.rings,
                        this.currentLevel.name
                    );
                }
                break;

            case 'gameover':
                this.renderGame();
                Screens.drawGameOver(ctx, w, h, this.player ? this.player.score : 0);
                break;
        }
    },

    renderGame() {
        const camX = Camera.getX();
        const camY = Camera.getY();
        const theme = this.currentChar.themes[this.currentLevelIdx];

        // Background
        Renderer.drawBackground(theme, camX, camY);

        // Ambient particles (behind tiles)
        Renderer.drawAmbientParticles(theme, camX, camY, this.ambientParticles);

        // Tiles
        Renderer.drawTiles(this.currentLevel, theme, camX, camY);

        // Collectibles
        for (const item of this.collectibles) {
            Renderer.drawCollectible(item, camX, camY);
        }

        // Enemies
        for (const e of this.enemies) {
            Renderer.drawEnemy(e, camX, camY, theme);
        }

        // Player
        if (this.player) {
            Renderer.drawPlayer(this.player, camX, camY);
        }

        // Projectiles
        for (const p of this.projectiles) {
            Renderer.drawProjectile(p, camX, camY);
        }

        // Effect particles (in front)
        for (const p of this.particles) {
            p.draw(this.ctx, camX, camY);
        }

        // HUD
        if (this.player) {
            Screens.drawHUD(
                this.ctx,
                this.canvas.width,
                this.player,
                this.currentLevel.name,
                this.currentChar
            );
        }
    },
};

// Start the game
Game.init();

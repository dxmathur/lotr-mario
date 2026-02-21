// renderer.js — Background, tiles, sprites, effects, pixel font

const Renderer = {
    canvas: null,
    ctx: null,

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
    },

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    // ── Background ──
    drawBackground(theme, camX, camY) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, theme.sky[0]);
        grad.addColorStop(1, theme.sky[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Parallax background layers
        for (let li = 0; li < theme.bgLayers.length; li++) {
            const layer = theme.bgLayers[li];
            const parallax = 0.1 + li * 0.15;
            const offsetX = -camX * parallax;

            ctx.fillStyle = layer.color;

            if (layer.hills) {
                ctx.beginPath();
                ctx.moveTo(0, h);
                for (let x = -100; x <= w + 100; x += 5) {
                    const worldX = x - offsetX;
                    const hillH = Math.sin(worldX * 0.005) * 40 +
                                  Math.sin(worldX * 0.012 + li * 2) * 25 +
                                  Math.sin(worldX * 0.003 + li) * 60;
                    const yPos = h * layer.yStart + hillH;
                    if (x === -100) ctx.moveTo(x, yPos);
                    else ctx.lineTo(x, yPos);
                }
                ctx.lineTo(w + 100, h);
                ctx.lineTo(-100, h);
                ctx.closePath();
                ctx.fill();
            } else {
                // Flat cave ceiling/floor
                const yPos = h * layer.yStart;
                ctx.fillRect(0, yPos, w, h - yPos);
            }
        }
    },

    // ── Tiles ──
    drawTiles(level, theme, camX, camY) {
        const ctx = this.ctx;
        const startCol = Math.floor(camX / TILE) - 1;
        const endCol = Math.ceil((camX + this.canvas.width) / TILE) + 1;
        const startRow = Math.floor(camY / TILE) - 1;
        const endRow = Math.ceil((camY + this.canvas.height) / TILE) + 1;

        for (let y = startRow; y <= endRow; y++) {
            for (let x = startCol; x <= endCol; x++) {
                const tile = level.getTile(x, y);
                if (tile === 0) continue;

                const sx = Math.round(x * TILE - camX);
                const sy = Math.round(y * TILE - camY);

                switch (tile) {
                    case 1: // Ground
                        ctx.fillStyle = theme.ground;
                        ctx.fillRect(sx, sy, TILE, TILE);
                        // Top edge highlight
                        if (level.getTile(x, y - 1) === 0) {
                            ctx.fillStyle = theme.groundDark;
                            ctx.fillRect(sx, sy, TILE, 4);
                            // Grass dots
                            ctx.fillStyle = theme.ground;
                            for (let i = 0; i < 3; i++) {
                                const gx = sx + 4 + i * 10 + ((x * 7 + i * 3) % 5);
                                ctx.fillRect(gx, sy - 2, 2, 4);
                            }
                        }
                        // Grid lines
                        ctx.fillStyle = theme.groundDark;
                        ctx.fillRect(sx, sy + TILE - 1, TILE, 1);
                        ctx.fillRect(sx + TILE - 1, sy, 1, TILE);
                        break;

                    case 2: // Brick
                        ctx.fillStyle = theme.brick;
                        ctx.fillRect(sx, sy, TILE, TILE);
                        ctx.fillStyle = theme.brickDark;
                        // Brick pattern
                        ctx.fillRect(sx, sy + 7, TILE, 2);
                        ctx.fillRect(sx, sy + 22, TILE, 2);
                        ctx.fillRect(sx + 15, sy, 2, 9);
                        ctx.fillRect(sx + 7, sy + 9, 2, 15);
                        ctx.fillRect(sx + 23, sy + 9, 2, 15);
                        ctx.fillRect(sx + 15, sy + 24, 2, 8);
                        break;

                    case 3: // Stone
                        ctx.fillStyle = theme.stone;
                        ctx.fillRect(sx, sy, TILE, TILE);
                        ctx.fillStyle = theme.stoneDark;
                        ctx.fillRect(sx, sy, TILE, 1);
                        ctx.fillRect(sx, sy, 1, TILE);
                        ctx.fillRect(sx + TILE - 1, sy, 1, TILE);
                        ctx.fillRect(sx, sy + TILE - 1, TILE, 1);
                        // Stone crack detail
                        ctx.fillRect(sx + 8, sy + 5, 6, 1);
                        ctx.fillRect(sx + 14, sy + 5, 1, 8);
                        ctx.fillRect(sx + 10, sy + 18, 12, 1);
                        break;

                    case 4: // Coin/Ring
                        // Draw ring collectible in-tile
                        const ringSprite = getItemSprite('ring');
                        if (ringSprite) {
                            const bob = Math.sin(Date.now() * 0.005 + x * 0.5) * 2;
                            ctx.drawImage(ringSprite, sx + 2, sy + 2 + bob, 28, 28);
                        } else {
                            ctx.fillStyle = '#FFD700';
                            ctx.beginPath();
                            ctx.arc(sx + TILE / 2, sy + TILE / 2, 8, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        break;

                    case 5: // Platform
                        ctx.fillStyle = theme.platform;
                        ctx.fillRect(sx, sy, TILE, 8);
                        ctx.fillStyle = theme.stoneDark;
                        ctx.fillRect(sx, sy + 8, TILE, 2);
                        break;

                    case 6: // Spike
                        ctx.fillStyle = theme.spike;
                        for (let i = 0; i < 4; i++) {
                            const spX = sx + i * 8;
                            ctx.beginPath();
                            ctx.moveTo(spX, sy + TILE);
                            ctx.lineTo(spX + 4, sy + TILE - 12);
                            ctx.lineTo(spX + 8, sy + TILE);
                            ctx.closePath();
                            ctx.fill();
                        }
                        break;

                    case 7: // Lava
                        ctx.fillStyle = theme.lava;
                        ctx.fillRect(sx, sy, TILE, TILE);
                        // Animated lava surface
                        ctx.fillStyle = '#ff8800';
                        const lavaWave = Math.sin(Date.now() * 0.003 + x) * 3;
                        ctx.fillRect(sx, sy + lavaWave, TILE, 4);
                        ctx.fillStyle = '#ffcc00';
                        ctx.fillRect(sx + 4, sy + 2 + lavaWave, TILE - 8, 2);
                        break;

                    case 8: // Flag
                        // Flag pole
                        ctx.fillStyle = '#888';
                        ctx.fillRect(sx + 14, sy, 4, TILE);
                        // Flag
                        ctx.fillStyle = '#cc0000';
                        ctx.fillRect(sx + 18, sy, 12, 10);
                        ctx.fillStyle = '#FFD700';
                        ctx.fillRect(sx + 20, sy + 3, 8, 4);
                        break;

                    case 9: // Decoration
                        ctx.fillStyle = theme.ground + '44';
                        ctx.fillRect(sx, sy, TILE, TILE);
                        break;
                }
            }
        }
    },

    // ── Player ──
    drawPlayer(player, camX, camY) {
        const ctx = this.ctx;
        const px = Math.round(player.x - camX);
        const py = Math.round(player.y - camY);

        // Invisibility effect (Frodo's ring)
        if (player.abilityActive > 0 && player.char.id === 'frodo') {
            ctx.globalAlpha = 0.3;
        }

        // Invincibility flash
        if (player.invincible > 0 && Math.floor(player.invincible / 3) % 2 === 0 && player.char.id !== 'frodo') {
            ctx.globalAlpha = 0.5;
        }

        const frameIdx = player.getFrame();
        const sprite = getCharSprite(player.char.id, frameIdx);

        if (sprite) {
            ctx.save();
            if (player.facing < 0) {
                ctx.translate(px + player.w, py);
                ctx.scale(-1, 1);
                ctx.drawImage(sprite, 0, 0, player.w, player.h);
            } else {
                ctx.drawImage(sprite, px, py, player.w, player.h);
            }
            ctx.restore();
        } else {
            // Fallback rectangle
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(px, py, player.w, player.h);
        }

        // Ability visual effects
        if (player.abilityActive > 0) {
            switch (player.char.id) {
                case 'frodo':
                    // Ring glow
                    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(px - 2, py - 2, player.w + 4, player.h + 4);
                    break;
                case 'aragorn':
                    // Sword trail
                    ctx.fillStyle = 'rgba(200, 200, 255, 0.6)';
                    const trailX = player.facing > 0 ? px + player.w : px - 20;
                    ctx.fillRect(trailX, py + 4, 20, player.h - 8);
                    break;
                case 'gollum':
                    // Stealth blur
                    ctx.fillStyle = 'rgba(150, 150, 150, 0.3)';
                    ctx.fillRect(px - 4, py - 4, player.w + 8, player.h + 8);
                    break;
            }
        }

        ctx.globalAlpha = 1;
    },

    // ── Enemies ──
    drawEnemy(enemy, camX, camY, theme) {
        const ctx = this.ctx;
        const ex = Math.round(enemy.x - camX);
        const ey = Math.round(enemy.y - camY);

        if (enemy.dead) {
            ctx.globalAlpha = 0.5;
        }

        const frameIdx = enemy.animFrame % 2;
        const sprite = getEnemySprite(enemy.type, frameIdx);

        if (sprite) {
            ctx.save();
            if (enemy.facing > 0) {
                ctx.translate(ex + enemy.w, ey);
                ctx.scale(-1, 1);
                ctx.drawImage(sprite, 0, 0, enemy.w, enemy.h);
            } else {
                ctx.drawImage(sprite, ex, ey, enemy.w, enemy.h);
            }
            ctx.restore();
        } else {
            ctx.fillStyle = enemy.type === 'chaser' ? '#220022' : '#880000';
            ctx.fillRect(ex, ey, enemy.w, enemy.h);
        }

        // Boss HP bar
        if (enemy.isBoss && !enemy.dead) {
            const barW = enemy.w + 10;
            const barH = 4;
            const barX = ex + (enemy.w - barW) / 2;
            const barY = ey - 10;
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = '#cc0000';
            const maxHp = enemy.isBoss ? 6 : 3;
            ctx.fillRect(barX, barY, barW * (enemy.hp / maxHp), barH);
        }

        ctx.globalAlpha = 1;
    },

    // ── Projectiles ──
    drawProjectile(proj, camX, camY) {
        const ctx = this.ctx;
        const px = Math.round(proj.x - camX);
        const py = Math.round(proj.y - camY);

        switch (proj.type) {
            case 'fireball':
                ctx.fillStyle = '#ff4400';
                ctx.beginPath();
                ctx.arc(px + proj.w / 2, py + proj.h / 2, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffcc00';
                ctx.beginPath();
                ctx.arc(px + proj.w / 2, py + proj.h / 2, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'arrow':
                ctx.fillStyle = '#8B6914';
                ctx.fillRect(px, py + 2, proj.w, 3);
                // Arrowhead
                ctx.fillStyle = '#ccc';
                const tipX = proj.vx > 0 ? px + proj.w : px;
                ctx.beginPath();
                ctx.moveTo(tipX, py);
                ctx.lineTo(tipX + (proj.vx > 0 ? 6 : -6), py + 3);
                ctx.lineTo(tipX, py + 6);
                ctx.closePath();
                ctx.fill();
                break;

            case 'darkblast':
                ctx.fillStyle = 'rgba(100, 0, 0, 0.8)';
                ctx.beginPath();
                ctx.arc(px + proj.w / 2, py + proj.h / 2, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.beginPath();
                ctx.arc(px + proj.w / 2, py + proj.h / 2, 8, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'beam':
                ctx.fillStyle = 'rgba(200, 200, 255, 0.9)';
                ctx.fillRect(px, py, proj.w, proj.h);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.fillRect(px + 2, py + 2, proj.w - 4, proj.h - 4);
                break;

            case 'enemyshot':
                ctx.fillStyle = '#888';
                ctx.fillRect(px, py + 1, 8, 4);
                ctx.fillStyle = '#555';
                const etipX = proj.vx > 0 ? px + 8 : px - 4;
                ctx.beginPath();
                ctx.moveTo(etipX, py);
                ctx.lineTo(etipX + (proj.vx > 0 ? 4 : -4), py + 3);
                ctx.lineTo(etipX, py + 6);
                ctx.closePath();
                ctx.fill();
                break;
        }
    },

    // ── Collectibles ──
    drawCollectible(item, camX, camY) {
        if (item.collected) return;
        const ctx = this.ctx;
        const ix = Math.round(item.x - camX);
        const iy = Math.round(item.y - camY);

        if (item.type === 'ring') {
            const sprite = getItemSprite('ring');
            if (sprite) {
                ctx.drawImage(sprite, ix, iy, item.w, item.h);
            } else {
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(ix + item.w / 2, iy + item.h / 2, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (item.type === 'heart') {
            ctx.fillStyle = '#ff3366';
            // Simple heart shape
            ctx.beginPath();
            ctx.arc(ix + 4, iy + 4, 5, 0, Math.PI * 2);
            ctx.arc(ix + 12, iy + 4, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(ix, iy + 6);
            ctx.lineTo(ix + 8, iy + 16);
            ctx.lineTo(ix + 16, iy + 6);
            ctx.closePath();
            ctx.fill();
        }
    },

    // ── Ambient Particles ──
    drawAmbientParticles(theme, camX, camY, particles) {
        if (theme.particles === 'none') return;
        const ctx = this.ctx;

        for (const p of particles) {
            p.draw(ctx, camX, camY);
        }
    },

    // ── Pixel Font ──
    drawText(text, x, y, size, color, align) {
        const ctx = this.ctx;
        ctx.fillStyle = color || '#fff';
        ctx.font = `${size || 16}px monospace`;
        ctx.textAlign = align || 'left';
        ctx.textBaseline = 'top';

        // Shadow
        ctx.fillStyle = '#000';
        ctx.fillText(text, x + 1, y + 1);
        ctx.fillStyle = color || '#fff';
        ctx.fillText(text, x, y);
    },
};

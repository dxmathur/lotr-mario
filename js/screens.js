// screens.js — Title, character select, HUD, level complete, game over, pause

const Screens = {
    titleTimer: 0,
    selectIndex: 0,
    selectRow: 0,
    selectCol: 0,
    levelCompleteTimer: 0,
    gameOverTimer: 0,
    flashTimer: 0,

    // ── Title Screen ──
    drawTitle(ctx, w, h) {
        this.titleTimer++;

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0a0a2e');
        grad.addColorStop(0.5, '#1a0a0a');
        grad.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Stars
        for (let i = 0; i < 50; i++) {
            const sx = (i * 137 + this.titleTimer * 0.1) % w;
            const sy = (i * 97) % (h * 0.6);
            const blink = Math.sin(this.titleTimer * 0.05 + i) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${blink})`;
            ctx.fillRect(sx, sy, 2, 2);
        }

        // Mountain silhouette
        ctx.fillStyle = '#1a1a2a';
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 10) {
            const mh = Math.sin(x * 0.01) * 80 + Math.sin(x * 0.025) * 40 + 180;
            ctx.lineTo(x, h - mh);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

        // The One Ring (animated)
        const ringY = 120 + Math.sin(this.titleTimer * 0.03) * 8;
        const ringGlow = Math.sin(this.titleTimer * 0.05) * 0.3 + 0.7;

        ctx.save();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20 * ringGlow;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(w / 2, ringY, 30, 25, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Inscriptions on ring
        ctx.strokeStyle = `rgba(255, 100, 0, ${ringGlow * 0.6})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(w / 2, ringY, 25, 20, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.fillText('FELLOWSHIP OF THE PLUMBER', w / 2 + 2, 202);
        ctx.fillStyle = '#FFD700';
        ctx.fillText('FELLOWSHIP OF THE PLUMBER', w / 2, 200);

        // Subtitle
        ctx.font = '14px monospace';
        ctx.fillStyle = '#aaa';
        ctx.fillText('A Lord of the Rings x Mario Adventure', w / 2, 245);

        // Prompt
        const promptAlpha = Math.sin(this.titleTimer * 0.06) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${promptAlpha})`;
        ctx.font = '18px monospace';
        ctx.fillText(Display.isMobile ? 'Tap to start' : 'Press ENTER to start', w / 2, 350);

        // Controls hint
        ctx.fillStyle = '#666';
        ctx.font = '12px monospace';
        if (Display.isMobile) {
            ctx.fillText('Touch controls on screen', w / 2, 420);
        } else {
            ctx.fillText('Arrow Keys: Move  |  Space: Jump  |  E/Shift: Ability', w / 2, 420);
            ctx.fillText('P/Esc: Pause', w / 2, 440);
        }

        ctx.textAlign = 'left';
    },

    // ── Character Select ──
    drawCharacterSelect(ctx, w, h, completedLevels) {
        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0a0a1e');
        grad.addColorStop(1, '#1a0a0a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Choose Your Hero', w / 2, 30);

        // Character grid (2 rows x 4 cols)
        const cols = 4;
        const cardW = 160;
        const cardH = 140;
        const gapX = 20;
        const gapY = 15;
        const startX = (w - (cols * cardW + (cols - 1) * gapX)) / 2;
        const startY = 65;

        for (let i = 0; i < CHARACTER_ORDER.length; i++) {
            const charId = CHARACTER_ORDER[i];
            const char = CHARACTERS[charId];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = startX + col * (cardW + gapX);
            const cy = startY + row * (cardH + gapY);
            const selected = i === this.selectRow * cols + this.selectCol;

            // Card background
            ctx.fillStyle = selected ? '#2a2a4a' : '#1a1a2a';
            ctx.fillRect(cx, cy, cardW, cardH);

            // Selection border
            if (selected) {
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.strokeRect(cx, cy, cardW, cardH);
            } else {
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.strokeRect(cx, cy, cardW, cardH);
            }

            // Character portrait
            const sprite = getCharSprite(charId, 0);
            if (sprite) {
                ctx.drawImage(sprite, cx + 10, cy + 10, 40, 40);
            }

            // Name
            ctx.fillStyle = selected ? '#FFD700' : '#ccc';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(char.name, cx + 58, cy + 18);

            // Title
            ctx.fillStyle = '#888';
            ctx.font = '10px monospace';
            ctx.fillText(char.title, cx + 58, cy + 34);

            // Weapon
            ctx.fillStyle = char.weaponColor || '#6a8aaa';
            ctx.font = '10px monospace';
            ctx.fillText(char.weapon || char.abilityName, cx + 10, cy + 60);

            ctx.fillStyle = '#557';
            ctx.font = '9px monospace';
            ctx.fillText(char.abilityDesc, cx + 10, cy + 74);

            // Level names & completion
            const levels = LEVEL_DEFS[charId];
            for (let li = 0; li < 3; li++) {
                const completed = completedLevels &&
                    completedLevels[charId] && completedLevels[charId][li];
                ctx.fillStyle = completed ? '#44aa44' : '#555';
                ctx.font = '9px monospace';
                const lvlName = levels[li].name;
                const prefix = completed ? '\u2713 ' : (li + 1) + '. ';
                ctx.fillText(prefix + lvlName, cx + 10, cy + 92 + li * 14);
            }
        }

        // Instructions
        ctx.fillStyle = '#666';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(Display.isMobile ? 'Tap to select, tap again to play' : 'Arrow Keys to select  |  ENTER to play', w / 2, h - 25);
        ctx.textAlign = 'left';
    },

    updateCharacterSelect() {
        const cols = 4;
        const rows = 2;

        if (Input.wasPressed('ArrowRight')) {
            this.selectCol = (this.selectCol + 1) % cols;
        }
        if (Input.wasPressed('ArrowLeft')) {
            this.selectCol = (this.selectCol - 1 + cols) % cols;
        }
        if (Input.wasPressed('ArrowDown')) {
            this.selectRow = (this.selectRow + 1) % rows;
        }
        if (Input.wasPressed('ArrowUp')) {
            this.selectRow = (this.selectRow - 1 + rows) % rows;
        }

        this.selectIndex = this.selectRow * cols + this.selectCol;
        return this.selectIndex;
    },

    getSelectedCharacter() {
        return CHARACTER_ORDER[this.selectIndex];
    },

    // ── HUD ──
    drawHUD(ctx, w, player, levelName, charConfig) {
        // Background bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, w, 40);

        // Character name
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(charConfig.name, 10, 14);

        // Level name
        ctx.fillStyle = '#aaa';
        ctx.font = '12px monospace';
        ctx.fillText(levelName, 10, 28);

        // HP hearts
        for (let i = 0; i < player.maxHp; i++) {
            const hx = 160 + i * 18;
            if (i < player.hp) {
                ctx.fillStyle = '#ff3366';
            } else {
                ctx.fillStyle = '#333';
            }
            // Simple heart
            ctx.beginPath();
            ctx.arc(hx + 3, 12, 4, 0, Math.PI * 2);
            ctx.arc(hx + 10, 12, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(hx, 14);
            ctx.lineTo(hx + 7, 22);
            ctx.lineTo(hx + 14, 14);
            ctx.closePath();
            ctx.fill();
        }

        // Lives
        ctx.fillStyle = '#ccc';
        ctx.font = '14px monospace';
        ctx.fillText(`x${player.lives}`, 260, 14);

        // Rings
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`\u25CB ${player.rings}`, 310, 14);

        // Score
        ctx.fillStyle = '#fff';
        ctx.fillText(`Score: ${player.score}`, 400, 14);

        // Ability cooldown
        const cdMax = charConfig.abilityCooldown;
        const cdCurr = player.abilityCooldown;
        const cdPct = cdCurr > 0 ? 1 - cdCurr / cdMax : 1;
        const barW = 80;
        const barH = 8;
        const barX = w - barW - 10;
        const barY = 8;

        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = cdPct >= 1 ? '#44cc44' : '#4488cc';
        ctx.fillRect(barX, barY, barW * cdPct, barH);
        ctx.strokeStyle = '#555';
        ctx.strokeRect(barX, barY, barW, barH);

        ctx.fillStyle = cdPct >= 1 ? '#88ff88' : '#6688aa';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(charConfig.abilityName, w - 10, 24);

        // Weapon name
        ctx.fillStyle = charConfig.weaponColor || '#aaa';
        ctx.font = '10px monospace';
        ctx.fillText(charConfig.weapon || '', w - 10, 34);
        ctx.textAlign = 'left';
    },

    // ── Level Complete ──
    drawLevelComplete(ctx, w, h, score, rings, levelName) {
        this.levelCompleteTimer++;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 32px monospace';
        ctx.fillText('Level Complete!', w / 2, 140);

        ctx.fillStyle = '#ccc';
        ctx.font = '18px monospace';
        ctx.fillText(levelName, w / 2, 190);

        ctx.fillStyle = '#FFD700';
        ctx.font = '16px monospace';
        ctx.fillText(`Rings: ${rings}`, w / 2, 240);
        ctx.fillText(`Score: ${score}`, w / 2, 265);

        if (this.levelCompleteTimer > 60) {
            const alpha = Math.sin(this.levelCompleteTimer * 0.06) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.font = '16px monospace';
            ctx.fillText(Display.isMobile ? 'Tap to continue' : 'Press ENTER to continue', w / 2, 340);
        }

        ctx.textAlign = 'left';
    },

    // ── Game Over ──
    drawGameOver(ctx, w, h, score) {
        this.gameOverTimer++;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';

        ctx.fillStyle = '#cc0000';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('GAME OVER', w / 2, 180);

        ctx.fillStyle = '#888';
        ctx.font = '18px monospace';
        ctx.fillText(`Final Score: ${score}`, w / 2, 240);

        if (this.gameOverTimer > 90) {
            const alpha = Math.sin(this.gameOverTimer * 0.06) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.font = '16px monospace';
            ctx.fillText(Display.isMobile ? 'Tap to return to menu' : 'Press ENTER to return to menu', w / 2, 330);
        }

        ctx.textAlign = 'left';
    },

    // ── Pause ──
    drawPause(ctx, w, h) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px monospace';
        ctx.fillText('PAUSED', w / 2, 200);

        ctx.fillStyle = '#aaa';
        ctx.font = '14px monospace';
        if (Display.isMobile) {
            ctx.fillText('Tap top half to resume', w / 2, 260);
            ctx.fillText('Tap bottom half to quit', w / 2, 285);
        } else {
            ctx.fillText('Press P or ESC to resume', w / 2, 260);
            ctx.fillText('Press Q to quit to menu', w / 2, 285);
        }

        ctx.textAlign = 'left';
    },

    // ── Level Intro ──
    drawLevelIntro(ctx, w, h, charName, levelName, levelIdx, charConfig) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(charName, w / 2, 160);

        ctx.fillStyle = '#ccc';
        ctx.font = '24px monospace';
        ctx.fillText(`Level ${levelIdx + 1}: ${levelName}`, w / 2, 200);

        // Weapon info
        if (charConfig && charConfig.weapon) {
            ctx.fillStyle = charConfig.weaponColor || '#aaa';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(`Weapon: ${charConfig.weapon}`, w / 2, 245);
            ctx.fillStyle = '#888';
            ctx.font = '12px monospace';
            ctx.fillText(charConfig.weaponDesc || '', w / 2, 265);
            ctx.fillStyle = '#6a8aaa';
            ctx.font = '12px monospace';
            ctx.fillText(Display.isMobile ? `[A] ${charConfig.abilityName}` : `[E/Shift] ${charConfig.abilityName}`, w / 2, 285);
        }

        const alpha = Math.sin(Date.now() * 0.004) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = '14px monospace';
        ctx.fillText(Display.isMobile ? 'Tap to begin' : 'Press ENTER to begin', w / 2, 330);

        ctx.textAlign = 'left';
    },

    resetTimers() {
        this.levelCompleteTimer = 0;
        this.gameOverTimer = 0;
    },

    // ── Tap handling (mobile) ──
    handleTap(gx, gy, gameState) {
        switch (gameState) {
            case 'title':
            case 'intro':
                Input.simulatePress('Enter');
                break;
            case 'levelcomplete':
                if (this.levelCompleteTimer > 60) Input.simulatePress('Enter');
                break;
            case 'gameover':
                if (this.gameOverTimer > 90) Input.simulatePress('Enter');
                break;
            case 'select': {
                const cols = 4;
                const cardW = 160;
                const cardH = 140;
                const gapX = 20;
                const gapY = 15;
                const startX = (800 - (cols * cardW + (cols - 1) * gapX)) / 2;
                const startY = 65;
                for (let i = 0; i < CHARACTER_ORDER.length; i++) {
                    const col = i % cols;
                    const row = Math.floor(i / cols);
                    const cx = startX + col * (cardW + gapX);
                    const cy = startY + row * (cardH + gapY);
                    if (gx >= cx && gx <= cx + cardW && gy >= cy && gy <= cy + cardH) {
                        if (this.selectRow === row && this.selectCol === col) {
                            // Already selected — confirm
                            Input.simulatePress('Enter');
                        } else {
                            // Select this card
                            this.selectRow = row;
                            this.selectCol = col;
                            this.selectIndex = row * cols + col;
                        }
                        return;
                    }
                }
                break;
            }
            case 'playing':
                break;
            case 'paused':
                if (gy < 240) {
                    Input.simulatePress('Escape');
                } else {
                    Input.simulatePress('KeyQ');
                }
                break;
        }
    },

    // ── Rotate prompt (portrait) ──
    drawRotatePrompt(ctx, w, h) {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('Rotate Your Device', w / 2, h / 2 - 20);

        ctx.fillStyle = '#888';
        ctx.font = '14px monospace';
        ctx.fillText('Landscape mode recommended', w / 2, h / 2 + 20);
        ctx.textAlign = 'left';
    }
};

// levels.js — Chunk library + 24 level definitions
// Tile types: 0=air, 1=ground, 2=brick, 3=stone, 4=coin, 5=platform, 6=spike, 7=lava, 8=flag, 9=decoration

// Each chunk is 10 tiles wide, 15 tiles tall
// Chunks are arrays of strings, each char maps to a tile type

const CHUNK_MAP = {
    '.': 0, '#': 1, 'B': 2, 'S': 3, 'C': 4, 'P': 5, 'X': 6, 'L': 7, 'F': 8, 'D': 9
};

function parseChunk(lines) {
    const rows = [];
    for (const line of lines) {
        const row = [];
        for (const ch of line) {
            row.push(CHUNK_MAP[ch] || 0);
        }
        while (row.length < 10) row.push(0);
        rows.push(row);
    }
    while (rows.length < 15) rows.unshift(new Array(10).fill(0));
    return rows;
}

// ── Chunk Library ──
const CHUNKS = {
    // Start chunks
    start: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '##########',
        '##########',
    ]),

    flat: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '##########',
        '##########',
    ]),

    coins_low: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..CCCCCC..',
        '..........',
        '..........',
        '##########',
        '##########',
    ]),

    pipe_small: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '......SS..',
        '......SS..',
        '##########',
        '##########',
    ]),

    gap_small: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '####..####',
        '####..####',
    ]),

    gap_medium: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '###....###',
        '###....###',
    ]),

    gap_large: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '##......##',
        '##......##',
    ]),

    stairs_up: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '.........S',
        '........SS',
        '.......SSS',
        '......SSSS',
        '##########',
        '##########',
    ]),

    stairs_down: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        'S.........',
        'SS........',
        'SSS.......',
        'SSSS......',
        '##########',
        '##########',
    ]),

    platform_steps: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '....PPPP..',
        '..........',
        '..PPPP....',
        '..........',
        '....PPPP..',
        '..........',
        '##########',
        '##########',
    ]),

    bricks_high: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..BBBBBB..',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '##########',
        '##########',
    ]),

    bricks_mid: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..BBCBB...',
        '..........',
        '..........',
        '..........',
        '##########',
        '##########',
    ]),

    bricks_mixed: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '...BSCB...',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '##########',
        '##########',
    ]),

    valley: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        'SS......SS',
        'SS......SS',
        'SS......SS',
        '##########',
        '##########',
    ]),

    pillars: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..S....S..',
        '..S....S..',
        '..S....S..',
        '..S....S..',
        '..S....S..',
        '..S....S..',
        '##########',
        '##########',
    ]),

    coins_high: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..CCCCCC..',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '##########',
        '##########',
    ]),

    floating_platforms: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '........PP',
        '..........',
        '....PP....',
        '..........',
        'PP........',
        '..........',
        '..........',
        '##########',
        '##########',
    ]),

    spike_run: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..XXXXXX..',
        '##########',
        '##########',
    ]),

    lava_gap: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '###LLLL###',
        '##########',
    ]),

    tower: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '....SS....',
        '....SS....',
        '...SSSS...',
        '...SSSS...',
        '..SSSSSS..',
        '..SSSSSS..',
        '.SSSSSSSS.',
        '.SSSSSSSS.',
        '##########',
        '##########',
    ]),

    zigzag: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '........PP',
        '..........',
        '....PP....',
        '..........',
        'PP........',
        '..........',
        '......PP..',
        '##########',
        '##########',
    ]),

    arena: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        'SS......SS',
        '..........',
        '##########',
        '##########',
    ]),

    boss_arena: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..PP..PP..',
        '..........',
        '..........',
        '##########',
        '##########',
    ]),

    end_flag: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '........F.',
        '........S.',
        '........S.',
        '........S.',
        '........S.',
        '........S.',
        '........S.',
        '........S.',
        '........S.',
        '##########',
        '##########',
    ]),

    corridor: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        'SSSSSSSSSS',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '##########',
        '##########',
    ]),

    tunnel: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        'SSSSSSSSSS',
        '..........',
        '..........',
        'SSSSSSSSSS',
        '..........',
        '..........',
        '##########',
        '##########',
    ]),

    elevated: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '##########',
        '##########',
        '##########',
        '##########',
        '##########',
    ]),

    drop: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '##########',
    ]),

    coin_heaven: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..C.C.C.C.',
        '..PPPPPP..',
        '..........',
        '.C.C.C.C..',
        '.PPPPPP...',
        '..........',
        '..........',
        '..........',
        '..........',
        '##########',
        '##########',
    ]),

    fortress_wall: parseChunk([
        '..........',
        '..........',
        '..........',
        '........SS',
        '........SS',
        '........SS',
        '........SS',
        '........SS',
        '........SS',
        '........SS',
        '........SS',
        '........SS',
        '........SS',
        '##########',
        '##########',
    ]),

    broken_bridge: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        'PPP..PP..P',
        '..........',
        '..........',
    ]),

    cave_ceiling: parseChunk([
        '##########',
        '##########',
        'SSSS..SSSS',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '##########',
        '##########',
    ]),

    mixed_hazard: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '...BBB....',
        '..........',
        '..........',
        '..........',
        '..........',
        '..XX..XX..',
        '##########',
        '##########',
    ]),

    gap_coins: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '....CC....',
        '...CCCC...',
        '..........',
        '###....###',
        '###....###',
    ]),

    multi_platform: parseChunk([
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '...PP.....',
        '..........',
        '.......PP.',
        '..........',
        '..PP......',
        '..........',
        '......PP..',
        '..........',
        '##########',
        '##########',
    ]),
};

// Enemy spawn definitions for each level
// Format: { chunk: chunkIndex, x: tileX, y: tileY, type: enemyType }
// Enemy types: 'walker', 'flyer', 'heavy', 'shooter', 'chaser'

// ── Level Definitions ──
// Each level: { chunks: [chunkNames], enemies: [...], items: [...], playerStart: {x, y} }

function buildLevel(chunkNames) {
    const height = 15;
    const width = chunkNames.length * 10;
    const tiles = [];
    for (let y = 0; y < height; y++) {
        tiles[y] = [];
        for (let ci = 0; ci < chunkNames.length; ci++) {
            const chunk = CHUNKS[chunkNames[ci]];
            for (let x = 0; x < 10; x++) {
                tiles[y][ci * 10 + x] = chunk[y][x];
            }
        }
    }
    return {
        width,
        height,
        tiles,
        brokenTiles: {},
        getTile(x, y) {
            if (x < 0 || x >= this.width || y < 0 || y >= this.height) return x < 0 || x >= this.width ? 1 : 0;
            return this.brokenTiles[`${x},${y}`] ? 0 : this.tiles[y][x];
        },
        setTile(x, y, val) {
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                this.tiles[y][x] = val;
            }
        },
        breakTile(x, y) {
            this.brokenTiles[`${x},${y}`] = true;
        },
        pixelWidth() { return this.width * TILE; }
    };
}

// Level templates for each character (3 levels each)
const LEVEL_DEFS = {
    frodo: [
        { name: 'The Shire', chunks: ['start', 'flat', 'coins_low', 'pipe_small', 'flat', 'gap_small', 'coins_low', 'bricks_mid', 'flat', 'platform_steps', 'coins_low', 'flat', 'end_flag'] },
        { name: 'Emyn Muil', chunks: ['start', 'stairs_up', 'bricks_high', 'gap_medium', 'platform_steps', 'valley', 'coins_high', 'pillars', 'spike_run', 'floating_platforms', 'bricks_mixed', 'arena', 'end_flag'] },
        { name: 'Mount Doom', chunks: ['start', 'lava_gap', 'spike_run', 'gap_large', 'mixed_hazard', 'tower', 'broken_bridge', 'lava_gap', 'corridor', 'spike_run', 'boss_arena', 'boss_arena', 'end_flag'] },
    ],
    aragorn: [
        { name: 'Weathertop', chunks: ['start', 'flat', 'stairs_up', 'coins_low', 'bricks_mid', 'flat', 'gap_small', 'pipe_small', 'coins_low', 'stairs_down', 'flat', 'flat', 'end_flag'] },
        { name: "Helm's Deep", chunks: ['start', 'fortress_wall', 'stairs_up', 'pillars', 'gap_medium', 'bricks_high', 'valley', 'spike_run', 'platform_steps', 'arena', 'bricks_mixed', 'corridor', 'end_flag'] },
        { name: 'Pelennor Fields', chunks: ['start', 'flat', 'gap_large', 'mixed_hazard', 'tower', 'lava_gap', 'broken_bridge', 'spike_run', 'zigzag', 'boss_arena', 'boss_arena', 'arena', 'end_flag'] },
    ],
    gandalf: [
        { name: 'Moria', chunks: ['start', 'cave_ceiling', 'flat', 'coins_low', 'pillars', 'gap_small', 'bricks_mid', 'tunnel', 'coins_low', 'flat', 'pipe_small', 'flat', 'end_flag'] },
        { name: 'Fangorn', chunks: ['start', 'flat', 'platform_steps', 'bricks_high', 'gap_medium', 'floating_platforms', 'valley', 'coins_high', 'pillars', 'spike_run', 'arena', 'corridor', 'end_flag'] },
        { name: 'Minas Tirith', chunks: ['start', 'stairs_up', 'tower', 'gap_large', 'mixed_hazard', 'lava_gap', 'zigzag', 'fortress_wall', 'spike_run', 'boss_arena', 'boss_arena', 'corridor', 'end_flag'] },
    ],
    legolas: [
        { name: 'Mirkwood', chunks: ['start', 'flat', 'coins_low', 'floating_platforms', 'flat', 'gap_small', 'bricks_mid', 'platform_steps', 'coins_low', 'pipe_small', 'flat', 'flat', 'end_flag'] },
        { name: 'Lothlorien', chunks: ['start', 'coin_heaven', 'platform_steps', 'gap_medium', 'bricks_high', 'floating_platforms', 'valley', 'pillars', 'coins_high', 'spike_run', 'arena', 'bricks_mixed', 'end_flag'] },
        { name: 'Black Gate', chunks: ['start', 'fortress_wall', 'gap_large', 'mixed_hazard', 'tower', 'broken_bridge', 'lava_gap', 'spike_run', 'zigzag', 'boss_arena', 'boss_arena', 'arena', 'end_flag'] },
    ],
    gimli: [
        { name: 'Glittering Caves', chunks: ['start', 'cave_ceiling', 'coins_low', 'flat', 'pillars', 'gap_small', 'bricks_mid', 'flat', 'coins_low', 'pipe_small', 'tunnel', 'flat', 'end_flag'] },
        { name: 'Moria Depths', chunks: ['start', 'cave_ceiling', 'tunnel', 'gap_medium', 'spike_run', 'platform_steps', 'valley', 'bricks_high', 'coins_high', 'pillars', 'arena', 'corridor', 'end_flag'] },
        { name: 'Isengard', chunks: ['start', 'tower', 'fortress_wall', 'gap_large', 'mixed_hazard', 'lava_gap', 'broken_bridge', 'spike_run', 'zigzag', 'boss_arena', 'boss_arena', 'arena', 'end_flag'] },
    ],
    sauron: [
        { name: 'Barad-dur', chunks: ['start', 'tower', 'flat', 'coins_low', 'fortress_wall', 'gap_small', 'bricks_mid', 'flat', 'pillars', 'corridor', 'flat', 'flat', 'end_flag'] },
        { name: 'Mordor Plains', chunks: ['start', 'lava_gap', 'spike_run', 'gap_medium', 'bricks_high', 'valley', 'floating_platforms', 'coins_high', 'mixed_hazard', 'spike_run', 'arena', 'corridor', 'end_flag'] },
        { name: 'Mount Doom', chunks: ['start', 'lava_gap', 'lava_gap', 'gap_large', 'mixed_hazard', 'tower', 'broken_bridge', 'spike_run', 'zigzag', 'boss_arena', 'boss_arena', 'lava_gap', 'end_flag'] },
    ],
    saruman: [
        { name: 'Orthanc', chunks: ['start', 'tower', 'stairs_up', 'coins_low', 'flat', 'gap_small', 'bricks_mid', 'fortress_wall', 'coins_low', 'pipe_small', 'flat', 'flat', 'end_flag'] },
        { name: 'Fangorn', chunks: ['start', 'flat', 'platform_steps', 'gap_medium', 'floating_platforms', 'bricks_high', 'valley', 'pillars', 'coins_high', 'spike_run', 'arena', 'corridor', 'end_flag'] },
        { name: 'The Shire (Corrupted)', chunks: ['start', 'flat', 'gap_large', 'mixed_hazard', 'spike_run', 'lava_gap', 'broken_bridge', 'tower', 'zigzag', 'boss_arena', 'boss_arena', 'arena', 'end_flag'] },
    ],
    gollum: [
        { name: 'Misty Mountains', chunks: ['start', 'cave_ceiling', 'flat', 'coins_low', 'gap_small', 'tunnel', 'bricks_mid', 'flat', 'coins_low', 'pipe_small', 'flat', 'flat', 'end_flag'] },
        { name: 'Dead Marshes', chunks: ['start', 'flat', 'lava_gap', 'gap_medium', 'platform_steps', 'valley', 'bricks_high', 'floating_platforms', 'coins_high', 'spike_run', 'arena', 'corridor', 'end_flag'] },
        { name: "Shelob's Lair", chunks: ['start', 'cave_ceiling', 'tunnel', 'gap_large', 'mixed_hazard', 'spike_run', 'broken_bridge', 'lava_gap', 'zigzag', 'boss_arena', 'boss_arena', 'cave_ceiling', 'end_flag'] },
    ],
};

// Enemy placement per level difficulty
function getEnemiesForLevel(charId, levelIdx, chunkNames) {
    const enemies = [];
    const levelLen = chunkNames.length;

    // Difficulty scaling
    const density = [0.3, 0.5, 0.7][levelIdx]; // Enemies per chunk
    const types = [
        ['walker'],
        ['walker', 'flyer', 'shooter'],
        ['walker', 'flyer', 'shooter', 'heavy', 'chaser'],
    ][levelIdx];

    for (let ci = 2; ci < levelLen - 1; ci++) {
        if (Math.random() < density) {
            const type = types[Math.floor(Math.random() * types.length)];
            const ex = ci * 10 + 3 + Math.floor(Math.random() * 5);
            let ey;
            if (type === 'flyer') {
                ey = 6 + Math.floor(Math.random() * 4);
            } else {
                ey = 12; // On ground level
            }
            enemies.push({ x: ex * TILE, y: ey * TILE, type });
        }
        // Add a second enemy on harder levels
        if (levelIdx >= 1 && Math.random() < density * 0.5) {
            const type = types[Math.floor(Math.random() * types.length)];
            const ex = ci * 10 + 1 + Math.floor(Math.random() * 7);
            let ey = type === 'flyer' ? 7 : 12;
            enemies.push({ x: ex * TILE, y: ey * TILE, type });
        }
    }

    // Boss for level 3
    if (levelIdx === 2) {
        const bossChunk = levelLen - 3;
        enemies.push({
            x: (bossChunk * 10 + 5) * TILE,
            y: 11 * TILE,
            type: 'heavy',
            isBoss: true
        });
    }

    return enemies;
}

function createLevel(charId, levelIdx) {
    const def = LEVEL_DEFS[charId][levelIdx];
    const level = buildLevel(def.chunks);
    level.name = def.name;
    level.enemies = getEnemiesForLevel(charId, levelIdx, def.chunks);
    level.playerStart = { x: 2 * TILE, y: 11 * TILE };
    return level;
}

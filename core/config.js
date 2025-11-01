// ============================================
// JUNETTE 4.6692 - CORE CONFIGURATION
// ============================================

export const CONFIG = {
    TILE_SIZE: 48,
    GRID_WIDTH: 12,
    GRID_HEIGHT: 10,
    ANIMATION_SPEED: 0.15,
    MAX_BIFURCATION_LAYERS: 3, // 1 = no split, 2 = 2-way, 3 = 4-way
    BRANCH_SPACING: 20,
    
    COLORS: {
        // Base colors
        BACKGROUND: 0x0a0e27,
        GRID_LINE: 0x1a2a5a,
        FLOOR: 0x162447,
        WALL: 0x2d4a7c,
        WALL_EDGE: 0x1f3a66,
        
        // Entity colors
        PLAYER: 0x00ff88,
        BOX: 0xff6b35,
        BOX_EDGE: 0xcc5528,
        BOX_ON_TARGET: 0x4ecdc4,
        
        // Target colors
        TARGET: 0xffd700,
        TARGET_INNER: 0xffed4e,
        
        // Pressure plate colors
        PLATE_INACTIVE: 0x666666,
        PLATE_ACTIVE: 0x00ff88,
        PLATE_GLOW: 0x00ff88,
        PLATE_EDGE: 0x444444,
        
        // Door colors
        DOOR_CLOSED: 0xff3366,
        DOOR_OPEN: 0x00ff88,
        DOOR_EDGE: 0xcc2244,
        
        // Colored boxes/targets
        RED: 0xff3366,
        RED_LIGHT: 0xff6699,
        BLUE: 0x3366ff,
        BLUE_LIGHT: 0x6699ff,
        GREEN: 0x33ff66,
        GREEN_LIGHT: 0x66ff99,
        YELLOW: 0xffff33,
        YELLOW_LIGHT: 0xffff66,
        NEUTRAL: 0xaaaaaa,
        INACTIVE: 0x333333,
        
        // Branch indicators
        BRANCH_A_TINT: 0xffffff,
        BRANCH_B_TINT: 0xdddddd,
        ACTIVE_BORDER: 0x00ff88,
        INACTIVE_BORDER: 0x1a2a5a,
        
        // Particles
        PARTICLE: 0x00ff88
    },
    
    // Weight thresholds for pressure plates
    WEIGHTS: {
        EMPTY: 0,
        LIGHT: 1,    // Player
        MEDIUM: 2,   // Box
        HEAVY: 3     // Multiple boxes
    }
};

export const COLOR_MAP = {
    'red': { base: CONFIG.COLORS.RED, light: CONFIG.COLORS.RED_LIGHT },
    'blue': { base: CONFIG.COLORS.BLUE, light: CONFIG.COLORS.BLUE_LIGHT },
    'green': { base: CONFIG.COLORS.GREEN, light: CONFIG.COLORS.GREEN_LIGHT },
    'yellow': { base: CONFIG.COLORS.YELLOW, light: CONFIG.COLORS.YELLOW_LIGHT },
    'neutral': { base: CONFIG.COLORS.NEUTRAL, light: CONFIG.COLORS.NEUTRAL },
    'inactive': { base: CONFIG.COLORS.INACTIVE, light: CONFIG.COLORS.INACTIVE }
};

// Puzzle entity types
export const ENTITY_TYPES = {
    WALL: '#',
    PLAYER: 'P',
    BOX: '$',
    TARGET: '.',
    PRESSURE_PLATE: 'p',
    DOOR: 'D',
    SWITCH: 'S',
    FLOOR: ' '
};

// Puzzle categories (Filament-style)
export const PUZZLE_CATEGORIES = {
    FOUNDATION: 'foundation',      // Pure Sokoban, Layer 1
    SPLIT: 'split',                // 2-way bifurcation intro
    PRESSURE: 'pressure',          // Pressure plates focus
    CIRCUIT: 'circuit',            // Energy routing
    BALANCE: 'balance',            // Weight combinations
    QUANTUM: 'quantum',            // 4-way bifurcation
    PATTERN: 'pattern',            // Symbol alignment
    CASCADE: 'cascade',            // 8-way complexity
    RECURSION: 'recursion',        // Collapse mechanics
    SECRETS: 'secrets'             // Optional hard puzzles
};

// Layer definitions
export const BIFURCATION_LAYERS = {
    1: { branches: 1, name: "Layer 1: Foundation", color: '#00ff88' },
    2: { branches: 2, name: "Layer 2: Bifurcation", color: '#ff6b35' },
    3: { branches: 4, name: "Layer 3: Quantum Cascade", color: '#ff3366' }
};

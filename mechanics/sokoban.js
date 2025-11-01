// ============================================
// SOKOBAN MECHANICS
// Core box-pushing logic
// ============================================

/**
 * Sokoban mechanics - handles the core push/pull logic for boxes
 * This is the foundation mechanic that everything else builds on
 */

export class SokobanBox {
    constructor(x, y, id) {
        this.x = x;
        this.y = y;
        this.id = id;
    }
    
    clone() {
        return new SokobanBox(this.x, this.y, this.id);
    }
}

export class SokobanPlayer {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = { x: 1, y: 0 }; // Facing right by default
    }
    
    clone() {
        const clone = new SokobanPlayer(this.x, this.y);
        clone.direction = { ...this.direction };
        return clone;
    }
}

/**
 * Sokoban mechanics helper functions
 */
export class SokobanMechanics {
    /**
     * Check if a move is valid (not blocked by wall or edge of grid)
     */
    static isValidPosition(x, y, width, height, walls) {
        // Out of bounds
        if (x < 0 || x >= width || y < 0 || y >= height) {
            return false;
        }
        
        // Wall collision
        if (walls.some(w => w.x === x && w.y === y)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if a box can be pushed in a direction
     * Returns { canPush: boolean, reason: string }
     */
    static canPushBox(box, dx, dy, width, height, walls, otherBoxes, customBlockers = null) {
        const newX = box.x + dx;
        const newY = box.y + dy;
        
        // Check basic validity
        if (!this.isValidPosition(newX, newY, width, height, walls)) {
            return { canPush: false, reason: 'wall' };
        }
        
        // Check for other boxes
        if (otherBoxes.some(b => b.id !== box.id && b.x === newX && b.y === newY)) {
            return { canPush: false, reason: 'box' };
        }
        
        // Check custom blockers (like closed doors)
        if (customBlockers && customBlockers(newX, newY)) {
            return { canPush: false, reason: 'blocked' };
        }
        
        return { canPush: true };
    }
    
    /**
     * Check if player can move to a position
     * Returns { canMove: boolean, willPushBox: boolean, box: SokobanBox|null, reason: string }
     */
    static canPlayerMove(player, dx, dy, width, height, walls, boxes, customBlockers = null) {
        const newX = player.x + dx;
        const newY = player.y + dy;
        
        // Check basic validity
        if (!this.isValidPosition(newX, newY, width, height, walls)) {
            return { canMove: false, willPushBox: false, box: null, reason: 'wall' };
        }
        
        // Check custom blockers (like closed doors)
        if (customBlockers && customBlockers(newX, newY)) {
            return { canMove: false, willPushBox: false, box: null, reason: 'blocked' };
        }
        
        // Check for box at target position
        const boxAtPosition = boxes.find(b => b.x === newX && b.y === newY);
        if (boxAtPosition) {
            // Try to push the box
            const pushResult = this.canPushBox(
                boxAtPosition, 
                dx, 
                dy, 
                width, 
                height, 
                walls, 
                boxes, 
                customBlockers
            );
            
            if (pushResult.canPush) {
                return { 
                    canMove: true, 
                    willPushBox: true, 
                    box: boxAtPosition,
                    reason: 'push' 
                };
            } else {
                return { 
                    canMove: false, 
                    willPushBox: false, 
                    box: null, 
                    reason: `box_${pushResult.reason}` 
                };
            }
        }
        
        // Clear move
        return { canMove: true, willPushBox: false, box: null, reason: 'clear' };
    }
    
    /**
     * Execute a player move (and box push if needed)
     * Returns the new state { player, boxes, pushed: boolean }
     */
    static executeMove(player, dx, dy, boxes, moveResult) {
        const newPlayer = player.clone();
        newPlayer.x += dx;
        newPlayer.y += dy;
        newPlayer.direction = { x: dx, y: dy };
        
        const newBoxes = boxes.map(b => b.clone());
        let pushed = false;
        
        if (moveResult.willPushBox && moveResult.box) {
            const boxIndex = newBoxes.findIndex(b => b.id === moveResult.box.id);
            if (boxIndex !== -1) {
                newBoxes[boxIndex].x += dx;
                newBoxes[boxIndex].y += dy;
                pushed = true;
            }
        }
        
        return { player: newPlayer, boxes: newBoxes, pushed };
    }
    
    /**
     * Pull mechanics (Pukoban-style)
     * Player pulls a box behind them
     */
    static canPlayerPull(player, dx, dy, width, height, walls, boxes, customBlockers = null) {
        const newX = player.x + dx;
        const newY = player.y + dy;
        
        // Check if player can move to new position
        if (!this.isValidPosition(newX, newY, width, height, walls)) {
            return { canPull: false, box: null, reason: 'wall' };
        }
        
        if (customBlockers && customBlockers(newX, newY)) {
            return { canPull: false, box: null, reason: 'blocked' };
        }
        
        // Check if there's a box behind player (opposite direction)
        const boxBehindX = player.x - dx;
        const boxBehindY = player.y - dy;
        
        const boxBehind = boxes.find(b => b.x === boxBehindX && b.y === boxBehindY);
        if (!boxBehind) {
            return { canPull: false, box: null, reason: 'no_box' };
        }
        
        // Box found - can pull it to player's current position
        return { canPull: true, box: boxBehind, reason: 'pull' };
    }
    
    /**
     * Check if all boxes are on targets
     */
    static isSolved(boxes, targets, colorMatcher = null) {
        if (boxes.length !== targets.length) {
            return false;
        }
        
        for (let box of boxes) {
            const targetAtPosition = targets.find(t => t.x === box.x && t.y === box.y);
            if (!targetAtPosition) {
                return false;
            }
            
            // If color matching function provided, use it
            if (colorMatcher && !colorMatcher(box, targetAtPosition)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Detect deadlock positions (box pushed into corner/wall)
     * This is a simplified deadlock detector
     */
    static isBoxDeadlocked(box, walls, targets) {
        // If box is on target, it's not deadlocked
        if (targets.some(t => t.x === box.x && t.y === box.y)) {
            return false;
        }
        
        // Check for corner deadlock
        const left = walls.some(w => w.x === box.x - 1 && w.y === box.y);
        const right = walls.some(w => w.x === box.x + 1 && w.y === box.y);
        const up = walls.some(w => w.x === box.x && w.y === box.y - 1);
        const down = walls.some(w => w.x === box.x && w.y === box.y + 1);
        
        // Box in corner
        if ((left || right) && (up || down)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Get boxes in deadlock
     */
    static getDeadlockedBoxes(boxes, walls, targets) {
        return boxes.filter(box => this.isBoxDeadlocked(box, walls, targets));
    }
    
    /**
     * Calculate minimum moves heuristic (for AI solving)
     * Returns sum of Manhattan distances from boxes to nearest targets
     */
    static calculateHeuristic(boxes, targets) {
        let totalDistance = 0;
        
        for (let box of boxes) {
            let minDistance = Infinity;
            
            for (let target of targets) {
                const distance = Math.abs(box.x - target.x) + Math.abs(box.y - target.y);
                minDistance = Math.min(minDistance, distance);
            }
            
            totalDistance += minDistance;
        }
        
        return totalDistance;
    }
}

/**
 * Sokoban state snapshot for undo/redo
 */
export class SokobanSnapshot {
    constructor(player, boxes) {
        this.player = player.clone();
        this.boxes = boxes.map(b => b.clone());
    }
    
    restore() {
        return {
            player: this.player.clone(),
            boxes: this.boxes.map(b => b.clone())
        };
    }
}

/**
 * Example usage in game code:
 * 
 * const moveResult = SokobanMechanics.canPlayerMove(
 *     player, dx, dy, width, height, walls, boxes,
 *     (x, y) => doorManager.isDoorBlocking(x, y) // custom blocker
 * );
 * 
 * if (moveResult.canMove) {
 *     const newState = SokobanMechanics.executeMove(player, dx, dy, boxes, moveResult);
 *     player = newState.player;
 *     boxes = newState.boxes;
 *     if (newState.pushed) pushCount++;
 * }
 */

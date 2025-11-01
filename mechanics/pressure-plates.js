// ============================================
// PRESSURE PLATE MECHANIC
// ============================================

import { CONFIG } from '../core/config.js';

export class PressurePlate {
    constructor(x, y, id, config = {}) {
        this.x = x;
        this.y = y;
        this.id = id;
        
        // Configuration
        this.requiredWeight = config.requiredWeight || CONFIG.WEIGHTS.MEDIUM; // Default: needs box
        this.affectsAllBranches = config.affectsAllBranches !== undefined ? config.affectsAllBranches : true;
        this.connectedDoors = config.connectedDoors || []; // Array of door IDs
        this.logic = config.logic || 'OR'; // 'OR', 'AND', 'XOR'
        
        // State per branch
        this.activeInBranch = {}; // { branchIndex: boolean }
        this.currentWeightPerBranch = {}; // { branchIndex: number }
    }
    
    /**
     * Calculate if plate is active based on entities on it
     */
    checkActivation(branchIndex, entitiesOnPlate) {
        let totalWeight = 0;
        
        entitiesOnPlate.forEach(entity => {
            if (entity.type === 'player') {
                totalWeight += CONFIG.WEIGHTS.LIGHT;
            } else if (entity.type === 'box') {
                totalWeight += CONFIG.WEIGHTS.MEDIUM;
            }
        });
        
        this.currentWeightPerBranch[branchIndex] = totalWeight;
        this.activeInBranch[branchIndex] = totalWeight >= this.requiredWeight;
        
        return this.activeInBranch[branchIndex];
    }
    
    /**
     * Check if plate should affect doors (handles cross-branch logic)
     */
    isEffectivelyActive(branchIndex, allBranches) {
        if (this.affectsAllBranches) {
            // For plates that affect all branches, use logic gate
            const activeStates = Object.values(this.activeInBranch);
            
            switch (this.logic) {
                case 'AND':
                    return activeStates.every(state => state === true);
                case 'OR':
                    return activeStates.some(state => state === true);
                case 'XOR':
                    return activeStates.filter(state => state === true).length === 1;
                default:
                    return this.activeInBranch[branchIndex];
            }
        } else {
            // Local branch only
            return this.activeInBranch[branchIndex];
        }
    }
    
    clone() {
        const clone = new PressurePlate(this.x, this.y, this.id, {
            requiredWeight: this.requiredWeight,
            affectsAllBranches: this.affectsAllBranches,
            connectedDoors: [...this.connectedDoors],
            logic: this.logic
        });
        clone.activeInBranch = { ...this.activeInBranch };
        clone.currentWeightPerBranch = { ...this.currentWeightPerBranch };
        return clone;
    }
}

export class Door {
    constructor(x, y, id, config = {}) {
        this.x = x;
        this.y = y;
        this.id = id;
        
        // Configuration
        this.defaultClosed = config.defaultClosed !== undefined ? config.defaultClosed : true;
        this.affectsAllBranches = config.affectsAllBranches !== undefined ? config.affectsAllBranches : true;
        this.orientation = config.orientation || 'vertical'; // 'vertical' or 'horizontal'
        
        // State per branch
        this.openInBranch = {}; // { branchIndex: boolean }
    }
    
    /**
     * Update door state based on connected pressure plates
     */
    updateState(branchIndex, connectedPlates) {
        // If no plates connected, use default state
        if (connectedPlates.length === 0) {
            this.openInBranch[branchIndex] = !this.defaultClosed;
            return;
        }
        
        // Door opens if ANY connected plate is active (OR logic)
        // You can extend this to support AND/XOR logic later
        this.openInBranch[branchIndex] = connectedPlates.some(plate => 
            plate.isEffectivelyActive(branchIndex)
        );
    }
    
    /**
     * Check if door blocks movement
     */
    isBlocking(branchIndex) {
        if (this.affectsAllBranches) {
            // Door is only passable if open in ALL branches
            return !Object.values(this.openInBranch).every(state => state === true);
        } else {
            // Check only this branch
            return !this.openInBranch[branchIndex];
        }
    }
    
    clone() {
        const clone = new Door(this.x, this.y, this.id, {
            defaultClosed: this.defaultClosed,
            affectsAllBranches: this.affectsAllBranches,
            orientation: this.orientation
        });
        clone.openInBranch = { ...this.openInBranch };
        return clone;
    }
}

/**
 * Pressure Plate Manager - handles all plate/door interactions
 */
export class PressurePlateManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.plates = [];
        this.doors = [];
    }
    
    addPlate(plate) {
        this.plates.push(plate);
    }
    
    addDoor(door) {
        this.doors.push(door);
    }
    
    /**
     * Update all pressure plates and doors for a specific branch
     */
    updateBranch(branchIndex) {
        const branch = this.gameState.branches[branchIndex];
        
        // Update each pressure plate
        this.plates.forEach(plate => {
            const entitiesOnPlate = [];
            
            // Check if player is on plate
            if (branch.player.x === plate.x && branch.player.y === plate.y) {
                entitiesOnPlate.push({ type: 'player' });
            }
            
            // Check if any boxes are on plate
            branch.boxes.forEach(box => {
                if (box.x === plate.x && box.y === plate.y) {
                    entitiesOnPlate.push({ type: 'box' });
                }
            });
            
            plate.checkActivation(branchIndex, entitiesOnPlate);
        });
        
        // Update each door based on connected plates
        this.doors.forEach(door => {
            const connectedPlates = this.plates.filter(plate => 
                plate.connectedDoors.includes(door.id)
            );
            door.updateState(branchIndex, connectedPlates);
        });
    }
    
    /**
     * Update all branches
     */
    updateAll() {
        for (let i = 0; i < this.gameState.branches.length; i++) {
            this.updateBranch(i);
        }
    }
    
    /**
     * Check if position is blocked by a door
     */
    isDoorBlocking(branchIndex, x, y) {
        const door = this.doors.find(d => d.x === x && d.y === y);
        return door ? door.isBlocking(branchIndex) : false;
    }
    
    /**
     * Get plate at position
     */
    getPlateAt(x, y) {
        return this.plates.find(p => p.x === x && p.y === y);
    }
    
    /**
     * Get door at position
     */
    getDoorAt(x, y) {
        return this.doors.find(d => d.x === x && d.y === y);
    }
    
    /**
     * Clone for undo system
     */
    clone() {
        const clone = new PressurePlateManager(this.gameState);
        clone.plates = this.plates.map(p => p.clone());
        clone.doors = this.doors.map(d => d.clone());
        return clone;
    }
    
    /**
     * Reset all plates and doors
     */
    reset() {
        this.plates = [];
        this.doors = [];
    }
}

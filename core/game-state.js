// ============================================
// GAME STATE
// Manages all state for the puzzle game
// ============================================

import { PressurePlateManager, PressurePlate, Door } from '../mechanics/pressure-plates.js';
import { SokobanPlayer, SokobanBox } from '../mechanics/sokoban.js';

/**
 * Branch State - represents one reality branch
 */
export class BranchState {
    constructor() {
        this.player = new SokobanPlayer(0, 0);
        this.boxes = [];
    }
    
    clone() {
        const clone = new BranchState();
        clone.player = this.player.clone();
        clone.boxes = this.boxes.map(b => b.clone());
        return clone;
    }
}

/**
 * Game State - represents the entire puzzle state
 */
export class GameState {
    constructor() {
        this.branches = [new BranchState()]; // Start with 1 branch
        this.activeBranch = 0;
        this.targets = [];
        this.walls = [];
        this.width = 0;
        this.height = 0;
        this.moves = 0;
        this.pushes = 0;
        this.history = [];
        this.isAnimating = false;
        
        // Color system
        this.boxColors = {};
        this.targetColorsPerBranch = {};
        
        // Pressure plate system
        this.pressurePlateManager = new PressurePlateManager(this);
    }
    
    clone() {
        const clone = new GameState();
        clone.branches = this.branches.map(b => b.clone());
        clone.activeBranch = this.activeBranch;
        clone.targets = this.targets.map(t => ({ ...t }));
        clone.walls = this.walls.map(w => ({ ...w }));
        clone.width = this.width;
        clone.height = this.height;
        clone.moves = this.moves;
        clone.pushes = this.pushes;
        clone.boxColors = { ...this.boxColors };
        clone.targetColorsPerBranch = JSON.parse(JSON.stringify(this.targetColorsPerBranch));
        
        // Clone pressure plate manager
        clone.pressurePlateManager = this.pressurePlateManager.clone();
        clone.pressurePlateManager.gameState = clone; // Update reference
        
        return clone;
    }
    
    /**
     * Load a puzzle into the game state
     */
    loadPuzzle(puzzle) {
        // Reset state
        this.width = puzzle.width;
        this.height = puzzle.height;
        this.moves = 0;
        this.pushes = 0;
        this.history = [];
        this.walls = [];
        this.targets = [];
        this.boxColors = {};
        this.targetColorsPerBranch = {};
        
        // Determine number of branches from bifurcation layer
        const bifurcationLayer = puzzle.bifurcationLayer || 1;
        const branchCount = Math.pow(2, bifurcationLayer - 1); // Layer 1 = 1 branch, Layer 2 = 2, Layer 3 = 4
        
        this.branches = [];
        for (let i = 0; i < branchCount; i++) {
            this.branches.push(new BranchState());
        }
        this.activeBranch = 0;
        
        // Reset pressure plate manager
        this.pressurePlateManager.reset();
        
        // Parse layout
        let boxIndex = 0;
        let targetIndex = 0;
        
        for (let y = 0; y < puzzle.layout.length; y++) {
            for (let x = 0; x < puzzle.layout[y].length; x++) {
                const char = puzzle.layout[y][x];
                
                switch (char) {
                    case '#':
                        this.walls.push({ x, y });
                        break;
                        
                    case 'P':
                        // Initialize player in same position for all branches
                        this.branches.forEach(branch => {
                            branch.player = new SokobanPlayer(x, y);
                        });
                        break;
                        
                    case '$':
                        // Initialize boxes in same position for all branches
                        this.branches.forEach(branch => {
                            branch.boxes.push(new SokobanBox(x, y, boxIndex));
                        });
                        // Set box color
                        if (puzzle.colors && puzzle.colors.boxes) {
                            this.boxColors[boxIndex] = puzzle.colors.boxes[boxIndex] || 'neutral';
                        }
                        boxIndex++;
                        break;
                        
                    case '.':
                        this.targets.push({ x, y, id: targetIndex });
                        // Set target colors per branch
                        if (puzzle.colors && puzzle.colors.targetsPerBranch) {
                            for (let branchIndex = 0; branchIndex < this.branches.length; branchIndex++) {
                                if (!this.targetColorsPerBranch[branchIndex]) {
                                    this.targetColorsPerBranch[branchIndex] = {};
                                }
                                this.targetColorsPerBranch[branchIndex][targetIndex] = 
                                    puzzle.colors.targetsPerBranch[branchIndex][targetIndex] || 'neutral';
                            }
                        } else {
                            // Fallback to neutral
                            for (let branchIndex = 0; branchIndex < this.branches.length; branchIndex++) {
                                if (!this.targetColorsPerBranch[branchIndex]) {
                                    this.targetColorsPerBranch[branchIndex] = {};
                                }
                                this.targetColorsPerBranch[branchIndex][targetIndex] = 'neutral';
                            }
                        }
                        targetIndex++;
                        break;
                        
                    case 'p':
                        // Pressure plate marker (actual plates defined in pressurePlates array)
                        break;
                        
                    case 'D':
                        // Door marker (actual doors defined in doors array)
                        break;
                }
            }
        }
        
        // Load pressure plates
        if (puzzle.pressurePlates) {
            puzzle.pressurePlates.forEach(plateData => {
                const plate = new PressurePlate(plateData.x, plateData.y, plateData.id, {
                    requiredWeight: plateData.requiredWeight,
                    affectsAllBranches: plateData.affectsAllBranches,
                    connectedDoors: plateData.connectedDoors,
                    logic: plateData.logic
                });
                this.pressurePlateManager.addPlate(plate);
            });
        }
        
        // Load per-branch pressure plates
        if (puzzle.pressurePlatesPerBranch) {
            for (let branchIndex in puzzle.pressurePlatesPerBranch) {
                puzzle.pressurePlatesPerBranch[branchIndex].forEach(plateData => {
                    const plate = new PressurePlate(plateData.x, plateData.y, plateData.id, {
                        requiredWeight: plateData.requiredWeight,
                        affectsAllBranches: plateData.affectsAllBranches || false,
                        connectedDoors: plateData.connectedDoors,
                        logic: plateData.logic
                    });
                    this.pressurePlateManager.addPlate(plate);
                });
            }
        }
        
        // Load doors
        if (puzzle.doors) {
            puzzle.doors.forEach(doorData => {
                const door = new Door(doorData.x, doorData.y, doorData.id, {
                    defaultClosed: doorData.defaultClosed,
                    affectsAllBranches: doorData.affectsAllBranches,
                    orientation: doorData.orientation
                });
                this.pressurePlateManager.addDoor(door);
            });
        }
        
        // Load per-branch doors
        if (puzzle.doorsPerBranch) {
            for (let branchIndex in puzzle.doorsPerBranch) {
                puzzle.doorsPerBranch[branchIndex].forEach(doorData => {
                    const door = new Door(doorData.x, doorData.y, doorData.id, {
                        defaultClosed: doorData.defaultClosed,
                        affectsAllBranches: doorData.affectsAllBranches || false,
                        orientation: doorData.orientation
                    });
                    this.pressurePlateManager.addDoor(door);
                });
            }
        }
        
        // Load per-branch walls (for asymmetric puzzles)
        if (puzzle.wallsPerBranch) {
            // This is more complex - need to track walls per branch
            // For now, we'll skip this feature and add it later if needed
            console.warn('Per-branch walls not yet implemented');
        }
        
        // Initialize pressure plate states
        this.pressurePlateManager.updateAll();
    }
    
    getActiveBranch() {
        return this.branches[this.activeBranch];
    }
    
    isWall(x, y) {
        return this.walls.some(w => w.x === x && w.y === y);
    }
    
    getBoxAt(branchIndex, x, y) {
        return this.branches[branchIndex].boxes.find(b => b.x === x && b.y === y);
    }
    
    isTarget(x, y) {
        return this.targets.some(t => t.x === x && t.y === y);
    }
    
    getTargetAt(x, y) {
        return this.targets.find(t => t.x === x && t.y === y);
    }
    
    isBoxOnCorrectTarget(branchIndex, box) {
        const target = this.getTargetAt(box.x, box.y);
        if (!target) return false;
        
        const boxColor = this.boxColors[box.id] || 'neutral';
        const targetColor = this.targetColorsPerBranch[branchIndex]?.[target.id] || 'neutral';
        
        // Inactive targets can't be solved
        if (targetColor === 'inactive') return false;
        
        // Neutral boxes/targets match anything
        if (boxColor === 'neutral' || targetColor === 'neutral') return true;
        
        return boxColor === targetColor;
    }
    
    isSolved() {
        // All targets in all branches must have a correctly colored box on them
        // (Extra boxes beyond targets are allowed - they can be used for plates, etc.)
        for (let branchIndex = 0; branchIndex < this.branches.length; branchIndex++) {
            const branch = this.branches[branchIndex];
            
            // Check each target
            for (let target of this.targets) {
                const targetColor = this.targetColorsPerBranch[branchIndex]?.[target.id] || 'neutral';
                
                // Skip inactive targets
                if (targetColor === 'inactive') continue;
                
                // Find if there's a box on this target
                const boxOnTarget = branch.boxes.find(b => b.x === target.x && b.y === target.y);
                
                if (!boxOnTarget) {
                    return false; // Target has no box
                }
                
                // Check if box color matches target color
                const boxColor = this.boxColors[boxOnTarget.id] || 'neutral';
                
                // Neutral boxes/targets match anything
                if (boxColor !== 'neutral' && targetColor !== 'neutral' && boxColor !== targetColor) {
                    return false; // Wrong color box on target
                }
            }
        }
        return true;
    }
    
    saveState() {
        this.history.push(this.clone());
        
        // Limit history to prevent memory issues
        if (this.history.length > 50) {
            this.history.shift();
        }
    }
    
    undo() {
        if (this.history.length > 0) {
            const previousState = this.history.pop();
            this.branches = previousState.branches;
            this.activeBranch = previousState.activeBranch;
            this.moves = previousState.moves;
            this.pushes = previousState.pushes;
            this.pressurePlateManager = previousState.pressurePlateManager;
            this.pressurePlateManager.gameState = this; // Update reference
            return true;
        }
        return false;
    }
    
    switchBranch(branchIndex) {
        if (branchIndex >= 0 && branchIndex < this.branches.length) {
            this.activeBranch = branchIndex;
        }
    }
    
    cycleBranch() {
        this.activeBranch = (this.activeBranch + 1) % this.branches.length;
    }
}
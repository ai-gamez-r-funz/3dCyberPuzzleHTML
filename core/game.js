// ============================================
// GAME CONTROLLER
// Main orchestrator that brings everything together
// ============================================

import { CONFIG } from './config.js';
import { GameState, BranchState } from './game-state.js';
import { Renderer } from './renderer.js';
import { PressurePlateManager } from '../mechanics/pressure-plates.js';

export class Game {
    constructor(containerElement) {
        this.state = new GameState();
        this.currentPuzzleIndex = 0;
        this.currentLayer = 1;
        
        // Initialize renderer
        this.renderer = new Renderer(containerElement, this.state);
        
        // Setup UI references
        this.setupUIReferences();
        
        // Setup controls
        this.setupControls();
    }
    
    setupUIReferences() {
        this.ui = {
            moveCounter: document.getElementById('move-counter'),
            pushCounter: document.getElementById('push-counter'),
            messageOverlay: document.getElementById('message-overlay'),
            branchAIndicator: document.getElementById('branch-a-indicator'),
            branchBIndicator: document.getElementById('branch-b-indicator'),
            layerLabel: document.getElementById('layer-label'),
            puzzleSelect: document.getElementById('puzzle-select'),
            layerSelect: document.getElementById('layer-select')
        };
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Button controls
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
        document.getElementById('help-btn').addEventListener('click', () => this.showHelp());
        document.getElementById('load-puzzle-btn').addEventListener('click', () => {
            const index = parseInt(this.ui.puzzleSelect.value);
            this.loadPuzzle(index);
        });
    }
    
    handleKeyPress(e) {
        if (this.state.isAnimating) return;
        
        const key = e.key.toLowerCase();
        let dx = 0, dy = 0;
        
        // Movement
        if (key === 'w' || key === 'arrowup') dy = -1;
        else if (key === 's' || key === 'arrowdown') dy = 1;
        else if (key === 'a' || key === 'arrowleft') dx = -1;
        else if (key === 'd' || key === 'arrowright') dx = 1;
        // Branch switching (only for Layer 2+)
        else if (this.currentLayer > 1) {
            if (key === '1') {
                this.switchBranch(0);
                return;
            }
            else if (key === '2') {
                this.switchBranch(1);
                return;
            }
            else if (key === 'tab') {
                e.preventDefault();
                this.state.cycleBranch();
                this.renderer.renderScene();
                this.renderer.updateBranchIndicators(this.state.activeBranch);
                return;
            }
        }
        // Undo
        if (key === 'z') {
            this.undo();
            return;
        }
        // Reset
        else if (key === 'r') {
            this.reset();
            return;
        }
        // Help
        else if (key === '?') {
            this.showHelp();
            return;
        }
        
        if (dx !== 0 || dy !== 0) {
            e.preventDefault();
            this.tryMove(dx, dy);
        }
    }
    
    tryMove(dx, dy) {
        const branch = this.state.getActiveBranch();
        const newX = branch.player.x + dx;
        const newY = branch.player.y + dy;
        
        // Update player direction
        branch.player.direction.x = dx;
        branch.player.direction.y = dy;
        
        // Check wall collision
        if (this.state.isWall(newX, newY)) {
            this.renderer.renderScene();
            return;
        }
        
        // NEW: Check door collision
        if (this.state.pressurePlateManager && 
            this.state.pressurePlateManager.isDoorBlocking(this.state.activeBranch, newX, newY)) {
            // Blocked by closed door - render to show player tried
            this.renderer.renderScene();
            // Optional: play "blocked" sound or visual effect
            return;
        }
        
        // Check box collision
        const box = this.state.getBoxAt(this.state.activeBranch, newX, newY);
        if (box) {
            const boxNewX = newX + dx;
            const boxNewY = newY + dy;
            
            // Can't push box into wall
            if (this.state.isWall(boxNewX, boxNewY)) {
                this.renderer.renderScene();
                return;
            }
            
            // NEW: Can't push box into closed door
            if (this.state.pressurePlateManager &&
                this.state.pressurePlateManager.isDoorBlocking(this.state.activeBranch, boxNewX, boxNewY)) {
                this.renderer.renderScene();
                return;
            }
            
            // Can't push box into another box
            if (this.state.getBoxAt(this.state.activeBranch, boxNewX, boxNewY)) {
                this.renderer.renderScene();
                return;
            }
            
            // Valid push!
            this.state.saveState();
            this.state.isAnimating = true;
            
            const oldBoxPos = { x: box.x, y: box.y };
            box.x = boxNewX;
            box.y = boxNewY;
            
            // Animate player and box
            let animationsComplete = 0;
            const checkComplete = () => {
                animationsComplete++;
                if (animationsComplete === 2) {
                    this.state.isAnimating = false;
                    this.state.pushes++;
                    
                    // NEW: Update pressure plates after move
                    if (this.state.pressurePlateManager) {
                        this.state.pressurePlateManager.updateAll();
                    }
                    
                    this.updateUI();
                    
                    if (this.state.isSolved()) {
                        this.onPuzzleSolved();
                    }
                    
                    this.renderer.renderScene();
                    
                    // Particles on box
                    const colorName = this.state.boxColors[box.id] || 'neutral';
                    const particleColor = this.renderer.getColorForName(colorName);
                    this.renderer.createParticles(
                        this.state.activeBranch,
                        boxNewX,
                        boxNewY,
                        particleColor,
                        6
                    );
                }
            };
            
            this.renderer.animateMove(
                this.state.activeBranch,
                branch.player,
                branch.player.x,
                branch.player.y,
                newX,
                newY,
                checkComplete
            );
            
            this.renderer.animateMove(
                this.state.activeBranch,
                box,
                oldBoxPos.x,
                oldBoxPos.y,
                boxNewX,
                boxNewY,
                checkComplete
            );
            
            branch.player.x = newX;
            branch.player.y = newY;
            this.state.moves++;
            
        } else {
            // Simple move (no box push)
            this.state.saveState();
            this.state.isAnimating = true;
            
            this.renderer.animateMove(
                this.state.activeBranch,
                branch.player,
                branch.player.x,
                branch.player.y,
                newX,
                newY,
                () => {
                    this.state.isAnimating = false;
                    
                    // NEW: Update pressure plates after move (player might have stepped on/off plate)
                    if (this.state.pressurePlateManager) {
                        this.state.pressurePlateManager.updateAll();
                    }
                    
                    this.renderer.renderScene();
                }
            );
            
            branch.player.x = newX;
            branch.player.y = newY;
            this.state.moves++;
            this.updateUI();
        }
    }
    
    switchBranch(branchIndex) {
        this.state.switchBranch(branchIndex);
        this.renderer.renderScene();
        this.renderer.updateBranchIndicators(this.state.activeBranch);
    }
    
    undo() {
        if (this.state.undo()) {
            // Restore pressure plate state from history
            if (this.state.pressurePlateManager) {
                this.state.pressurePlateManager.updateAll();
            }
            
            this.renderer.renderScene();
            this.renderer.updateBranchIndicators(this.state.activeBranch);
            this.updateUI();
            this.showMessage('UNDO', 500);
        }
    }
    
    reset() {
        this.loadPuzzle(this.currentPuzzleIndex);
        this.showMessage('RESET', 500);
    }
    
    loadPuzzle(index, puzzleData = null) {
        this.currentPuzzleIndex = index;
        const puzzle = puzzleData || this.getCurrentPuzzleList()[index];
        
        if (!puzzle) {
            console.error('Puzzle not found:', index);
            return;
        }
        
        this.currentLayer = puzzle.bifurcationLayer || 1;
        this.state.loadPuzzle(puzzle);
        this.renderer.renderScene();
        this.renderer.updateBranchIndicators(this.state.activeBranch);
        this.updateUI();
        
        this.ui.puzzleSelect.value = index;
        this.showMessage(puzzle.name, 2000);
    }
    
    getCurrentPuzzleList() {
        // This will be set by the main index.html when it loads puzzles
        return this._currentPuzzles || [];
    }
    
    setPuzzleList(puzzles) {
        this._currentPuzzles = puzzles;
    }
    
    updateUI() {
        this.ui.moveCounter.textContent = this.state.moves;
        this.ui.pushCounter.textContent = this.state.pushes;
    }
    
    onPuzzleSolved() {
        // Celebration particles from all targets in all branches
        for (let branchIndex = 0; branchIndex < this.state.branches.length; branchIndex++) {
            this.state.targets.forEach(target => {
                const colorName = this.state.targetColorsPerBranch[branchIndex]?.[target.id] || 'neutral';
                
                // Skip inactive targets
                if (colorName === 'inactive') return;
                
                const particleColor = this.renderer.getColorForName(colorName, true); // true = light version
                this.renderer.createParticles(
                    branchIndex,
                    target.x,
                    target.y,
                    particleColor,
                    12
                );
            });
        }
        
        setTimeout(() => {
            const message = this.currentLayer > 1 ? 
                'BIFURCATION RESOLVED!' : 
                'PUZZLE SOLVED!';
            this.showMessage(message, 3000);
        }, 500);
    }
    
    showMessage(text, duration = 2000) {
        this.ui.messageOverlay.textContent = text;
        this.ui.messageOverlay.classList.add('show');
        setTimeout(() => {
            this.ui.messageOverlay.classList.remove('show');
        }, duration);
    }
    
    showHelp() {
        const puzzle = this.getCurrentPuzzleList()[this.currentPuzzleIndex];
        if (puzzle) {
            const helpText = puzzle.hint || puzzle.description;
            this.showMessage(helpText, 3000);
        }
    }
}
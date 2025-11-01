// ============================================
// RENDERER
// Handles all PIXI.js rendering
// ============================================

import { CONFIG, COLOR_MAP } from './config.js';

export class Renderer {
    constructor(container, state) {
        this.state = state;
        this.app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight - 150,
            backgroundColor: CONFIG.COLORS.BACKGROUND,
            antialias: true
        });
        container.appendChild(this.app.view);

        this.branchContainers = [];
        this.particleContainer = new PIXI.Container();
        
        // Create containers for each branch (up to 10 for future expansion)
        for (let i = 0; i < 10; i++) {
            const container = new PIXI.Container();
            container.visible = false; // Hide by default
            this.branchContainers.push(container);
            this.app.stage.addChild(container);
        }
        
        this.app.stage.addChild(this.particleContainer);

        this.sprites = [];
        for (let i = 0; i < 10; i++) {
            this.sprites.push({
                player: null,
                boxes: [],
                targets: [],
                walls: [],
                plates: [],   // NEW for pressure plates
                doors: []     // NEW for doors
            });
        }

        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        this.app.renderer.resize(window.innerWidth, window.innerHeight - 150);
        this.positionBranches();
    }

    positionBranches() {
        const gridWidth = this.state.width * CONFIG.TILE_SIZE;
        const gridHeight = this.state.height * CONFIG.TILE_SIZE;
        const branchCount = this.state.branches.length;
        const totalWidth = (gridWidth * branchCount) + (CONFIG.BRANCH_SPACING * (branchCount - 1));
        
        let startX = (this.app.screen.width - totalWidth) / 2;
        const startY = (this.app.screen.height - gridHeight) / 2;

        for (let i = 0; i < branchCount; i++) {
            this.branchContainers[i].x = startX + (i * (gridWidth + CONFIG.BRANCH_SPACING));
            this.branchContainers[i].y = startY;
        }
    }

    clear() {
        for (let i = 0; i < 10; i++) {
            this.branchContainers[i].removeChildren();
            this.branchContainers[i].visible = false;
            this.sprites[i] = {
                player: null,
                boxes: [],
                targets: [],
                walls: [],
                plates: [],
                doors: []
            };
        }
    }

    drawGrid(branchIndex) {
        const graphics = new PIXI.Graphics();
        
        // Draw grid background
        for (let y = 0; y < this.state.height; y++) {
            for (let x = 0; x < this.state.width; x++) {
                if (!this.state.isWall(x, y)) {
                    graphics.beginFill(CONFIG.COLORS.FLOOR);
                    graphics.drawRect(
                        x * CONFIG.TILE_SIZE + 2,
                        y * CONFIG.TILE_SIZE + 2,
                        CONFIG.TILE_SIZE - 4,
                        CONFIG.TILE_SIZE - 4
                    );
                    graphics.endFill();
                }
            }
        }

        // Draw grid lines
        graphics.lineStyle(1, CONFIG.COLORS.GRID_LINE, 0.3);
        for (let x = 0; x <= this.state.width; x++) {
            graphics.moveTo(x * CONFIG.TILE_SIZE, 0);
            graphics.lineTo(x * CONFIG.TILE_SIZE, this.state.height * CONFIG.TILE_SIZE);
        }
        for (let y = 0; y <= this.state.height; y++) {
            graphics.moveTo(0, y * CONFIG.TILE_SIZE);
            graphics.lineTo(this.state.width * CONFIG.TILE_SIZE, y * CONFIG.TILE_SIZE);
        }

        this.branchContainers[branchIndex].addChild(graphics);
    }

    getColorForName(colorName, lightVersion = false) {
        const colors = COLOR_MAP[colorName] || COLOR_MAP['neutral'];
        return lightVersion ? colors.light : colors.base;
    }

    createWallSprite(x, y) {
        const graphics = new PIXI.Graphics();
        
        // Main wall
        graphics.beginFill(CONFIG.COLORS.WALL);
        graphics.drawRect(0, 0, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
        graphics.endFill();
        
        // Edge highlight
        graphics.lineStyle(2, CONFIG.COLORS.WALL_EDGE, 0.5);
        graphics.moveTo(0, 0);
        graphics.lineTo(CONFIG.TILE_SIZE, 0);
        graphics.lineTo(CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
        
        graphics.x = x * CONFIG.TILE_SIZE;
        graphics.y = y * CONFIG.TILE_SIZE;
        return graphics;
    }

    createTargetSprite(x, y, target, branchIndex) {
        const graphics = new PIXI.Graphics();
        const centerX = CONFIG.TILE_SIZE / 2;
        const centerY = CONFIG.TILE_SIZE / 2;
        
        const colorName = this.state.targetColorsPerBranch[branchIndex]?.[target.id] || 'neutral';
        
        // Skip inactive targets
        if (colorName === 'inactive') {
            graphics.x = x * CONFIG.TILE_SIZE;
            graphics.y = y * CONFIG.TILE_SIZE;
            return graphics;
        }
        
        const color = this.getColorForName(colorName);
        
        // Outer glow
        graphics.beginFill(color, 0.2);
        graphics.drawCircle(centerX, centerY, 16);
        graphics.endFill();
        
        // Target ring
        graphics.lineStyle(3, color, 0.6);
        graphics.drawCircle(centerX, centerY, 12);
        
        // Inner dot
        graphics.beginFill(color, 0.8);
        graphics.drawCircle(centerX, centerY, 4);
        graphics.endFill();
        
        graphics.x = x * CONFIG.TILE_SIZE;
        graphics.y = y * CONFIG.TILE_SIZE;
        return graphics;
    }

    createBoxSprite(x, y, box, branchIndex) {
        const graphics = new PIXI.Graphics();
        const isOnTarget = this.state.isBoxOnCorrectTarget(branchIndex, box);
        
        const colorName = this.state.boxColors[box.id] || 'neutral';
        const color = this.getColorForName(colorName);
        const mainColor = isOnTarget ? CONFIG.COLORS.BOX_ON_TARGET : color;
        
        // Box body
        graphics.beginFill(mainColor);
        graphics.drawRoundedRect(8, 8, CONFIG.TILE_SIZE - 16, CONFIG.TILE_SIZE - 16, 4);
        graphics.endFill();
        
        // Edge
        graphics.lineStyle(2, CONFIG.COLORS.BOX_EDGE, 0.6);
        graphics.drawRoundedRect(8, 8, CONFIG.TILE_SIZE - 16, CONFIG.TILE_SIZE - 16, 4);
        
        graphics.x = x * CONFIG.TILE_SIZE;
        graphics.y = y * CONFIG.TILE_SIZE;
        return graphics;
    }

    createPlayerSprite(x, y, branch) {
        const graphics = new PIXI.Graphics();
        const centerX = CONFIG.TILE_SIZE / 2;
        const centerY = CONFIG.TILE_SIZE / 2;
        
        // Player body
        graphics.beginFill(CONFIG.COLORS.PLAYER);
        graphics.drawCircle(centerX, centerY, 12);
        graphics.endFill();
        
        // Direction indicator
        const dirX = branch.player.direction.x * 8;
        const dirY = branch.player.direction.y * 8;
        graphics.beginFill(CONFIG.COLORS.PLAYER);
        graphics.drawCircle(centerX + dirX, centerY + dirY, 4);
        graphics.endFill();
        
        graphics.x = x * CONFIG.TILE_SIZE;
        graphics.y = y * CONFIG.TILE_SIZE;
        return graphics;
    }

    // NEW: Create pressure plate sprite
    createPressurePlateSprite(x, y, plate, branchIndex) {
        const graphics = new PIXI.Graphics();
        const centerX = CONFIG.TILE_SIZE / 2;
        const centerY = CONFIG.TILE_SIZE / 2;
        
        // Check if plate is active
        const isActive = plate.activeInBranch[branchIndex] || false;
        const baseColor = isActive ? CONFIG.COLORS.PLATE_ACTIVE : CONFIG.COLORS.PLATE_INACTIVE;
        const alpha = isActive ? 1.0 : 0.5;
        
        // Outer ring
        graphics.beginFill(baseColor, alpha * 0.3);
        graphics.drawCircle(centerX, centerY, 18);
        graphics.endFill();
        
        // Inner platform
        graphics.beginFill(baseColor, alpha);
        graphics.drawCircle(centerX, centerY, 12);
        graphics.endFill();
        
        // Edge detail
        graphics.lineStyle(2, CONFIG.COLORS.PLATE_EDGE, alpha);
        graphics.drawCircle(centerX, centerY, 12);
        
        // Glow effect if active
        if (isActive) {
            graphics.lineStyle(2, CONFIG.COLORS.PLATE_GLOW, 0.5);
            graphics.drawCircle(centerX, centerY, 16);
        }
        
        graphics.x = x * CONFIG.TILE_SIZE;
        graphics.y = y * CONFIG.TILE_SIZE;
        return graphics;
    }

    // NEW: Create door sprite
    createDoorSprite(x, y, door, branchIndex) {
        const graphics = new PIXI.Graphics();
        
        // Check if door is open
        const isOpen = door.openInBranch[branchIndex] || false;
        const color = isOpen ? CONFIG.COLORS.DOOR_OPEN : CONFIG.COLORS.DOOR_CLOSED;
        const alpha = isOpen ? 0.3 : 1.0;
        
        if (door.orientation === 'horizontal') {
            // Horizontal door
            graphics.beginFill(color, alpha);
            graphics.drawRect(4, CONFIG.TILE_SIZE / 2 - 4, CONFIG.TILE_SIZE - 8, 8);
            graphics.endFill();
            
            if (!isOpen) {
                graphics.lineStyle(2, CONFIG.COLORS.DOOR_EDGE);
                graphics.drawRect(4, CONFIG.TILE_SIZE / 2 - 4, CONFIG.TILE_SIZE - 8, 8);
            }
        } else {
            // Vertical door
            graphics.beginFill(color, alpha);
            graphics.drawRect(CONFIG.TILE_SIZE / 2 - 4, 4, 8, CONFIG.TILE_SIZE - 8);
            graphics.endFill();
            
            if (!isOpen) {
                graphics.lineStyle(2, CONFIG.COLORS.DOOR_EDGE);
                graphics.drawRect(CONFIG.TILE_SIZE / 2 - 4, 4, 8, CONFIG.TILE_SIZE - 8);
            }
        }
        
        graphics.x = x * CONFIG.TILE_SIZE;
        graphics.y = y * CONFIG.TILE_SIZE;
        return graphics;
    }

    renderScene() {
        this.clear();

        for (let branchIndex = 0; branchIndex < this.state.branches.length; branchIndex++) {
            const branch = this.state.branches[branchIndex];
            const container = this.branchContainers[branchIndex];
            container.visible = true;
            
            this.drawGrid(branchIndex);

            // Render walls
            this.state.walls.forEach(wall => {
                const sprite = this.createWallSprite(wall.x, wall.y);
                this.sprites[branchIndex].walls.push(sprite);
                container.addChild(sprite);
            });

            // NEW: Render pressure plates
            if (this.state.pressurePlateManager) {
                this.state.pressurePlateManager.plates.forEach(plate => {
                    const sprite = this.createPressurePlateSprite(plate.x, plate.y, plate, branchIndex);
                    this.sprites[branchIndex].plates.push(sprite);
                    container.addChild(sprite);
                });
            }

            // Render targets
            this.state.targets.forEach(target => {
                const sprite = this.createTargetSprite(target.x, target.y, target, branchIndex);
                this.sprites[branchIndex].targets.push(sprite);
                container.addChild(sprite);
            });

            // NEW: Render doors
            if (this.state.pressurePlateManager) {
                this.state.pressurePlateManager.doors.forEach(door => {
                    const sprite = this.createDoorSprite(door.x, door.y, door, branchIndex);
                    this.sprites[branchIndex].doors.push(sprite);
                    container.addChild(sprite);
                });
            }

            // Render boxes
            branch.boxes.forEach(box => {
                const sprite = this.createBoxSprite(box.x, box.y, box, branchIndex);
                this.sprites[branchIndex].boxes.push(sprite);
                container.addChild(sprite);
            });

            // Render player
            this.sprites[branchIndex].player = this.createPlayerSprite(
                branch.player.x, 
                branch.player.y, 
                branch
            );
            container.addChild(this.sprites[branchIndex].player);
        }

        this.positionBranches();
    }

    animateMove(branchIndex, entity, fromX, fromY, toX, toY, onComplete) {
        const sprite = entity === this.state.branches[branchIndex].player 
            ? this.sprites[branchIndex].player 
            : this.sprites[branchIndex].boxes.find(b => 
                b.x === toX * CONFIG.TILE_SIZE && b.y === toY * CONFIG.TILE_SIZE
            );

        if (!sprite) {
            onComplete();
            return;
        }

        const startX = fromX * CONFIG.TILE_SIZE;
        const startY = fromY * CONFIG.TILE_SIZE;
        const endX = toX * CONFIG.TILE_SIZE;
        const endY = toY * CONFIG.TILE_SIZE;

        let progress = 0;
        const animate = () => {
            progress += CONFIG.ANIMATION_SPEED;
            if (progress >= 1) {
                sprite.x = endX;
                sprite.y = endY;
                onComplete();
            } else {
                sprite.x = startX + (endX - startX) * progress;
                sprite.y = startY + (endY - startY) * progress;
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    createParticles(branchIndex, x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(color);
            particle.drawCircle(0, 0, 3);
            particle.endFill();

            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 2;

            const containerX = this.branchContainers[branchIndex].x;
            const containerY = this.branchContainers[branchIndex].y;

            particle.x = containerX + (x * CONFIG.TILE_SIZE) + CONFIG.TILE_SIZE / 2;
            particle.y = containerY + (y * CONFIG.TILE_SIZE) + CONFIG.TILE_SIZE / 2;

            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            this.particleContainer.addChild(particle);

            let life = 1.0;
            const animateParticle = () => {
                particle.x += vx;
                particle.y += vy;
                life -= 0.05;
                particle.alpha = life;

                if (life > 0) {
                    requestAnimationFrame(animateParticle);
                } else {
                    this.particleContainer.removeChild(particle);
                }
            };
            animateParticle();
        }
    }

    updateBranchIndicators(activeBranch) {
        const indicators = ['branch-a-indicator', 'branch-b-indicator'];
        indicators.forEach((id, index) => {
            const elem = document.getElementById(id);
            if (elem) {
                if (index === activeBranch) {
                    elem.classList.add('active');
                } else {
                    elem.classList.remove('active');
                }
            }
        });
    }
}
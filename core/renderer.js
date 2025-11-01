// ============================================
        // RENDERER
        // ============================================
        class Renderer {
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
                
                // Create containers for each branch
                for (let i = 0; i < CONFIG.BRANCH_COUNT; i++) {
                    const container = new PIXI.Container();
                    this.branchContainers.push(container);
                    this.app.stage.addChild(container);
                }
                
                this.app.stage.addChild(this.particleContainer);

                this.sprites = [];
                for (let i = 0; i < CONFIG.BRANCH_COUNT; i++) {
                    this.sprites.push({
                        player: null,
                        boxes: [],
                        targets: [],
                        walls: []
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
                const totalWidth = (gridWidth * CONFIG.BRANCH_COUNT) + (CONFIG.BRANCH_SPACING * (CONFIG.BRANCH_COUNT - 1));
                
                let startX = (this.app.screen.width - totalWidth) / 2;
                const startY = (this.app.screen.height - gridHeight) / 2;

                for (let i = 0; i < CONFIG.BRANCH_COUNT; i++) {
                    this.branchContainers[i].x = startX + (i * (gridWidth + CONFIG.BRANCH_SPACING));
                    this.branchContainers[i].y = startY;
                }
            }

            clear() {
                for (let i = 0; i < CONFIG.BRANCH_COUNT; i++) {
                    this.branchContainers[i].removeChildren();
                    this.sprites[i] = {
                        player: null,
                        boxes: [],
                        targets: [],
                        walls: []
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

                // Draw border - active branch gets highlighted border
                const borderColor = branchIndex === this.state.activeBranch ? 
                    CONFIG.COLORS.ACTIVE_BORDER : CONFIG.COLORS.INACTIVE_BORDER;
                const borderWidth = branchIndex === this.state.activeBranch ? 3 : 1;
                
                graphics.lineStyle(borderWidth, borderColor, 0.8);
                graphics.drawRect(0, 0, this.state.width * CONFIG.TILE_SIZE, this.state.height * CONFIG.TILE_SIZE);

                this.branchContainers[branchIndex].addChild(graphics);
            }

            createWallSprite(x, y) {
                const graphics = new PIXI.Graphics();
                
                graphics.beginFill(CONFIG.COLORS.WALL);
                graphics.drawRect(0, 0, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                graphics.endFill();

                graphics.lineStyle(2, CONFIG.COLORS.WALL_EDGE);
                graphics.drawRect(2, 2, CONFIG.TILE_SIZE - 4, CONFIG.TILE_SIZE - 4);

                graphics.lineStyle(1, CONFIG.COLORS.WALL_EDGE, 0.3);
                graphics.moveTo(CONFIG.TILE_SIZE / 4, CONFIG.TILE_SIZE / 4);
                graphics.lineTo(CONFIG.TILE_SIZE * 3 / 4, CONFIG.TILE_SIZE * 3 / 4);
                graphics.moveTo(CONFIG.TILE_SIZE * 3 / 4, CONFIG.TILE_SIZE / 4);
                graphics.lineTo(CONFIG.TILE_SIZE / 4, CONFIG.TILE_SIZE * 3 / 4);

                graphics.x = x * CONFIG.TILE_SIZE;
                graphics.y = y * CONFIG.TILE_SIZE;
                return graphics;
            }

            createTargetSprite(x, y, target, branchIndex) {
                const graphics = new PIXI.Graphics();
                const centerX = CONFIG.TILE_SIZE / 2;
                const centerY = CONFIG.TILE_SIZE / 2;
                
                const colorName = this.state.targetColorsPerBranch[branchIndex]?.[target.id] || 'neutral';
                const colors = COLOR_MAP[colorName];
                const baseColor = colors.base;
                const lightColor = colors.light;

                // Inactive targets are barely visible
                const alpha = colorName === 'inactive' ? 0.2 : 1.0;

                // Outer glow circle
                graphics.beginFill(baseColor, 0.2 * alpha);
                graphics.drawCircle(centerX, centerY, 20);
                graphics.endFill();

                // Inner circle
                graphics.beginFill(lightColor, alpha);
                graphics.drawCircle(centerX, centerY, 8);
                graphics.endFill();

                // Cross pattern
                graphics.lineStyle(2, baseColor, alpha);
                graphics.moveTo(centerX - 12, centerY);
                graphics.lineTo(centerX + 12, centerY);
                graphics.moveTo(centerX, centerY - 12);
                graphics.lineTo(centerX, centerY + 12);

                graphics.x = x * CONFIG.TILE_SIZE;
                graphics.y = y * CONFIG.TILE_SIZE;
                return graphics;
            }

            createBoxSprite(x, y, box, branchIndex) {
                const graphics = new PIXI.Graphics();
                const padding = 6;
                
                const colorName = this.state.boxColors[box.id] || 'neutral';
                const colors = COLOR_MAP[colorName];
                const baseColor = colors.base;

                // Box shadow
                graphics.beginFill(0x000000, 0.3);
                graphics.drawRoundedRect(
                    padding + 2,
                    padding + 2,
                    CONFIG.TILE_SIZE - padding * 2,
                    CONFIG.TILE_SIZE - padding * 2,
                    6
                );
                graphics.endFill();

                // Main box
                graphics.beginFill(baseColor);
                graphics.drawRoundedRect(
                    padding,
                    padding,
                    CONFIG.TILE_SIZE - padding * 2,
                    CONFIG.TILE_SIZE - padding * 2,
                    6
                );
                graphics.endFill();

                // Box edges
                graphics.lineStyle(2, baseColor, 0.7);
                graphics.drawRoundedRect(
                    padding + 2,
                    padding + 2,
                    CONFIG.TILE_SIZE - padding * 2 - 4,
                    CONFIG.TILE_SIZE - padding * 2 - 4,
                    4
                );

                // Check if box is on correct target
                if (this.state.isBoxOnCorrectTarget(branchIndex, box)) {
                    // Draw checkmark or glow
                    graphics.lineStyle(3, CONFIG.COLORS.BOX_ON_TARGET);
                    const centerX = CONFIG.TILE_SIZE / 2;
                    const centerY = CONFIG.TILE_SIZE / 2;
                    graphics.moveTo(centerX - 8, centerY);
                    graphics.lineTo(centerX - 3, centerY + 5);
                    graphics.lineTo(centerX + 8, centerY - 5);
                }

                graphics.x = x * CONFIG.TILE_SIZE;
                graphics.y = y * CONFIG.TILE_SIZE;
                return graphics;
            }

            createPlayerSprite(x, y, branch) {
                const graphics = new PIXI.Graphics();
                const centerX = CONFIG.TILE_SIZE / 2;
                const centerY = CONFIG.TILE_SIZE / 2;
                
                // Outer glow
                graphics.beginFill(CONFIG.COLORS.PLAYER, 0.3);
                graphics.drawCircle(centerX, centerY, 16);
                graphics.endFill();

                // Main body
                graphics.beginFill(CONFIG.COLORS.PLAYER);
                graphics.drawCircle(centerX, centerY, 11);
                graphics.endFill();

                // Direction indicator
                const dir = branch.player.direction || { x: 1, y: 0 };
                graphics.lineStyle(3, CONFIG.COLORS.BACKGROUND, 1);
                
                if (dir.x === 1 && dir.y === 0) { // Right
                    graphics.moveTo(centerX - 5, centerY - 5);
                    graphics.lineTo(centerX + 5, centerY);
                    graphics.lineTo(centerX - 5, centerY + 5);
                } else if (dir.x === -1 && dir.y === 0) { // Left
                    graphics.moveTo(centerX + 5, centerY - 5);
                    graphics.lineTo(centerX - 5, centerY);
                    graphics.lineTo(centerX + 5, centerY + 5);
                } else if (dir.x === 0 && dir.y === -1) { // Up
                    graphics.moveTo(centerX - 5, centerY + 5);
                    graphics.lineTo(centerX, centerY - 5);
                    graphics.lineTo(centerX + 5, centerY + 5);
                } else if (dir.x === 0 && dir.y === 1) { // Down
                    graphics.moveTo(centerX - 5, centerY - 5);
                    graphics.lineTo(centerX, centerY + 5);
                    graphics.lineTo(centerX + 5, centerY - 5);
                }

                graphics.x = x * CONFIG.TILE_SIZE;
                graphics.y = y * CONFIG.TILE_SIZE;
                return graphics;
            }

            renderScene() {
                this.clear();

                for (let branchIndex = 0; branchIndex < CONFIG.BRANCH_COUNT; branchIndex++) {
                    const branch = this.state.branches[branchIndex];
                    
                    this.drawGrid(branchIndex);

                    // Render walls (same for all branches)
                    this.state.walls.forEach(wall => {
                        const sprite = this.createWallSprite(wall.x, wall.y);
                        this.sprites[branchIndex].walls.push(sprite);
                        this.branchContainers[branchIndex].addChild(sprite);
                    });

                    // Render targets (different colors per branch!)
                    this.state.targets.forEach(target => {
                        const sprite = this.createTargetSprite(target.x, target.y, target, branchIndex);
                        this.sprites[branchIndex].targets.push(sprite);
                        this.branchContainers[branchIndex].addChild(sprite);
                    });

                    // Render boxes (different per branch)
                    branch.boxes.forEach(box => {
                        const sprite = this.createBoxSprite(box.x, box.y, box, branchIndex);
                        this.sprites[branchIndex].boxes.push(sprite);
                        this.branchContainers[branchIndex].addChild(sprite);
                    });

                    // Render player (different per branch)
                    this.sprites[branchIndex].player = this.createPlayerSprite(
                        branch.player.x, 
                        branch.player.y, 
                        branch
                    );
                    this.branchContainers[branchIndex].addChild(this.sprites[branchIndex].player);
                }

                this.positionBranches();
            }

            animateMove(branchIndex, entity, fromX, fromY, toX, toY, onComplete) {
                const branch = this.state.branches[branchIndex];
                const sprite = entity === branch.player ? 
                    this.sprites[branchIndex].player : 
                    this.sprites[branchIndex].boxes.find(s => 
                        s.x === fromX * CONFIG.TILE_SIZE && 
                        s.y === fromY * CONFIG.TILE_SIZE
                    );

                if (!sprite) return onComplete();

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
                        return;
                    }

                    const eased = 1 - Math.pow(1 - progress, 3);
                    sprite.x = startX + (endX - startX) * eased;
                    sprite.y = startY + (endY - startY) * eased;

                    requestAnimationFrame(animate);
                };
                animate();
            }

            createParticles(branchIndex, x, y, color = CONFIG.COLORS.PARTICLE, count = 8) {
                const container = this.branchContainers[branchIndex];
                const centerX = (x + 0.5) * CONFIG.TILE_SIZE + container.x;
                const centerY = (y + 0.5) * CONFIG.TILE_SIZE + container.y;

                for (let i = 0; i < count; i++) {
                    const angle = (Math.PI * 2 * i) / count;
                    const speed = 2 + Math.random() * 2;
                    
                    const particle = new PIXI.Graphics();
                    particle.beginFill(color);
                    particle.drawCircle(0, 0, 3);
                    particle.endFill();
                    particle.x = centerX;
                    particle.y = centerY;
                    
                    const vx = Math.cos(angle) * speed;
                    const vy = Math.sin(angle) * speed;
                    let life = 1.0;

                    this.particleContainer.addChild(particle);

                    const updateParticle = () => {
                        particle.x += vx;
                        particle.y += vy;
                        life -= 0.03;
                        particle.alpha = life;

                        if (life <= 0) {
                            this.particleContainer.removeChild(particle);
                        } else {
                            requestAnimationFrame(updateParticle);
                        }
                    };
                    updateParticle();
                }
            }

            updateBranchIndicators(activeBranch) {
                const indicators = ['branch-a-indicator', 'branch-b-indicator'];
                indicators.forEach((id, index) => {
                    const elem = document.getElementById(id);
                    if (index === activeBranch) {
                        elem.classList.add('active');
                    } else {
                        elem.classList.remove('active');
                    }
                });
            }
        }
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.map = new GameMap(this.canvas);
        
        // Game state
        this.money = 100;
        this.lives = 10;
        this.wave = 1;
        this.isGameOver = false;
        this.enemies = [];
        this.selectedTowerType = null;
        this.inventory = [];
        
        // Drag and drop state
        this.isDragging = false;
        this.dragTower = null;
        this.dragX = 0;
        this.dragY = 0;
        this.inventory = [];
        
        // Wave configuration
        this.waveConfig = {
            spawnInterval: 1000,
            enemiesPerWave: 10,
            lastSpawnTime: 0,
            enemiesSpawned: 0,
            waveStarted: false,
            timeBetweenWaves: 5000
        };

        // 初始化事件监听
        this.initEventListeners();
        
        // 开始游戏循环
        this.lastUpdate = performance.now();
        this.gameLoop();
    }

    // Initialize event listeners
    initEventListeners() {
        // Drag tower from map
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.isGameOver) return;

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const gridX = Math.floor(x / this.map.gridSize);
            const gridY = Math.floor(y / this.map.gridSize);
            
            // Check if in enemy activity area
            const isInEnemyArea = gridX >= this.map.enemyActivityArea.startCol &&
                                 gridX <= this.map.enemyActivityArea.endCol &&
                                 gridY >= this.map.enemyActivityArea.startRow &&
                                 gridY <= this.map.enemyActivityArea.endRow;

            if (isInEnemyArea) return; // Not allowed to drag from enemy activity area
            
            const tower = this.map.towers.find(t => 
                t.gridX === gridX &&
                t.gridY === gridY
            );

            if (tower) {
                this.isDragging = true;
                this.dragTower = tower;
                this.dragX = x;
                this.dragY = y;
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.dragTower) return;

            const rect = this.canvas.getBoundingClientRect();
            this.dragX = e.clientX - rect.left;
            this.dragY = e.clientY - rect.top;
            const gridX = Math.floor(this.dragX / this.map.gridSize);
            const gridY = Math.floor(this.dragY / this.map.gridSize);

            // Check if in enemy activity area
            const isInEnemyArea = gridX >= this.map.enemyActivityArea.startCol &&
                                 gridX <= this.map.enemyActivityArea.endCol &&
                                 gridY >= this.map.enemyActivityArea.startRow &&
                                 gridY <= this.map.enemyActivityArea.endRow;

            if (!isInEnemyArea) {
                // Update position of the tower being dragged
                const gridPos = this.map.getGridPosition(this.dragX, this.dragY);
                this.dragTower.gridX = Math.floor(gridPos.x / this.map.gridSize);
                this.dragTower.gridY = Math.floor(gridPos.y / this.map.gridSize);
                this.dragTower.x = this.dragTower.gridX * this.map.gridSize + this.map.gridSize / 2;
                this.dragTower.y = this.dragTower.gridY * this.map.gridSize + this.map.gridSize / 2;
            }
        });

        // Cancel drag when mouse leaves canvas
        this.canvas.addEventListener('mouseup', (e) => {
            if (!this.isDragging || !this.dragTower) return;

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const gridX = Math.floor(x / this.map.gridSize);
            const gridY = Math.floor(y / this.map.gridSize);
            
            // Check if in enemy activity area
            const isInEnemyArea = gridX >= this.map.enemyActivityArea.startCol &&
                                 gridX <= this.map.enemyActivityArea.endCol &&
                                 gridY >= this.map.enemyActivityArea.startRow &&
                                 gridY <= this.map.enemyActivityArea.endRow;

            if (isInEnemyArea) {
                // If dragged to enemy activity area, restore tower's original position
                const gridPos = this.map.getGridPosition(this.dragTower.x, this.dragTower.y);
                this.dragTower.gridX = Math.floor(gridPos.x / this.map.gridSize);
                this.dragTower.gridY = Math.floor(gridPos.y / this.map.gridSize);
                this.dragTower.x = this.dragTower.gridX * this.map.gridSize + this.map.gridSize / 2;
                this.dragTower.y = this.dragTower.gridY * this.map.gridSize + this.map.gridSize / 2;
            } else {
                // Check if there's another tower at target position
                const targetTower = this.map.towers.find(tower => 
                    tower !== this.dragTower &&
                    tower.gridX === gridX &&
                    tower.gridY === gridY
                );

                if (targetTower) {
                    if (this.dragTower.canMerge(targetTower)) {
                        // Merge and upgrade
                        targetTower.upgrade();
                        const index = this.map.towers.indexOf(this.dragTower);
                        if (index > -1) this.map.towers.splice(index, 1);
                    } else {
                        // Swap positions
                        const tempGridX = this.dragTower.gridX;
                        const tempGridY = this.dragTower.gridY;
                        const tempX = this.dragTower.x;
                        const tempY = this.dragTower.y;
                        
                        this.dragTower.gridX = targetTower.gridX;
                        this.dragTower.gridY = targetTower.gridY;
                        this.dragTower.x = targetTower.x;
                        this.dragTower.y = targetTower.y;
                        
                        targetTower.gridX = tempGridX;
                        targetTower.gridY = tempGridY;
                        targetTower.x = tempX;
                        targetTower.y = tempY;
                    }
                } else if (this.map.canPlaceTower(x, y, this.dragTower)) {
                    // Move to new position
                    const gridPos = this.map.getGridPosition(x, y);
                    this.dragTower.gridX = Math.floor(gridPos.x / this.map.gridSize);
                    this.dragTower.gridY = Math.floor(gridPos.y / this.map.gridSize);
                    this.dragTower.x = this.dragTower.gridX * this.map.gridSize + this.map.gridSize / 2;
                    this.dragTower.y = this.dragTower.gridY * this.map.gridSize + this.map.gridSize / 2;
                } else {
                    // If can't place, restore original position
                    const gridPos = this.map.getGridPosition(this.dragTower.x, this.dragTower.y);
                    this.dragTower.gridX = Math.floor(gridPos.x / this.map.gridSize);
                    this.dragTower.gridY = Math.floor(gridPos.y / this.map.gridSize);
                    this.dragTower.x = this.dragTower.gridX * this.map.gridSize + this.map.gridSize / 2;
                    this.dragTower.y = this.dragTower.gridY * this.map.gridSize + this.map.gridSize / 2;
                }
            }
            
            this.isDragging = false;
            this.dragTower = null;
            this.selectedTowerType = null;
        });
    }

    // Buy tower and place in inventory area
    buyTower(type) {
        if (this.isGameOver) return;
        const tower = new Tower(0, 0, type, this.map.towerPlacementArea, this.map.inventorySlotsArea);
        if (this.money >= tower.cost) {
            // Find empty slot in inventory area
            for (let y = this.map.inventorySlotsArea.startRow; y <= this.map.inventorySlotsArea.endRow; y++) {
                for (let x = this.map.inventorySlotsArea.startCol; x <= this.map.inventorySlotsArea.endCol; x++) {
                    const posX = x * this.map.gridSize + this.map.gridSize / 2;
                    const posY = y * this.map.gridSize + this.map.gridSize / 2;
                    if (this.map.canPlaceTower(posX, posY)) {
                        this.money -= tower.cost;
                        tower.x = posX;
                        tower.y = posY;
                        tower.gridX = x;
                        tower.gridY = y;
                        this.map.addTower(tower);
                        this.updateUI();
                        return;
                    }
                }
            }
        }
    }

    // Place tower
    placeTower(x, y) {
        if (!this.selectedTowerType) return;

        const tower = new Tower(x, y, this.selectedTowerType, this.map.towerPlacementArea, this.map.inventorySlotsArea);
        if (this.money >= tower.cost && this.map.canPlaceTower(x, y)) {
            this.money -= tower.cost;
            this.map.addTower(tower);
            this.updateUI();
        }

        this.selectedTowerType = null;
    }

    // Spawn enemy
    spawnEnemy() {
        const types = ['normal', 'fast', 'tank'];
        const type = types[utils.randomInt(0, types.length - 1)];
        const enemy = new Enemy(this.map.getPathPoints(), type);
        this.enemies.push(enemy);
    }

    // Update game state
    update(currentTime) {
        // Handle wave
        if (!this.waveConfig.waveStarted) {
            if (currentTime - this.waveConfig.lastSpawnTime >= this.waveConfig.timeBetweenWaves) {
                this.waveConfig.waveStarted = true;
                this.waveConfig.enemiesSpawned = 0;
                this.wave++;
                this.updateUI();
            }
        } else if (this.waveConfig.enemiesSpawned < this.waveConfig.enemiesPerWave) {
            if (currentTime - this.waveConfig.lastSpawnTime >= this.waveConfig.spawnInterval) {
                this.spawnEnemy();
                this.waveConfig.enemiesSpawned++;
                this.waveConfig.lastSpawnTime = currentTime;
            }
        } else if (this.enemies.length === 0) {
            this.waveConfig.waveStarted = false;
            this.waveConfig.lastSpawnTime = currentTime;
            this.waveConfig.enemiesPerWave += 5;
            this.money += 50; // Wave reward
            this.updateUI();
        }

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update();

            if (enemy.isDead) {
                this.money += enemy.reward;
                this.enemies.splice(i, 1);
                this.updateUI();
            } else if (enemy.reachedEnd) {
                this.lives--;
                this.enemies.splice(i, 1);
                this.updateUI();

                if (this.lives <= 0) {
                    this.isGameOver = true;
                }
            }
        }

        // Update defense towers
        this.map.towers.forEach(tower => {
            tower.findTarget(this.enemies);
            tower.attack(currentTime);
            tower.updateBullets(this.enemies);
        });
    }

    // Render game screen
    render() {
        this.map.render();

        // Render enemies
        this.enemies.forEach(enemy => enemy.render(this.ctx));

        // Render defense towers
        this.map.towers.forEach(tower => tower.render(this.ctx));

        // Render tower being dragged
        if (this.isDragging && this.dragTower) {
            this.dragTower.render(this.ctx);
            
            // Show placement validity indicator
            const canPlace = this.map.canPlaceTower(this.dragX, this.dragY);
            this.ctx.strokeStyle = canPlace ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
            this.ctx.lineWidth = 2;
            const gridPos = this.map.getGridPosition(this.dragX, this.dragY);
            this.ctx.strokeRect(gridPos.x, gridPos.y, this.map.gridSize, this.map.gridSize);
        }

        // Render game over screen
        if (this.isGameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game over', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    // Update UI
    updateUI() {
        document.getElementById('money').textContent = this.money;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('wave').textContent = this.wave;
    }

    // Game main loop
    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastUpdate;

        this.update(currentTime);
        this.render();

        this.lastUpdate = currentTime;
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game
const game = new Game();
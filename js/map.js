class GameMap {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 40; // Size of each grid cell
        this.canvas.width = 680; // 17 columns * 40
        this.rows = Math.floor(canvas.height / this.gridSize);
        this.cols = Math.floor(canvas.width / this.gridSize);

        // Define enemy activity area (from row 3 to row 6, excluding the last column)
        this.enemyActivityArea = {
            startRow: 2,
            endRow: 5,
            startCol: 0,
            endCol: this.cols - 4
        };

        // Define tower placement area (last column, from row 3 to row 6)
        this.towerPlacementArea = {
            startRow: 2,
            endRow: 5,
            col: this.cols - 3
        };

        // Define inventory area (from row 3 to row 6, last two columns)
        this.inventorySlotsArea = {
            startRow: 2,
            endRow: 5,
            startCol: this.cols - 2,
            endCol: this.cols - 1
        };

        // Define path points (enemy movement path)
        this.pathPoints = [
            // Starting points (y coordinates from 2 to 5)
            {x: 0, y: 2},
            {x: 15, y: 2},
            {x: 0, y: 3},
            {x: 15, y: 3},
            {x: 0, y: 4},
            {x: 15, y: 4},
            {x: 0, y: 5},
            {x: 15, y: 5}
        ];

        // Store placed towers
        this.towers = [];
    }

    // Draw grid
    drawGrid() {
        // Draw background color for enemy activity area
        this.ctx.fillStyle = utils.colors.path;
        this.ctx.fillRect(
            this.enemyActivityArea.startCol * this.gridSize,
            this.enemyActivityArea.startRow * this.gridSize,
            (this.enemyActivityArea.endCol - this.enemyActivityArea.startCol + 1) * this.gridSize,
            (this.enemyActivityArea.endRow - this.enemyActivityArea.startRow + 1) * this.gridSize
        );

        // Draw background color for tower placement area
        this.ctx.fillStyle = '#e6ffe6';
        this.ctx.fillRect(
            this.towerPlacementArea.col * this.gridSize,
            this.towerPlacementArea.startRow * this.gridSize,
            this.gridSize,
            (this.towerPlacementArea.endRow - this.towerPlacementArea.startRow + 1) * this.gridSize
        );

        // Draw background color for inventory area
        this.ctx.fillStyle = '#fff3e0';
        this.ctx.fillRect(
            this.inventorySlotsArea.startCol * this.gridSize,
            this.inventorySlotsArea.startRow * this.gridSize,
            (this.inventorySlotsArea.endCol - this.inventorySlotsArea.startCol + 1) * this.gridSize,
            (this.inventorySlotsArea.endRow - this.inventorySlotsArea.startRow + 1) * this.gridSize
        );

        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;

        // Draw vertical lines
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    // Check if a tower can be placed at the position
    canPlaceTower(x, y, sourceTower = null) {
        // Convert to grid coordinates
        const gridX = Math.floor(x / this.gridSize);
        const gridY = Math.floor(y / this.gridSize);
    
        // Check if position is in tower placement area
        const isInTowerArea = gridX === this.towerPlacementArea.col &&
                             gridY >= this.towerPlacementArea.startRow &&
                             gridY <= this.towerPlacementArea.endRow;

        // Check if position is in inventory area
        const isInInventoryArea = gridX >= this.inventorySlotsArea.startCol &&
                                 gridX <= this.inventorySlotsArea.endCol &&
                                 gridY >= this.inventorySlotsArea.startRow &&
                                 gridY <= this.inventorySlotsArea.endRow;
    
        // Check if position is on the path
        const isOnPath = this.pathPoints.some(point => 
            point.x === gridX && point.y === gridY
        );
    
        // Get tower at target position
        const targetTower = this.towers.find(tower => 
            tower.gridX === gridX && tower.gridY === gridY
        );
    
        // If tower is being dragged from the map
        if (sourceTower) {
            // Get source tower position information
            const isSourceInInventory = sourceTower.gridX >= this.inventorySlotsArea.startCol &&
                                       sourceTower.gridX <= this.inventorySlotsArea.endCol &&
                                       sourceTower.gridY >= this.inventorySlotsArea.startRow &&
                                       sourceTower.gridY <= this.inventorySlotsArea.endRow;

            // If there's a tower at target position
            if (targetTower) {
                // Check if towers can be merged (same type and level)
                if (sourceTower.type === targetTower.type && sourceTower.level === targetTower.level) {
                    return true;
                }
                // Check if towers can be swapped (different towers in same area)
                return (isInTowerArea && !isSourceInInventory) || (isInInventoryArea && isSourceInInventory);
            }

            // If target position has no tower
            // Allow dragging from inventory to tower area, or from tower area to inventory
            // Or place at original position (cancel drag)
            return (isInTowerArea && isSourceInInventory) || 
                   (isInInventoryArea && !isSourceInInventory) || 
                   (sourceTower.gridX === gridX && sourceTower.gridY === gridY);
        }
    
        // If it's a newly purchased tower, only allow placement in inventory area with no other tower
        return isInInventoryArea && !targetTower;
    }

    // Get grid position
    getGridPosition(x, y) {
        return {
            x: Math.floor(x / this.gridSize) * this.gridSize,
            y: Math.floor(y / this.gridSize) * this.gridSize
        };
    }

    // Add tower
    addTower(tower) {
        this.towers.push(tower);
    }

    // Get path points
    getPathPoints() {
        return this.pathPoints.map(point => ({
            x: point.x * this.gridSize + this.gridSize / 2,
            y: point.y * this.gridSize + this.gridSize / 2
        }));
    }

    // Clear canvas
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Render map
    render() {
        this.clear();
        this.drawGrid();
    }
}
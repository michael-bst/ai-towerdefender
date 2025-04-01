class Tower {
    constructor(x, y, type = 'basic', towerPlacementArea = null, inventorySlotsArea = null) {
        this.gridX = Math.floor(x / 40); // Grid coordinate X
        this.gridY = Math.floor(y / 40); // Grid coordinate Y
        this.x = this.gridX * 40 + 20; // Center point X
        this.y = this.gridY * 40 + 20; // Center point Y
        this.type = type;
        this.target = null;
        this.lastShot = 0;
        this.level = 1; // Add level property
        this.towerPlacementArea = towerPlacementArea;
        this.inventorySlotsArea = inventorySlotsArea
        
        // Set properties based on tower type
        switch(type) {
            case 'sniper':
                this.damage = 50 * this.level;
                this.range = 800;
                this.fireRate = 1500 / this.level; // milliseconds
                this.cost = 100;
                break;
            case 'aoe':
                this.damage = 20 * this.level;
                this.range = 800;
                this.fireRate = 2000 / this.level;
                this.cost = 150;
                this.splashRadius = 50 * this.level;
                break;
            default: // basic
                this.damage = 25 * this.level;
                this.range = 800;
                this.fireRate = 1000 / this.level;
                this.cost = 50;
        }

        this.bullets = [];
    }

    // Find target
    findTarget(enemies) {
        // Check if tower is in inventory area
        if (this.inventorySlotsArea && 
            this.gridX >= this.inventorySlotsArea.startCol && 
            this.gridX <= this.inventorySlotsArea.endCol && 
            this.gridY >= this.inventorySlotsArea.startRow && 
            this.gridY <= this.inventorySlotsArea.endRow) {
            this.target = null;
            return;
        }

        // First check if current target is still valid
        if (this.target && !this.target.isDead && !this.target.reachedEnd &&
            utils.getDistance(this.x, this.y, this.target.x, this.target.y) <= this.range) {
            return; // Keep current target
        }

        // Get tower's row (y coordinate)
        const towerRow = Math.floor(this.y / 40);

        // First try to find enemies in the same row
        this.target = enemies.find(enemy => 
            !enemy.isDead && 
            !enemy.reachedEnd && 
            Math.floor(enemy.y / 40) === towerRow && 
            utils.getDistance(this.x, this.y, enemy.x, enemy.y) <= this.range
        );

        // If no enemies in the same row, find any enemy within range
        if (!this.target) {
            this.target = enemies.find(enemy => 
                !enemy.isDead && 
                !enemy.reachedEnd && 
                utils.getDistance(this.x, this.y, enemy.x, enemy.y) <= this.range
            );
        }
    }

    // Attack
    attack(currentTime) {
        // Check if tower is in inventory area
        if (this.inventorySlotsArea && 
            this.gridX >= this.inventorySlotsArea.startCol && 
            this.gridX <= this.inventorySlotsArea.endCol && 
            this.gridY >= this.inventorySlotsArea.startRow && 
            this.gridY <= this.inventorySlotsArea.endRow) return;

        if (!this.target || currentTime - this.lastShot < this.fireRate) return;

        // Create bullet
        this.bullets.push({
            x: this.x,
            y: this.y,
            targetX: this.target.x,
            targetY: this.target.y,
            speed: 5,
            damage: this.damage,
            splashRadius: this.type === 'aoe' ? this.splashRadius : 0
        });

        this.lastShot = currentTime;
    }

    // Update bullets
    updateBullets(enemies) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // Update target position (track moving enemies)
            if (bullet.target && !bullet.target.isDead && !bullet.target.reachedEnd) {
                bullet.targetX = bullet.target.x;
                bullet.targetY = bullet.target.y;
            }
            
            const dx = bullet.targetX - bullet.x;
            const dy = bullet.targetY - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Update bullet position
            if (distance > 0) {
                bullet.x += (dx / distance) * bullet.speed;
                bullet.y += (dy / distance) * bullet.speed;
            }

            // Check if bullet hits enemy
            let hit = false;
            if (bullet.splashRadius > 0) {
                // AOE damage
                enemies.forEach(enemy => {
                    if (!enemy.isDead && !enemy.reachedEnd &&
                        utils.getDistance(bullet.x, bullet.y, enemy.x, enemy.y) <= bullet.splashRadius) {
                        enemy.takeDamage(bullet.damage);
                        hit = true;
                    }
                });
            } else {
                // Single target damage
                const hitEnemy = enemies.find(enemy => 
                    !enemy.isDead && 
                    !enemy.reachedEnd && 
                    utils.getDistance(bullet.x, bullet.y, enemy.x, enemy.y) < enemy.size
                );
                if (hitEnemy) {
                    hitEnemy.takeDamage(bullet.damage);
                    hit = true;
                }
            }

            // Remove bullet if it hits or exceeds range
            if (hit || distance < bullet.speed || distance > this.range * 1.5) {
                this.bullets.splice(i, 1);
            }
        }
    }

    // Upgrade tower
    upgrade() {
        this.level++;
        // Update properties
        switch(this.type) {
            case 'sniper':
                this.damage = 50 * this.level;
                this.fireRate = 1500 / this.level;
                break;
            case 'aoe':
                this.damage = 20 * this.level;
                this.fireRate = 2000 / this.level;
                this.splashRadius = 50 * this.level;
                break;
            default: // basic
                this.damage = 25 * this.level;
                this.fireRate = 1000 / this.level;
        }
    }

    // Swap positions
    swapPosition(otherTower) {
        const tempX = this.gridX;
        const tempY = this.gridY;
        const tempCenterX = this.x;
        const tempCenterY = this.y;

        this.gridX = otherTower.gridX;
        this.gridY = otherTower.gridY;
        this.x = otherTower.x;
        this.y = otherTower.y;

        otherTower.gridX = tempX;
        otherTower.gridY = tempY;
        otherTower.x = tempCenterX;
        otherTower.y = tempCenterY;
    }

    // Check if towers can be merged
    canMerge(otherTower) {
        return this.type === otherTower.type && this.level === otherTower.level;
    }

    // Render
    render(ctx) {
        // Draw tower
        ctx.fillStyle = utils.colors.tower;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Draw Attack Range (shown only when selected)
        if (this.selected) {
            ctx.strokeStyle = utils.colors.range;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Drawing bullets
        ctx.fillStyle = utils.colors.bullet;
        this.bullets.forEach(bullet => {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Mapping of tower type identification and rating
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.type[0].toUpperCase()}${this.level}`, this.x, this.y + 4);
    }
}
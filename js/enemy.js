class Enemy {
    constructor(pathPoints, type = 'normal') {
        // Group path points by y-coordinate
        const pathGroups = {};
        pathPoints.forEach(point => {
            if (!pathGroups[point.y]) {
                pathGroups[point.y] = [];
            }
            pathGroups[point.y].push(point);
        });

        // Randomly select a path
        const availableYs = Object.keys(pathGroups);
        const selectedY = availableYs[Math.floor(Math.random() * availableYs.length)];
        this.pathPoints = pathGroups[selectedY];
        this.currentPoint = 0;
        this.x = this.pathPoints[0].x;
        this.y = this.pathPoints[0].y;
        this.type = type;
        
        // Setting Properties by Type
        switch(type) {
            case 'fast':
                this.speed = 0.5;
                this.maxHealth = 50;
                this.reward = 15;
                this.size = 15;
                break;
            case 'tank':
                this.speed = 0.125;
                this.maxHealth = 200;
                this.reward = 25;
                this.size = 25;
                break;
            default: // normal
                this.speed = 0.25;
                this.maxHealth = 100;
                this.reward = 20;
                this.size = 20;
        }
        
        this.health = this.maxHealth;
        this.isDead = false;
        this.reachedEnd = false;
    }

    // Update Enemy Position
    update() {
        if (this.isDead || this.reachedEnd) return;

        const targetPoint = this.pathPoints[this.currentPoint + 1];
        if (!targetPoint) {
            this.reachedEnd = true;
            return;
        }

        const dx = targetPoint.x - this.x;
        const dy = targetPoint.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
            this.x = targetPoint.x;
            this.y = targetPoint.y;
            this.currentPoint++;
        } else {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }

    // harmed
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
    }

    // Rendering the enemy
    render(ctx) {
        if (this.isDead) return;

        // Drawing the enemy
        ctx.fillStyle = utils.colors.enemy;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Drawing Blood Strips
        const healthBarWidth = this.size * 2;
        const healthBarHeight = 4;
        const healthPercentage = this.health / this.maxHealth;

        // Bloodstain Background
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.size - 10,
                    healthBarWidth, healthBarHeight);

        // Current blood level
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - healthBarWidth/2, this.y - this.size - 10,
                    healthBarWidth * healthPercentage, healthBarHeight);
    }
}
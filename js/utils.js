// Utility functions
const utils = {
    // Calculate distance between two points
    getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },

    // Calculate angle between two points
    getAngle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    // Check if a point is inside a circle
    isPointInCircle(x, y, centerX, centerY, radius) {
        return this.getDistance(x, y, centerX, centerY) <= radius;
    },

    // Generate random integer
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Convert degrees to radians
    degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    },

    // Convert radians to degrees
    radiansToDegrees(radians) {
        return radians * 180 / Math.PI;
    },

    // Check if two circles intersect
    circlesIntersect(x1, y1, r1, x2, y2, r2) {
        return this.getDistance(x1, y1, x2, y2) <= r1 + r2;
    },

    // Color utility functions
    colors: {
        tower: '#4A90E2',
        enemy: '#E74C3C',
        bullet: '#2C3E50',
        range: 'rgba(74, 144, 226, 0.2)',
        path: '#95A5A6'
    }
};
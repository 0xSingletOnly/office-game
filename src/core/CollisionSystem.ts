import * as THREE from 'three';

/**
 * Represents a collidable object in the world
 */
export interface Collidable {
  getBoundingBox(): THREE.Box3;
  getPosition(): THREE.Vector3;
}

/**
 * CollisionSystem - Manages all collidable objects and provides collision detection
 */
export class CollisionSystem {
  private collidables: THREE.Box3[] = [];
  private collidableMeshes: THREE.Mesh[] = [];
  
  /**
   * Add a mesh as a collidable object
   */
  addMesh(mesh: THREE.Mesh | THREE.Group): void {
    if (mesh instanceof THREE.Mesh) {
      const box = new THREE.Box3().setFromObject(mesh);
      this.collidables.push(box);
      this.collidableMeshes.push(mesh);
    } else if (mesh instanceof THREE.Group) {
      // For groups, get bounding box of all children
      const box = new THREE.Box3().setFromObject(mesh);
      this.collidables.push(box);
      // Store reference to group for updates
      this.collidableMeshes.push(mesh as any);
    }
  }
  
  /**
   * Add a custom bounding box
   */
  addBoundingBox(box: THREE.Box3): void {
    this.collidables.push(box);
  }
  
  /**
   * Create and add a box collider from dimensions and position
   */
  addBoxCollider(
    width: number, 
    height: number, 
    depth: number, 
    x: number, 
    y: number, 
    z: number
  ): void {
    const min = new THREE.Vector3(x - width/2, y, z - depth/2);
    const max = new THREE.Vector3(x + width/2, y + height, z + depth/2);
    const box = new THREE.Box3(min, max);
    this.collidables.push(box);
  }
  
  /**
   * Update all collidable bounding boxes (in case objects moved)
   */
  update(): void {
    for (let i = 0; i < this.collidableMeshes.length; i++) {
      const mesh = this.collidableMeshes[i];
      if (mesh) {
        this.collidables[i].setFromObject(mesh);
      }
    }
  }
  
  /**
   * Check if a point collides with any collidable object
   */
  checkPointCollision(point: THREE.Vector3): boolean {
    for (const box of this.collidables) {
      if (box.containsPoint(point)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Check if a sphere collides with any collidable object
   * Returns the collision normal and penetration depth if collision occurs
   */
  checkSphereCollision(
    center: THREE.Vector3, 
    radius: number
  ): { collided: boolean; normal: THREE.Vector3; depth: number } {
    for (const box of this.collidables) {
      // Find closest point on box to sphere center
      const closestPoint = new THREE.Vector3(
        Math.max(box.min.x, Math.min(center.x, box.max.x)),
        Math.max(box.min.y, Math.min(center.y, box.max.y)),
        Math.max(box.min.z, Math.min(center.z, box.max.z))
      );
      
      // Calculate distance from sphere center to closest point
      const distance = center.distanceTo(closestPoint);
      
      if (distance < radius) {
        // Collision detected
        const normal = new THREE.Vector3().subVectors(center, closestPoint).normalize();
        // If center is inside the box, push out along Y axis
        if (distance === 0) {
          normal.set(0, 1, 0);
        }
        const depth = radius - distance;
        return { collided: true, normal, depth };
      }
    }
    
    return { collided: false, normal: new THREE.Vector3(), depth: 0 };
  }
  
  /**
   * Resolve collision for a moving player
   * Returns the corrected position
   */
  resolvePlayerCollision(
    currentPos: THREE.Vector3,
    desiredPos: THREE.Vector3,
    playerRadius: number = 0.3
  ): THREE.Vector3 {
    const result = desiredPos.clone();
    
    // Check collision at desired position
    const collision = this.checkSphereCollision(result, playerRadius);
    
    if (collision.collided) {
      // Push the player out along the collision normal
      result.addScaledVector(collision.normal, collision.depth);
      
      // Also check if we need to slide along the wall
      // Try sliding on X axis only
      const slideX = new THREE.Vector3(desiredPos.x, result.y, currentPos.z);
      const collisionX = this.checkSphereCollision(slideX, playerRadius);
      
      // Try sliding on Z axis only
      const slideZ = new THREE.Vector3(currentPos.x, result.y, desiredPos.z);
      const collisionZ = this.checkSphereCollision(slideZ, playerRadius);
      
      // Choose the direction that doesn't collide
      if (!collisionX.collided && collisionZ.collided) {
        result.x = desiredPos.x;
      } else if (collisionX.collided && !collisionZ.collided) {
        result.z = desiredPos.z;
      }
      // If both collide, we're in a corner - stay at pushed position
    }
    
    return result;
  }
  
  /**
   * Clear all collidables
   */
  clear(): void {
    this.collidables = [];
    this.collidableMeshes = [];
  }
  
  /**
   * Get all collidable bounding boxes (for debugging)
   */
  getCollidables(): THREE.Box3[] {
    return this.collidables;
  }
  
  /**
   * Visualize collidables for debugging
   */
  getDebugVisuals(): THREE.LineSegments[] {
    const visuals: THREE.LineSegments[] = [];
    
    for (const box of this.collidables) {
      const helper = new THREE.Box3Helper(box, 0xff0000);
      visuals.push(helper);
    }
    
    return visuals;
  }
}

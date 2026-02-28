import * as THREE from 'three';

/**
 * VisionCone - Handles Louis's line of sight detection
 */
export class VisionCone {
  private origin: THREE.Vector3 = new THREE.Vector3();
  private direction: THREE.Vector3 = new THREE.Vector3();
  private fov: number;           // Field of view in radians
  private range: number;         // Max detection range
  private debugMesh?: THREE.Mesh;

  constructor(fovDegrees: number = 120, range: number = 15) {
    this.fov = THREE.MathUtils.degToRad(fovDegrees);
    this.range = range;
  }

  /**
   * Check if a target is within the vision cone
   */
  canSeeTarget(
    fromPosition: THREE.Vector3,
    fromRotation: number,
    targetPosition: THREE.Vector3,
    walls?: THREE.Mesh[]
  ): boolean {
    // Update origin and direction
    this.origin.copy(fromPosition);
    this.direction.set(Math.sin(fromRotation), 0, Math.cos(fromRotation));

    // Calculate vector to target
    const toTarget = new THREE.Vector3().subVectors(targetPosition, this.origin);
    const distance = toTarget.length();

    // Check range
    if (distance > this.range) {
      return false;
    }

    // Check angle (FOV)
    toTarget.normalize();
    const angle = this.direction.angleTo(toTarget);
    if (angle > this.fov / 2) {
      return false;
    }

    // Check line of sight (walls block vision)
    if (walls && walls.length > 0) {
      const raycaster = new THREE.Raycaster(
        fromPosition.clone().add(new THREE.Vector3(0, 1.5, 0)), // Eye level
        toTarget,
        0,
        distance
      );

      const intersects = raycaster.intersectObjects(walls);
      if (intersects.length > 0) {
        return false; // Wall blocks vision
      }
    }

    return true;
  }

  /**
   * Get detection level (0-1) based on distance and angle
   * Closer and more centered = higher detection
   */
  getDetectionLevel(
    fromPosition: THREE.Vector3,
    fromRotation: number,
    targetPosition: THREE.Vector3,
    walls?: THREE.Mesh[]
  ): number {
    if (!this.canSeeTarget(fromPosition, fromRotation, targetPosition, walls)) {
      return 0;
    }

    const toTarget = new THREE.Vector3().subVectors(targetPosition, fromPosition);
    const distance = toTarget.length();
    toTarget.normalize();

    // Distance factor (closer = higher)
    const distanceFactor = 1 - (distance / this.range);

    // Angle factor (more centered = higher)
    const angle = this.direction.angleTo(toTarget);
    const angleFactor = 1 - (angle / (this.fov / 2));

    // Combine factors
    return Math.max(0, Math.min(1, distanceFactor * angleFactor));
  }

  /**
   * Create a debug visual for the vision cone
   */
  createDebugVisual(scene: THREE.Scene): void {
    // Create a cone geometry to visualize FOV
    const geometry = new THREE.ConeGeometry(
      this.range * Math.tan(this.fov / 2),
      this.range,
      32,
      1,
      true
    );
    geometry.rotateX(-Math.PI / 2); // Point forward
    geometry.translate(0, 0, this.range / 2); // Move origin to tip

    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.debugMesh = new THREE.Mesh(geometry, material);
    this.debugMesh.visible = false; // Hidden by default
    scene.add(this.debugMesh);
  }

  updateDebugVisual(position: THREE.Vector3, rotation: number): void {
    if (!this.debugMesh) return;

    this.debugMesh.position.copy(position);
    this.debugMesh.rotation.y = rotation;
  }

  setDebugVisible(visible: boolean): void {
    if (this.debugMesh) {
      this.debugMesh.visible = visible;
    }
  }

  setRange(range: number): void {
    this.range = range;
  }

  setFOV(fovDegrees: number): void {
    this.fov = THREE.MathUtils.degToRad(fovDegrees);
  }

  getRange(): number {
    return this.range;
  }
}

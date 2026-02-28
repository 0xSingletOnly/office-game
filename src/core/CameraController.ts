import * as THREE from 'three';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private target: THREE.Object3D | null = null;
  
  // Camera settings
  private distance: number = 5;           // Distance from player
  private minDistance: number = 2;
  private maxDistance: number = 8;
  private heightOffset: number = 2;       // Height above player
  private sideOffset: number = 1;         // Side offset for over-shoulder view
  
  // Rotation
  private yaw: number = 0;
  private pitch: number = 0.3;
  private minPitch: number = -0.5;
  private maxPitch: number = 1.2;
  
  // Smoothing
  private smoothing: number = 8;
  private currentPosition: THREE.Vector3 = new THREE.Vector3();
  
  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      75,                                     // FOV
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1,                                    // Near plane
      1000                                    // Far plane
    );
    
    this.currentPosition.copy(this.camera.position);
  }
  
  setTarget(target: THREE.Object3D): void {
    this.target = target;
    // Initialize camera position behind target
    this.currentPosition.copy(target.position);
    this.currentPosition.y += this.heightOffset;
    this.currentPosition.z += this.distance;
  }
  
  update(deltaTime: number): void {
    if (!this.target) return;
    
    // Get mouse input for camera rotation
    // Note: This is handled by InputManager, we'll integrate it through the player
    
    // Calculate desired camera position
    const targetPosition = this.calculateDesiredPosition();
    
    // Smoothly interpolate to desired position
    const t = Math.min(1, this.smoothing * deltaTime);
    this.currentPosition.lerp(targetPosition, t);
    
    // Update camera
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(
      this.target.position.x,
      this.target.position.y + 1.5, // Look at head height
      this.target.position.z
    );
  }
  
  private calculateDesiredPosition(): THREE.Vector3 {
    if (!this.target) return this.currentPosition;
    
    // Calculate offset based on yaw and pitch
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const cosYaw = Math.cos(this.yaw);
    const sinYaw = Math.sin(this.yaw);
    
    // Spherical coordinates to cartesian
    const offsetX = sinYaw * cosPitch * this.distance + cosYaw * this.sideOffset;
    const offsetY = sinPitch * this.distance + this.heightOffset;
    const offsetZ = cosYaw * cosPitch * this.distance - sinYaw * this.sideOffset;
    
    return new THREE.Vector3(
      this.target.position.x + offsetX,
      this.target.position.y + offsetY,
      this.target.position.z + offsetZ
    );
  }
  
  /**
   * Update camera rotation based on mouse input
   */
  rotate(deltaYaw: number, deltaPitch: number): void {
    this.yaw -= deltaYaw;
    this.pitch -= deltaPitch;
    
    // Clamp pitch
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
  }
  
  /**
   * Set rotation directly (for initial positioning)
   */
  setRotation(yaw: number, pitch: number): void {
    this.yaw = yaw;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, pitch));
  }
  
  /**
   * Adjust camera distance (for zoom)
   */
  adjustDistance(delta: number): void {
    this.distance = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.distance + delta)
    );
  }
  
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
  
  getYaw(): number {
    return this.yaw;
  }
  
  getPitch(): number {
    return this.pitch;
  }
  
  onWindowResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}

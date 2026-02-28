import * as THREE from 'three';
import { Game } from '../core/Game.js';
import { CollisionSystem } from '../core/CollisionSystem.js';

export class Player {
  private game: Game;
  private mesh: THREE.Group;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private collisionSystem: CollisionSystem | null = null;
  
  // Movement constants
  private readonly WALK_SPEED = 5;
  private readonly SPRINT_SPEED = 10;
  private readonly CROUCH_SPEED = 2.5;
  private readonly ACCELERATION = 20;
  private readonly FRICTION = 10;
  
  // Collision
  private readonly PLAYER_RADIUS = 0.3;
  
  // State
  private isSprinting: boolean = false;
  private isCrouching: boolean = false;
  private stamina: number = 100;
  private readonly MAX_STAMINA = 100;
  private readonly STAMINA_DRAIN = 30;  // per second
  private readonly STAMINA_RECOVERY = 20; // per second
  
  // Visuals
  private bodyMesh: THREE.Mesh | null = null;
  private headMesh: THREE.Mesh | null = null;

  constructor(game: Game) {
    this.game = game;
    this.mesh = new THREE.Group();
    this.createVisuals();
    
    // Add to scene
    game.getScene()?.add(this.mesh);
    
    // Initial position
    this.mesh.position.set(0, 0, 0);
  }
  
  public setCollisionSystem(collisionSystem: CollisionSystem): void {
    this.collisionSystem = collisionSystem;
  }
  
  private createVisuals(): void {
    // Body (suit - blue for Mike)
    // Capsule height 1.0, so center at 0.5 for bottom to touch ground
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2c4f7c,  // Suits blue
      roughness: 0.7 
    });
    this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.bodyMesh.position.y = 0.5;
    this.bodyMesh.castShadow = true;
    this.mesh.add(this.bodyMesh);
    
    // Head
    // Position on top of body: 0.5 + 0.5 (half capsule) + 0.25 (head radius) = 1.25
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffdbac,  // Skin tone
      roughness: 0.5 
    });
    this.headMesh = new THREE.Mesh(headGeometry, headMaterial);
    this.headMesh.position.y = 1.25;
    this.headMesh.castShadow = true;
    this.mesh.add(this.headMesh);
    
    // Hair (Mike's distinctive hairstyle - simple box for now)
    const hairGeometry = new THREE.BoxGeometry(0.35, 0.15, 0.4);
    const hairMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3d2314,  // Dark brown
      roughness: 0.9 
    });
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.y = 1.45;
    hair.position.z = 0.05;
    hair.castShadow = true;
    this.mesh.add(hair);
    
    // Briefcase (iconic Mike accessory)
    const briefcaseGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.1);
    const briefcaseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,  // Black leather
      roughness: 0.3 
    });
    const briefcase = new THREE.Mesh(briefcaseGeometry, briefcaseMaterial);
    briefcase.position.set(0.35, 0.75, 0.2);
    briefcase.rotation.z = -0.3;
    briefcase.castShadow = true;
    this.mesh.add(briefcase);
  }
  
  update(deltaTime: number): void {
    this.handleInput();
    this.applyMovement(deltaTime);
    this.updateStamina(deltaTime);
    this.updateCamera();
  }
  
  private handleInput(): void {
    const input = this.game.inputManager;
    if (!input) return;
    
    // Sprint
    this.isSprinting = input.isSprinting() && this.stamina > 0;
    
    // Crouch
    this.isCrouching = input.isCrouching();
    
    // Camera rotation from mouse
    const mouseDelta = input.getMouseDelta();
    this.game.cameraController?.rotate(mouseDelta.x, mouseDelta.y);
    input.resetMouseDelta();
  }
  
  private applyMovement(deltaTime: number): void {
    const input = this.game.inputManager;
    if (!input) return;
    
    const moveInput = input.getMovementVector();
    const camera = this.game.cameraController?.getCamera();
    
    if (!camera) return;
    
    // Get camera direction (flat on XZ plane)
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    
    // Calculate right vector
    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
    
    // Calculate target velocity based on input
    const speed = this.isSprinting ? this.SPRINT_SPEED : 
                  this.isCrouching ? this.CROUCH_SPEED : this.WALK_SPEED;
    
    const targetVelocity = new THREE.Vector3()
      .addScaledVector(cameraDirection, -moveInput.z * speed)
      .addScaledVector(cameraRight, moveInput.x * speed);
    
    // Apply acceleration
    const acceleration = moveInput.x !== 0 || moveInput.z !== 0 ? 
      this.ACCELERATION : this.FRICTION;
    
    this.velocity.lerp(targetVelocity, Math.min(1, acceleration * deltaTime));
    
    // Calculate desired position
    const currentPos = this.mesh.position.clone();
    const desiredPos = currentPos.clone().addScaledVector(this.velocity, deltaTime);
    
    // Apply collision resolution if collision system is available
    if (this.collisionSystem) {
      const resolvedPos = this.collisionSystem.resolvePlayerCollision(
        currentPos, 
        desiredPos, 
        this.PLAYER_RADIUS
      );
      
      // If we're not moving in the direction we want, zero out that component of velocity
      // This prevents "running into walls" maintaining velocity
      if (Math.abs(desiredPos.x - currentPos.x) > 0.001 && Math.abs(resolvedPos.x - currentPos.x) < 0.001) {
        this.velocity.x = 0;
      }
      if (Math.abs(desiredPos.z - currentPos.z) > 0.001 && Math.abs(resolvedPos.z - currentPos.z) < 0.001) {
        this.velocity.z = 0;
      }
      
      this.mesh.position.copy(resolvedPos);
    } else {
      // No collision system - apply movement directly
      this.mesh.position.copy(desiredPos);
    }
    
    // Ensure player stays on the ground (y=0)
    this.mesh.position.y = 0;
    
    // Rotate player to face movement direction (or camera direction if not moving)
    if (this.velocity.length() > 0.1) {
      const targetRotation = Math.atan2(this.velocity.x, this.velocity.z);
      const currentRotation = this.mesh.rotation.y;
      
      // Smooth rotation
      let diff = targetRotation - currentRotation;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      
      this.mesh.rotation.y += diff * 10 * deltaTime;
    }
  }
  
  private updateStamina(deltaTime: number): void {
    if (this.isSprinting && this.velocity.length() > 0.1) {
      this.stamina -= this.STAMINA_DRAIN * deltaTime;
      if (this.stamina <= 0) {
        this.stamina = 0;
        this.isSprinting = false;
      }
    } else if (!this.isSprinting && this.stamina < this.MAX_STAMINA) {
      this.stamina += this.STAMINA_RECOVERY * deltaTime;
      this.stamina = Math.min(this.stamina, this.MAX_STAMINA);
    }
  }
  
  private updateCamera(): void {
    // Sync camera controller with player rotation for initial direction
    // This is handled in the camera controller's update
  }
  
  public getMesh(): THREE.Group {
    return this.mesh;
  }
  
  public getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }
  
  public getVelocity(): THREE.Vector3 {
    return this.velocity.clone();
  }
  
  public getStamina(): number {
    return this.stamina;
  }
  
  public isSprintActive(): boolean {
    return this.isSprinting;
  }
  
  public setPosition(x: number, y: number, z: number): void {
    this.mesh.position.set(x, y, z);
  }
}

import * as THREE from 'three';
import { Game } from '../core/Game.js';

/**
 * ExitZone - The escape point that triggers victory when player reaches it
 */
export class ExitZone {
  private game: Game;
  private mesh: THREE.Group;
  private position: THREE.Vector3;
  private radius: number = 2;
  private isActive: boolean = true;
  
  // Visual elements
  private light!: THREE.PointLight;
  private particles: THREE.Points | null = null;
  
  // Animation
  private time: number = 0;

  constructor(game: Game, position: THREE.Vector3) {
    this.game = game;
    this.position = position.clone();
    this.mesh = new THREE.Group();
    
    this.mesh.position.copy(position);
    
    this.createVisuals();
    this.createParticles();
    
    // Add to scene
    game.getScene()?.add(this.mesh);
    
    console.log('🚪 Exit zone created at', position);
  }
  
  private createVisuals(): void {
    const group = this.mesh;
    
    // Exit door frame (larger than normal doors)
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0xc9a227,  // Gold
      metalness: 0.8,
      roughness: 0.2
    });
    
    // Frame
    const frameThickness = 0.2;
    const frameWidth = 3;
    const frameHeight = 4;
    
    // Left pillar
    const leftPillar = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, frameHeight, frameThickness),
      frameMaterial
    );
    leftPillar.position.set(-frameWidth/2, frameHeight/2, 0);
    leftPillar.castShadow = true;
    group.add(leftPillar);
    
    // Right pillar
    const rightPillar = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, frameHeight, frameThickness),
      frameMaterial
    );
    rightPillar.position.set(frameWidth/2, frameHeight/2, 0);
    rightPillar.castShadow = true;
    group.add(rightPillar);
    
    // Top lintel
    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(frameWidth + frameThickness * 2, frameThickness, frameThickness),
      frameMaterial
    );
    lintel.position.set(0, frameHeight - frameThickness/2, 0);
    lintel.castShadow = true;
    group.add(lintel);
    
    // The exit itself (glowing portal)
    const portalGeo = new THREE.PlaneGeometry(frameWidth - 0.2, frameHeight - 0.5);
    const portalMat = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const portal = new THREE.Mesh(portalGeo, portalMat);
    portal.position.set(0, frameHeight/2 - 0.1, 0);
    group.add(portal);
    
    // Green glow light
    this.light = new THREE.PointLight(0x00ff00, 1, 8);
    this.light.position.set(0, frameHeight/2, 1);
    group.add(this.light);
    
    // EXIT sign above
    const signGroup = new THREE.Group();
    signGroup.position.set(0, frameHeight + 0.5, 0.3);
    
    const signBg = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.4, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    signGroup.add(signBg);
    
    // Add text planes for EXIT letters
    const letterGeo = new THREE.PlaneGeometry(0.2, 0.3);
    const letterMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const letters = ['E', 'X', 'I', 'T'];
    letters.forEach((_, i) => {
      const letter = new THREE.Mesh(letterGeo, letterMat);
      letter.position.set(-0.45 + i * 0.3, 0, 0.06);
      signGroup.add(letter);
    });
    
    group.add(signGroup);
    
    // Floor marker (green circle)
    const ringGeo = new THREE.RingGeometry(this.radius - 0.2, this.radius, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);
  }
  
  private createParticles(): void {
    // Particle system for magical exit effect
    const particleCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities: THREE.Vector3[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = Math.random() * 3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        Math.random() * 0.03 + 0.01,
        (Math.random() - 0.5) * 0.02
      ));
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0x00ff00,
      size: 0.05,
      transparent: true,
      opacity: 0.8
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.mesh.add(this.particles);
  }
  
  update(deltaTime: number): void {
    if (!this.isActive) return;
    
    this.time += deltaTime;
    
    // Pulse the light
    const pulse = Math.sin(this.time * 2) * 0.3 + 0.7;
    this.light.intensity = pulse;
    
    // Animate particles
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        // Move up
        positions[i * 3 + 1] += 0.02;
        
        // Reset if too high
        if (positions[i * 3 + 1] > 4) {
          positions[i * 3 + 1] = 0;
          positions[i * 3] = (Math.random() - 0.5) * 2;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        }
      }
      
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
    
    // Check if player reached exit
    this.checkPlayerReached();
  }
  
  private checkPlayerReached(): void {
    const player = this.game.player;
    if (!player) return;
    
    const playerPos = player.getPosition();
    const distance = playerPos.distanceTo(this.position);
    
    if (distance < this.radius) {
      console.log('🏃 Player reached exit! ESCAPE SUCCESSFUL!');
      this.onPlayerEscape();
    }
  }
  
  private onPlayerEscape(): void {
    this.isActive = false;
    this.game.onPlayerEscape();
  }
  
  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }
  
  dispose(): void {
    this.game.getScene()?.remove(this.mesh);
  }
}

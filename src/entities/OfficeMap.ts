import * as THREE from 'three';
import { Game } from '../core/Game.js';
import { InteractiveObject } from './InteractiveObject.js';
import { HidingSpot, HidingSpotType } from './HidingSpot.js';
import { Door, DoorType } from './Door.js';
import { DistractionObject, DistractionType } from './DistractionObject.js';
import { CollisionSystem } from '../core/CollisionSystem.js';

/**
 * OfficeMap - Procedurally builds the Pearson Hardman office environment
 * This creates a simple test environment for Phase 1
 */
export class OfficeMap {
  private scene: THREE.Scene;
  private walls: THREE.Mesh[] = [];
  private floor: THREE.Mesh | null = null;
  private interactiveObjects: InteractiveObject[] = [];
  private furniture: THREE.Group[] = [];
  
  // Materials
  private floorMaterial: THREE.MeshStandardMaterial;
  private wallMaterial: THREE.MeshStandardMaterial;
  private furnitureMaterial: THREE.MeshStandardMaterial;
  
  // Reference to game (for creating interactive objects)
  private game: Game | null = null;
  
  // Collision system
  private collisionSystem: CollisionSystem;

  constructor(scene: THREE.Scene, game?: Game, collisionSystem?: CollisionSystem) {
    this.scene = scene;
    this.game = game || null;
    this.collisionSystem = collisionSystem || new CollisionSystem();
    
    // Initialize materials
    this.floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2314,  // Dark mahogany
      roughness: 0.3,
      metalness: 0.1
    });
    
    this.wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5dc,  // Cream/off-white
      roughness: 0.8
    });
    
    this.furnitureMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,  // Dark furniture
      roughness: 0.5
    });
  }
  
  build(): void {
    this.createLighting();
    this.createFloor();
    this.createWalls();
    this.createFurniture();
    this.createDecorations();
    this.createInteractiveObjects();
    
    console.log('🏢 Office environment built!');
  }
  
  private createInteractiveObjects(): void {
    if (!this.game) return;
    
    // Create bathroom stalls (classic hiding spot!)
    this.interactiveObjects.push(
      new HidingSpot(this.game, new THREE.Vector3(-12, 0, -12), HidingSpotType.BATHROOM_STALL)
    );
    this.interactiveObjects.push(
      new HidingSpot(this.game, new THREE.Vector3(-10, 0, -12), HidingSpotType.BATHROOM_STALL)
    );
    this.interactiveObjects.push(
      new HidingSpot(this.game, new THREE.Vector3(-8, 0, -12), HidingSpotType.BATHROOM_STALL)
    );
    
    // Supply closet
    this.interactiveObjects.push(
      new HidingSpot(this.game, new THREE.Vector3(15, 0, -15), HidingSpotType.CLOSET)
    );
    
    // Locker (in employee area)
    this.interactiveObjects.push(
      new HidingSpot(this.game, new THREE.Vector3(-15, 0, 5), HidingSpotType.LOCKER)
    );
    
    // Doors
    // Main office door
    this.interactiveObjects.push(
      new Door(this.game, new THREE.Vector3(0, 0, -18), 0, DoorType.GLASS)
    );
    
    // Conference room doors
    this.interactiveObjects.push(
      new Door(this.game, new THREE.Vector3(8, 0, 5), -Math.PI / 2, DoorType.GLASS)
    );
    
    // Storage room door
    this.interactiveObjects.push(
      new Door(this.game, new THREE.Vector3(15, 0, -10), Math.PI / 2, DoorType.STANDARD)
    );
    
    // Distraction objects - Coffee cups
    this.interactiveObjects.push(
      new DistractionObject(this.game, new THREE.Vector3(5, 0.1, 5), DistractionType.COFFEE_CUP)
    );
    this.interactiveObjects.push(
      new DistractionObject(this.game, new THREE.Vector3(-5, 0.1, 5), DistractionType.COFFEE_CUP)
    );
    
    // Books in library
    this.interactiveObjects.push(
      new DistractionObject(this.game, new THREE.Vector3(-15, 0.1, -15), DistractionType.BOOK)
    );
    this.interactiveObjects.push(
      new DistractionObject(this.game, new THREE.Vector3(-13, 0.1, -15), DistractionType.BOOK)
    );
    
    // Phone on desk
    this.interactiveObjects.push(
      new DistractionObject(this.game, new THREE.Vector3(5, 1.05, -5), DistractionType.PHONE)
    );
    
    // Papers (copy room)
    this.interactiveObjects.push(
      new DistractionObject(this.game, new THREE.Vector3(15, 0.05, -15), DistractionType.PAPERS)
    );
    
    // Stapler
    this.interactiveObjects.push(
      new DistractionObject(this.game, new THREE.Vector3(-5, 1.05, 5), DistractionType.STAPLER)
    );
    
    console.log(`🎯 Created ${this.interactiveObjects.length} interactive objects`);
  }
  
  private createLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    
    // Main directional light (sunlight from windows)
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    this.scene.add(sunLight);
    
    // Office ceiling lights (point lights)
    const lightPositions = [
      { x: 0, z: 0 },
      { x: 8, z: 8 },
      { x: -8, z: 8 },
      { x: 8, z: -8 },
      { x: -8, z: -8 }
    ];
    
    for (const pos of lightPositions) {
      const pointLight = new THREE.PointLight(0xfffaed, 0.5, 15);
      pointLight.position.set(pos.x, 8, pos.z);
      this.scene.add(pointLight);
      
      // Light fixture (visual only)
      const fixtureGeometry = new THREE.BoxGeometry(1, 0.1, 1);
      const fixtureMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xeeeeee,
        emissive: 0xfffaed,
        emissiveIntensity: 0.2
      });
      const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
      fixture.position.set(pos.x, 7.9, pos.z);
      this.scene.add(fixture);
    }
  }
  
  private createFloor(): void {
    // Main floor
    const floorGeometry = new THREE.PlaneGeometry(40, 40);
    this.floor = new THREE.Mesh(floorGeometry, this.floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);
    
    // Add floor tiles pattern (grid)
    const gridHelper = new THREE.GridHelper(40, 20, 0x2a1a0e, 0x2a1a0e);
    gridHelper.position.y = 0.01;
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);
  }
  
  private createWalls(): void {
    // Create office perimeter and room dividers
    const wallHeight = 4;
    const wallThickness = 0.2;
    
    // Outer walls
    this.createWall(40, wallHeight, wallThickness, 0, wallHeight/2, -20); // North
    this.createWall(40, wallHeight, wallThickness, 0, wallHeight/2, 20);  // South
    this.createWall(wallThickness, wallHeight, 40, -20, wallHeight/2, 0); // West
    this.createWall(wallThickness, wallHeight, 40, 20, wallHeight/2, 0);  // East
    
    // Interior walls (office rooms)
    // Horizontal divider
    this.createWall(20, wallHeight, wallThickness, 0, wallHeight/2, -5);
    
    // Vertical dividers
    this.createWall(wallThickness, wallHeight, 15, -10, wallHeight/2, 12.5);
    this.createWall(wallThickness, wallHeight, 15, 10, wallHeight/2, 12.5);
    this.createWall(wallThickness, wallHeight, 15, -10, wallHeight/2, -12.5);
    this.createWall(wallThickness, wallHeight, 15, 10, wallHeight/2, -12.5);
  }
  
  private createWall(width: number, height: number, depth: number, x: number, y: number, z: number): void {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const wall = new THREE.Mesh(geometry, this.wallMaterial);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene.add(wall);
    this.walls.push(wall);
    
    // Register with collision system
    this.collisionSystem.addMesh(wall);
  }
  
  private createFurniture(): void {
    if (!this.game) return;
    
    // Desks scattered around
    const deskPositions = [
      { x: -5, z: 5, rotation: 0 },
      { x: 5, z: 5, rotation: 0 },
      { x: -5, z: -10, rotation: Math.PI },
      { x: 5, z: -10, rotation: Math.PI },
      { x: -15, z: 0, rotation: Math.PI / 2 },
      { x: 15, z: 0, rotation: -Math.PI / 2 }
    ];
    
    for (const desk of deskPositions) {
      this.createDesk(desk.x, desk.z, desk.rotation);
    }
    
    // Conference table (central)
    this.createConferenceTable(0, 12, 0);
    
    // Bookshelves (library area)
    this.createBookshelf(-15, -15, 0);
    this.createBookshelf(-15, -12, 0);
    this.createBookshelf(-12, -15, Math.PI / 2);
    
    // Copy machine
    this.createCopyMachine(15, -15);
  }
  
  private createDesk(x: number, z: number, rotation: number): void {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    
    // Desktop
    const topGeometry = new THREE.BoxGeometry(2, 0.1, 1);
    const top = new THREE.Mesh(topGeometry, this.furnitureMaterial);
    top.position.y = 1;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);
    
    // Legs
    const legGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    
    const legPositions = [
      { x: -0.9, z: -0.4 },
      { x: 0.9, z: -0.4 },
      { x: -0.9, z: 0.4 },
      { x: 0.9, z: 0.4 }
    ];
    
    for (const pos of legPositions) {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos.x, 0.5, pos.z);
      leg.castShadow = true;
      group.add(leg);
    }
    
    // Computer monitor
    const monitorGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.05);
    const monitorMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
    monitor.position.set(0, 1.35, -0.3);
    monitor.castShadow = true;
    group.add(monitor);
    
    // Screen glow
    const screenGeometry = new THREE.PlaneGeometry(0.35, 0.25);
    const screenMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x4a90d9,
      side: THREE.DoubleSide
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 1.35, -0.27);
    group.add(screen);
    
    this.scene.add(group);
    this.furniture.push(group);
    
    // Register with collision system (simplified box around desk)
    // Desk collision box: width=2, height=1, depth=1
    this.collisionSystem.addBoxCollider(2, 1, 1, x, 0, z);
  }
  
  private createConferenceTable(x: number, z: number, rotation: number): void {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    
    // Table
    const tableGeometry = new THREE.BoxGeometry(4, 0.1, 2);
    const table = new THREE.Mesh(tableGeometry, this.furnitureMaterial);
    table.position.y = 1;
    table.castShadow = true;
    table.receiveShadow = true;
    group.add(table);
    
    // Chairs around table
    const chairMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const chairGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.6);
    const backGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.1);
    
    const chairPositions = [
      { x: 0, z: 1.5 },
      { x: -1.5, z: 0, rot: Math.PI / 2 },
      { x: 1.5, z: 0, rot: -Math.PI / 2 },
      { x: 0, z: -1.5, rot: Math.PI }
    ];
    
    for (const pos of chairPositions) {
      const chairGroup = new THREE.Group();
      chairGroup.position.set(pos.x, 0, pos.z);
      if (pos.rot) chairGroup.rotation.y = pos.rot;
      
      const seat = new THREE.Mesh(chairGeometry, chairMaterial);
      seat.position.y = 0.5;
      seat.castShadow = true;
      chairGroup.add(seat);
      
      const back = new THREE.Mesh(backGeometry, chairMaterial);
      back.position.set(0, 0.9, -0.25);
      back.castShadow = true;
      chairGroup.add(back);
      
      group.add(chairGroup);
    }
    
    this.scene.add(group);
    this.furniture.push(group);
    
    // Register with collision system (table: 4x1x2)
    this.collisionSystem.addBoxCollider(4, 1, 2, x, 0, z);
  }
  
  private createBookshelf(x: number, z: number, rotation: number): void {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    
    const shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    
    // Frame
    const frameGeometry = new THREE.BoxGeometry(3, 3, 0.5);
    const frame = new THREE.Mesh(frameGeometry, shelfMaterial);
    frame.position.y = 1.5;
    frame.castShadow = true;
    group.add(frame);
    
    // Books (simple colored boxes)
    const bookColors = [0x8b0000, 0x006400, 0x00008b, 0x8b008b, 0x654321];
    
    for (let i = 0; i < 3; i++) {
      const y = 0.5 + i * 0.9;
      for (let j = 0; j < 8; j++) {
        const bookGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.4);
        const bookMaterial = new THREE.MeshStandardMaterial({ 
          color: bookColors[Math.floor(Math.random() * bookColors.length)] 
        });
        const book = new THREE.Mesh(bookGeometry, bookMaterial);
        book.position.set(-1.2 + j * 0.25, y, 0);
        book.castShadow = true;
        
        // Random slight rotation for realism
        book.rotation.z = (Math.random() - 0.5) * 0.1;
        
        group.add(book);
      }
    }
    
    this.scene.add(group);
    this.furniture.push(group);
    
    // Register with collision system (bookshelf: 3x3x0.5)
    this.collisionSystem.addBoxCollider(3, 3, 0.5, x, 0, z);
  }
  
  private createCopyMachine(x: number, z: number): void {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    
    const machineMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const glassMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x111111,
      transparent: true,
      opacity: 0.8
    });
    
    // Main body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.5, 1.5),
      machineMaterial
    );
    body.position.y = 0.75;
    body.castShadow = true;
    group.add(body);
    
    // Scanner glass
    const scanner = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.05, 1),
      glassMaterial
    );
    scanner.position.y = 1.55;
    group.add(scanner);
    
    // Control panel
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.4, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    panel.position.set(0, 1.3, 0.76);
    group.add(panel);
    
    this.scene.add(group);
    this.furniture.push(group);
    
    // Register with collision system (copy machine: 1.2x1.5x1.5)
    this.collisionSystem.addBoxCollider(1.2, 1.5, 1.5, x, 0, z);
  }
  
  private createDecorations(): void {
    // Pearson Hardman logo/sign
    const signGroup = new THREE.Group();
    signGroup.position.set(0, 3, -19.8);
    
    const signBg = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    signBg.castShadow = true;
    signGroup.add(signBg);
    
    // Add the sign to the wall
    this.scene.add(signGroup);
    
    // Potted plants
    this.createPlant(-18, -18);
    this.createPlant(18, -18);
    this.createPlant(-18, 18);
    this.createPlant(18, 18);
  }
  
  private createPlant(x: number, z: number): void {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    
    // Pot
    const potGeometry = new THREE.CylinderGeometry(0.4, 0.3, 0.6, 8);
    const potMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const pot = new THREE.Mesh(potGeometry, potMaterial);
    pot.position.y = 0.3;
    pot.castShadow = true;
    group.add(pot);
    
    // Plant (simple green sphere for now)
    const plantGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const plantMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const plant = new THREE.Mesh(plantGeometry, plantMaterial);
    plant.position.y = 0.9;
    plant.castShadow = true;
    group.add(plant);
    
    this.scene.add(group);
  }
  
  public getWalls(): THREE.Mesh[] {
    return this.walls;
  }
  
  public getInteractiveObjects(): InteractiveObject[] {
    return this.interactiveObjects;
  }
  
  public getCollisionSystem(): CollisionSystem {
    return this.collisionSystem;
  }
}

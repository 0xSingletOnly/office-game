import * as THREE from 'three';
import { Game } from '../core/Game.js';
import { StateMachine, State } from '../ai/StateMachine.js';
import { VisionCone } from '../ai/VisionCone.js';

// Louis AI States
const PATROL_STATE: State<LouisAI> = {
  name: 'PATROL',
  
  enter(louis: LouisAI): void {
    louis.setSpeed(louis.WALK_SPEED);
    louis.sayQuote('patrol');
    void louis;
  },
  
  execute(louis: LouisAI, deltaTime: number): void {
    // Move along patrol path
    louis.patrol(deltaTime);
    
    // Check for player
    const detectionLevel = louis.checkForPlayer();
    if (detectionLevel > 0.9) {
      louis.getStateMachine().setCurrentState('CHASE');
    } else if (detectionLevel > 0.3) {
      louis.getStateMachine().setCurrentState('SUSPICIOUS');
    }
  },
  
  exit(_louis: LouisAI): void {
    // Cleanup if needed
    void _louis;
  }
};

const SUSPICIOUS_STATE: State<LouisAI> = {
  name: 'SUSPICIOUS',
  
  enter(louis: LouisAI): void {
    louis.setSpeed(0); // Stop and look
    louis.sayQuote('suspicious');
    louis.suspicionTimer = 0;
  },
  
  execute(louis: LouisAI, deltaTime: number): void {
    louis.suspicionTimer += deltaTime;
    
    // Look at player
    const playerPos = louis.getPlayerPosition();
    if (playerPos) {
      louis.lookAt(playerPos);
    }
    
    // Check for player
    const detectionLevel = louis.checkForPlayer();
    if (detectionLevel > 0.9) {
      louis.getStateMachine().setCurrentState('CHASE');
    } else if (detectionLevel < 0.1 && louis.suspicionTimer > 2) {
      // Lost interest, go back to patrol
      louis.getStateMachine().setCurrentState('PATROL');
    }
    
    // Too suspicious for too long = chase
    if (louis.suspicionTimer > 4) {
      louis.getStateMachine().setCurrentState('CHASE');
    }
  },
  
  exit(louis: LouisAI): void {
    louis.suspicionTimer = 0;
  }
};

const CHASE_STATE: State<LouisAI> = {
  name: 'CHASE',
  
  enter(louis: LouisAI): void {
    louis.setSpeed(louis.CHASE_SPEED);
    louis.sayQuote('chase');
    louis.chaseTimer = 0;
  },
  
  execute(louis: LouisAI, deltaTime: number): void {
    louis.chaseTimer += deltaTime;
    
    // Move towards player
    const playerPos = louis.getPlayerPosition();
    if (playerPos) {
      louis.moveTowards(playerPos, deltaTime);
      louis.lookAt(playerPos);
    }
    
    // Check if caught
    if (louis.canCatchPlayer()) {
      louis.getStateMachine().setCurrentState('CAUGHT');
      return;
    }
    
    // Check if still seeing player
    const detectionLevel = louis.checkForPlayer();
    if (detectionLevel < 0.1) {
      // Lost player, start searching
      louis.getStateMachine().setCurrentState('SEARCH');
    }
  },
  
  exit(louis: LouisAI): void {
    louis.chaseTimer = 0;
  }
};

const SEARCH_STATE: State<LouisAI> = {
  name: 'SEARCH',
  
  enter(louis: LouisAI): void {
    louis.setSpeed(louis.WALK_SPEED * 0.7);
    louis.sayQuote('search');
    louis.searchTimer = 0;
    // Store last known position
    const playerPos = louis.getPlayerPosition();
    if (playerPos) {
      louis.lastKnownPlayerPosition.copy(playerPos);
    }
  },
  
  execute(louis: LouisAI, deltaTime: number): void {
    louis.searchTimer += deltaTime;
    
    // Move to last known position
    const distToLastPos = louis.getPosition().distanceTo(louis.lastKnownPlayerPosition);
    if (distToLastPos > 1) {
      louis.moveTowards(louis.lastKnownPlayerPosition, deltaTime);
    } else {
      // At last known position, look around
      louis.mesh.rotation.y += deltaTime; // Spin around looking
    }
    
    // Check for player again
    const detectionLevel = louis.checkForPlayer();
    if (detectionLevel > 0.9) {
      louis.getStateMachine().setCurrentState('CHASE');
    }
    
    // Give up after searching
    if (louis.searchTimer > 5) {
      louis.getStateMachine().setCurrentState('PATROL');
    }
  },
  
  exit(louis: LouisAI): void {
    louis.searchTimer = 0;
  }
};

const CAUGHT_STATE: State<LouisAI> = {
  name: 'CAUGHT',
  
  enter(louis: LouisAI): void {
    louis.setSpeed(0);
    louis.sayQuote('catch');
    louis.onCatchPlayer();
  },
  
  execute(_louis: LouisAI, _deltaTime: number): void {
    // Stay in this state until game handles it
    void _louis;
    void _deltaTime;
  },
  
  exit(_louis: LouisAI): void {
    // Reset or game over
  }
};

export class LouisAI {
  private game: Game;
  private stateMachine!: StateMachine<LouisAI>;
  public mesh: THREE.Group;
  private visionCone: VisionCone;
  
  // Movement
  public readonly WALK_SPEED = 4;
  public readonly CHASE_SPEED = 9;
  private speed: number = 0;
  private currentVelocity: THREE.Vector3 = new THREE.Vector3();
  
  // Patrol
  private patrolPoints: THREE.Vector3[] = [];
  private currentPatrolIndex: number = 0;
  
  // Timers
  public suspicionTimer: number = 0;
  public chaseTimer: number = 0;
  public searchTimer: number = 0;
  
  // Tracking
  public lastKnownPlayerPosition: THREE.Vector3 = new THREE.Vector3();
  
  // Visuals
  private bodyMesh: THREE.Mesh | null = null;

  constructor(game: Game) {
    this.game = game;
    this.mesh = new THREE.Group();
    this.visionCone = new VisionCone(120, 15);
    
    this.createVisuals();
    this.setupPatrolPoints();
    this.setupStateMachine();
    
    // Add to scene
    game.getScene()?.add(this.mesh);
    
    // Initial position
    this.mesh.position.set(-5, 1, -5);
    
    // Start patrolling
    this.stateMachine.setCurrentState('PATROL');
  }
  
  private createVisuals(): void {
    // Body (suit - darker for Louis)
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.9, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,  // Black suit
      roughness: 0.7 
    });
    this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.bodyMesh.position.y = 1;
    this.bodyMesh.castShadow = true;
    this.mesh.add(this.bodyMesh);
    
    // Head (Louis is shorter than Mike)
    const headGeometry = new THREE.SphereGeometry(0.23, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffdbac,
      roughness: 0.5 
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.75;
    head.castShadow = true;
    this.mesh.add(head);
    
    // Hair (Louis has different hair)
    const hairGeometry = new THREE.BoxGeometry(0.33, 0.1, 0.38);
    const hairMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2c1a0e,
      roughness: 0.9 
    });
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.y = 1.95;
    hair.position.z = 0.02;
    this.mesh.add(hair);
    
    // The drug test folder (very important!)
    const folderGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.05);
    const folderMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xccaa00,  // Manila folder
      roughness: 0.6 
    });
    const folder = new THREE.Mesh(folderGeometry, folderMaterial);
    folder.position.set(0.35, 1.2, 0.2);
    folder.rotation.z = 0.2;
    folder.rotation.y = -0.3;
    folder.castShadow = true;
    this.mesh.add(folder);
    
    // Vision cone debug (optional, for development)
    // this.visionCone.createDebugVisual(this.game.getScene()!);
  }
  
  private setupPatrolPoints(): void {
    // Define patrol waypoints around the office
    this.patrolPoints = [
      new THREE.Vector3(-5, 1, -5),   // Louis's office area
      new THREE.Vector3(0, 1, -5),    // Hallway
      new THREE.Vector3(5, 1, -5),    // Harvey's office area
      new THREE.Vector3(5, 1, 0),     // Center
      new THREE.Vector3(0, 1, 5),     // Conference area
      new THREE.Vector3(-5, 1, 5),    // Library area
      new THREE.Vector3(-10, 1, 0),   // Cubicles
    ];
  }
  
  private setupStateMachine(): void {
    this.stateMachine = new StateMachine<LouisAI>(this);
    this.stateMachine.addState(PATROL_STATE);
    this.stateMachine.addState(SUSPICIOUS_STATE);
    this.stateMachine.addState(CHASE_STATE);
    this.stateMachine.addState(SEARCH_STATE);
    this.stateMachine.addState(CAUGHT_STATE);
  }
  
  update(deltaTime: number): void {
    this.stateMachine.update(deltaTime);
    
    // Update vision cone debug if enabled
    // this.visionCone.updateDebugVisual(this.mesh.position, this.mesh.rotation.y);
  }
  
  // Patrol behavior
  patrol(deltaTime: number): void {
    if (this.patrolPoints.length === 0) return;
    
    const target = this.patrolPoints[this.currentPatrolIndex];
    const distToTarget = this.mesh.position.distanceTo(target);
    
    if (distToTarget < 0.5) {
      // Reached waypoint, go to next
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    } else {
      // Move towards waypoint
      this.moveTowards(target, deltaTime);
      this.lookAt(target);
    }
  }
  
  // Movement helpers
  moveTowards(target: THREE.Vector3, deltaTime: number): void {
    const direction = new THREE.Vector3()
      .subVectors(target, this.mesh.position)
      .normalize();
    
    direction.y = 0; // Stay on ground
    
    this.currentVelocity.lerp(direction.multiplyScalar(this.speed), 10 * deltaTime);
    this.mesh.position.addScaledVector(this.currentVelocity, deltaTime);
  }
  
  lookAt(target: THREE.Vector3): void {
    const direction = new THREE.Vector3()
      .subVectors(target, this.mesh.position);
    direction.y = 0;
    
    const targetRotation = Math.atan2(direction.x, direction.z);
    
    // Smooth rotation
    let diff = targetRotation - this.mesh.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    
    this.mesh.rotation.y += diff * 5 * 0.016; // Approximate delta
  }
  
  setSpeed(speed: number): void {
    this.speed = speed;
  }
  
  // Detection
  checkForPlayer(): number {
    const player = this.game.player;
    if (!player) return 0;
    
    const playerPos = player.getPosition();
    const walls = this.game.officeMap?.getWalls();
    
    const detectionLevel = this.visionCone.getDetectionLevel(
      this.mesh.position,
      this.mesh.rotation.y,
      playerPos,
      walls
    );
    
    // Update game detection meter
    this.game.updateDetection(detectionLevel);
    
    return detectionLevel;
  }
  
  canCatchPlayer(): boolean {
    const player = this.game.player;
    if (!player) return false;
    
    const dist = this.mesh.position.distanceTo(player.getPosition());
    return dist < 1.5; // Catch range
  }
  
  getPlayerPosition(): THREE.Vector3 | null {
    return this.game.player?.getPosition() || null;
  }
  
  // Quotes system
  sayQuote(type: 'patrol' | 'suspicious' | 'chase' | 'search' | 'catch'): void {
    const quotes = {
      patrol: [
        "Mike? I know you're here...",
        "Come out, come out wherever you are...",
        "I have the drug test paperwork ready!",
        "You can't hide from me forever!"
      ],
      suspicious: [
        "Did I hear something?",
        "Is someone there?",
        "Mike? Is that you?",
        "Show yourself!"
      ],
      chase: [
        "YOU'RE GETTING LITT UP!",
        "STOP RUNNING!",
        "DRUG TEST TIME!",
        "I'VE GOT YOU NOW!"
      ],
      search: [
        "Where did you go?",
        "I know you're around here...",
        "You can't escape me!",
        "Come back here!"
      ],
      catch: [
        "GOT YOU!",
        "You're busted!",
        "Now pee in the cup!",
        "I caught you red-handed!"
      ]
    };
    
    const typeQuotes = quotes[type];
    const quote = typeQuotes[Math.floor(Math.random() * typeQuotes.length)];
    
    console.log(`🗣️ Louis: "${quote}"`);
    
    // Show floating text (future enhancement)
    this.showFloatingText(quote);
  }
  
  private showFloatingText(_text: string): void {
    // TODO: Implement floating text above Louis's head
    // For now, we just log to console
  }
  
  onCatchPlayer(): void {
    console.log('🚨 PLAYER CAUGHT! GAME OVER!');
    this.game.onPlayerCaught();
  }
  
  /**
   * Investigate a noise/distraction
   */
  investigateNoise(position: THREE.Vector3): void {
    console.log(`🤔 Louis is investigating noise at (${position.x.toFixed(1)}, ${position.z.toFixed(1)})`);
    
    // Store as last known position
    this.lastKnownPlayerPosition.copy(position);
    
    // Switch to search state if not already chasing
    const currentState = this.stateMachine.getCurrentStateName();
    if (currentState !== 'CHASE' && currentState !== 'CAUGHT') {
      this.stateMachine.setCurrentState('SEARCH');
    }
  }
  
  // Getters
  getStateMachine(): StateMachine<LouisAI> {
    return this.stateMachine;
  }
  
  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }
  
  getState(): string | null {
    return this.stateMachine.getCurrentStateName();
  }
}

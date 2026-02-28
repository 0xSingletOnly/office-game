import * as THREE from 'three';
import { Game } from '../core/Game.js';
import { StateMachine, State } from '../ai/StateMachine.js';
import { VisionCone } from '../ai/VisionCone.js';

/**
 * SuspicionSample - Tracks a suspicion reading with position and direction
 */
interface SuspicionSample {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  level: number;
  timestamp: number;
}

// Louis AI States
const PATROL_STATE: State<LouisAI> = {
  name: 'PATROL',
  
  enter(louis: LouisAI): void {
    louis.setSpeed(louis.WALK_SPEED);
    louis.sayQuote('patrol');
    louis.clearSuspicionHistory();
  },
  
  execute(louis: LouisAI, deltaTime: number): void {
    // Check for player FIRST before moving - immediate response!
    const detectionLevel = louis.checkForPlayer();
    
    if (detectionLevel > 0.9) {
      // Player spotted! Chase immediately
      louis.getStateMachine().setCurrentState('CHASE');
      return;
    } else if (detectionLevel > 0.3) {
      // Something suspicious detected
      louis.getStateMachine().setCurrentState('SUSPICIOUS');
      return;
    }
    
    // No player detected - continue patrol
    louis.patrol(deltaTime);
  },
  
  exit(_louis: LouisAI): void {
    // Cleanup if needed
    void _louis;
  }
};

const SUSPICIOUS_STATE: State<LouisAI> = {
  name: 'SUSPICIOUS',
  
  enter(louis: LouisAI): void {
    louis.setSpeed(louis.WALK_SPEED * 0.6); // Slow, cautious movement
    louis.sayQuote('suspicious');
    louis.suspicionTimer = 0;
    louis.stuckTimer = 0;
    louis.lastPosition.copy(louis.getPosition());
    // Calculate and store investigation target
    louis.calculateInvestigationTarget();
  },
  
  execute(louis: LouisAI, deltaTime: number): void {
    louis.suspicionTimer += deltaTime;
    
    // Update suspicion tracking
    const detectionLevel = louis.checkForPlayer();
    louis.updateSuspicionHistory(detectionLevel);
    
    // IMMEDIATE: If player is right in front (high detection), CHASE!
    if (detectionLevel > 0.9) {
      louis.getStateMachine().setCurrentState('CHASE');
      return;
    }
    
    // If player disappeared for a while, go back to patrol
    if (detectionLevel < 0.05 && louis.suspicionTimer > 2.0) {
      louis.getStateMachine().setCurrentState('PATROL');
      return;
    }
    
    // Recalculate target if getting more suspicious
    if (louis.isSuspicionIncreasing()) {
      louis.calculateInvestigationTarget();
      louis.stuckTimer = 0; // Reset stuck timer when target updates
    }
    
    // Move toward investigation target (direction of suspicion)
    const target = louis.getInvestigationTarget();
    const distToTarget = louis.getPosition().distanceTo(target);
    
    if (distToTarget > 0.5) {
      // Move toward the suspicious direction
      const prevPos = louis.getPosition().clone();
      louis.moveTowards(target, deltaTime);
      
      // Check if stuck (not making progress)
      const moved = prevPos.distanceTo(louis.getPosition());
      if (moved < 0.01) {
        louis.stuckTimer += deltaTime;
        if (louis.stuckTimer > 1.5) {
          // Stuck! Try a different direction or give up
          console.log('🤔 Louis is stuck, trying new approach...');
          louis.calculateInvestigationTarget(); // Pick new target
          louis.stuckTimer = 0;
        }
      } else {
        louis.stuckTimer = 0;
      }
      
      louis.lookAt(target);
    } else {
      // At target, look around
      louis.mesh.rotation.y += deltaTime * 0.5;
    }
    
    // State transitions
    if (louis.getSuspicionLevel() > 0.8) {
      louis.getStateMachine().setCurrentState('CHASE');
    }
  },
  
  exit(louis: LouisAI): void {
    louis.suspicionTimer = 0;
    louis.stuckTimer = 0;
    louis.clearSuspicionHistory();
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
    louis.stuckTimer = 0;
    louis.lastPosition.copy(louis.getPosition());
    louis.clearSuspicionHistory();
    
    // Store last known position as primary search target
    const playerPos = louis.getPlayerPosition();
    if (playerPos) {
      louis.lastKnownPlayerPosition.copy(playerPos);
    }
    
    // Generate search waypoints radiating from last known position
    louis.generateSearchWaypoints();
  },
  
  execute(louis: LouisAI, deltaTime: number): void {
    louis.searchTimer += deltaTime;
    
    // ALWAYS check for player first!
    const detectionLevel = louis.checkForPlayer();
    louis.updateSuspicionHistory(detectionLevel);
    
    // IMMEDIATE: If player spotted, CHASE!
    if (detectionLevel > 0.9) {
      louis.getStateMachine().setCurrentState('CHASE');
      return;
    }
    
    // If low detection but still seeing something, go suspicious
    if (detectionLevel > 0.3) {
      louis.getStateMachine().setCurrentState('SUSPICIOUS');
      return;
    }
    
    // If suspicion is increasing, investigate that direction
    if (louis.isSuspicionIncreasing()) {
      louis.calculateInvestigationTarget();
      const target = louis.getInvestigationTarget();
      louis.moveTowards(target, deltaTime);
      louis.lookAt(target);
    } else {
      // No new leads, follow search waypoints
      const target = louis.getCurrentSearchWaypoint();
      const distToTarget = louis.getPosition().distanceTo(target);
      
      if (distToTarget < 0.5) {
        // Reached waypoint, go to next
        louis.nextSearchWaypoint();
        louis.stuckTimer = 0;
      } else {
        // Check for stuck condition
        const prevPos = louis.getPosition().clone();
        louis.moveTowards(target, deltaTime);
        const moved = prevPos.distanceTo(louis.getPosition());
        
        if (moved < 0.01) {
          louis.stuckTimer += deltaTime;
          if (louis.stuckTimer > 2.0) {
            // Stuck on this waypoint, skip to next
            console.log('🔍 Louis skipping stuck waypoint');
            louis.nextSearchWaypoint();
            louis.stuckTimer = 0;
          }
        } else {
          louis.stuckTimer = 0;
        }
        
        louis.lookAt(target);
      }
    }
    
    // Give up after searching
    if (louis.searchTimer > 6) {
      louis.getStateMachine().setCurrentState('PATROL');
    }
  },
  
  exit(louis: LouisAI): void {
    louis.searchTimer = 0;
    louis.stuckTimer = 0;
    louis.clearSuspicionHistory();
    louis.clearSearchWaypoints();
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
  public lastPosition: THREE.Vector3 = new THREE.Vector3();
  
  // Suspicion tracking for directional investigation
  private suspicionHistory: SuspicionSample[] = [];
  private readonly SUSPICION_HISTORY_DURATION = 2.0; // Seconds to keep samples
  private investigationTarget: THREE.Vector3 = new THREE.Vector3();
  private currentSuspicionLevel: number = 0;
  
  // Stuck detection
  public stuckTimer: number = 0;
  
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
    
    // Initial position (y=0 so feet touch ground, body parts positioned relative to this)
    this.mesh.position.set(-5, 0, -5);
    
    // Start patrolling
    this.stateMachine.setCurrentState('PATROL');
  }
  
  private createVisuals(): void {
    // Body (suit - darker for Louis)
    // Capsule height 0.9, so center at 0.45 for bottom to touch ground
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.9, 4, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x555566,  // Lighter blue-grey suit (visible but dark)
    });
    this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.bodyMesh.position.y = 0.45;
    this.bodyMesh.castShadow = true;
    this.mesh.add(this.bodyMesh);
    
    // Head (Louis is shorter than Mike)
    // Position on top of body: 0.45 + 0.45 (half capsule) + 0.23 (head radius) = 1.13
    const headGeometry = new THREE.SphereGeometry(0.23, 12, 12);
    const headMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffddaa,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.13;
    head.castShadow = true;
    this.mesh.add(head);
    
    // Hair (Louis has different hair)
    const hairGeometry = new THREE.BoxGeometry(0.33, 0.1, 0.38);
    const hairMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x5a3620,
    });
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.y = 1.33;
    hair.position.z = 0.02;
    this.mesh.add(hair);
    
    // The drug test folder (very important!)
    const folderGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.05);
    const folderMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffdd55,  // Bright Manila folder
    });
    const folder = new THREE.Mesh(folderGeometry, folderMaterial);
    folder.position.set(0.35, 0.65, 0.2);
    folder.rotation.z = 0.2;
    folder.rotation.y = -0.3;
    folder.castShadow = true;
    this.mesh.add(folder);
    
    // Vision cone debug (optional, for development)
    // this.visionCone.createDebugVisual(this.game.getScene()!);
  }
  
  private setupPatrolPoints(): void {
    // Define patrol waypoints around the office (y=0 for ground level)
    this.patrolPoints = [
      new THREE.Vector3(-5, 0, -5),   // Louis's office area
      new THREE.Vector3(0, 0, -5),    // Hallway
      new THREE.Vector3(5, 0, -5),    // Harvey's office area
      new THREE.Vector3(5, 0, 0),     // Center
      new THREE.Vector3(0, 0, 5),     // Conference area
      new THREE.Vector3(-5, 0, 5),    // Library area
      new THREE.Vector3(-10, 0, 0),   // Cubicles
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
    
    // Clean up old suspicion samples
    this.pruneSuspicionHistory();
    
    // Update vision cone debug if enabled
    // this.visionCone.updateDebugVisual(this.mesh.position, this.mesh.rotation.y);
  }
  
  /**
   * Track suspicion history to determine direction of increasing suspicion
   */
  updateSuspicionHistory(detectionLevel: number): void {
    // ALWAYS update current suspicion level (even when 0)
    this.currentSuspicionLevel = detectionLevel;
    
    const playerPos = this.getPlayerPosition();
    if (!playerPos || detectionLevel <= 0) {
      // Player not detected - still record a 0 sample to track "lost" status
      if (detectionLevel <= 0) {
        this.suspicionHistory.push({
          position: this.lastKnownPlayerPosition.clone(),
          direction: new THREE.Vector3(0, 0, 1),
          level: 0,
          timestamp: performance.now() / 1000
        });
      }
      return;
    }
    
    // Calculate direction to player
    const direction = new THREE.Vector3()
      .subVectors(playerPos, this.mesh.position)
      .normalize();
    
    // Add new sample
    this.suspicionHistory.push({
      position: playerPos.clone(),
      direction: direction,
      level: detectionLevel,
      timestamp: performance.now() / 1000
    });
  }
  
  /**
   * Remove old suspicion samples
   */
  private pruneSuspicionHistory(): void {
    const now = performance.now() / 1000;
    this.suspicionHistory = this.suspicionHistory.filter(
      sample => now - sample.timestamp < this.SUSPICION_HISTORY_DURATION
    );
  }
  
  /**
   * Clear all suspicion history
   */
  clearSuspicionHistory(): void {
    this.suspicionHistory = [];
    this.currentSuspicionLevel = 0;
  }
  
  /**
   * Check if suspicion is increasing based on recent samples
   */
  isSuspicionIncreasing(): boolean {
    if (this.suspicionHistory.length < 2) return false;
    
    // Compare recent samples
    const recent = this.suspicionHistory.slice(-3); // Last 3 samples
    const avgRecent = recent.reduce((sum, s) => sum + s.level, 0) / recent.length;
    
    const older = this.suspicionHistory.slice(0, Math.max(1, this.suspicionHistory.length - 3));
    const avgOlder = older.reduce((sum, s) => sum + s.level, 0) / older.length;
    
    return avgRecent > avgOlder + 0.05; // Threshold to avoid noise
  }
  
  /**
   * Calculate where to investigate based on suspicion direction
   */
  calculateInvestigationTarget(): void {
    if (this.suspicionHistory.length === 0) {
      // No history, use last known player position
      this.investigationTarget.copy(this.lastKnownPlayerPosition);
      return;
    }
    
    // Get recent samples and calculate weighted average direction
    const recent = this.suspicionHistory.slice(-5);
    const avgDirection = new THREE.Vector3();
    let totalWeight = 0;
    
    for (const sample of recent) {
      // Weight by level and recency
      const weight = sample.level;
      avgDirection.add(sample.direction.clone().multiplyScalar(weight));
      totalWeight += weight;
    }
    
    if (totalWeight > 0) {
      avgDirection.divideScalar(totalWeight).normalize();
    } else {
      // Fall back to last player position
      this.investigationTarget.copy(this.lastKnownPlayerPosition);
      return;
    }
    
    // Calculate investigation point: move in suspicion direction
    // Distance based on suspicion level (more suspicious = investigate further)
    const investigateDistance = 3 + this.currentSuspicionLevel * 5;
    this.investigationTarget.copy(this.mesh.position)
      .add(avgDirection.multiplyScalar(investigateDistance));
    this.investigationTarget.y = 0;
  }
  
  /**
   * Get current investigation target
   */
  getInvestigationTarget(): THREE.Vector3 {
    return this.investigationTarget;
  }
  
  /**
   * Get current suspicion level
   */
  getSuspicionLevel(): number {
    return this.currentSuspicionLevel;
  }
  
  // Search waypoint system for structured searching
  private searchWaypoints: THREE.Vector3[] = [];
  private currentSearchIndex: number = 0;
  
  /**
   * Generate search waypoints radiating from last known position
   */
  generateSearchWaypoints(): void {
    this.searchWaypoints = [];
    const center = this.lastKnownPlayerPosition.clone();
    
    // Generate points in a spiral/search pattern
    const searchRadius = 6;
    const numPoints = 8;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2 + Math.random() * 0.5;
      const radius = searchRadius * (0.5 + 0.5 * (i / numPoints)); // Varying radius
      const x = center.x + Math.cos(angle) * radius;
      const z = center.z + Math.sin(angle) * radius;
      this.searchWaypoints.push(new THREE.Vector3(x, 0, z));
    }
    
    // Start from closest point
    this.currentSearchIndex = 0;
    let minDist = Infinity;
    for (let i = 0; i < this.searchWaypoints.length; i++) {
      const dist = this.mesh.position.distanceTo(this.searchWaypoints[i]);
      if (dist < minDist) {
        minDist = dist;
        this.currentSearchIndex = i;
      }
    }
  }
  
  /**
   * Get current search waypoint
   */
  getCurrentSearchWaypoint(): THREE.Vector3 {
    if (this.searchWaypoints.length === 0) {
      return this.lastKnownPlayerPosition;
    }
    return this.searchWaypoints[this.currentSearchIndex];
  }
  
  /**
   * Move to next search waypoint
   */
  nextSearchWaypoint(): void {
    if (this.searchWaypoints.length === 0) return;
    this.currentSearchIndex = (this.currentSearchIndex + 1) % this.searchWaypoints.length;
  }
  
  /**
   * Clear search waypoints
   */
  clearSearchWaypoints(): void {
    this.searchWaypoints = [];
    this.currentSearchIndex = 0;
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
    
    // Calculate desired position
    const currentPos = this.mesh.position.clone();
    const desiredPos = currentPos.clone().addScaledVector(this.currentVelocity, deltaTime);
    
    // Apply collision resolution
    const collisionSystem = this.game.collisionSystem;
    if (collisionSystem) {
      const resolvedPos = collisionSystem.resolvePlayerCollision(
        currentPos,
        desiredPos,
        0.3 // Louis radius (same as player)
      );
      
      // Update velocity based on actual movement
      if (Math.abs(desiredPos.x - currentPos.x) > 0.001 && Math.abs(resolvedPos.x - currentPos.x) < 0.001) {
        this.currentVelocity.x = 0;
      }
      if (Math.abs(desiredPos.z - currentPos.z) > 0.001 && Math.abs(resolvedPos.z - currentPos.z) < 0.001) {
        this.currentVelocity.z = 0;
      }
      
      this.mesh.position.copy(resolvedPos);
    } else {
      // No collision system - apply movement directly
      this.mesh.position.copy(desiredPos);
    }
    
    // Ensure Louis stays on the ground (y=0)
    this.mesh.position.y = 0;
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
    
    // Update last known position if detecting player
    if (detectionLevel > 0.1) {
      this.lastKnownPlayerPosition.copy(playerPos);
    }
    
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

# 🎮 Pearson Hardman Escape - Testing Guide

This guide explains how to test the game after each implementation phase.

---

## 🚀 Quick Start (Phase 1 - Current)

### Running the Game

```bash
# Start the development server
npm run dev
```

The game will open automatically at `http://localhost:3000`

### Phase 1 Testing Checklist ✅

| Feature | How to Test | Expected Result |
|---------|-------------|-----------------|
| **Game Launch** | Run `npm run dev` | Browser opens with title screen |
| **Title Screen** | View initial screen | Shows "PEARSON HARDMAN ESCAPE" with controls |
| **Pointer Lock** | Click "CLICK TO START" | Mouse locks, UI disappears |
| **WASD Movement** | Press W/A/S/D | Mike moves in camera-relative directions |
| **Mouse Look** | Move mouse | Camera rotates around Mike smoothly |
| **Sprint** | Hold SHIFT while moving | Mike runs faster (check console) |
| **Stamina System** | Sprint until tired | Sprint stops when stamina depletes |
| **Crouch** | Hold C | Mike moves slower (not visually different yet) |
| **Pause** | Press ESC | Pointer unlocks, instructions reappear |
| **Resume** | Click on canvas | Pointer locks again, game resumes |

### Phase 1 Debug Commands (Browser Console)

```javascript
// Check if player is moving
console.log(game.player?.getVelocity())

// Teleport player
console.log(game.player?.setPosition(0, 1, 0))

// Check current position
console.log(game.player?.getPosition())
```

---

## 📋 Testing by Phase

### Phase 2: Louis AI System

**Features to Test:**

```
✅ Louis spawns in office
✅ Louis patrols between waypoints
✅ Louis detects player when in vision cone
✅ Chase mode activates on detection
✅ Louis searches last known position when player hides
✅ Detection meter appears and fills correctly
```

**Test Scenarios:**

1. **Patrol Test**
   - Watch Louis walk his patrol route
   - He should stop at each waypoint briefly
   - Should not detect player behind walls

2. **Vision Cone Test**
   - Walk into Louis's line of sight
   - Detection meter should appear and fill
   - At 100%, chase mode activates

3. **Chase Test**
   - Let Louis spot you
   - Run away - Louis should chase at high speed
   - Break line of sight - Louis should search area

4. **Catch Test**
   - Let Louis catch you
   - Game over screen should appear

---

### Phase 3: Environment & Hiding

**Features to Test:**

```
✅ All office rooms are accessible
✅ Walls block movement
✅ Hideable objects are interactive
✅ Press E to enter/exit hiding spots
✅ Louis cannot detect player while hidden
✅ Distraction objects work (throwable)
```

**Test Scenarios:**

1. **Map Navigation**
   - Visit each area: Library, Conference Room, Cubicles, etc.
   - Check that all doors/walkways work
   - Verify no collision issues

2. **Hiding Test**
   - Approach a bathroom stall
   - Press E - view should change (camera zooms in/blur)
   - Louis walks past - no detection
   - Press E again to exit

3. **Distraction Test**
   - Pick up coffee cup (E)
   - Throw with mouse click
   - Louis should investigate noise

---

### Phase 4: UI & Game Loop

**Features to Test:**

```
✅ Main menu with start/options
✅ HUD shows stamina, detection meter
✅ Timer counts down (3 minutes)
✅ Win condition: reach exit
✅ Win/Lose screens with restart
✅ Settings: mouse sensitivity, volume
```

**Test Scenarios:**

1. **Win Condition**
   - Reach the exit door
   - Win screen appears
   - Can restart game

2. **Lose Condition**
   - Get caught by Louis
   - Drug test mini-game appears
   - Lose screen with "YOU GOT LITT UP!"

3. **Timer Test**
   - Survive for 3 minutes
   - Timer runs out = automatic win (escape succeeds)

---

## 🐛 Debugging Tips

### Enable Debug Mode

Add this to `src/main.ts`:

```typescript
// Add after game.init()
(window as any).game = game;
(window as any).THREE = THREE;
```

Then in browser console:

```javascript
// See all game objects
game.scene.traverse(obj => console.log(obj.name, obj))

// Check Louis AI state
game.louis?.getCurrentState()

// Check detection level
game.detectionSystem?.getDetectionLevel()
```

### Visual Debugging

Add to `Game.ts` init():

```typescript
// Show collision boundaries
import { Box3Helper } from 'three';
const box = new THREE.Box3().setFromObject(playerMesh);
const helper = new Box3Helper(box, 0xff0000);
scene.add(helper);
```

### Performance Monitoring

Open Chrome DevTools > Performance:
1. Click record
2. Play for 30 seconds
3. Check for frame drops
4. Target: 60 FPS consistently

---

## 🎯 Automated Testing (Future)

```bash
# Run unit tests (when implemented)
npm test

# Run integration tests
npm run test:integration

# Check TypeScript compilation
npm run build
```

---

## 📱 Testing Checklist Before Release

- [ ] Game loads without errors
- [ ] All controls respond immediately
- [ ] No camera clipping through walls
- [ ] Louis AI doesn't get stuck
- [ ] Can complete game (win)
- [ ] Can lose game (caught)
- [ ] Audio plays correctly
- [ ] Works on Chrome, Firefox, Safari
- [ ] Works at different screen sizes
- [ ] No memory leaks (play for 10+ minutes)

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `npm install` |
| Blank screen | Check console for errors |
| Mouse not locking | Click directly on canvas |
| Laggy movement | Reduce browser zoom, close other tabs |
| Three.js errors | Clear browser cache, restart dev server |

---

## 📝 Reporting Bugs

When reporting issues, include:

1. Browser and version
2. Steps to reproduce
3. Expected vs actual behavior
4. Console error messages
5. Screenshot (if visual bug)

# 🕵️ EXIT CODE - 2D No-Code Level Creator & Decryption Game

## 🎯 Game Concept Overview

**Exit Code** is a 2D tile-based decryption game where community members create levels using a visual no-code editor, and players solve puzzles through movement, collision, and text decryption mechanics.

Think: **2D Minecraft meets Scratch meets Hacker Terminal**

---

## 🧱 Core Game Mechanics

### **Level Creator (No-Code Editor)**
- **Grid System**: Small square tiles (like 2D Minecraft)
- **Drag & Drop**: Visual interface to place objects
- **Object Library**: Pre-built game objects with behaviors
- **Action System**: Define what happens when objects interact
- **Preview Mode**: Test levels before publishing

### **Gameplay Mechanics**
- **Movement**: Arrow keys/WASD to move player
- **Collision Detection**: Trigger events when touching objects
- **Text Matching**: Decrypt codes, solve riddles, find passwords
- **Health System**: Health objects heal, death objects kill
- **Hint System**: Objects reveal clues when touched
- **Win Conditions**: Complete objectives to finish level

### **Game Objects**
```
PLAYER OBJECTS:
🟦 Player Spawn - Starting position
🔴 Player - Moveable character

ENVIRONMENT:
⬛ Wall - Solid, blocks movement
🟩 Floor - Walkable surface  
🟨 Goal/Exit - Level completion

INTERACTIVE:
💡 Hint Object - Shows text on collision
🔑 Key Object - Collectible item
📝 Text Input - Player types answer
💻 Terminal - Decryption puzzles

MECHANICS:
❤️ Health Object - Restores health
💀 Death Object - Kills player
⚡ Moving Object - Animated obstacles
🚪 Door - Opens with key/code
```

---

## 🛠️ Level Creator Interface

### **Creator Mode UI**
```
┌─────────────────────────────────────────────────┐
│ EXIT CODE - LEVEL CREATOR                       │
├─────────────────┬───────────────────────────────┤
│ OBJECT PALETTE  │        LEVEL GRID            │
│                 │                               │
│ 🟦 Player       │  ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛         │
│ ⬛ Wall         │  ⬛🟩🟩🟩🟩🟩🟩🟩🟩⬛         │
│ 🟩 Floor        │  ⬛🟩🟦🟩💡🟩🟩🟩🟩⬛         │
│ 💡 Hint         │  ⬛🟩🟩🟩⬛⬛🟩🟩🟩⬛         │
│ 🔑 Key          │  ⬛🟩🟩🟩🟩🟩🟩🔑🟩⬛         │
│ 🚪 Door         │  ⬛🟩🟩🟩🟩🟩🟩🟩🟩⬛         │
│ 💻 Terminal     │  ⬛🟩🟩🟩🟩🟩🟩🟩🟨⬛         │
│ ❤️ Health       │  ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛         │
│ 💀 Death        │                               │
│                 │ [Test Level] [Save] [Share]   │
└─────────────────┴───────────────────────────────┘
```

### **Object Configuration Panel**
When placing objects, creators can set:
- **Hint Text**: What message shows on collision
- **Required Input**: What text player must type
- **Health Value**: How much health to add/remove
- **Movement Pattern**: For moving objects
- **Unlock Conditions**: What's needed to interact

---

## 🎮 Player Experience

### **Game Play UI**
```
┌─────────────────────────────────────────────────┐
│ LEVEL: "Corporate Infiltration" by u/hacker123  │
├─────────────────────────────────────────────────┤
│                                                 │
│   ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛                     │
│   ⬛🟩🟩🟩💡🟩🟩🟩🟩⬛                     │
│   ⬛🟩🟦🟩🟩🟩🟩🟩🟩⬛   HP: ❤️❤️❤️        │
│   ⬛🟩🟩🟩⬛⬛🟩💻🟩⬛                     │
│   ⬛🟩🟩🟩🟩🟩🟩🟩🟩⬛   INVENTORY:        │
│   ⬛🟩🟩🟩🟩🟩🟩🔑🟩⬛   🔑 Admin Key      │
│   ⬛🟩🟩🟩🟩🟩🟩🟩🟨⬛                     │
│   ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛                     │
│                                                 │
│ > HINT: "The password is hidden in the logs..."  │
│ > ENTER COMMAND: ________________               │
├─────────────────────────────────────────────────┤
│ Use WASD to move • Touch objects to interact    │
└─────────────────────────────────────────────────┘
```

---

## 🏗️ Technical Architecture

### **Frontend Components**
```
src/client/components/
├── Game/
│   ├── GameEngine.tsx       # Main game loop
│   ├── Player.tsx           # Player movement
│   ├── GameGrid.tsx         # Tile rendering
│   ├── CollisionSystem.tsx  # Interaction detection
│   └── DecryptionInput.tsx  # Text input puzzles
├── Creator/
│   ├── LevelEditor.tsx      # Main editor interface
│   ├── ObjectPalette.tsx    # Draggable objects
│   ├── TileGrid.tsx         # Editable grid
│   ├── ObjectConfig.tsx     # Property editor
│   └── LevelPreview.tsx     # Test mode
└── UI/
    ├── HackerTerminal.tsx   # Terminal styling
    ├── InventoryPanel.tsx   # Player items
    └── GameHUD.tsx          # Health, score, etc.
```

### **Data Models**
```typescript
interface GameObject {
  id: string;
  type: 'player' | 'wall' | 'hint' | 'key' | 'terminal' | 'death' | 'health';
  x: number;
  y: number;
  properties: {
    text?: string;        // Hint text
    requiredInput?: string; // Answer to decrypt
    healthValue?: number; // +/- health
    movementPattern?: string; // For animated objects
  };
}

interface Level {
  id: string;
  title: string;
  creator: string;
  grid: GameObject[][];
  playerStart: { x: number, y: number };
  winCondition: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface GameState {
  playerX: number;
  playerY: number;
  health: number;
  inventory: string[];
  currentLevel: Level;
  inputMode: boolean;
}
```

---

## 📊 Implementation Priority (3-Day Sprint)

### **Day 1: Core Foundation**
1. **Grid System** - Basic tile rendering
2. **Hacker Styling** - Terminal theme CSS
3. **Object Palette** - Draggable tiles
4. **Simple Movement** - Player controls

### **Day 2: Game Mechanics** 
1. **Collision Detection** - Object interactions
2. **Hint System** - Text display on touch
3. **Basic Creator** - Place/remove tiles
4. **Level Saving** - Redis storage

### **Day 3: Polish & Submit**
1. **Decryption Puzzles** - Text matching
2. **Demo Levels** - Create examples
3. **Level Sharing** - Community features
4. **Hackathon Submission** - Deploy & document

---

## 🎯 Minimum Viable Product (MVP)

### **Must Have Features**
- [ ] 10x10 grid level editor
- [ ] 6 basic object types (player, wall, floor, hint, goal, death)
- [ ] Drag & drop object placement
- [ ] Player movement with collision detection
- [ ] Hint text display on collision
- [ ] Simple win condition (reach goal)
- [ ] Level save/load via Redis
- [ ] Community level sharing

### **Success Criteria**
- Creator can build a simple level in 2 minutes
- Player can complete the level using hints
- Multiple community levels can be created and shared
- Hacker aesthetic is compelling and consistent
- App works smoothly on Reddit's platform

---

This is a MUCH more exciting concept! A 2D no-code game creator with hacker themes will definitely stand out in the hackathon. Ready to start building? 🚀
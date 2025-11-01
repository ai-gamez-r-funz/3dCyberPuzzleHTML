// ============================================
// LAYER 1 PUZZLES - FOUNDATION (No Bifurcation)
// Single reality, teaching core mechanics
// ============================================

import { PUZZLE_CATEGORIES } from '../core/config.js';

/**
 * Layer 1 puzzles have bifurcationLayer: 1 (no split, single reality)
 * These teach mechanics without the complexity of managing multiple branches
 */

export const LAYER_1_PUZZLES = [
    // ========================================
    // CATEGORY: FOUNDATION - Basic Sokoban
    // ========================================
    {
        id: 'L1-F1',
        category: PUZZLE_CATEGORIES.FOUNDATION,
        bifurcationLayer: 1,
        name: "Foundation 1: First Push",
        description: "Push the box onto the target. WASD to move.",
        width: 6,
        height: 5,
        layout: [
            "######",
            "#    #",
            "# P$ #",
            "#  . #",
            "######"
        ]
    },
    
    {
        id: 'L1-F2',
        category: PUZZLE_CATEGORIES.FOUNDATION,
        bifurcationLayer: 1,
        name: "Foundation 2: Path Planning",
        description: "Don't push the box into a corner!",
        width: 7,
        height: 6,
        layout: [
            "#######",
            "#     #",
            "# P $ #",
            "#     #",
            "#   . #",
            "#######"
        ]
    },
    
    {
        id: 'L1-F3',
        category: PUZZLE_CATEGORIES.FOUNDATION,
        bifurcationLayer: 1,
        name: "Foundation 3: Two Boxes",
        description: "Multiple boxes, multiple targets.",
        width: 8,
        height: 6,
        layout: [
            "########",
            "#      #",
            "# P $$ #",
            "#      #",
            "# ..   #",
            "########"
        ]
    },
    
    // ========================================
    // CATEGORY: PRESSURE - Pressure Plates
    // ========================================
    {
        id: 'L1-P1',
        category: PUZZLE_CATEGORIES.PRESSURE,
        bifurcationLayer: 1,
        name: "Pressure 1: First Plate",
        description: "Stand on the pressure plate (p) to open the door (D)!",
        width: 8,
        height: 5,
        layout: [
            "########",
            "# P    #",
            "# p D $#",
            "#     .#",
            "########"
        ],
        pressurePlates: [
            {
                id: 0,
                x: 2,
                y: 2,
                requiredWeight: 1, // Just needs player
                connectedDoors: [0],
                affectsAllBranches: true
            }
        ],
        doors: [
            {
                id: 0,
                x: 4,
                y: 2,
                defaultClosed: true,
                orientation: 'vertical'
            }
        ]
    },
    
    {
        id: 'L1-P2',
        category: PUZZLE_CATEGORIES.PRESSURE,
        bifurcationLayer: 1,
        name: "Pressure 2: Box Weight",
        description: "This plate needs a box! Boxes are heavier than you.",
        width: 9,
        height: 6,
        layout: [
            "#########",
            "#       #",
            "# P $ D #",
            "#   p   #",
            "#      .#",
            "#########"
        ],
        pressurePlates: [
            {
                id: 0,
                x: 4,
                y: 3,
                requiredWeight: 2, // Needs box (weight = 2)
                connectedDoors: [0]
            }
        ],
        doors: [
            {
                id: 0,
                x: 6,
                y: 2,
                defaultClosed: true
            }
        ]
    },
    
    {
        id: 'L1-P3',
        category: PUZZLE_CATEGORIES.PRESSURE,
        bifurcationLayer: 1,
        name: "Pressure 3: Hold the Door",
        description: "Keep the plate pressed while getting the box through!",
        width: 10,
        height: 6,
        layout: [
            "##########",
            "#        #",
            "# P $  D #",
            "#   p    #",
            "#       .#",
            "##########"
        ],
        pressurePlates: [
            {
                id: 0,
                x: 4,
                y: 3,
                requiredWeight: 2, // Needs box
                connectedDoors: [0]
            }
        ],
        doors: [
            {
                id: 0,
                x: 7,
                y: 2,
                defaultClosed: true
            }
        ],
        hint: "Push the box onto the plate, then go around to push it through the door!"
    },
    
    {
        id: 'L1-P4',
        category: PUZZLE_CATEGORIES.PRESSURE,
        bifurcationLayer: 1,
        name: "Pressure 4: Two Plates (OR)",
        description: "Either plate opens the door. Use logic!",
        width: 11,
        height: 7,
        layout: [
            "###########",
            "#         #",
            "# P  $ $  #",
            "#  p   p  #",
            "#    D    #",
            "#    .    #",
            "###########"
        ],
        pressurePlates: [
            {
                id: 0,
                x: 3,
                y: 3,
                requiredWeight: 2,
                connectedDoors: [0],
                logic: 'OR'
            },
            {
                id: 1,
                x: 7,
                y: 3,
                requiredWeight: 2,
                connectedDoors: [0],
                logic: 'OR'
            }
        ],
        doors: [
            {
                id: 0,
                x: 5,
                y: 4,
                defaultClosed: true
            }
        ]
    },
    
    {
        id: 'L1-P5',
        category: PUZZLE_CATEGORIES.PRESSURE,
        bifurcationLayer: 1,
        name: "Pressure 5: Two Plates (AND)",
        description: "BOTH plates must be pressed! Plan your moves.",
        width: 12,
        height: 8,
        layout: [
            "############",
            "#          #",
            "# P  $  $  #",
            "#          #",
            "#  p    p  #",
            "#     D    #",
            "#     .    #",
            "############"
        ],
        pressurePlates: [
            {
                id: 0,
                x: 3,
                y: 4,
                requiredWeight: 2,
                connectedDoors: [0],
                logic: 'AND'
            },
            {
                id: 1,
                x: 8,
                y: 4,
                requiredWeight: 2,
                connectedDoors: [0],
                logic: 'AND'
            }
        ],
        doors: [
            {
                id: 0,
                x: 6,
                y: 5,
                defaultClosed: true
            }
        ]
    },
    
    {
        id: 'L1-P6',
        category: PUZZLE_CATEGORIES.PRESSURE,
        bifurcationLayer: 1,
        name: "Pressure 6: The Gauntlet",
        description: "Multiple doors, complex paths. Think ahead!",
        width: 13,
        height: 9,
        layout: [
            "#############",
            "#           #",
            "# P  $   $  #",
            "#    #D#    #",
            "#  p  D  p  #",
            "#    #D#    #",
            "#           #",
            "#     .     #",
            "#############"
        ],
        pressurePlates: [
            {
                id: 0,
                x: 3,
                y: 4,
                requiredWeight: 2,
                connectedDoors: [0, 1]
            },
            {
                id: 1,
                x: 9,
                y: 4,
                requiredWeight: 2,
                connectedDoors: [1, 2]
            }
        ],
        doors: [
            {
                id: 0,
                x: 6,
                y: 3,
                defaultClosed: true,
                orientation: 'horizontal'
            },
            {
                id: 1,
                x: 6,
                y: 4,
                defaultClosed: true,
                orientation: 'horizontal'
            },
            {
                id: 2,
                x: 6,
                y: 5,
                defaultClosed: true,
                orientation: 'horizontal'
            }
        ]
    },
    
    // ========================================
    // CATEGORY: FOUNDATION + PRESSURE Mix
    // ========================================
    {
        id: 'L1-FP1',
        category: PUZZLE_CATEGORIES.FOUNDATION,
        bifurcationLayer: 1,
        name: "Mixed 1: Pressure + Target",
        description: "Some plates open doors, some spots are targets.",
        width: 10,
        height: 7,
        layout: [
            "##########",
            "#        #",
            "# P $ $  #",
            "#  p   . #",
            "#    D   #",
            "#      . #",
            "##########"
        ],
        pressurePlates: [
            {
                id: 0,
                x: 3,
                y: 3,
                requiredWeight: 2,
                connectedDoors: [0]
            }
        ],
        doors: [
            {
                id: 0,
                x: 5,
                y: 4,
                defaultClosed: true
            }
        ],
        hint: "One box for the target, one for the plate!"
    }
];

/**
 * Get puzzles by category
 */
export function getLayer1PuzzlesByCategory(category) {
    return LAYER_1_PUZZLES.filter(p => p.category === category);
}

/**
 * Get puzzle by ID
 */
export function getLayer1PuzzleById(id) {
    return LAYER_1_PUZZLES.find(p => p.id === id);
}

// ============================================
// LAYER 2 PUZZLES - BIFURCATION (2-Way Split)
// Reality splits into 2 branches
// ============================================

import { PUZZLE_CATEGORIES } from '../core/config.js';

/**
 * Layer 2 puzzles have bifurcationLayer: 2 (2-way split)
 * These introduce the complexity of managing two parallel realities
 */

export const LAYER_2_PUZZLES = [
    // ========================================
    // CATEGORY: SPLIT - Bifurcation Basics
    // ========================================
    {
        id: 'L2-S1',
        category: PUZZLE_CATEGORIES.SPLIT,
        bifurcationLayer: 2,
        name: "Split 1: Two Realities",
        description: "One box, two branches. Box must be on target in BOTH realities!",
        width: 7,
        height: 6,
        layout: [
            "#######",
            "#     #",
            "# P $ #",
            "#     #",
            "# . . #",
            "#######"
        ],
        colors: {
            boxes: { 0: 'neutral' },
            targetsPerBranch: {
                0: { 0: 'neutral', 1: 'neutral' },
                1: { 0: 'neutral', 1: 'neutral' }
            }
        }
    },
    
    {
        id: 'L2-S2',
        category: PUZZLE_CATEGORIES.SPLIT,
        bifurcationLayer: 2,
        name: "Split 2: Color Swap",
        description: "Targets have different colors in each branch!",
        width: 8,
        height: 6,
        layout: [
            "########",
            "#      #",
            "# P  $ #",
            "#      #",
            "# .  . #",
            "########"
        ],
        colors: {
            boxes: { 0: 'neutral' },
            targetsPerBranch: {
                0: { 0: 'red', 1: 'blue' },
                1: { 0: 'blue', 1: 'red' }
            }
        }
    },
    
    // ========================================
    // CATEGORY: PRESSURE - With Bifurcation
    // ========================================
    {
        id: 'L2-P1',
        category: PUZZLE_CATEGORIES.PRESSURE,
        bifurcationLayer: 2,
        name: "Split Pressure 1: One Plate, Two Doors",
        description: "Plate affects BOTH branches. Doors in different places!",
        width: 10,
        height: 6,
        layout: [
            "##########",
            "#        #",
            "# P $  D #",
            "#   p    #",
            "#   D   .#",
            "##########"
        ],
        pressurePlates: [
            {
                id: 0,
                x: 4,
                y: 3,
                requiredWeight: 2, // Needs box
                connectedDoors: [0, 1],
                affectsAllBranches: true, // Global plate!
                logic: 'OR'
            }
        ],
        doorsPerBranch: {
            0: [
                {
                    id: 0,
                    x: 7,
                    y: 2,
                    defaultClosed: true
                }
            ],
            1: [
                {
                    id: 1,
                    x: 4,
                    y: 4,
                    defaultClosed: true
                }
            ]
        },
        hint: "The plate exists in both branches. When you press it in one, it opens doors in BOTH!"
    },
    
    {
        id: 'L2-P2',
        category: PUZZLE_CATEGORIES.PRESSURE,
        bifurcationLayer: 2,
        name: "Split Pressure 2: Local Plates",
        description: "Each branch has its own plate. Plan independently!",
        width: 11,
        height: 7,
        layout: [
            "###########",
            "#         #",
            "# P  $ $  #",
            "#  p   p  #",
            "#  D   D  #",
            "#  .   .  #",
            "###########"
        ],
        pressurePlatesPerBranch: {
            0: [
                {
                    id: 0,
                    x: 3,
                    y: 3,
                    requiredWeight: 2,
                    connectedDoors: [0],
                    affectsAllBranches: false // Local to Branch A!
                }
            ],
            1: [
                {
                    id: 1,
                    x: 7,
                    y: 3,
                    requiredWeight: 2,
                    connectedDoors: [1],
                    affectsAllBranches: false // Local to Branch B!
                }
            ]
        },
        doorsPerBranch: {
            0: [
                {
                    id: 0,
                    x: 3,
                    y: 4,
                    defaultClosed: true
                }
            ],
            1: [
                {
                    id: 1,
                    x: 7,
                    y: 4,
                    defaultClosed: true
                }
            ]
        },
        hint: "Each branch has its own plate and door. Switch between branches (Tab or 1/2) to solve each!"
    },
    
    {
        id: 'L2-P3',
        category: PUZZLE_CATEGORIES.PRESSURE,
        bifurcationLayer: 2,
        name: "Split Pressure 3: AND Across Branches",
        description: "Door opens only when plates in BOTH branches are pressed!",
        width: 12,
        height: 8,
        layout: [
            "############",
            "#          #",
            "# P  $  $  #",
            "#    #D#   #",
            "#  p  D  p #",
            "#    #D#   #",
            "#     .    #",
            "############"
        ],
        pressurePlates: [
            {
                id: 0,
                x: 3,
                y: 4,
                requiredWeight: 2,
                connectedDoors: [0, 1, 2],
                affectsAllBranches: true,
                logic: 'AND' // Both branches must press!
            },
            {
                id: 1,
                x: 9,
                y: 4,
                requiredWeight: 2,
                connectedDoors: [0, 1, 2],
                affectsAllBranches: true,
                logic: 'AND'
            }
        ],
        doors: [
            {
                id: 0,
                x: 6,
                y: 3,
                defaultClosed: true
            },
            {
                id: 1,
                x: 6,
                y: 4,
                defaultClosed: true
            },
            {
                id: 2,
                x: 6,
                y: 5,
                defaultClosed: true
            }
        ],
        hint: "The doors are shared between branches. They only open when BOTH plates are pressed!"
    },
    
    {
        id: 'L2-P4',
        category: PUZZLE_CATEGORIES.PRESSURE,
        bifurcationLayer: 2,
        name: "Split Pressure 4: Asymmetric Puzzle",
        description: "Different layouts in each branch. Coordinate carefully!",
        width: 11,
        height: 8,
        layout: [
            "###########",
            "#         #",
            "# P $ $   #",
            "#   #     #",
            "# p   p   #",
            "#   #   D #",
            "#       . #",
            "###########"
        ],
        pressurePlates: [
            {
                id: 0,
                x: 2,
                y: 4,
                requiredWeight: 2,
                connectedDoors: [0],
                affectsAllBranches: true,
                logic: 'OR'
            },
            {
                id: 1,
                x: 6,
                y: 4,
                requiredWeight: 2,
                connectedDoors: [0],
                affectsAllBranches: true,
                logic: 'OR'
            }
        ],
        doorsPerBranch: {
            0: [
                {
                    id: 0,
                    x: 8,
                    y: 5,
                    defaultClosed: true
                }
            ],
            1: [
                // No door in Branch B!
            ]
        },
        wallsPerBranch: {
            0: [
                { x: 4, y: 3 },
                { x: 4, y: 5 }
            ],
            1: [
                { x: 4, y: 3 }
                // Different wall configuration!
            ]
        },
        hint: "The walls are different in each branch! Explore both to find the solution."
    },
    
    // ========================================
    // CATEGORY: BALANCE - Complex Weight Puzzles
    // ========================================
    {
        id: 'L2-B1',
        category: PUZZLE_CATEGORIES.BALANCE,
        bifurcationLayer: 2,
        name: "Balance 1: Weight Distribution",
        description: "Distribute boxes across branches to open all doors!",
        width: 13,
        height: 9,
        layout: [
            "#############",
            "#           #",
            "# P $ $ $ $ #",
            "#           #",
            "#  p  p  p  #",
            "#  D  D  D  #",
            "#           #",
            "#  .  .  .  #",
            "#############"
        ],
        pressurePlates: [
            {
                id: 0,
                x: 3,
                y: 4,
                requiredWeight: 2,
                connectedDoors: [0],
                affectsAllBranches: false
            },
            {
                id: 1,
                x: 6,
                y: 4,
                requiredWeight: 2,
                connectedDoors: [1],
                affectsAllBranches: true
            },
            {
                id: 2,
                x: 9,
                y: 4,
                requiredWeight: 2,
                connectedDoors: [2],
                affectsAllBranches: false
            }
        ],
        doors: [
            {
                id: 0,
                x: 3,
                y: 5,
                defaultClosed: true,
                affectsAllBranches: false
            },
            {
                id: 1,
                x: 6,
                y: 5,
                defaultClosed: true,
                affectsAllBranches: true
            },
            {
                id: 2,
                x: 9,
                y: 5,
                defaultClosed: true,
                affectsAllBranches: false
            }
        ],
        colors: {
            boxes: { 0: 'red', 1: 'blue', 2: 'green', 3: 'yellow' },
            targetsPerBranch: {
                0: { 0: 'red', 1: 'blue', 2: 'green' },
                1: { 0: 'yellow', 1: 'blue', 2: 'red' }
            }
        },
        hint: "Some doors are local, some are global. Plan which boxes go to which branch!"
    }
];

/**
 * Get puzzles by category
 */
export function getLayer2PuzzlesByCategory(category) {
    return LAYER_2_PUZZLES.filter(p => p.category === category);
}

/**
 * Get puzzle by ID
 */
export function getLayer2PuzzleById(id) {
    return LAYER_2_PUZZLES.find(p => p.id === id);
}

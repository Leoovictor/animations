// A placeholder rig for tests and the rig viewer: a side-view figure built from rectangles in code (not a character design).
// Sizes in "image px". Facing right (+x), a positive angle swings a hanging bone backwards: knees fold with shin > 0, elbows with forearm < 0. Each bone's image is a capsule whose pivot is near its top end.
export const TEST_RIG = {
  view: 'side', placeholder: true,
  bones: [
    { id: 'pelvis',    parent: null,        image: 'pelvis',  pivot: [60, 30],  position: [0, 0],     z: 5 },
    { id: 'torso',     parent: 'pelvis',    image: 'torso',   pivot: [60, 200], position: [0, -10],   z: 6, limits: [-25, 25] },
    { id: 'head',      parent: 'torso',     image: 'head',    pivot: [70, 150], position: [5, -190],  z: 9, limits: [-30, 35] },
    { id: 'upperArmR', parent: 'torso',     image: 'limb',    pivot: [22, 22],  position: [10, -165], z: 8, limits: [-170, 80] },
    { id: 'forearmR',  parent: 'upperArmR', image: 'limb',    pivot: [22, 22],  position: [0, 110],   z: 8, limits: [-150, 0] },
    { id: 'upperArmL', parent: 'torso',     image: 'limbB',   pivot: [22, 22],  position: [-5, -165], z: 3, limits: [-170, 80] },
    { id: 'forearmL',  parent: 'upperArmL', image: 'limbB',   pivot: [22, 22],  position: [0, 110],   z: 3, limits: [-150, 0] },
    { id: 'thighR',    parent: 'pelvis',    image: 'leg',     pivot: [26, 22],  position: [10, 20],   z: 4, limits: [-100, 70] },
    { id: 'shinR',     parent: 'thighR',    image: 'leg',     pivot: [26, 22],  position: [0, 125],   z: 4, limits: [0, 150] },
    { id: 'thighL',    parent: 'pelvis',    image: 'legB',    pivot: [26, 22],  position: [-10, 20],  z: 2, limits: [-100, 70] },
    { id: 'shinL',     parent: 'thighL',    image: 'legB',    pivot: [26, 22],  position: [0, 125],   z: 2, limits: [0, 150] },
  ],
  sockets: { handR: { bone: 'forearmR', at: [22, 122] }, handL: { bone: 'forearmL', at: [22, 122] }, footR: { bone: 'shinR', at: [26, 140] }, footL: { bone: 'shinL', at: [26, 140] }, eye: { bone: 'head', at: [100, 70] } },
};

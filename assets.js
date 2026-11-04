/* Public-domain models from Kenney (CC0): Furniture Kit and Food Kit, copied into assets/models/kenney.
   Models load in the background. Any venue prop whose model has not loaded yet stays empty, so the game
   never waits on them, and a missing file just leaves the placeholder out. */
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export const KIT_FURNITURE=['table','tableRound','chairRounded','stoolBar','pottedPlant','kitchenStove','trashcan','kitchenCabinet'];
export const KIT_FOOD=['plate-dinner','burger','pizza','fries','taco','hot-dog','cup-coffee','mug','cocktail','carton','soda-bottle','can','bag','ice-cream-cup','cake','sandwich','salad','glass-wine'];

export function loadKit(THREE){
  const templates={};
  const loader=new GLTFLoader();
  // The Kenney models point at Textures/colormap.png, which is not in the repo yet. Route that request to a
  // neutral 1x1 image so there are no 404s. To get the real look, copy Kenney's colormap.png to
  // assets/models/kenney/Textures/ and remove this modifier.
  const PLACEHOLDER='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8c+fPfwAIDQN2K5sFKgAAAABJRU5ErkJggg==';
  loader.manager.setURLModifier(u=>/colormap\.png$/i.test(u)?PLACEHOLDER:u);
  const load=(folder,name)=>loader.load(`assets/models/kenney/${folder}/${name}.glb`,
    gltf=>{templates[name]=gltf.scene},
    undefined,
    ()=>{/* missing or blocked: the venue simply keeps its placeholder */});
  KIT_FURNITURE.forEach(n=>load('furniture',n));
  KIT_FOOD.forEach(n=>load('food',n));
  return{get:name=>templates[name]||null};
}

/* Public-domain models from Kenney (CC0): Furniture Kit and Food Kit, copied into assets/models/kenney.
   Models load in the background. Any venue prop whose model has not loaded yet stays empty, so the game
   never waits on them, and a missing file just leaves the placeholder out. */
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export const KIT_FURNITURE=['table','tableRound','chairRounded','stoolBar','pottedPlant','kitchenStove','trashcan','kitchenCabinet'];
export const KIT_FOOD=['plate-dinner','burger','pizza','fries','taco','hot-dog','cup-coffee','mug','cocktail','carton','soda-bottle','can','bag','ice-cream-cup','cake','sandwich','salad','glass-wine'];

export function loadKit(THREE){
  const templates={};
  const loader=new GLTFLoader();
  const load=(folder,name)=>loader.load(`assets/models/kenney/${folder}/${name}.glb`,
    gltf=>{templates[name]=gltf.scene},
    undefined,
    ()=>{/* missing or blocked: the venue simply keeps its placeholder */});
  KIT_FURNITURE.forEach(n=>load('furniture',n));
  KIT_FOOD.forEach(n=>load('food',n));
  return{get:name=>templates[name]||null};
}

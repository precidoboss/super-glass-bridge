import * as THREE from 'three';
import {createBenz} from './benz.js';

export const URUS_PAINTS=[
  {name:'OBSIDIAN BLACK',color:0x050708},
  {name:'SATIN GRAPHITE',color:0x41484d},
  {name:'SUPER GREEN',color:0x0b6b3f},
  {name:'ICE WHITE',color:0xe7ecec},
  {name:'ROSSO RED',color:0x8d0b18}
];

export function createUrus(renderer,opts={}){
  const base=createBenz(renderer,{...opts,noBeam:!!opts.noBeam});
  const group=new THREE.Group();group.name='SUPER URUS · PERFORMANCE SUV';group.add(base.group);
  base.group.scale.set(1.08,1.22,1.08);base.group.position.y=.045;
  const trim=new THREE.MeshStandardMaterial({color:0x050607,metalness:.62,roughness:.2});
  const glass=new THREE.MeshPhysicalMaterial({color:0x07130f,metalness:.35,roughness:.06,transparent:true,opacity:.58,depthWrite:false,side:THREE.DoubleSide});
  const lime=new THREE.MeshBasicMaterial({color:0xc8ff43});
  const white=new THREE.MeshStandardMaterial({color:0xdce5e7,metalness:1,roughness:.12});
  const red=new THREE.MeshStandardMaterial({color:0x57070c,emissive:0xff1428,emissiveIntensity:1.5,roughness:.2});
  const suv=base.body;
  const roof=new THREE.Mesh(new THREE.BoxGeometry(1.62,.10,2.25),glass);roof.position.set(0,1.72,.42);suv.add(roof);
  for(const x of[-.78,.78]){const rail=new THREE.Mesh(new THREE.CapsuleGeometry(.035,4.25,4,10),white);rail.rotation.x=Math.PI/2;rail.position.set(x,1.78,.15);suv.add(rail)}
  for(const z of[-2.43,2.43]){const bumper=new THREE.Mesh(new THREE.BoxGeometry(2.02,.28,.24),trim);bumper.position.set(0,.42,z);suv.add(bumper)}
  for(const x of[-1,1]){const arch=new THREE.Mesh(new THREE.TorusGeometry(.56,.055,8,34,Math.PI+.7),trim);arch.rotation.y=x*Math.PI/2;arch.rotation.z=-.28;arch.position.set(x*1.02,.54,-1.58);suv.add(arch)}
  const front=new THREE.Mesh(new THREE.BoxGeometry(1.48,.38,.10),trim);front.position.set(0,.7,-2.44);front.rotation.x=.3;suv.add(front);
  for(let i=-4;i<=4;i++){const bar=new THREE.Mesh(new THREE.BoxGeometry(.07,.22,.024),white);bar.position.set(i*.18,.72,-2.50);bar.rotation.x=.3;suv.add(bar)}
  const tail=new THREE.Mesh(new THREE.BoxGeometry(1.65,.055,.035),red);tail.position.set(0,.91,2.47);suv.add(tail);
  const c=document.createElement('canvas');c.width=256;c.height=72;const x=c.getContext('2d');x.fillStyle='#07100b';x.fillRect(0,0,256,72);x.strokeStyle='#c8ff43';x.lineWidth=6;x.strokeRect(10,10,236,52);x.fillStyle='#f2ffe4';x.font='800 36px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('URUS',128,38);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const logo=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.34),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));logo.position.set(0,.94,2.51);suv.add(logo);
  const api={...base,group,body:base.body,wheels:base.wheels,steer:base.steer,beam:base.beam,env:base.env,paints:URUS_PAINTS,dims:{...base.dims,W:base.dims.W*1.08,L:base.dims.L*1.08},seat:{x:base.seat.x*1.04,y:base.seat.y*1.22+.03,z:base.seat.z*1.04}};
  api._paint=0;api.setPaint=function(i){api._paint=((i%URUS_PAINTS.length)+URUS_PAINTS.length)%URUS_PAINTS.length;const idx=api._paint%base.paints.length;const p=base.paints[idx];base.setPaint(idx);return URUS_PAINTS[api._paint]};api.nextPaint=function(){return api.setPaint(api._paint+1)};
  return api;
}

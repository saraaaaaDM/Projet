// ============================================================
//  SCENE SETUP
// ============================================================
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 4, 14);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================
//  DAY/NIGHT CYCLE
// ============================================================
function lerpColor(a, b, t) {
  const r = (((a >> 16) & 0xff) * (1-t) + ((b >> 16) & 0xff) * t) | 0;
  const g = (((a >>  8) & 0xff) * (1-t) + ((b >>  8) & 0xff) * t) | 0;
  const bl= ( (a & 0xff)         * (1-t) + ( b & 0xff)         * t) | 0;
  return (r << 16) | (g << 8) | bl;
}
const PHASES = [
  { phase: 0.00, sky: 0xff9966, fog: 0xffbb88 }, // dawn
  { phase: 0.25, sky: 0x7ab8d4, fog: 0x9fcce0 }, // day
  { phase: 0.55, sky: 0xff6633, fog: 0xff8855 }, // dusk
  { phase: 0.75, sky: 0x080e22, fog: 0x0d1530 }, // night
  { phase: 1.00, sky: 0x080e22, fog: 0x0d1530 }, // night end
];
function phaseColor(key, p) {
  for (let i = 0; i < PHASES.length - 1; i++) {
    const a = PHASES[i], b = PHASES[i+1];
    if (p >= a.phase && p <= b.phase) {
      const t = (p - a.phase) / (b.phase - a.phase);
      return lerpColor(a[key], b[key], t);
    }
  }
  return PHASES[PHASES.length-1][key];
}

scene.background = new THREE.Color(0x7ab8d4);
scene.fog = new THREE.FogExp2(0x9fcce0, 0.022);

// ============================================================
//  LIGHTS
// ============================================================
const ambientLight = new THREE.AmbientLight(0xd0e8ff, 0.5);
scene.add(ambientLight);

const hemi = new THREE.HemisphereLight(0xb0d8ff, 0x4a6632, 0.8);
scene.add(hemi);

const sunLight = new THREE.DirectionalLight(0xfff0c0, 1.8);
sunLight.position.set(10, 18, 8);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 70;
sunLight.shadow.camera.left  = -30;
sunLight.shadow.camera.right  = 30;
sunLight.shadow.camera.top    = 24;
sunLight.shadow.camera.bottom = -24;
sunLight.shadow.bias = -0.001;
scene.add(sunLight);

const moonLight = new THREE.DirectionalLight(0x4466cc, 0);
moonLight.position.set(-12, 15, -5);
scene.add(moonLight);

const interiorLight = new THREE.PointLight(0xff8830, 3.5, 10);
interiorLight.position.set(19, 2.2, -0.5);
scene.add(interiorLight);

const lampLight = new THREE.PointLight(0xffcc66, 2.5, 6);
lampLight.position.set(20.5, 2.8, -2.0);
scene.add(lampLight);

const fireplaceLight = new THREE.PointLight(0xff4400, 3, 5);
fireplaceLight.position.set(21.5, 1.4, -2.2);
scene.add(fireplaceLight);

// ============================================================
//  HELPERS
// ============================================================
function mat(color, roughness=0.85, metalness=0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}
function box(w,h,d,color,rough=0.85) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat(color,rough));
  m.castShadow = true; m.receiveShadow = true; return m;
}
function cyl(rt,rb,h,segs,color,rough=0.85) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segs), mat(color,rough));
  m.castShadow = true; m.receiveShadow = true; return m;
}
function lerp(a,b,t){ return a+(b-a)*t; }
function easeInOut(t){ return t<0.5?2*t*t:-1+(4-2*t)*t; }
function easeOut(t){ return 1-Math.pow(1-t,3); }
function clamp(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); }

// ============================================================
//  GROUND & PATH
// ============================================================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120,40,30,14),
  mat(0x6aaa5a,0.95)
);
ground.rotation.x = -Math.PI/2;
ground.receiveShadow = true;
scene.add(ground);

for(let i=0;i<16;i++){
  const p = box(5+Math.random()*4,0.04,3+Math.random()*2, Math.random()>0.5?0x70b85a:0x5e9e4a);
  p.position.set(-22+Math.random()*50,0.02,-4+Math.random()*8);
  scene.add(p);
}

const pathMat = new THREE.MeshStandardMaterial({ color:0xc4b090, roughness:0.3, metalness:0.05 });
const pathMesh = new THREE.Mesh(new THREE.PlaneGeometry(32,1.5), pathMat);
pathMesh.rotation.x = -Math.PI/2;
pathMesh.position.set(2,0.04,0.5);
pathMesh.receiveShadow = true;
scene.add(pathMesh);

for(let i=0;i<32;i++){
  const tw=0.55+Math.random()*0.2, td=0.45+Math.random()*0.15;
  const tile = box(tw,0.06,td, Math.random()>0.5?0xc8b89a:0xb8a880, 0.9);
  tile.position.set(-13+i*0.88+(Math.random()-0.5)*0.2, 0.04, 0.4+(Math.random()-0.5)*0.35);
  tile.rotation.y = (Math.random()-0.5)*0.18;
  scene.add(tile);
}

// ============================================================
//  STARS
// ============================================================
const starGeo = new THREE.BufferGeometry();
const starCount = 900;
const starPos = new Float32Array(starCount*3);
for(let i=0;i<starCount;i++){
  const theta = Math.random()*Math.PI*2;
  const phi   = Math.random()*Math.PI*0.5;
  const r = 80+Math.random()*20;
  starPos[i*3]   = r*Math.sin(phi)*Math.cos(theta);
  starPos[i*3+1] = r*Math.cos(phi)+10;
  starPos[i*3+2] = r*Math.sin(phi)*Math.sin(theta);
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos,3));
const starMat = new THREE.PointsMaterial({ color:0xffffff, size:0.38, transparent:true, opacity:0 });
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

// ============================================================
//  SUN & MOON
// ============================================================
const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1.8,12,10),
  new THREE.MeshBasicMaterial({ color:0xffee88 })
);
scene.add(sunMesh);

const moonMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1.4,10,8),
  new THREE.MeshBasicMaterial({ color:0xddeeff })
);
moonMesh.visible = false;
scene.add(moonMesh);

// ============================================================
//  FENCE
// ============================================================
function makeFence(x,z){
  const g=new THREE.Group();
  const post=cyl(0.06,0.07,1.2,5,0x8b6b3d); post.position.y=0.6; g.add(post);
  [-0.28,0.28].forEach(dy=>{
    const rail=box(1.1,0.06,0.04,0xa07840); rail.position.set(0.5,0.6+dy,0); g.add(rail);
  });
  g.position.set(x,0,z); return g;
}
for(let x=-18;x<28;x+=1.1) scene.add(makeFence(x,-3.7));
for(let x=-18;x<14;x+=1.1) scene.add(makeFence(x,2.9));

// ============================================================
//  TREES
// ============================================================
function createTree(scale=1){
  const g=new THREE.Group();
  const trunk=cyl(0.2*scale,0.28*scale,2.2*scale,7,0x6b4f2a);
  trunk.position.y=1.1*scale; g.add(trunk);
  [0x3d7a3f,0x4e8f47,0x2d6232].forEach((col,i)=>{
    const f=new THREE.Mesh(new THREE.ConeGeometry((1.4-i*0.25)*scale,(1.9)*scale,7),mat(col,0.9));
    f.castShadow=true; f.position.y=(2.2+i*0.75)*scale; g.add(f);
  });
  return g;
}
[[-16,-3.2],[-12.5,-3.0],[-9,-3.2],[-5,-2.9],[-1.5,-3.1],
 [-14,2.2],[-10.5,2.5],[-7,2.2],[-3,2.4],[1.5,2.2],
 [5.5,2.3],[5.5,-3.0],[9,-3.2],
 [24,-3.0],[27,2.3],[30,-2.8],[-19,2.0],[-19,-3.0]
].forEach(([x,z])=>{
  const t=createTree(0.82+Math.random()*0.36); t.position.set(x,0,z); scene.add(t);
});

// ============================================================
//  FLOWERS & GRASS
// ============================================================
const flowerCols=[0xff5555,0xff9f1c,0xffe135,0xff80cc,0xcc55ff,0xff6688];
const flowers=[];
for(let i=0;i<70;i++){
  const x=-16+Math.random()*38; if(x>12) continue;
  const z=(Math.random()>0.5?-1:1)*(1.1+Math.random()*2.0);
  const col=flowerCols[Math.floor(Math.random()*flowerCols.length)];
  const stem=cyl(0.02,0.02,0.28,4,0x4a8a2a); stem.position.set(x,0.14,z); scene.add(stem);
  const petal=new THREE.Mesh(new THREE.SphereGeometry(0.1,5,4),mat(col,0.8));
  petal.position.set(x,0.33,z); scene.add(petal);
  flowers.push({ mesh:petal, ox:x, oz:z, phase:Math.random()*Math.PI*2 });
}
for(let i=0;i<60;i++){
  const x=-18+Math.random()*42; if(x>13) continue;
  const z=(Math.random()>0.5?-1:1)*(0.9+Math.random()*2.2);
  const tuft=box(0.05,0.22+Math.random()*0.14,0.05,0x5aaa3a,1);
  tuft.rotation.z=(Math.random()-0.5)*0.5; tuft.position.set(x,0.11,z); scene.add(tuft);
}

// ============================================================
//  CLOUDS
// ============================================================
const clouds=[];
function makeCloud(x,y,z,scale=1){
  const g=new THREE.Group();
  [[0,0,0,2.8,1.0,1.6],[-0.9,0.3,0,1.8,0.85,1.2],[0.9,0.3,0,2.0,0.9,1.3],[0,0.55,0,1.4,0.7,1.0],[-.4,.5,0,1.0,.65,.9]]
    .forEach(([px,py,pz,w,h,d])=>{
      const c=box(w*scale,h*scale,d*scale,0xf4f4f4,0.5);
      c.castShadow=false; c.receiveShadow=false; c.position.set(px*scale,py*scale,pz*scale); g.add(c);
    });
  g.position.set(x,y,z); return g;
}
[[-16,8.5,-8,1.1],[-4,10,-10,.95],[8,9.2,-9,1.2],[20,8.8,-8,.85],[30,9.5,-9,1.05],[-26,9,-7,.9]]
  .forEach(([x,y,z,s])=>{ const c=makeCloud(x,y,z,s); scene.add(c); clouds.push(c); });

// ============================================================
//  BIRDS
// ============================================================
const birds=[];
function createBird(){
  const g=new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3,0.12,0.12),mat(0x222222,0.9)));
  const wingL=new THREE.Mesh(new THREE.BoxGeometry(0.35,0.04,0.18),mat(0x2a2a2a,0.9));
  wingL.position.set(-0.3,0,0); g.add(wingL);
  const wingR=new THREE.Mesh(new THREE.BoxGeometry(0.35,0.04,0.18),mat(0x2a2a2a,0.9));
  wingR.position.set(0.3,0,0); g.add(wingR);
  g.userData={wingL,wingR}; return g;
}
for(let i=0;i<6;i++){
  const b=createBird();
  const a=(i/6)*Math.PI*2;
  b.userData.angle=a; b.userData.radius=3.5+Math.random()*2;
  b.userData.speed=0.4+Math.random()*0.2; b.userData.height=9+Math.random()*4;
  b.userData.phase=Math.random()*Math.PI*2;
  b.position.set(-5+Math.cos(a)*4, b.userData.height, -5+Math.sin(a)*2);
  scene.add(b); birds.push(b);
}

// ============================================================
//  FALLING LEAVES
// ============================================================
const leaves=[];
const leafCols=[0xcc5522,0xdd8833,0xee9922,0xbb4422,0xaacc44,0xdd4411];
for(let i=0;i<40;i++){
  const leaf=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.02,0.1),mat(leafCols[i%leafCols.length],0.9));
  leaf.userData={
    x:-14+Math.random()*28, y:3+Math.random()*5, z:-3+Math.random()*6,
    vy:-(0.35+Math.random()*0.55), vx:(Math.random()-0.5)*0.25, vz:(Math.random()-0.5)*0.25,
    rx:Math.random()*Math.PI*2, ry:Math.random()*Math.PI*2, rz:Math.random()*Math.PI*2,
    phase:Math.random()*Math.PI*2
  };
  const d=leaf.userData;
  leaf.position.set(d.x,d.y,d.z); scene.add(leaf); leaves.push(leaf);
}

// ============================================================
//  CHIMNEY SMOKE
// ============================================================
const smoke=[];
for(let i=0;i<20;i++){
  const sm=new THREE.Mesh(
    new THREE.SphereGeometry(0.16+Math.random()*0.1,5,4),
    new THREE.MeshStandardMaterial({ color:0xaaaaaa, transparent:true, opacity:0.18, roughness:1 })
  );
  sm.userData={ life:Math.random(), speed:0.38+Math.random()*0.28, drift:(Math.random()-0.5)*0.22 };
  scene.add(sm); smoke.push(sm);
}

// ============================================================
//  HOUSE
// ============================================================
(function buildHouse(){
  const g=new THREE.Group();
  const wallMat=mat(0xf2e4c8,0.9);
  const floorMat=mat(0xd4a86a,0.9);

  // Floor
  const fl=new THREE.Mesh(new THREE.BoxGeometry(6.2,0.12,5.2),floorMat);
  fl.position.set(0,0.06,0); fl.receiveShadow=true; g.add(fl);

  // Walls (no front)
  [[0,1.9,-2.5,6,3.8,0.18],[-3,1.9,0,0.18,3.8,5],[3,1.9,0,0.18,3.8,5]].forEach(([x,y,z,w,h,d])=>{
    const w_=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wallMat);
    w_.position.set(x,y,z); w_.castShadow=true; w_.receiveShadow=true; g.add(w_);
  });
  // Front pillars
  [-3,3].forEach(x=>{ const p=new THREE.Mesh(new THREE.BoxGeometry(0.22,3.8,0.22),wallMat); p.position.set(x,1.9,2.5); g.add(p); });
  const lintel=new THREE.Mesh(new THREE.BoxGeometry(6,0.22,0.22),wallMat); lintel.position.set(0,3.7,2.5); g.add(lintel);

  // Ceiling
  const ceil=new THREE.Mesh(new THREE.BoxGeometry(6,0.1,5),mat(0xe8d8b8,0.9));
  ceil.position.set(0,3.75,0); ceil.receiveShadow=true; g.add(ceil);

  // Roof
  const roof=new THREE.Mesh(new THREE.ConeGeometry(4.6,2.2,4),mat(0x8c2e2e,0.85));
  roof.rotation.y=Math.PI/4; roof.position.set(0,5.05,0); roof.castShadow=true; g.add(roof);

  // Chimney
  const ch=cyl(0.25,0.3,1.5,5,0x9b4a2a,0.9); ch.position.set(1.5,5.6,-1.5); g.add(ch);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.38,0.28,0.12,6),mat(0x7a3822,0.9));
  cap.position.set(1.5,6.42,-1.5); g.add(cap);

  // WOOD FLOOR PLANKS
  for(let fz=-2.3;fz<2.3;fz+=0.32){
    const pk=new THREE.Mesh(new THREE.BoxGeometry(5.7,0.04,0.28),mat(fz%0.64<0.32?0xc89050:0xbb8040,0.9));
    pk.position.set(0,0.13,fz); pk.receiveShadow=true; g.add(pk);
  }

  // RUG
  const rug=new THREE.Mesh(new THREE.BoxGeometry(3.4,0.04,2.4),mat(0x8b3a2e,0.95)); rug.position.set(-0.2,0.15,0.2); g.add(rug);
  const rugIn=new THREE.Mesh(new THREE.BoxGeometry(2.8,0.05,1.9),mat(0xd4995a,0.9)); rugIn.position.set(-0.2,0.16,0.2); g.add(rugIn);
  const rugC=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.06,0.8),mat(0x8b3a2e,0.9)); rugC.position.set(-0.2,0.17,0.2); g.add(rugC);

  // SOFA
  const sofa=new THREE.Group();
  const sBase=new THREE.Mesh(new THREE.BoxGeometry(2.5,0.45,0.95),mat(0x4a6b8a,0.8)); sBase.position.y=0.22; sofa.add(sBase);
  const sBack=new THREE.Mesh(new THREE.BoxGeometry(2.5,0.75,0.22),mat(0x3d5c78,0.8)); sBack.position.set(0,0.67,-0.37); sofa.add(sBack);
  [-1.1,1.1].forEach(sx=>{ const arm=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.55,0.95),mat(0x3d5c78,0.8)); arm.position.set(sx,0.42,0); sofa.add(arm); });
  [-0.75,0,0.75].forEach(cx=>{
    const cu=new THREE.Mesh(new THREE.BoxGeometry(0.72,0.16,0.78),mat(0x5577a0,0.7)); cu.position.set(cx,0.51,0.02); sofa.add(cu);
    const bc=new THREE.Mesh(new THREE.BoxGeometry(0.95,0.52,0.16),mat(0x5577a0,0.7)); bc.position.set(cx,0.74,-0.29); sofa.add(bc);
  });
  const blanket=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.08,0.7),mat(0xcc4422,0.85)); blanket.position.set(-0.6,0.5,0.15); blanket.rotation.z=0.15; sofa.add(blanket);
  sofa.position.set(-0.2,0.16,-1.7); g.add(sofa);

  // CAT on sofa
  const cat=new THREE.Group();
  const cb=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.2,0.5),mat(0xcc8844,0.9)); cb.position.y=0.1; cat.add(cb);
  const ch2=new THREE.Mesh(new THREE.SphereGeometry(0.13,7,6),mat(0xcc8844,0.9)); ch2.position.set(0,0.22,0.2); cat.add(ch2);
  [[-.06,.06],[.06,.06]].forEach(([ex,ez])=>{ const e=new THREE.Mesh(new THREE.ConeGeometry(0.04,0.07,4),mat(0xcc8844,0.9)); e.position.set(ex,0.31,0.2+ez); cat.add(e); });
  const tail=cyl(0.02,0.03,0.35,5,0xbb7733); tail.rotation.z=-0.8; tail.position.set(0,0.18,-0.28); cat.add(tail);
  cat.position.set(0.7,0.69,-1.55); cat.rotation.y=0.3; g.add(cat);

  // COFFEE TABLE
  const ct=new THREE.Mesh(new THREE.BoxGeometry(1.15,0.08,0.68),mat(0x9e6a30,0.6)); ct.position.set(-0.2,0.72,-0.5); g.add(ct);
  [[-0.45,-0.25],[0.45,-0.25],[-0.45,0.25],[0.45,0.25]].forEach(([tx,tz])=>{ const l=cyl(0.03,0.03,0.55,4,0x7a4f20); l.position.set(-0.2+tx,0.44,-0.5+tz); g.add(l); });
  const bk=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.05,0.22),mat(0x2244aa,0.8)); bk.position.set(-0.05,0.78,-0.5); bk.rotation.y=0.25; g.add(bk);
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(0.065,0.045,0.11,8),mat(0xf8f0e0,0.4)); cup.position.set(-0.32,0.78,-0.46); g.add(cup);
  const sau=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.09,0.03,8),mat(0xf0e8d8,0.4)); sau.position.set(-0.32,0.75,-0.46); g.add(sau);

  // FLOOR LAMP
  const lb=cyl(0.13,0.15,0.08,8,0x888888,0.4); lb.position.set(2.1,0.2,-1.9); g.add(lb);
  const lp=cyl(0.03,0.03,1.9,6,0x999999,0.3); lp.position.set(2.1,1.15,-1.9); g.add(lp);
  const ls=new THREE.Mesh(new THREE.ConeGeometry(0.32,0.48,8,1,true),new THREE.MeshStandardMaterial({color:0xe8c060,roughness:0.6,side:THREE.DoubleSide}));
  ls.rotation.x=Math.PI; ls.position.set(2.1,2.12,-1.9); g.add(ls);
  const lg=new THREE.Mesh(new THREE.SphereGeometry(0.08,6,5),new THREE.MeshBasicMaterial({color:0xffdd88})); lg.position.set(2.1,2.0,-1.9); g.add(lg);

  // BOOKSHELF
  const sh=new THREE.Mesh(new THREE.BoxGeometry(0.24,2.4,1.9),mat(0x7b5530,0.9)); sh.position.set(2.84,1.3,-1.2); g.add(sh);
  for(let s=0;s<3;s++){ const sl=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.04,1.85),mat(0x8a6038,0.8)); sl.position.set(2.84,0.32+s*0.72,-1.2); g.add(sl); }
  const bkCols=[0xcc2222,0x224488,0x228833,0xaa6622,0x882299,0x226688,0xcc8822,0x44aa66];
  for(let row=0;row<3;row++){ let bz=-0.82; while(bz<0.85){ const bw=0.06+Math.random()*0.05,bh=0.22+Math.random()*0.16; const b2=new THREE.Mesh(new THREE.BoxGeometry(0.22,bh,bw),mat(bkCols[Math.floor(Math.random()*bkCols.length)],0.9)); b2.position.set(2.82,0.36+row*0.72+bh/2,-1.2+bz+bw/2); b2.rotation.y=(Math.random()-0.5)*0.08; g.add(b2); bz+=bw+0.014; } }

  // FIREPLACE
  const fps=new THREE.Mesh(new THREE.BoxGeometry(1.9,1.7,0.28),mat(0xb8a888,0.95)); fps.position.set(1.8,0.75,-2.36); g.add(fps);
  const fpb=new THREE.Mesh(new THREE.BoxGeometry(1.65,1.5,0.32),mat(0xd4c4a0,0.9)); fpb.position.set(1.8,0.75,-2.34); g.add(fpb);
  const fpo=new THREE.Mesh(new THREE.BoxGeometry(1.05,0.95,0.38),mat(0x111111)); fpo.position.set(1.8,0.57,-2.34); g.add(fpo);
  const mant=new THREE.Mesh(new THREE.BoxGeometry(2.0,0.13,0.48),mat(0xc8a870,0.65)); mant.position.set(1.8,1.51,-2.3); g.add(mant);
  // Flames
  [[0.42,0.38,0xff4400],[0.36,0.28,0xff8800],[0.22,0.18,0xffcc00]].forEach(([d,w,col],yi)=>{
    const fl=new THREE.Mesh(new THREE.BoxGeometry(w,d*0.8,d),mat(col)); fl.position.set(1.8,0.3+yi*0.1,-2.32); g.add(fl);
  });
  const log=cyl(0.06,0.06,0.85,6,0x5a3012); log.rotation.z=Math.PI/2; log.position.set(1.8,0.14,-2.32); g.add(log);
  const candle=cyl(0.04,0.04,0.22,6,0xfffaee); candle.position.set(1.1,1.63,-2.28); g.add(candle);
  const cfl=new THREE.Mesh(new THREE.SphereGeometry(0.04,5,4),new THREE.MeshBasicMaterial({color:0xffbb44})); cfl.position.set(1.1,1.78,-2.28); g.add(cfl);
  const fr=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.38,0.06),mat(0x7b5530,0.7)); fr.position.set(1.82,1.75,-2.27); g.add(fr);
  const pic=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.28,0.07),mat(0x6699cc,0.5)); pic.position.set(1.82,1.75,-2.26); g.add(pic);

  // WALL ART
  const wa=new THREE.Mesh(new THREE.BoxGeometry(0.95,0.68,0.06),mat(0x5a3a1a,0.7)); wa.position.set(-1.2,2.5,-2.38); g.add(wa);
  const wac=new THREE.Mesh(new THREE.BoxGeometry(0.80,0.54,0.07),mat(0x4477bb,0.5)); wac.position.set(-1.2,2.5,-2.37); g.add(wac);

  // CLOCK on wall
  const clk=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.06,12),mat(0x8a6030,0.6)); clk.rotation.x=Math.PI/2; clk.position.set(-2.1,2.8,-2.38); g.add(clk);
  const clf=new THREE.Mesh(new THREE.CylinderGeometry(0.19,0.19,0.07,12),mat(0xf8f4ee,0.3)); clf.rotation.x=Math.PI/2; clf.position.set(-2.1,2.8,-2.35); g.add(clf);

  // PLANT
  const pot=cyl(0.14,0.10,0.22,7,0xcc7744,0.8); pot.position.set(-2.5,0.31,-1.2); g.add(pot);
  for(let i=0;i<6;i++){ const a=(i/6)*Math.PI*2; const pl=new THREE.Mesh(new THREE.SphereGeometry(0.1+Math.random()*0.06,5,4),mat(0x2a7a30,0.85)); pl.position.set(-2.5+Math.cos(a)*0.12,0.55+Math.random()*0.12,-1.2+Math.sin(a)*0.12); g.add(pl); }

  // SIDE TABLE
  const stTop=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.06,0.5),mat(0x9e6a30,0.7)); stTop.position.set(2.15,0.62,-0.2); g.add(stTop);
  [[-0.18,-0.18],[0.18,-0.18],[-0.18,0.18],[0.18,0.18]].forEach(([tx,tz])=>{ const l=cyl(0.025,0.025,0.5,4,0x7a4f20); l.position.set(2.15+tx,0.37,-0.2+tz); g.add(l); });

  g.position.set(18,0,-0.2);
  scene.add(g);
})();

// ============================================================
//  CHARACTER
// ============================================================
function createCharacter(){
  const g=new THREE.Group();
  const skinM=mat(0xffc9a0,0.7), shirtM=mat(0xcc4422,0.8), pantsM=mat(0x334455,0.85);
  const shoeM=mat(0x2a1a0a,0.9), hairM=mat(0x3d2200,0.9), coatM=mat(0x334488,0.75);

  const body=new THREE.Mesh(new THREE.BoxGeometry(0.56,0.92,0.38),shirtM); body.position.y=1.36; body.castShadow=true;
  const coat=new THREE.Mesh(new THREE.BoxGeometry(0.62,0.88,0.1),coatM); coat.position.set(0,1.36,0.19);
  const head=new THREE.Mesh(new THREE.BoxGeometry(0.38,0.4,0.36),skinM); head.position.y=2.02; head.castShadow=true;
  const hair=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.14,0.38),hairM); hair.position.set(0.02,2.27,0);
  const scarf=new THREE.Mesh(new THREE.BoxGeometry(0.44,0.14,0.44),mat(0xdd3322,0.8)); scarf.position.set(0,1.82,0);

  const legG=new THREE.BoxGeometry(0.21,0.76,0.22);
  const leg1=new THREE.Mesh(legG,pantsM); leg1.position.set(-0.15,0.63,0); leg1.castShadow=true;
  const leg2=new THREE.Mesh(legG,pantsM); leg2.position.set(0.15,0.63,0); leg2.castShadow=true;

  const shoeG=new THREE.BoxGeometry(0.22,0.1,0.3);
  const shoe1=new THREE.Mesh(shoeG,shoeM); shoe1.position.set(-0.15,0.22,0.04);
  const shoe2=new THREE.Mesh(shoeG,shoeM); shoe2.position.set(0.15,0.22,0.04);

  const armG=new THREE.BoxGeometry(0.18,0.72,0.18);
  const arm1=new THREE.Mesh(armG,coatM); arm1.position.set(-0.39,1.3,0); arm1.castShadow=true;
  const arm2=new THREE.Mesh(armG,coatM); arm2.position.set(0.39,1.3,0); arm2.castShadow=true;

  // Bag/backpack
  const bag=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.35,0.18),mat(0x886644,0.85)); bag.position.set(0,1.35,-0.2);

  g.add(body,coat,head,hair,scarf,leg1,leg2,shoe1,shoe2,arm1,arm2,bag);
  g.userData={leg1,leg2,shoe1,shoe2,arm1,arm2};
  return g;
}

const character=createCharacter();
character.rotation.y=-Math.PI/2;
character.position.set(-13,0,0.5);
scene.add(character);

// ============================================================
//  SCROLL / UI
// ============================================================
const progressBar=document.getElementById('progress-bar');
const hint=document.getElementById('hint');
const caption=document.getElementById('caption');
const captionTitle=document.getElementById('caption-title');
const captionSub=document.getElementById('caption-sub');

let progress=0, targetProgress=0;
const CHAR_START_X=-13, CHAR_END_X=13.5;

const captions=[
  {from:0.0,  to:0.22, title:"Un matin dans le jardin",  sub:"Quelque chose vous attend…"},
  {from:0.78, to:1.0,  title:"Bienvenue chez vous !",     sub:"Entrez, il fait bon dedans."},
];

let mouseX=0, mouseY=0;
window.addEventListener('mousemove', e=>{
  mouseX=(e.clientX/window.innerWidth -0.5)*2;
  mouseY=(e.clientY/window.innerHeight-0.5)*2;
});

const clock=new THREE.Clock();
let time=0;

// ============================================================
//  ANIMATION LOOP
// ============================================================
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),0.05);
  time+=dt;

  progress+=(targetProgress-progress)*0.055;
  progressBar.style.width=(progress*100)+'%';
  hint.classList.toggle('hidden',progress>0.04);

  let show=false;
  for(const c of captions){
    if(progress>=c.from && progress<=c.to){ captionTitle.textContent=c.title; captionSub.textContent=c.sub; show=true; break; }
  }
  caption.classList.toggle('visible',show);

  // --- SKY / FOG ---
  scene.background.setHex(phaseColor('sky',progress));
  scene.fog.color.setHex(phaseColor('fog',progress));

  // --- SUN / MOON / STARS ---
  const sunAngle=Math.PI+progress*Math.PI*1.5;
  sunMesh.position.set(Math.cos(sunAngle)*22, Math.sin(sunAngle)*18+2, -10);
  sunLight.position.copy(sunMesh.position);

  const dayFactor=clamp(Math.sin(progress*Math.PI),0,1);
  const nightFactor=clamp(1-dayFactor*1.6,0,1);
  sunLight.intensity=1.9*dayFactor;
  sunLight.color.setHex(progress<0.18||progress>0.78?0xff8844:0xfff0c0);
  ambientLight.intensity=0.15+dayFactor*0.5;
  moonLight.intensity=nightFactor*0.7;
  hemi.groundColor.setHex(progress>0.6?0x1a1a2e:0x4a6632);

  sunMesh.visible=dayFactor>0.06;
  moonMesh.visible=nightFactor>0.1;
  if(moonMesh.visible) moonMesh.position.set(-sunMesh.position.x*0.5, sunMesh.position.y*0.75+5, -12);
  starMat.opacity=nightFactor*0.92;

  // --- CHARACTER ---
  const tChar=easeInOut(clamp(progress/0.82,0,1));
  character.position.x=lerp(CHAR_START_X,CHAR_END_X,tChar);
  const moving=progress>0.01&&progress<0.99;
  if(moving){
    const sw=Math.sin(time*4.8);
    character.userData.leg1.rotation.z=sw*0.30;
    character.userData.leg2.rotation.z=-sw*0.30;
    character.userData.arm1.rotation.z=-sw*0.20;
    character.userData.arm2.rotation.z=sw*0.20;
    character.position.y=Math.abs(Math.sin(time*9.6))*0.045;
  } else {
    ['leg1','leg2','arm1','arm2'].forEach(k=>character.userData[k].rotation.z=0);
    character.position.y=Math.sin(time*1.2)*0.012;
  }

  // --- CAMERA + MOUSE PARALLAX ---
  const px=mouseX*0.28, py=mouseY*0.14;
  if(progress<0.82){
    const t=easeInOut(clamp(progress/0.82,0,1));
    camera.position.x=lerp(CHAR_START_X+1,15,t)+px;
    camera.position.y=lerp(4,5.5,t)-py;
    camera.position.z=lerp(14,15,t);
    camera.lookAt(lerp(CHAR_START_X+5,18,t),1.8,lerp(0.5,-0.3,t));
  } else {
    const t2=easeOut((progress-0.82)/0.18);
    camera.position.set(lerp(15,17,t2)+px*0.4, lerp(5.5,4.2,t2), lerp(15,11,t2));
    camera.lookAt(lerp(18,19.5,t2),lerp(1.8,1.4,t2),lerp(-0.3,-0.6,t2));
  }

  // --- CLOUDS ---
  clouds.forEach((c,i)=>{ c.position.x+=dt*(0.09+i*0.012); if(c.position.x>36) c.position.x=-26; });

  // --- BIRDS ---
  birds.forEach((b,i)=>{
    b.userData.angle+=dt*b.userData.speed;
    const a=b.userData.angle;
    b.position.x=-5+Math.cos(a)*b.userData.radius+i*1.2;
    b.position.y=b.userData.height+Math.sin(a*2.3+b.userData.phase)*0.55;
    b.position.z=-4+Math.sin(a*0.7)*b.userData.radius*0.45;
    b.rotation.y=-a+Math.PI/2;
    const flap=Math.sin(time*6+b.userData.phase)*0.38;
    b.userData.wingL.rotation.z=flap; b.userData.wingR.rotation.z=-flap;
  });

  // --- LEAVES ---
  leaves.forEach(leaf=>{
    const d=leaf.userData;
    d.y+=d.vy*dt; d.x+=d.vx*dt+Math.sin(time*1.2+d.phase)*0.008; d.z+=d.vz*dt+Math.cos(time*0.9+d.phase)*0.006;
    d.rx+=dt*1.2; d.ry+=dt*0.8; d.rz+=dt*0.5;
    if(d.y<0.12){ d.y=4+Math.random()*5; d.x=-14+Math.random()*28; d.z=-3.5+Math.random()*7; d.vx=(Math.random()-0.5)*0.25; d.vz=(Math.random()-0.5)*0.25; }
    leaf.position.set(d.x,d.y,d.z); leaf.rotation.set(d.rx,d.ry,d.rz);
  });

  // --- SMOKE ---
  smoke.forEach((sm,i)=>{
    const d=sm.userData;
    d.life+=dt*d.speed*0.18; if(d.life>1) d.life=0;
    const t=d.life;
    sm.position.set(19.5+Math.sin(t*8+i)*0.2+d.drift*t*3, 6.42+t*4.5, -1.9+Math.cos(t*6+i)*0.15);
    sm.material.opacity=(1-t)*0.2*Math.min(t*8,1);
    sm.scale.setScalar(0.8+t*1.8);
  });

  // --- FLOWERS SWAY ---
  flowers.forEach(f=>{ f.mesh.position.x=f.ox+Math.sin(time*1.5+f.phase)*0.015; f.mesh.rotation.z=Math.sin(time*1.5+f.phase)*0.08; });

  // --- FIREPLACE FLICKER ---
  fireplaceLight.intensity=2.5+Math.sin(time*9.1)*0.85+Math.sin(time*14.7)*0.4;

  // --- INTERIOR GLOW (brighter at night) ---
  const boost=1+nightFactor*0.9;
  interiorLight.intensity=3.5*boost;
  lampLight.intensity=2.5*boost;

  renderer.render(scene,camera);
}

window.addEventListener('scroll',()=>{
  const maxScroll=document.body.scrollHeight-window.innerHeight;
  targetProgress=clamp(window.scrollY/maxScroll,0,1);
});

animate();
/* GPU-rendered backdrops: sky with Milky Way and stars, moonlit ocean, misty pine mountains. */
(function () {
  'use strict';
  const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}';

  const COMMON = `
precision highp float;
uniform vec2 u_res; uniform float u_time; uniform vec4 u_band; uniform vec2 u_moon; uniform float u_dpr;
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x), mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0.0,a=0.5; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<5;i++){ v+=a*vnoise(p); p=m*p; a*=0.5;} return v; }
float fbm3(vec2 p){ float v=0.0,a=0.5; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<3;i++){ v+=a*vnoise(p); p=m*p; a*=0.5;} return v; }
float stars(vec2 px, float cell, float thr, float t){
  vec2 g=floor(px/cell); vec2 f=fract(px/cell); float h=hash12(g); if(h<thr) return 0.0;
  vec2 sp = vec2(0.15,0.15)+0.7*vec2(hash12(g+1.7), hash12(g+3.1));
  float d=length((f-sp)*cell)/u_dpr;
  float r = 0.5 + 1.6*pow(hash12(g+5.3),3.0);
  float tw=0.6+0.4*sin(t*(0.8+2.2*hash12(g+9.1))+h*40.0);
  float s = smoothstep(r, 0.0, d)*tw;
  s += smoothstep(r*5.0, 0.0, d)*0.06*tw*step(1.6, r);
  return s;
}
vec3 skyCol(vec2 uv, vec2 px, float t){
  vec3 top = vec3(0.010,0.014,0.065); vec3 low = vec3(0.11,0.15,0.34);
  vec3 c = mix(low, top, pow(clamp(uv.y,0.0,1.0), 0.75));
  float asp = u_res.x/u_res.y;
  vec2 p = vec2((uv.x-0.5)*asp, uv.y-u_band.y);
  float ca=cos(u_band.x), sa=sin(u_band.x);
  vec2 q = vec2(ca*p.x - sa*p.y, sa*p.x + ca*p.y);
  float band = exp(-pow(q.y/u_band.z, 2.0)*1.6);
  float n = fbm(q*vec2(2.2,7.0)+vec2(t*0.004,0.0));
  float n2 = fbm(q*vec2(5.0,13.0)+7.3);
  float n3 = fbm(q*vec2(12.0,30.0)+2.1);
  vec3 neb = mix(vec3(0.5,0.58,0.92), vec3(0.88,0.74,0.78), n2);
  c += neb * band * u_band.w * (0.06 + 0.42*pow(n,1.6) + 0.12*n3);
  c -= band * u_band.w * 0.10 * smoothstep(0.52,0.78,n2) * smoothstep(0.3,0.7,n);
  float s = stars(px, 46.0*u_dpr, 0.55, t) + stars(px, 22.0*u_dpr, 0.62, t)*0.8 + stars(px, 11.0*u_dpr, 0.78, t)*0.5;
  s += band*u_band.w*stars(px+31.0, 7.0*u_dpr, 0.55, t)*0.45;
  vec3 sc = mix(vec3(1.0,0.97,0.9), vec3(0.8,0.88,1.0), hash12(floor(px/23.0)));
  c += sc * s;
  return c;
}
`;

  const SKY_FRAG = COMMON + `
void main(){ vec2 uv = gl_FragCoord.xy/u_res; vec3 c = skyCol(uv, gl_FragCoord.xy, u_time);
  gl_FragColor = vec4(pow(c, vec3(0.95)), 1.0); }`;

  const SEA_FRAG = COMMON + `
float hgt(vec2 p, float t){
  float h = fbm(p*vec2(0.9,1.8)+vec2(t*0.12, t*0.25))*0.5;
  h += fbm3(p*vec2(3.2,6.5)+vec2(-t*0.3, t*0.5))*0.3;
  h += vnoise(p*vec2(11.0,24.0)+vec2(t*0.9, -t*0.6))*0.14;
  h += vnoise(p*vec2(23.0,50.0)+vec2(-t*1.3, t*0.8))*0.07;
  return h;
}
void main(){
  vec2 uv = gl_FragCoord.xy/u_res; float asp=u_res.x/u_res.y; float t=u_time;
  float hz = 0.5;
  vec3 col;
  vec3 moonC = vec3(1.0,0.93,0.78);
  if (uv.y > hz) {
    vec2 suv = vec2(uv.x, (uv.y-hz)/(1.0-hz));
    col = skyCol(suv, gl_FragCoord.xy, t);
    col += vec3(0.16,0.2,0.38)*pow(1.0-suv.y, 7.0)*0.7;
    // distant headland on the right
    float head = 0.012*smoothstep(0.55,0.75,uv.x)*(1.0+0.6*fbm3(vec2(uv.x*9.0,1.0))) ;
    if (suv.y < head/(1.0-hz)) col = vec3(0.03,0.045,0.1);
  } else {
    float yv = hz - uv.y;
    float z = 0.018/(yv+0.0035);
    float x = (uv.x-0.5)*asp*z*2.1;
    vec2 wp = vec2(x, z);
    float e = 0.012*z + 0.002;
    float hc = hgt(wp, t), hx = hgt(wp+vec2(e,0.0), t), hz2 = hgt(wp+vec2(0.0,e), t);
    float amp = 0.16;
    vec3 n = normalize(vec3(-(hx-hc)/e*amp, 1.0, -(hz2-hc)/e*amp));
    vec3 v = normalize(vec3(x, -0.07, z));
    vec3 r = reflect(v, n);
    vec3 skyLow = vec3(0.14,0.19,0.4), skyTop = vec3(0.02,0.03,0.09);
    vec3 refl = mix(skyLow, skyTop, clamp(r.y*2.5, 0.0, 1.0));
    float fres = 0.05 + 0.95*pow(1.0 - max(dot(-v, n), 0.0), 4.0);
    vec3 deep = vec3(0.015,0.05,0.11);
    col = mix(deep, refl, fres);
    // moon reflection
    vec3 md = normalize(vec3((u_moon.x-0.5)*2.0*asp, 0.45, 1.0));
    float dm = max(dot(r, md), 0.0);
    float spec = pow(dm, 700.0)*1.2 + pow(dm, 90.0)*0.28 + pow(dm, 10.0)*0.05;
    float gl = hash12(floor(gl_FragCoord.xy/u_dpr)+floor(t*7.0));
    col += moonC * (pow(dm, 700.0)*1.2*(0.5+1.0*gl) + pow(dm, 90.0)*0.28 + pow(dm, 10.0)*0.05);
    // haze toward horizon
    col = mix(col, vec3(0.12,0.16,0.3), 1.0-exp(-z*0.09));
    // shore
    float shoreY = 0.27 + 0.025*sin(uv.x*4.2+0.8) + 0.01*fbm3(vec2(uv.x*6.0, 3.0));
    float edge = uv.y - shoreY;
    float tide = 0.012*sin(t*0.5) ;
    float foamBand = smoothstep(0.03, 0.0, edge - tide) * smoothstep(-0.003, 0.004, edge - tide);
    float fn = fbm(vec2(uv.x*26.0 - t*0.25, uv.y*90.0 + t*0.5));
    float foam = foamBand * smoothstep(0.48, 0.75, fn + 0.1*foamBand);
    foam += smoothstep(0.004, 0.0, abs(edge - tide))*0.5*smoothstep(0.3,0.6,fn);
    vec3 sand = mix(vec3(0.16,0.13,0.2), vec3(0.09,0.075,0.12), smoothstep(shoreY, 0.0, uv.y));
    sand += 0.03*vnoise(gl_FragCoord.xy*0.9);
    float wet = smoothstep(-0.06, 0.0, edge)*smoothstep(0.02,-0.01,edge);
    sand = mix(sand, mix(sand, refl, 0.35), wet);
    // moon glint on wet sand
    float glx = exp(-pow((uv.x-u_moon.x)*4.0,2.0));
    sand += moonC*glx*wet*0.12;
    col = mix(col, sand, smoothstep(0.004, -0.004, edge));
    col += vec3(0.85,0.9,1.0)*foam*0.4;
  }
  gl_FragColor = vec4(pow(col, vec3(0.95)), 1.0);
}`;

  const PINES_FRAG = COMMON + `
float ridge(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v += a*(1.0-abs(2.0*vnoise(p)-1.0)); p*=2.1; p.x+=3.7; a*=0.5; } return v; }
// 1 inside a tiered pine for the cell at index c; x in cell units, y in screen units
float tree(float c, float x, float y, float base, float hscale, float seed){
  float r1 = hash12(vec2(c, seed)), r2 = hash12(vec2(c, seed+3.0)), r3 = hash12(vec2(c, seed+5.0));
  float cx = c + 0.2 + 0.6*r1;
  float h = hscale*(0.45 + 0.65*r2*r2);
  float w = 0.26 + 0.22*r3;
  float rel = (y - base + 0.012*r1)/h;
  if (rel < -0.1 || rel > 1.0) return 0.0;
  float tier = 1.0 - fract(rel*(6.0+2.0*r3));
  float hw = w*(1.0-rel)*(0.62 + 0.42*tier) + 0.02;
  return step(abs(x - cx), hw);
}
float forest(float x, float y, float base, float freq, float hscale, float seed){
  float xx = x*freq; float c = floor(xx); float m = 0.0;
  for (int i=-1;i<=1;i++){ float ci = c + float(i); m = max(m, tree(ci, xx, y, base + 0.015*(hash12(vec2(ci,seed+9.0))-0.5), hscale, seed)); }
  float xx2 = x*freq*0.73 + 0.41; float c2 = floor(xx2);
  for (int i=-1;i<=1;i++){ float ci = c2 + float(i); m = max(m, tree(ci, xx2, y, base - 0.01 + 0.015*hash12(vec2(ci,seed+19.0)), hscale*0.85, seed+31.0)); }
  return m;
}
void main(){
  vec2 uv = gl_FragCoord.xy/u_res; float asp=u_res.x/u_res.y; float t=u_time;
  float x = uv.x*asp;
  vec3 col = skyCol(uv, gl_FragCoord.xy, t);
  col += vec3(0.2,0.24,0.45)*pow(max(0.0, 1.0-(uv.y-0.3)/0.5), 5.0)*0.5;
  vec3 fog = vec3(0.24,0.29,0.5);
  // far range: sharp ridged peaks, moonlit from the left
  float e = 0.02;
  float r0 = ridge(vec2(x*2.8+4.0, 0.3));
  float y0 = 0.40 + 0.32*(r0-0.25) + 0.025*(1.0-abs(2.0*vnoise(vec2(x*38.0, 1.0))-1.0));
  if (uv.y < y0) {
    float lit = vnoise(vec2(x*3.5+2.0, 0.5));
    float tex = fbm3(vec2(x*24.0, uv.y*24.0)) * 0.6 + 0.4*fbm3(vec2(x*7.0+uv.y*9.0, uv.y*4.0));
    vec3 rock = mix(vec3(0.09,0.11,0.24), vec3(0.2,0.24,0.42), lit*0.7 + tex*0.3);
    rock = mix(rock, vec3(0.3,0.33,0.5), smoothstep(y0-0.05, y0, uv.y)*0.5);
    float snow = smoothstep(0.62, 0.7, y0) * smoothstep(y0-0.035-0.02*vnoise(vec2(x*30.0,2.0)), y0-0.005, uv.y);
    rock = mix(rock, vec3(0.62,0.66,0.8)*(0.6+0.4*lit), snow*0.85);
    col = mix(rock, fog, 0.45 + 0.4*smoothstep(y0, y0-0.3, uv.y));
  }
  // mid range, nearer and darker
  float r1 = ridge(vec2(x*4.2+11.0, 0.8));
  float y1 = 0.34 + 0.2*(r1-0.2) + 0.02*(1.0-abs(2.0*vnoise(vec2(x*50.0, 3.0))-1.0));
  if (uv.y < y1) {
    float lit = vnoise(vec2(x*5.0+7.0, 0.5));
    float tex = fbm3(vec2(x*30.0, uv.y*30.0)) * 0.6 + 0.4*fbm3(vec2(x*9.0-uv.y*8.0, uv.y*5.0));
    vec3 rock = mix(vec3(0.06,0.08,0.18), vec3(0.14,0.17,0.32), lit*0.7 + tex*0.3);
    col = mix(rock, fog, 0.25 + 0.35*smoothstep(y1, y1-0.25, uv.y));
  }
  // valley mist
  float mist = fbm(vec2(x*2.0 + t*0.02, uv.y*7.0));
  col = mix(col, fog, 0.6*smoothstep(0.48, 0.40, uv.y)*smoothstep(0.28,0.4,uv.y)*mist);
  // forest, back to front
  float b1 = 0.37 + 0.03*fbm(vec2(x*1.8+5.0, 0.0));
  if (uv.y < b1 + 0.06 && forest(x, uv.y, b1, 30.0, 0.06, 1.0) > 0.5 || uv.y < b1) { vec3 c1 = vec3(0.09,0.12,0.26); col = mix(c1, fog, 0.3*smoothstep(b1+0.02, b1-0.1, uv.y)+0.18); }
  float b2 = 0.315 + 0.03*fbm(vec2(x*2.2+1.0, 0.0));
  if (uv.y < b2 + 0.1 && forest(x, uv.y, b2, 17.0, 0.1, 7.0) > 0.5 || uv.y < b2) { vec3 c2 = vec3(0.05,0.07,0.16); col = mix(c2, fog, 0.22*smoothstep(b2+0.02, b2-0.12, uv.y)); }
  float b3 = 0.25 + 0.02*fbm(vec2(x*1.4+8.0, 0.0));
  if (uv.y < b3 + 0.2 && forest(x, uv.y, b3, 8.5, 0.2, 13.0) > 0.5 || uv.y < b3) { vec3 c3 = vec3(0.016,0.025,0.065); col = mix(c3, fog, 0.08*smoothstep(b3, b3-0.2, uv.y)); }
  // clearing floor with a soft moonlit patch in the middle, low mist
  if (uv.y < 0.25) {
    float g = fbm3(vec2(x*9.0, uv.y*30.0));
    vec3 floorC = mix(vec3(0.035,0.055,0.12), vec3(0.012,0.018,0.045), smoothstep(0.25, 0.0, uv.y));
    floorC += 0.025*g;
    float patch = exp(-pow((uv.x-0.5)*2.2,2.0)) * smoothstep(0.08, 0.25, uv.y);
    floorC += vec3(0.2,0.24,0.38)*patch*0.55;
    float lowmist = fbm3(vec2(x*3.0 - t*0.03, uv.y*20.0))*smoothstep(0.1, 0.22, uv.y)*smoothstep(0.26,0.22,uv.y);
    floorC = mix(floorC, fog*0.8, lowmist*0.5);
    col = floorC;
  }
  gl_FragColor = vec4(pow(col, vec3(0.95)), 1.0);
}`;

  function compile(gl, type, src) {
    const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { throw new Error(gl.getShaderInfoLog(sh)); }
    return sh;
  }
  const FRAGS = { sky: SKY_FRAG, sea: SEA_FRAG, pines: PINES_FRAG };

  window.makeBackdrop = function (canvas, kind, band) {
    let gl;
    try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' }); } catch (e) { return null; }
    if (!gl) return null;
    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAGS[kind]));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) { console.warn('shader failed', kind, e.message); return null; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(prog, n);
    const uRes = U('u_res'), uTime = U('u_time'), uBand = U('u_band'), uMoon = U('u_moon'), uDpr = U('u_dpr');
    let dpr = 1;
    return {
      resize(w, h, d) {
        dpr = d; canvas.width = Math.round(w * d); canvas.height = Math.round(h * d);
        gl.viewport(0, 0, canvas.width, canvas.height);
      },
      render(t, moon) {
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, t);
        gl.uniform1f(uDpr, dpr);
        gl.uniform4f(uBand, band[0], band[1], band[2], band[3]);
        gl.uniform2f(uMoon, moon ? moon[0] : 0.5, moon ? moon[1] : 0.8);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  };
})();

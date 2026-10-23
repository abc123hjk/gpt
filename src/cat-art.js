/* Original procedural pixel artwork. All coordinates use a 64 × 64 grid. */
(function (root) {
  'use strict';
  const ink = '#694334', orange = '#eda354', light = '#ffd28a', shade = '#ce7a40', cream = '#fff0d0', pink = '#ec9c94';
  function draw(ctx, state = 'idle', t = 0, options = {}) {
    ctx.save();
    const unit = Math.min(ctx.canvas.width, ctx.canvas.height) / 64;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.scale(unit, unit);
    const r = (x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(Math.round(x),Math.round(y),w,h); };
    const poly = (points,c) => { ctx.fillStyle=c; ctx.beginPath(); points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); ctx.fill(); };
    const heart = (x,y) => { r(x+1,y,2,1,pink);r(x+4,y,2,1,pink);r(x,y+1,7,2,pink);r(x+1,y+3,5,1,pink);r(x+2,y+4,3,1,pink);r(x+3,y+5,1,1,pink); };
    const fish = (x,y) => { poly([[x,y+2],[x+3,y],[x+9,y],[x+12,y+3],[x+9,y+6],[x+3,y+6],[x,y+4],[x-3,y+6],[x-3,y]],'#7fa7a2'); r(x+8,y+2,1,1,ink);r(x+4,y+1,1,4,'#bed4be'); };
    const beat = Math.floor(t * 2.5) % 2;
    let bounce = state === 'happy' ? -Math.round(Math.abs(Math.sin(t*7))*8) : state === 'walk' ? -beat : Math.floor(t*1.5)%2;
    if (state === 'drag') bounce = Math.round(Math.sin(t*8));
    if (options.flip) { ctx.translate(64,0); ctx.scale(-1,1); }
    ctx.save();ctx.translate(0,bounce);
    if (state === 'sleep') {
      r(10,49,43,3,'#69433420');
      poly([[11,41],[15,35],[22,32],[42,32],[49,36],[53,43],[51,49],[14,49],[10,46]],ink);
      poly([[13,41],[17,37],[23,34],[41,34],[47,38],[50,44],[49,47],[15,47],[12,45]],orange);
      r(31,35,3,8,shade);r(38,35,3,6,shade);r(43,39,3,6,shade);
      poly([[12,37],[11,27],[17,30],[27,30],[33,27],[33,39],[29,44],[17,44]],ink);
      poly([[14,36],[14,30],[18,33],[27,33],[31,30],[31,39],[28,42],[18,42]],light);
      r(16,37,4,1,ink);r(25,37,4,1,ink);r(21,39,2,1,pink);
      r(15,45,20,3,cream);r(39,44,11,3,light);
      const float = Math.floor(t*1.2)%3;
      ctx.fillStyle=ink;ctx.font='bold 6px monospace';ctx.fillText('z',39,26-float);ctx.font='bold 8px monospace';ctx.fillText('Z',47,20-float);
      ctx.restore();ctx.restore();return;
    }
    if (state !== 'drag' && state !== 'happy') r(16,54-bounce,34,2,'#69433418');
    // Curled tail, with a cream tip.
    const wag = Math.floor(t*2)%2;
    poly([[45,48],[51,48],[54,44],[54,34-wag],[51,31-wag],[51,28-wag],[56,28-wag],[59,32-wag],[59,45],[55,52],[46,53]],ink);
    poly([[46,49],[51,50],[56,44],[56,33-wag],[53,30-wag],[55,30-wag],[57,33-wag],[57,44],[54,50],[47,51]],orange);
    r(53,29-wag,3,4,cream);
    // Pear-shaped torso and white bib.
    poly([[23,29],[40,29],[45,35],[47,48],[43,53],[20,53],[17,49],[19,37]],ink);
    poly([[24,31],[39,31],[43,36],[45,47],[42,51],[21,51],[19,48],[21,38]],orange);
    poly([[26,32],[37,32],[39,38],[37,47],[26,47],[24,39]],cream);
    r(20,38,4,2,shade);r(40,38,4,2,shade);r(20,43,3,2,shade);r(41,43,3,2,shade);
    const feet = state === 'walk' ? beat*2 : 0;
    r(20,49-feet,10,5,ink);r(22,49-feet,7,3,cream);r(35,49+feet,10,5,ink);r(36,49+feet,7,3,cream);
    if (state === 'drag') { r(23,51,5,8,ink);r(24,53,3,5,cream);r(37,51,5,8,ink);r(38,53,3,5,cream); }
    // Stepped ears and rounded face.
    let hy = state === 'eat' ? 3 + beat : state === 'lick' ? 1 : 0;
    ctx.save(); ctx.translate(0,hy);
    poly([[15,18],[15,8],[18,8],[25,14],[37,14],[44,8],[47,8],[48,19],[51,23],[51,32],[47,37],[41,40],[22,40],[16,37],[12,32],[12,24]],ink);
    poly([[17,19],[17,11],[24,17],[38,17],[45,11],[46,20],[49,24],[49,31],[45,35],[40,38],[23,38],[17,35],[14,31],[14,25]],orange);
    poly([[19,15],[23,19],[19,20]],pink);poly([[43,15],[43,20],[39,19]],pink);
    r(27,16,3,6,shade);r(34,16,3,6,shade);r(30,16,4,3,shade);
    r(14,26,5,2,shade);r(15,31,4,2,shade);r(44,26,5,2,shade);r(44,31,4,2,shade);
    poly([[23,28],[28,28],[31,30],[35,28],[40,28],[42,32],[39,36],[24,36],[21,33]],cream);
    const closed = ['pet','happy','eat','lick'].includes(state) || Math.floor(t*3)%19===0;
    if (closed) { r(21,26,2,1,ink);r(23,25,3,1,ink);r(37,25,3,1,ink);r(40,26,2,1,ink); }
    else { r(23,24,3,5,ink);r(37,24,3,5,ink);r(23,24,1,1,cream);r(37,24,1,1,cream); }
    r(30,30,3,2,pink);r(31,32,1,2,ink);r(28,34,3,1,ink);r(32,34,3,1,ink);
    if (state === 'pet' || state === 'happy') {r(18,30,4,2,pink);r(41,30,4,2,pink);}
    if (state === 'lick') {r(29,34,3,3,pink);r(22,33,5,5,cream);r(21,34,1,4,ink);}
    ctx.restore();
    if (state === 'stretch') {r(15,47,11,5,ink);r(15,48,10,3,cream);r(39,47,12,5,ink);r(40,48,10,3,cream);}
    if (state === 'focus') {
      r(17,41,29,17,ink);r(19,43,25,12,'#88aca5');r(20,44,23,1,'#b4d2c4');r(17,56,29,2,'#475c56');r(14,58,35,2,ink);r(16,58,31,1,'#b4c1ae');
      r(29,48,5,3,cream);r(30,47,3,5,cream);r(20,55+beat,4,2,orange);r(40,56-beat,4,2,orange);
    }
    if (state === 'eat') { r(18,54,28,2,ink);r(20,56,24,3,'#b5c4ad');r(22,59,20,1,ink);fish(27,49+beat); }
    if (state === 'pet' || state === 'happy') { heart(8,14-Math.floor(t*4)%5);heart(48,9-Math.floor(t*3)%4); }
    if (state === 'chase') {r(46,38,5,3,cream);r(12,40,7,3,cream);}
    ctx.restore();ctx.restore();
  }
  root.CatArt = { draw };
})(typeof window !== 'undefined' ? window : globalThis);

// Raster data export without a browser. generate-assets.py turns these primitives into PNGs.
require('../src/cat-art.js');
class PixelCanvas {
  constructor(){this.canvas={width:64,height:64};this.matrix=[1,1,0,0];this.stack=[];this.shapes=[];this.fillStyle='#000';this.font='6px monospace';}
  save(){this.stack.push({matrix:[...this.matrix],fillStyle:this.fillStyle,font:this.font});}
  restore(){Object.assign(this,this.stack.pop());}
  scale(x,y){this.matrix[0]*=x;this.matrix[1]*=y;}
  translate(x,y){this.matrix[2]+=x*this.matrix[0];this.matrix[3]+=y*this.matrix[1];}
  point(x,y){return[x*this.matrix[0]+this.matrix[2],y*this.matrix[1]+this.matrix[3]];}
  clearRect(){this.shapes=[];}
  fillRect(x,y,w,h){const a=this.point(x,y),b=this.point(x+w,y+h);this.shapes.push({kind:'rect',box:[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])],color:this.fillStyle});}
  beginPath(){this.points=[];}
  moveTo(x,y){this.points.push(this.point(x,y));}
  lineTo(x,y){this.points.push(this.point(x,y));}
  closePath(){}
  fill(){this.shapes.push({kind:'polygon',points:[...this.points],color:this.fillStyle});}
  fillText(value,x,y){this.shapes.push({kind:'text',value,point:this.point(x,y),color:this.fillStyle,font:this.font});}
}
const names=['idle','walk','sleep','pet','eat','happy','focus','drag','lick','stretch','chase'];
const data={};for(const name of names){data[name]=[];for(let frame=0;frame<8;frame++){const ctx=new PixelCanvas();CatArt.draw(ctx,name,frame/8*2.4);data[name].push(ctx.shapes);}}
process.stdout.write(JSON.stringify(data));

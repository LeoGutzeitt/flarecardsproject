import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Resvg,initWasm} from '@resvg/resvg-wasm';
import {ticketSvg,ticketTemplates,ticketArt} from '../supabase/functions/_shared/ticket-template.mjs';
test('modelos renderizam PNG com fonte, acentos, numeração e texto escapado',async()=>{
 await initWasm(await readFile(new URL('../node_modules/@resvg/resvg-wasm/index_bg.wasm',import.meta.url)));
 const data={name:'João <Silva>',cards:[{name:'Charizard & Pikachu',number:'006/165'},{name:'M-Rayquaza EX',number:'076/108'}],code:'ticket-exemplo',demo:true};
 assert.throws(()=>ticketSvg({...data,template:'invalido'}),/modelo/);
 assert.throws(()=>ticketSvg({...data,cards:Array.from({length:10},()=>({name:'Carta'}))}),/muitas cartas/);
 for(const template of ticketTemplates){
  const svg=ticketSvg({...data,template:template.id},{embedFont:false});assert.match(svg,/João &lt;Silva&gt;/);assert.doesNotMatch(svg,/<Silva>/);assert.match(svg,/006\/165/);assert.match(svg,/076\/108/);assert.match(svg,/DEMONSTRAÇÃO LOCAL/);
  const renderer=new Resvg(svg,{font:{fontBuffers:[Buffer.from(ticketArt.font,'base64')],defaultFontFamily:'Noto Sans'}});
  let image;try{image=renderer.render();const png=image.asPng();assert.equal(image.width,1536);assert.equal(image.height,1024);assert.deepEqual([...png.slice(0,8)],[137,80,78,71,13,10,26,10]);}finally{image?.free();renderer.free();}
 }
});

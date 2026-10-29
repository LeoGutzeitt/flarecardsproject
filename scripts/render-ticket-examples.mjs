import {Resvg,initWasm} from '@resvg/resvg-wasm';
import {readFile,writeFile} from 'node:fs/promises';
import {ticketSvg,ticketTemplates,ticketArt} from '../supabase/functions/_shared/ticket-template.mjs';
await initWasm(await readFile(new URL('../node_modules/@resvg/resvg-wasm/index_bg.wasm',import.meta.url)));
for(const template of ticketTemplates){const renderer=new Resvg(ticketSvg({name:'Nome do ganhador',cards:[{name:'Charizard ex',number:'006/165'},{name:'Pikachu',number:'025/165'}],code:'EXEMPLO VISUAL · DADOS ILUSTRATIVOS',demo:true,template:template.id},{embedFont:false}),{font:{fontBuffers:[Buffer.from(ticketArt.font,'base64')],defaultFontFamily:'Noto Sans'}});let image;try{image=renderer.render();await writeFile(new URL('../assets/ticket-example-'+template.id+'.png',import.meta.url),image.asPng());}finally{image?.free();renderer.free();}}
console.log('Exemplos ilustrativos dos modelos gerados em assets/.');

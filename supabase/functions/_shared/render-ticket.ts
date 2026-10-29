import {Resvg,initWasm} from 'npm:@resvg/resvg-wasm@2.6.2';
import {wasmBase64} from './ticket-wasm.mjs';
import {ticketSvg,ticketArt} from './ticket-template.mjs';
const decode=(value:string)=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
let ready:Promise<void>|undefined;
export async function renderTicketPng(job:Record<string,unknown>){
 ready??=initWasm(decode(wasmBase64));await ready;
 const renderer=new Resvg(ticketSvg({...job,template:job.template||'brasa'},{embedFont:false}),{font:{fontBuffers:[decode(ticketArt.font)],defaultFontFamily:'Noto Sans'},fitTo:{mode:'width',value:1536}});
 let rendered;try{rendered=renderer.render();const bytes=rendered.asPng();let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(binary);}finally{rendered?.free();renderer.free();}
}

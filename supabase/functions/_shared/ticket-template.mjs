import {ticketArt} from './ticket-art.mjs';
import {validateTicketTemplate} from './ticket-models.mjs';
export {ticketTemplates,validateTicketTemplate} from './ticket-models.mjs';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');
const wrap=(text,length)=>{const words=String(text).split(/\s+/),lines=[];let line='';for(const word of words){if((line+' '+word).trim().length>length&&line){lines.push(line);line='';}if(word.length>length){if(line){lines.push(line);line='';}for(let i=0;i<word.length;i+=length)lines.push(word.slice(i,i+length));}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines;};
export function ticketSvg(data,{embedFont=true}={}){
 const template=validateTicketTemplate(data.template||'brasa'),accent=template==='ouro'?'#bb9145':'#a5303a';
 const cards=data.cards||[{name:data.card,number:data.number}],lines=cards.flatMap(c=>wrap(`${c.name||'Carta não informada'} · ${c.number||'Numeração não informada'}`,47));
 if(!cards.length||lines.length>7)throw Error('Há muitas cartas para um único ticket. Divida a seleção.');
 const name=wrap(data.name||data.winner||'Nome do ganhador',38),code=data.code||'CÓDIGO GERADO APÓS APROVAÇÃO';
 if(name.length>2)throw Error('Nome muito longo para o ticket.');
 const text=(x,y,value,size,fill='#282328',extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${escape(value)}</text>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1536" height="1024" viewBox="0 0 1536 1024" role="img" aria-label="Ticket de retirada Flare Cards"><defs>${embedFont?`<style>@font-face{font-family:'Noto Sans';src:url(data:font/ttf;base64,${ticketArt.font}) format('truetype')}</style>`:''}</defs><image width="1536" height="1024" xlink:href="${ticketArt[template]}"/><g font-family="Noto Sans, sans-serif"><image x="90" y="62" width="240" height="112" xlink:href="${ticketArt.logo}"/>${text(390,102,'SUA PRÓXIMA RARIDADE JÁ TEM DONO.',18,'#d8c5b4','letter-spacing="2"')}${text(390,156,'Ticket de retirada',42,'#fff')}${text(105,340,'GANHADOR DO LEILÃO',18,accent,'letter-spacing="3"')}${name.map((line,i)=>text(103,402+i*48,line,44)).join('')}${text(105,510,'CARTAS CONQUISTADAS / NUMERAÇÃO',17,accent,'letter-spacing="2"')}<path d="M105 535H1110" stroke="${accent}" stroke-opacity=".25"/>${lines.map((line,i)=>text(105,580+i*29,line,25)).join('')}${text(105,780,data.demo?'DEMONSTRAÇÃO LOCAL · SEM VALIDADE PARA RETIRADA':data.preview?'PRÉVIA · AGUARDANDO APROVAÇÃO':'Apresente este ticket e um documento na retirada.',16,accent)}${text(100,892,'IDENTIFICAÇÃO DO TICKET',14,'#d9c3b7','letter-spacing="2"')}${text(100,928,code,22,'#fff')}${text(100,968,'O ticket não comprova pagamento. Não compartilhe o código.',15,'#d9c3b7')}</g></svg>`;
}
export {ticketArt};

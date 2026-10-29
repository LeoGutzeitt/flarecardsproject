import {validateCardLanguage} from './card-languages.js';
import { readCatalog, CATALOG_KEY } from './store-catalog.js';
import { ACCOUNTS_KEY } from './auth.js';
import { validateAuctionImage } from './auction-store.js';
import { findCollection } from './pokemon-collections.js';
export const ORDERS_KEY='flare-cards:orders:v1', AUDIT_KEY='flare-cards:audit:v1';
export function createPlatformStore(storage, authorize) {
 const read=(key)=>JSON.parse(storage.getItem(key)||'[]');
 const save=(key,value)=>{try{storage.setItem(key,JSON.stringify(value));}catch{throw Error('Armazenamento cheio. Reduza o tamanho das fotos e tente novamente.');}};
 function audit(action,id,reason=''){const actor=authorize('admin');save(AUDIT_KEY,[{id:crypto.randomUUID(),at:Date.now(),actor:actor.name,action,entity:id,reason},...read(AUDIT_KEY)].slice(0,300));}
 return {
  catalog:()=>readCatalog(storage),
  orders(){authorize('admin');return read(ORDERS_KEY);},
  users(){authorize('admin');return read(ACCOUNTS_KEY).filter(u=>u.role==='user').map(({id,name,email,disabled})=>({id,name,email,disabled}));},
  audit(){authorize('admin');return read(AUDIT_KEY);},
  saveProduct(input){
   authorize('admin');const items=readCatalog(storage),old=items.find(p=>p.id===input.id),set=findCollection(input.collectionId);
   if(!input.name?.trim()||input.name.length>80||!set)throw Error('Informe o nome e uma coleção válida.');
   if(!Number.isFinite(input.price)||input.price<=0||input.price>1000000||!Number.isInteger(input.stock)||input.stock<0||input.stock>100000)throw Error('Informe preço positivo e estoque inteiro válido.');
   if(!['NM','SP','MP','HP','DM'].includes(input.condition))throw Error('Escolha a condição da carta.');
   const language=validateCardLanguage(input.language??old?.language);
   const number=String(input.number??old?.number??'').trim();
   if(number&&!/^[0-9]{3}\/[0-9]{3}$/.test(number))throw Error('Informe o número no formato xxx/xxx. Exemplo: 006/165.');
   const image=input.image||old?.image;if(!old||image!==old.image)validateAuctionImage(image);
   const item={id:old?.id||crypto.randomUUID(),name:input.name.trim(),number,language,collectionId:set.id,collection:set.name,rarity:String(input.rarity||'').slice(0,50),price:Math.round(input.price*100)/100,stock:input.stock,condition:input.condition,image,published:input.published!==false};
   save(CATALOG_KEY,old?items.map(p=>p.id===old.id?item:p):[...items,item]);audit(old?'Carta atualizada':'Carta cadastrada',item.id);return item;
  },
  publish(id,published){authorize('admin');const items=readCatalog(storage),item=items.find(p=>p.id===id);if(!item)throw Error('Carta não encontrada.');item.published=published;save(CATALOG_KEY,items);audit(published?'Publicação restaurada':'Publicação retirada',id);},
  block(id,disabled,reason){authorize('admin');if(!reason?.trim())throw Error('Informe o motivo da moderação.');const users=read(ACCOUNTS_KEY),user=users.find(u=>u.id===id&&u.role==='user');if(!user)throw Error('Usuário não encontrado.');user.disabled=disabled;save(ACCOUNTS_KEY,users);audit(disabled?'Usuário suspenso':'Usuário reativado',id,reason);},
  requestOrder(lines,packs=[]){const user=authorize('user'),catalog=[...readCatalog(storage).filter(p=>p.published!==false),...packs];if(!Array.isArray(lines)||!lines.length)throw Error('Carrinho vazio.');const items=lines.map(({id,quantity})=>{const product=catalog.find(p=>p.id===id);if(!product||!Number.isInteger(quantity)||quantity<1||quantity>99||product.stock!==null&&product.stock!==undefined&&quantity>product.stock)throw Error('Revise o estoque e a quantidade das cartas.');return {id,name:product.name,quantity,price:product.price};});const orders=read(ORDERS_KEY);const order={id:crypto.randomUUID(),createdAt:Date.now(),userId:user.id,name:user.name,email:user.email,items,total:items.reduce((sum,p)=>sum+p.price*p.quantity,0),status:'requested'};save(ORDERS_KEY,[order,...orders]);return order;},
  updateOrder(id,status){authorize('admin');const orders=read(ORDERS_KEY),order=orders.find(o=>o.id===id);const next={requested:['confirmed','cancelled'],confirmed:['paid','cancelled'],paid:['ready'],ready:['completed']};if(!order||!next[order.status]?.includes(status))throw Error('Mudança de status não permitida.');order.status=status;order.updatedAt=Date.now();save(ORDERS_KEY,orders);audit('Pedido: '+status,id);},
  record: audit,
 };
}

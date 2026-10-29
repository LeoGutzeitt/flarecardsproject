import {validateTicketTemplate} from './ticket-models.js';
import {ACCOUNTS_KEY} from './auth.js';
export const WINNERS_KEY='flare-cards:winner-reviews:v1';
export function createWinnerReviews(storage,auctions,authorize,now=()=>Date.now()){
 const saved=()=>JSON.parse(storage.getItem(WINNERS_KEY)||'[]');
 function list(){authorize('admin');const users=JSON.parse(storage.getItem(ACCOUNTS_KEY)||'[]'),reviews=saved();return auctions.adminList().filter(l=>!l.draft&&l.endsAt<=now()).map(l=>{
  const bid=l.bids.at(-1),user=users.find(u=>u.id===bid?.bidderId),review=reviews.find(r=>r.auctionId===l.id&&r.bidId===bid?.id&&r.email===user?.email);
  return {auctionId:l.id,card:l.name,image:l.image,number:l.number,language:l.language,collection:l.collection,endsAt:l.endsAt,bidId:bid?.id,winner:bid?.bidder,email:user?.email||'',amount:bid?.amount,winnerId:bid?.bidderId,blocked:user?.disabled===true,reviewedAt:review?.reviewedAt,reviewedBy:review?.reviewedBy,code:review?.code,template:review?.template||'brasa',status:!bid?'no-bids':review?'approved':'review',emailStatus:review?'pending-configuration':'not-approved'};
 }).sort((a,b)=>b.endsAt-a.endsAt);}
 return {list,approve(id,template='brasa'){const admin=authorize('admin');validateTicketTemplate(template);const winner=list().find(w=>w.auctionId===id);if(!winner?.bidId)throw Error('Este leilão não tem ganhador.');if(winner.blocked)throw Error('A conta do ganhador está suspensa. Revise a moderação antes de aprovar.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(winner.email))throw Error('E-mail não disponível na conta do ganhador. Não é possível liberar o ticket.');if(winner.reviewedAt)return winner;
 const review={template,auctionId:id,bidId:winner.bidId,email:winner.email,reviewedAt:now(),reviewedBy:admin.name,code:crypto.randomUUID()};storage.setItem(WINNERS_KEY,JSON.stringify([...saved().filter(r=>r.auctionId!==id),review]));return list().find(w=>w.auctionId===id);}};
}

const entities = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const escape = value => String(value).replace(/[&<>"']/g, char => entities[char]);
export function buildWinnerEmail(job, from, instructions) {
  if (!instructions?.trim() || !from?.trim()) throw new Error('Configure remetente e retirada.');
  const amount = (job.amount / 100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  return {
    from, to: [job.email], subject: 'Flare Cards — seu ticket de retirada',
    text: `Olá, ${job.name}!\nVocê ganhou o leilão de ${job.card}${job.number?' · '+job.number:''}.\nLance vencedor: ${amount}\nTicket de retirada: ${job.code}\n\n${instructions}\n\nApresente este ticket e um documento na retirada. O ticket não comprova pagamento. Não compartilhe o código.`,
    html: `<div style="font-family:Arial;max-width:600px;padding:24px"><h1>Seu próximo tesouro é seu!</h1><p>${escape(job.name)}, você ganhou o leilão de <strong>${escape(job.card)}${job.number?' · '+escape(job.number):''}</strong>.</p><p>Lance vencedor: ${escape(amount)}</p><h2>Ticket de retirada</h2><p style="padding:16px;background:#f5e9ec;font-family:monospace">${escape(job.code)}</p><p style="white-space:pre-line">${escape(instructions)}</p><p>Apresente o ticket e um documento. O ticket não comprova pagamento. Não compartilhe o código.</p></div>`,
  };
}
export async function deliverWinnerEmail(job, config, fetcher = fetch) {
  const email=buildWinnerEmail(job,config.from,config.instructions);
  if(config.renderTicket){const png=await config.renderTicket(job);email.attachments=[{filename:'flare-ticket.png',content:png,content_type:'image/png'}];}
  const response = await fetcher('https://api.resend.com/emails', {
    method:'POST', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${config.key}`, 'Content-Type':'application/json', 'Idempotency-Key': `auction-ticket-${job.ticketId}` },
    body: JSON.stringify(email),
  });
  if (!response.ok) throw new Error(`Provedor de e-mail: HTTP ${response.status}`);
}

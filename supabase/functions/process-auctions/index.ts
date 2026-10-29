import { createClient } from 'npm:@supabase/supabase-js@2';
import {renderTicketPng} from '../_shared/render-ticket.ts';
import { deliverWinnerEmail } from '../_shared/winner-email.mjs';

const required = (name: string) => { const value = Deno.env.get(name); if (!value) throw new Error(`Configure ${name}`); return value; };
Deno.serve(async request => {
  const origin = Deno.env.get('SITE_ORIGIN') || '';
  const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (request.method !== 'POST') return json({ error: 'Método não permitido' }, 405);
  try {
    const url = required('SUPABASE_URL'), service = required('SUPABASE_SERVICE_ROLE_KEY');
    const admin = createClient(url, service, { auth: { persistSession: false } });
    const cronSecret = Deno.env.get('AUCTION_CRON_SECRET');
    const cronAuthorized = !!cronSecret && request.headers.get('x-auction-cron-secret') === cronSecret;
    if (!cronAuthorized) {
      const token = request.headers.get('authorization')?.replace(/^Bearer /i, '') || '';
      const { data: { user }, error } = await admin.auth.getUser(token);
      if (error || !user) return json({ error: 'Autenticação necessária' }, 401);
      const { data: member, error: roleError } = await admin.from('auction_admins').select('user_id').eq('user_id', user.id).maybeSingle();
      if (roleError || !member) return json({ error: 'Acesso restrito ao administrador' }, 403);
    }
    const rpc = async (name: string, args = {}) => { const { data, error } = await admin.rpc(name,args); if (error) throw error; return data; };
    const finalized = await rpc('finalize_auctions');
    // Tickets podem ser emitidos mesmo quando o provedor ainda não está configurado.
    if (!Deno.env.get('RESEND_API_KEY') || !Deno.env.get('EMAIL_FROM') || !Deno.env.get('PICKUP_INSTRUCTIONS')) return json({ finalized, sent: 0, pendingConfiguration: true });
    const batch = await rpc('claim_auction_notifications'); let sent = 0, failed = 0;
    for (const job of batch) {
      try {
        await deliverWinnerEmail(job, { key: required('RESEND_API_KEY'), from: required('EMAIL_FROM'), instructions: required('PICKUP_INSTRUCTIONS'),renderTicket:renderTicketPng });
        await rpc('complete_auction_notification',{notification_id:job.id,attempt_number:job.attempt,success:true}); sent++;
      } catch {
        failed++;
        await rpc('complete_auction_notification',{notification_id:job.id,attempt_number:job.attempt,success:false,error_message:'Falha de envio. Verifique o provedor e a configuração.'});
      }
    }
    return json({ finalized, sent, failed });
  } catch { return json({ error: 'Não foi possível processar os leilões. Confira a configuração no servidor.' }, 500); }
});

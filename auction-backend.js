import { publicConfig } from './public-config.js';
export async function connectAuctionBackend({adminPortal=false}={}) {
  let config = publicConfig;
  try { const response = await fetch('/api/config', { signal: AbortSignal.timeout(5000) }); if (response.ok) config = await response.json(); } catch { /* Hospedagem estática usa public-config.js. */ }
  if (config.configurationError) throw new Error(config.configurationError);
  if (!config.supabaseUrl || !config.supabasePublishableKey) return null;
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  const client = createClient(config.supabaseUrl, config.supabasePublishableKey, { auth: { flowType: 'pkce', storage: sessionStorage, storageKey:adminPortal?'flare-cards:admin-supabase':'flare-cards:customer-supabase', persistSession: true, detectSessionInUrl: true } });
  let user = null;
  async function updateUser() {
    const { data: { user: account } } = await client.auth.getUser();
    if (!account) { user = null; return; }
    const { data: admin, error } = await client.rpc('is_auction_admin'); if (error) throw error;
    if(adminPortal?!admin:admin){await client.auth.signOut();user=null;throw new Error('Conta não disponível neste acesso.');}
    user = { id: account.id, name: String(account.user_metadata?.full_name || account.email?.split('@')[0] || 'Colecionador').slice(0,40), email: account.email, role: admin ? 'admin' : 'user' };
  }
  // Aguarda a troca do código PKCE antes de consultar a identidade.
  await client.auth.getSession(); await updateUser();
  async function rpc(name, args) { const { data, error } = await client.rpc(name, args); if (error) throw new Error(error.message); return data; }
  return {
    remote: true,
    auth: {
      currentUser: () => user, hasAdmin: () => true,
      requireUser(role) { if (!user || (role && user.role !== role)) throw new Error('Entre com uma conta autorizada.'); return user; },
      async logout() { const { error } = await client.auth.signOut(); if (error) throw error; user = null; },
      async googleLogin() { const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}${adminPortal?'/flareadmin':'/auctions.html'}` } }); if (error) throw error; },
    },
    store: {
      list: () => rpc('list_auctions'),
      bid: (id, input) => rpc('submit_auction_bid', { lot_id: id, bid_amount: input.amount, request_id: crypto.randomUUID() }),
      create: input => rpc('save_auction', { lot_id: null, payload: input }),
      configure: (id, input) => rpc('save_auction', { lot_id: id, payload: input }),
    },
    winners:()=>rpc('admin_auction_winners'),
    approveWinner:(id,template)=>rpc('approve_auction_winner',{ticket_id:id,template_id:template}),
    dashboard: () => rpc('auction_dashboard'),
    redeem: code => rpc('redeem_auction_ticket', { ticket_code: code.trim() }),
    async process() { const { data, error } = await client.functions.invoke('process-auctions'); if (error) throw error; return data; },
  };
}

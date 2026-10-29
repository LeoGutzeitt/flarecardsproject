// Demonstração local: não substitui autenticação e autorização no servidor.
export const ACCOUNTS_KEY = 'flare-cards:accounts:v1';
const DEMO_ADMIN = { id: 'flare-default-admin-v1', name: 'usuario_admin', email: '', role: 'admin' };
export function createAuth(accountsStorage, sessionStorage, options = {}) {
  const SESSION_KEY = options.adminOnly ? "flare-cards:admin-session:v1" : "flare-cards:session:v1";
  const adminAllowed = options.adminOnly || options.allowAdmin;
  const accounts = () => JSON.parse(accountsStorage.getItem(ACCOUNTS_KEY) || '[]');
  const persist = list => accountsStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
  async function digest(password, salt) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 210000 }, key, 256);
    return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  function currentUser() {
    try { const id = sessionStorage.getItem(SESSION_KEY); if (id === DEMO_ADMIN.id) return adminAllowed ? { ...DEMO_ADMIN } : null; const user = accounts().find(user => user.id === id); return user && !user.disabled && (adminAllowed || user.role !== 'admin') ? { id: user.id, name: user.name, email: user.email, role: user.role } : null; }
    catch { return null; }
  }
  function requireUser(role) {
    const user = currentUser();
    if (!user) throw new Error('Entre na sua conta para continuar.');
    if (role && user.role !== role) throw new Error(role === 'admin' ? 'Apenas administradores podem gerenciar leilões.' : 'Entre com uma conta de usuário para dar lances.');
    return user;
  }
  return {
    currentUser, requireUser,
    hasAdmin: () => true,
    logout() { sessionStorage.removeItem(SESSION_KEY); },
    async register({ name, email, password }, adminSetup = false) {
      if (options.adminOnly) throw new Error('Cadastro indisponível nesta área.');
      if (adminSetup) throw new Error('O administrador padrão já foi configurado. Entre com usuario_admin.');
      const normalized = String(email).trim().toLowerCase();
      if (!name?.trim() || name.trim().length > 40 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || password.length < 8 || password.length > 128) throw new Error('Informe nome, e-mail válido e senha de 8 a 128 caracteres.');
      const salt = crypto.randomUUID(); const hash = await digest(password, salt);
      const list = accounts();
      if (adminSetup && list.some(user => user.role === 'admin')) throw new Error('O administrador local já foi configurado.');
      if (list.some(user => user.email === normalized)) throw new Error('Este e-mail já está cadastrado neste navegador.');
      const user = { id: crypto.randomUUID(), name: name.trim(), email: normalized, role: adminSetup ? 'admin' : 'user', salt, hash };
      persist([...list, user]); sessionStorage.setItem(SESSION_KEY, user.id); return currentUser();
    },
    async login(email, password) {
      if (email.trim().toLowerCase() === 'usuario_admin') {
        if (!adminAllowed) throw new Error('Conta não disponível neste acesso.');
        if (password !== '1234') throw new Error('Usuário ou senha incorretos.');
        sessionStorage.setItem(SESSION_KEY, DEMO_ADMIN.id); return currentUser();
      }
      if (options.adminOnly) throw new Error('Acesso restrito à administração.');
      const user = accounts().find(user => user.email === email.trim().toLowerCase());
      if (!user || user.disabled || (!adminAllowed && user.role === 'admin') || await digest(password, user.salt) !== user.hash) throw new Error('Usuário ou senha incorretos.');
      sessionStorage.setItem(SESSION_KEY, user.id); return currentUser();
    },
  };
}

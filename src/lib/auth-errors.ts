/**
 * Tradução das mensagens de erro do Supabase Auth para português do Brasil.
 * O fallback devolve a mensagem original, para não esconder erros desconhecidos.
 */
const MAPA_ERROS: Record<string, string> = {
  'Password is known to be weak and easy to guess':
    'Esta senha é muito comum. Escolha uma senha mais forte.',
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'User already registered': 'Este e-mail já está cadastrado.',
  'Email not confirmed': 'Confirme seu e-mail para continuar.',
  'Password should be at least 6 characters':
    'A senha deve ter pelo menos 6 caracteres.',
  'Unable to validate email address: invalid format': 'Formato de e-mail inválido.',
  'For security purposes, you can only request this once every 60 seconds':
    'Aguarde 60 segundos para tentar novamente.',
  'Signup requires a valid password': 'Informe uma senha válida.',
};

export function translateAuthError(err: unknown): string {
  const original =
    typeof err === 'string'
      ? err
      : (err as { message?: string } | null)?.message ?? '';

  if (!original) return 'Ocorreu um erro inesperado. Tente novamente.';

  if (MAPA_ERROS[original]) return MAPA_ERROS[original]!;

  // Correspondência parcial: o Supabase às vezes acrescenta detalhes à mensagem.
  for (const [chave, traducao] of Object.entries(MAPA_ERROS)) {
    if (original.toLowerCase().includes(chave.toLowerCase())) return traducao;
  }

  return original;
}

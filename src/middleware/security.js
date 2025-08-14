/**
 * Middleware de segurança para headers HTTP
 * Adiciona headers de segurança essenciais para proteção contra ataques
 */

export const securityHeaders = (req, res, next) => {
  // Previne clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Previne MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Proteção XSS básica
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy básico
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:;");
  
  // Força HTTPS em produção
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Remove header que expõe tecnologia
  res.removeHeader('X-Powered-By');
  
  next();
};

export default securityHeaders;
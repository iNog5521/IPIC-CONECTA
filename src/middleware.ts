import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteção da rota /admin
  if (pathname.startsWith('/admin')) {
    // Aqui no middleware não temos acesso direto ao Firebase Auth Client
    // Usamos um cookie de sessão ou apenas verificamos se existe um token (simulado por enquanto)
    // Para manter o "Redirecionamento Furtivo", se não houver permissão, joga para a Home /
    
    // Simulação: Se não houver cookie de admin, redireciona
    const isAdmin = request.cookies.get('admin_session'); 
    
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

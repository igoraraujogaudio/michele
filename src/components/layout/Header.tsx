'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from '@/lib/auth/auth.helpers';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { LogOut, Menu, X, UserCircle } from 'lucide-react';

interface HeaderProps {
  user?: {
    email?: string;
    user_metadata?: {
      name?: string;
    };
  };
}

const publicRoutes = ['/auth/login', '/auth/register', '/auth/reset-password'];

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [ordensDropdownOpen, setOrdensDropdownOpen] = useState(false);
  const [relatorioDropdownOpen, setRelatorioDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const ordensDropdownRef = useRef<HTMLDivElement>(null);
  const relatorioDropdownRef = useRef<HTMLDivElement>(null);

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (ordensDropdownRef.current && !ordensDropdownRef.current.contains(event.target as Node)) {
        setOrdensDropdownOpen(false);
      }
      if (relatorioDropdownRef.current && !relatorioDropdownRef.current.contains(event.target as Node)) {
        setRelatorioDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Não renderiza o header em páginas públicas
  if (isPublicRoute || !user) {
    return null;
  }

  async function handleLogout() {
    setLoading(true);
    await signOut();
    router.push('/auth/login');
    router.refresh();
  }

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Sistema de Veículos</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition">
              Dashboard
            </Link>
            
            {/* Dropdown Ordens */}
            <div className="relative" ref={ordensDropdownRef}>
              <button
                onClick={() => setOrdensDropdownOpen(!ordensDropdownOpen)}
                className="text-gray-700 hover:text-blue-600 transition flex items-center gap-1"
              >
                Ordens
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {ordensDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <Link
                    href="/ordens"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                    onClick={() => setOrdensDropdownOpen(false)}
                  >
                    Todas as Ordens
                  </Link>
                  <Link
                    href="/ordens/nova"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                    onClick={() => setOrdensDropdownOpen(false)}
                  >
                    Nova Ordem
                  </Link>
                  <Link
                    href="/relatorios/manutencao"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                    onClick={() => setOrdensDropdownOpen(false)}
                  >
                    Em Manutenção
                  </Link>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    href="/upload/historico"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                    onClick={() => setOrdensDropdownOpen(false)}
                  >
                    Importar Histórico
                  </Link>
                </div>
              )}
            </div>
            
            {/* Dropdown Veículos */}
            <div className="relative" ref={relatorioDropdownRef}>
              <button
                onClick={() => setRelatorioDropdownOpen(!relatorioDropdownOpen)}
                className="text-gray-700 hover:text-blue-600 transition flex items-center gap-1"
              >
                Veículos
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {relatorioDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <Link
                    href="/veiculos"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                    onClick={() => setRelatorioDropdownOpen(false)}
                  >
                    Todos os Veículos
                  </Link>
                  <Link
                    href="/relatorios/disponiveis"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                    onClick={() => setRelatorioDropdownOpen(false)}
                  >
                    Disponíveis
                  </Link>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    href="/upload/gerencias"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                    onClick={() => setRelatorioDropdownOpen(false)}
                  >
                    Atualizar Gerências
                  </Link>
                </div>
              )}
            </div>
            
            <Link href="/cadastros/prefixos" className="text-gray-700 hover:text-blue-600 transition">
              Prefixos
            </Link>
            <Link href="/cadastros/locais" className="text-gray-700 hover:text-blue-600 transition">
              Locais
            </Link>
          </nav>

          {/* User Avatar Dropdown */}
          <div className="hidden md:flex items-center" ref={dropdownRef}>
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Menu do usuário"
              >
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{initials}</span>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{loading ? 'Saindo...' : 'Sair'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-3">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 transition px-2 py-1"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <div className="border-l-2 border-blue-600 pl-2">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Ordens</p>
                <Link
                  href="/ordens"
                  className="block text-gray-700 hover:text-blue-600 transition py-1"
                  onClick={() => setMenuOpen(false)}
                >
                  Todas as Ordens
                </Link>
                <Link
                  href="/ordens/nova"
                  className="block text-gray-700 hover:text-blue-600 transition py-1"
                  onClick={() => setMenuOpen(false)}
                >
                  Nova Ordem
                </Link>
                <Link
                  href="/relatorios/manutencao"
                  className="block text-gray-700 hover:text-blue-600 transition py-1"
                  onClick={() => setMenuOpen(false)}
                >
                  Em Manutenção
                </Link>
                <Link
                  href="/upload/historico"
                  className="block text-gray-700 hover:text-blue-600 transition py-1 mt-2 pt-2 border-t border-gray-200"
                  onClick={() => setMenuOpen(false)}
                >
                  Importar Histórico
                </Link>
              </div>
              <div className="border-l-2 border-green-600 pl-2">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Veículos</p>
                <Link
                  href="/veiculos"
                  className="block text-gray-700 hover:text-blue-600 transition py-1"
                  onClick={() => setMenuOpen(false)}
                >
                  Todos os Veículos
                </Link>
                <Link
                  href="/relatorios/disponiveis"
                  className="block text-gray-700 hover:text-blue-600 transition py-1"
                  onClick={() => setMenuOpen(false)}
                >
                  Disponíveis
                </Link>
              </div>
              <Link
                href="/cadastros/prefixos"
                className="text-gray-700 hover:text-blue-600 transition px-2 py-1"
                onClick={() => setMenuOpen(false)}
              >
                Prefixos
              </Link>
              <Link
                href="/cadastros/locais"
                className="text-gray-700 hover:text-blue-600 transition px-2 py-1"
                onClick={() => setMenuOpen(false)}
              >
                Locais
              </Link>
              <div className="border-t border-gray-200 pt-3 mt-3">
                <p className="text-gray-900 font-medium px-2">{userName}</p>
                <p className="text-gray-500 text-xs px-2 mb-2">{user?.email}</p>
                <Button
                  variant="secondary"
                  onClick={handleLogout}
                  loading={loading}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

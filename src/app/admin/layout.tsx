"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Calendar, 
  Heart, 
  Users, 
  BookOpen, 
  LogOut,
  Menu,
  X,
  MapPin
} from 'lucide-react';
import styles from './layout.module.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  // Fecha o menu automaticamente no mobile ao carregar
  React.useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Mural de Avisos', icon: ImageIcon, path: '/admin/mural' },
    { name: 'Agenda & Cultos', icon: Calendar, path: '/admin/agenda' },
    { name: 'Pedidos de Oração', icon: Heart, path: '/admin/oracoes' },
    { name: 'Membros', icon: Users, path: '/admin/membros' },
    { name: 'Sedes', icon: MapPin, path: '/admin/sedes' },
    { name: 'Palavra do Dia', icon: BookOpen, path: '/admin/palavra' },
  ];

  return (
    <div className={styles.layout}>
      {/* Sidebar - Desktop */}
      <aside className={`${styles.sidebar} ${!isSidebarOpen ? styles.collapsed : ''}`}>
        <div className={styles.logoArea}>
          <div className={styles.logo}>
            <span className={styles.ipic}>IPIC</span> Admin
          </div>
          <button 
            className={styles.toggleBtn} 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className={styles.nav}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.name} 
                href={item.path} 
                onClick={() => {
                  if (window.innerWidth <= 768) setIsSidebarOpen(false);
                }}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                <item.icon size={22} />
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <Link href="/" className={styles.logoutBtn}>
            <LogOut size={20} />
            {isSidebarOpen && <span>Sair do Painel</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className={styles.mobileOverlay} 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Main Content Area */}
      <main className={styles.main}>
        <header className={styles.topHeader}>
          <div className={styles.headerLeft}>
            <button 
              className={styles.mobileMenuBtn} 
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className={styles.welcome}>
              <h1>Painel Administrativo</h1>
              <p>Gestão do IPIC CONECTA</p>
            </div>
          </div>
          <div className={styles.userProfile}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>Admin Master</span>
              <span className={styles.userRole}>Administrador Geral</span>
            </div>
            <div className={styles.avatar}>AM</div>
          </div>
        </header>

        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}

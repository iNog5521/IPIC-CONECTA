"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Heart, Bell, User } from 'lucide-react';
import styles from './BottomNav.module.css';

const BottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Início', icon: Home, path: '/' },
    { name: 'Cultos', icon: Calendar, path: '/cultos' },
    { name: 'Orações', icon: Heart, path: '/oracoes' },
    { name: 'Mural', icon: Bell, path: '/avisos' },
    { name: 'Perfil', icon: User, path: '/perfil' },
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.name} 
              href={item.path} 
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <item.icon size={22} />
              <span className={styles.label}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

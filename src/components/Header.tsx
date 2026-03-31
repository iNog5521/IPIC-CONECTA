"use client";

import React from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import styles from './Header.module.css';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.ipic}>IPIC</span>
          <span className={styles.conecta}>CONECTA</span>
        </Link>
        <Link href="/perfil" className={styles.profileIcon} aria-label="Perfil do Usuário">
          <User size={24} />
        </Link>
      </div>
    </header>
  );
};

export default Header;

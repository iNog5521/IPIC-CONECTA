export interface UserProfile {
  id: string;
  uid: string;
  nome: string;
  email: string;
  nascimento: string;
  fielDesde: string;
  telefone?: string;
  sede: string;
  role: 'user' | 'admin' | 'owner';
  photoURL?: string;
  photoPath?: string;
  lastMessage?: string;
  lastMessageDate?: string;
  createdAt: string;
}

export interface Sede {
  id: string;
  nome: string;
  endereco: string;
  active: boolean;
}

export interface Aviso {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  sede: string;
  imageUrl: string;
  storagePath: string;
  createdAt: any;
}

export interface ModeloMural {
  id: string;
  name: string;
  imageUrl: string;
  storagePath: string;
  createdAt: any;
}

export interface Confirmacao {
  id: string;
  cultoId: string;
  cultoTime?: string;
  cultoDay?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  sede?: string;
  createdAt: any;
}

export interface Culto {
  id: string;
  name: string;
  description: string;
  day: string;
  time: string;
  sede: string;
  active: boolean;
}

export interface OracaoPedido {
  id: string;
  uid: string;
  nome: string;
  sede: string;
  texto: string;
  status: 'Pendente' | 'Orado';
  createdAt: any;
}


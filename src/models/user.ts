export interface User {
  id: string;
  email: string;
  role: 'driver' | 'user';
  name?: string;
  createdAt?: Date;
} 
export enum UserRole {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  TOURIST = 'TOURIST'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UserLoginInput {
  email: string;
  password: string;
}

export interface JwtPayload {
  id: string;
  role: UserRole;
} 
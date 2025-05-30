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

export interface UserJwtPayload {
  id: string;
  role: UserRole;
}

// Corresponds to the user_role ENUM in schema.sql
export enum AdminUserRole {
  HOMESTAY_OWNER = 'homestay_owner',
  SUPER_ADMIN = 'super_admin',
  ACTIVITY_MANAGER = 'activity_manager'
}

// Corresponds to the admin_users table in schema.sql
export interface AdminUser {
  id: number; // SERIAL PRIMARY KEY
  username: string;
  // password field is usually not sent to client, but needed for auth comparison
  password?: string; // Or password_hash: string; depending on how you handle it.
  email: string;
  name: string;
  role: AdminUserRole;
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface AdminUserCreateInput {
  username: string;
  password: string;
  email: string;
  name: string;
  role: AdminUserRole; // Make it required for clarity, or set a default in logic
  is_active?: boolean;
}

export interface AdminUserLoginInput {
  // Users can login with either email or username
  email?: string;
  username?: string;
  password: string;
}

export interface AdminJwtPayload {
  id: number; // Corresponds to admin_users.id
  username: string;
  role: AdminUserRole;
  // Add other non-sensitive user details you might need in authenticated routes
}

// You might also want types for landing_page_user if you build auth for them
export enum LandingUserType {
  USER = 'user',
  GUEST = 'guest'
}

export interface LandingPageUser {
  id: number;
  email: string;
  name: string;
  last_name: string;
  passport: string | null;
  phone_number: string;
  type: LandingUserType;
  country: string | null;
  address: string | null;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
} 
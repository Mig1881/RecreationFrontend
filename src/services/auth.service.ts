// src/services/auth.service.ts
import { apiClient } from '../api/apiClient';

export interface LoginDto {
  email: string;
  password: string;
}

export interface SignupDto {
  nationalId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  birthDate?: string;
}

export interface JwtResponse {
  token: string;
  id: number;
  email: string;
  roles: string[];
}

export const authService = {
  // Endpoint público para iniciar sesión
  login: (credentials: LoginDto) => 
    apiClient<JwtResponse>('/auth/login', { method: 'POST', data: credentials }),

  // Endpoint público para registrar recreadores
  register: (userData: SignupDto) => 
    apiClient<string>('/auth/register', { method: 'POST', data: userData }),
};
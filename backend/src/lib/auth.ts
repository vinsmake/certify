import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Role } from '@certify/shared';
import { env } from '../config/env';

/** Contenido del JWT (forma heredada: userId en camelCase). */
export interface AuthUser {
  userId: number;
  role: Role;
  dependency_id: number | null;
}

const SALT_ROUNDS = 12;

export const hashPassword = (password: string) => bcrypt.hash(password, SALT_ROUNDS);
export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export const signToken = (payload: AuthUser) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRATION as SignOptions['expiresIn'] });

export const verifyToken = (token: string) => jwt.verify(token, env.JWT_SECRET) as AuthUser;

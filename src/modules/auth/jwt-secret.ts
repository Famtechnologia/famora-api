import { ConfigService } from '@nestjs/config';

/**
 * The signing secret for every session token in the application.
 *
 * There is deliberately no fallback. A default here is worse than a crash:
 * anyone holding it can mint a valid token for any account, including an
 * admin one, and a public repository hands it to them. Refusing to boot makes
 * a missing secret impossible to miss.
 */
export function requireJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET');

  if (!secret || !secret.trim()) {
    throw new Error(
      'JWT_SECRET is not set. Set it in the environment before starting the API — ' +
        'session tokens cannot be signed safely without it.',
    );
  }

  return secret;
}

/**
 * How long a session token stays valid.
 *
 * Long, because there is no silent renewal on the client: when this expires
 * the user is signed out and has to authenticate again. `/auth/refresh` lets
 * an app trade a valid token for a fresh one before that happens.
 */
export const SESSION_TOKEN_TTL = '30d';

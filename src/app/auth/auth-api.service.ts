import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

const BASE_URL = 'http://localhost:3000/api/auth';

export interface SsoOrganization {
  id: string;
  name: string;
  his: string | null;
  hisId: string | null;
  typeId: number | null;
  enabled: boolean;
}

export interface AuthSession {
  userId: string;
  organizations: SsoOrganization[];
  selectedOrganizationId: string | null;
  hasPrescriptorLicenseKey: boolean;
}

interface SessionResponseDto {
  authenticated: boolean;
  userId: string;
  userStatus?: string;
  organizations?: SsoOrganization[];
  permissions?: unknown;
  selectedOrganizationId?: string | null;
  hasPrescriptorLicenseKey?: boolean;
  expiresAt?: string;
}

interface AuthErrorDto {
  error?: string;
  retryAfterSeconds?: number;
}

function toAuthSession(dto: SessionResponseDto): AuthSession {
  return {
    userId: dto.userId,
    organizations: dto.organizations ?? [],
    selectedOrganizationId: dto.selectedOrganizationId ?? null,
    hasPrescriptorLicenseKey: dto.hasPrescriptorLicenseKey ?? false,
  };
}

function toAuthError(error: unknown, fallback: string): Error {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as AuthErrorDto | undefined;
    if (error.status === 429) {
      const wait = body?.retryAfterSeconds;
      return new Error(
        wait
          ? `Te veel inlogpogingen. Probeer het over ${wait} seconden opnieuw.`
          : 'Te veel inlogpogingen. Probeer het later opnieuw.',
      );
    }
    return new Error(body?.error || fallback);
  }
  return new Error(fallback);
}

@Service()
export class AuthApiService {
  private readonly http = inject(HttpClient);

  async login(username: string, password: string): Promise<AuthSession> {
    try {
      const response = await firstValueFrom(
        this.http.post<SessionResponseDto>(
          `${BASE_URL}/login`,
          { username, password },
          { withCredentials: true },
        ),
      );
      return toAuthSession(response);
    } catch (error) {
      throw toAuthError(error, 'E-mailadres of wachtwoord onjuist.');
    }
  }

  /** Null when there is no live session (e.g. cookie missing/expired). */
  async getSession(): Promise<AuthSession | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<SessionResponseDto>(`${BASE_URL}/session`, { withCredentials: true }),
      );
      return toAuthSession(response);
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post(`${BASE_URL}/logout`, {}, { withCredentials: true }));
  }

  async selectOrganization(organizationId: string): Promise<AuthSession> {
    try {
      const response = await firstValueFrom(
        this.http.post<SessionResponseDto>(
          `${BASE_URL}/organization`,
          { organizationId },
          { withCredentials: true },
        ),
      );
      return toAuthSession(response);
    } catch (error) {
      throw toAuthError(error, 'Organisatie selecteren mislukt.');
    }
  }
}

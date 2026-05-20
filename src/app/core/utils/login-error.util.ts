/** Cuerpo de error del login cuando django-axes bloquea la IP. */
export interface LoginLockoutError {
  code?: string;
  error?: string;
  detail?: string;
  cooloff_seconds?: number;
}

export function formatWaitTime(seconds: number): string {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const remainder = seconds % 3600;
    if (remainder >= 60) {
      const minutes = Math.floor(remainder / 60);
      const horaTxt = hours === 1 ? 'hora' : 'horas';
      const minTxt = minutes === 1 ? 'minuto' : 'minutos';
      return `${hours} ${horaTxt} y ${minutes} ${minTxt}`;
    }
    return hours === 1 ? '1 hora' : `${hours} horas`;
  }
  if (seconds >= 60) {
    const minutes = Math.max(1, Math.floor(seconds / 60));
    return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
  }
  return seconds === 1 ? '1 segundo' : `${seconds} segundos`;
}

export function isAxesLockoutError(
  status: number,
  body: LoginLockoutError | string | null | undefined,
): boolean {
  if (status === 429) return true;
  return typeof body === 'object' && body?.code === 'axes_lockout';
}

export function getAxesLockoutMessage(
  body: LoginLockoutError | string | null | undefined,
): string {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  if (typeof body === 'object' && body) {
    const text = body.detail || body.error;
    if (text) return text;
    if (body.cooloff_seconds != null) {
      const wait = formatWaitTime(body.cooloff_seconds);
      return (
        'Demasiados intentos fallidos. Tu acceso ha sido bloqueado temporalmente. ' +
        `Intenta nuevamente dentro de ${wait}.`
      );
    }
  }
  return (
    'Demasiados intentos fallidos. Tu acceso ha sido bloqueado temporalmente. ' +
    'Intenta nuevamente más tarde.'
  );
}

export function getInvalidCredentialsMessage(
  body: LoginLockoutError | string | null | undefined,
): string {
  if (typeof body === 'object' && body) {
    return body.detail || body.error || 'Correo o contraseña incorrectos.';
  }
  return 'Correo o contraseña incorrectos.';
}

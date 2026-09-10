import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from './auth.store';

// The auth endpoints themselves handle their own 401s (wrong credentials, "not
// logged in yet") — only a 401 from some other call means a live session expired
// mid-use, which is what should actually force a logout.
const AUTH_PATH = '/api/auth/';

export const sessionExpiredInterceptor: HttpInterceptorFn = (req, next) => {
  // inject() must run synchronously in the interceptor's own call, not inside the
  // catchError callback below, which fires later outside any injection context.
  const authStore = inject(AuthStore);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !req.url.includes(AUTH_PATH) && authStore.user()) {
        void authStore.logout();
      }
      return throwError(() => error);
    }),
  );
};

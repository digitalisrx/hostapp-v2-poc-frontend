import { HttpInterceptorFn } from '@angular/common/http';

const BACKEND_ORIGIN = 'http://localhost:3000';

// Most API services build their requests without `withCredentials: true`, which
// silently drops the session cookie — harmless while an endpoint accepted anonymous
// requests, but a 401 the moment it starts requiring an authenticated session.
export const withCredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(BACKEND_ORIGIN)) {
    return next(req);
  }

  return next(req.clone({ withCredentials: true }));
};

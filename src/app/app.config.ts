import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors, withJsonpSupport } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { sessionExpiredInterceptor } from './auth/session-expired.interceptor';
import { withCredentialsInterceptor } from './shared/with-credentials.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withJsonpSupport(), withInterceptors([withCredentialsInterceptor, sessionExpiredInterceptor])),
  ]
};

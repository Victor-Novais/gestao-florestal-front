import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

// Interceptors serão registrados aqui nas tasks F1-T2 e F1-T5
// import { JwtInterceptor }   from './interceptors/jwt.interceptor';
// import { ErrorInterceptor } from './interceptors/error.interceptor';

/**
 * CoreModule – importado SOMENTE no AppModule (ou app.config.ts).
 * Contém serviços singleton: AuthService, NotificationService, etc.
 */
@NgModule({
  imports: [CommonModule],
  providers: [
    // { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor,   multi: true },
    // { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ]
})
export class CoreModule {
  /** Lança erro se alguém tentar importar o CoreModule duas vezes. */
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule já foi carregado. Importe apenas no AppModule/appConfig.');
    }
  }
}

import {
  HttpInterceptor, HttpRequest, HttpHandler,
  HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { NotificationService } from '../services/notification.service';

/** Mapeia status HTTP → mensagem amigável */
const HTTP_MESSAGES: Record<number, string> = {
  400: 'Requisição inválida. Verifique os dados informados.',
  401: 'Credenciais inválidas ou sessão expirada.',
  403: 'Conta inativa ou sem permissão para esta ação.',
  404: 'Recurso não encontrado.',
  422: 'Dados inválidos. Verifique o formulário.',
  500: 'Erro interno no servidor. Tente novamente em instantes.',
  502: 'Serviço temporariamente indisponível.',
  503: 'Serviço temporariamente indisponível.',
};

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  private notify = inject(NotificationService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        // Não exibe snackbar para erros de auth — tratados no JwtInterceptor
        if (err.status === 401 && req.url.includes('/auth/')) {
          return throwError(() => err);
        }

        const message = HTTP_MESSAGES[err.status]
          ?? 'Ocorreu um erro inesperado. Tente novamente.';

        this.notify.error(message);
        return throwError(() => err);
      })
    );
  }
}

import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'areas/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'areas/:id/editar',
    renderMode: RenderMode.Server
  },
  {
    path: 'especies/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'especies/:id/editar',
    renderMode: RenderMode.Server
  },
  {
    path: 'colaboradores/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'colaboradores/:id/editar',
    renderMode: RenderMode.Server
  },
  {
    path: 'equipamentos/editar/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'inventario/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'ocorrencias/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'relatorios/plantio/confirmacao/:id',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];

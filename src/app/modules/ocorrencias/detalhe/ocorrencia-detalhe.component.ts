import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OcorrenciaService } from '../ocorrencia.service';
import { OcorrenciaResponse, TIPO_OCORRENCIA_LABELS, URGENCIA_CONFIG } from '../ocorrencia.model';

@Component({
  selector: 'app-ocorrencia-detalhe',
  standalone: false,
  templateUrl: './ocorrencia-detalhe.component.html',
  styleUrls: ['./ocorrencia-detalhe.component.scss']
})
export class OcorrenciaDetalheComponent implements OnInit {
  ocorrencia?: OcorrenciaResponse;
  loading = true;
  lightboxFoto: string | null = null;

  TIPO_LABELS = TIPO_OCORRENCIA_LABELS;
  URGENCIA_CONFIG = URGENCIA_CONFIG;

  constructor(
    private route: ActivatedRoute,
    private service: OcorrenciaService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.buscarPorId(id).subscribe({
      next: (res: OcorrenciaResponse) => { this.ocorrencia = res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  abrirLightbox(url: string): void { this.lightboxFoto = url; }
  fecharLightbox(): void { this.lightboxFoto = null; }

  imprimir(): void { window.print(); }
}

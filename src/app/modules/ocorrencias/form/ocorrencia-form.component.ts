import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { OcorrenciaService } from '../ocorrencia.service';
import {
  TIPO_OCORRENCIA_LABELS, URGENCIA_CONFIG,
  TipoOcorrencia, UrgenciaOcorrencia
} from '../ocorrencia.model';
import { AlertaOcorrenciaDialogComponent } from '../alerta-dialog/alerta-ocorrencia-dialog.component';

@Component({
  selector: 'app-ocorrencia-form',
  standalone: false,
  templateUrl: './ocorrencia-form.component.html',
  styleUrls: ['./ocorrencia-form.component.scss']
})
export class OcorrenciaFormComponent implements OnInit {
  form!: FormGroup;
  areas: { id: string; nome: string }[] = [];
  loading = false;
  previewFotos: string[] = [];
  fotosBase64: string[] = [];

  tiposOcorrencia = Object.entries(TIPO_OCORRENCIA_LABELS).map(([key, val]) => ({
    value: key as TipoOcorrencia,
    ...val
  }));

  urgencias = Object.entries(URGENCIA_CONFIG).map(([key, val]) => ({
    value: key as UrgenciaOcorrencia,
    ...(val as { label: string; color: string; bg: string })
  }));

  urgenciaColorAtual: string = '';

  constructor(
    private fb: FormBuilder,
    private service: OcorrenciaService,
    private dialog: MatDialog,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      tipo:            [null, Validators.required],
      areaFlorestalId: [null, Validators.required],
      urgencia:        [null, Validators.required],
      latitude:        [null],
      longitude:       [null],
      descricao:       [''],
    });

    this.carregarAreas();

    this.form.get('urgencia')!.valueChanges.subscribe(v => {
      this.urgenciaColorAtual = v ? URGENCIA_CONFIG[v as UrgenciaOcorrencia].color : '';
    });
  }

  carregarAreas(): void {
    this.http.get<any>(`${environment.apiUrl}/api/areas?size=100`)
      .subscribe(res => this.areas = res.content ?? []);
  }

  onFotosChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.previewFotos = [];
    this.fotosBase64 = [];

    Array.from(input.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.previewFotos.push(result);
        // Para o back, enviamos a URL simulada (em produção usaria upload real)
        this.fotosBase64.push(result);
      };
      reader.readAsDataURL(file);
    });
  }

  removerFoto(index: number): void {
    this.previewFotos.splice(index, 1);
    this.fotosBase64.splice(index, 1);
  }

  submeter(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;

    const payload = { ...this.form.value, urlFotos: this.fotosBase64 };

    this.service.criar(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        const urgencia = res.urgencia as UrgenciaOcorrencia;
        if (urgencia === 'ALTO' || urgencia === 'CRITICO') {
          this.dialog.open(AlertaOcorrenciaDialogComponent, {
            width: '480px',
            maxWidth: 'calc(100vw - 1rem)',
            panelClass: ['responsive-dialog-panel', 'responsive-dialog-panel--narrow'],
            disableClose: true,
            data: { ocorrencia: res }
          }).afterClosed().subscribe(() => this.router.navigate(['/ocorrencias']));
        } else {
          this.router.navigate(['/ocorrencias']);
        }
      },
      error: () => { this.loading = false; }
    });
  }
}

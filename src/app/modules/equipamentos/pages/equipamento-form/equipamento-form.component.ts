import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

// Imports do Angular Material
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

// Import do seu Service (Verifique se o caminho está correto)
import { EquipamentoService } from '../../../../core/services/equipamento.service';
import { EquipamentoFormData } from '../../../../core/models/equipamento.model';

@Component({
  selector: 'app-equipamento-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './equipamento-form.component.html',
  styleUrls: ['./equipamento-form.component.scss']
})

export class EquipamentoFormComponent implements OnInit {
  form: FormGroup;
  idEdicao?: string;
  responsaveis: Array<{ id: string | number | null; nome: string }> = [];
  readonly categorias = ['VEICULO', 'FERRAMENTA_MANUAL', 'EPI', 'INSUMO_QUIMICO'];

  constructor(
    private fb: FormBuilder,
    private service: EquipamentoService,
    private route: ActivatedRoute,
    public router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      descricao: ['', Validators.required],
      codigoPatrimonial: ['', Validators.required],
      categoria: ['', Validators.required],
      unidadeMedida: ['', Validators.required],
      localizacaoAtual: [''],
      vidaUtilEstimada: [12, [Validators.required, Validators.min(1)]],
      quantidade: [1, [Validators.required, Validators.min(1)]],
      estoqueMinimo: [0, [Validators.required, Validators.min(0)]],
      dataAquisicao: [null, Validators.required],
      responsavelId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.carregarResponsaveis();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idEdicao = id;
      this.service.buscarPorId(this.idEdicao).subscribe({
        next: (dados) => this.form.patchValue(dados),
        error: () => this.snackBar.open('Erro ao carregar dados do equipamento.', 'OK', { duration: 3000 })
      });
    }
  }

  carregarResponsaveis(): void {
    this.service.listarResponsaveis().subscribe({
      next: (res) => this.responsaveis = res,
      error: (err) => console.error('Erro ao carregar colaboradores', err)
    });
  }

  salvar(): void {
    if (this.form.invalid) return;

    const payload: EquipamentoFormData = this.form.value;
    const request$: Observable<any> = this.idEdicao
      ? this.service.atualizar(this.idEdicao, payload)
      : this.service.salvar(payload);

    request$.subscribe({
      next: () => {
        this.snackBar.open('Equipamento salvo com sucesso!', 'Fechar', { duration: 3000 });
        this.router.navigate(['/equipamentos']);
      },
      error: (err) => {
        const mensagem = err.status === 409 ? 'Código Patrimonial já cadastrado!' : 'Erro ao salvar equipamento.';
        this.snackBar.open(mensagem, 'Erro', { duration: 5000 });
      }
    });
  }
}

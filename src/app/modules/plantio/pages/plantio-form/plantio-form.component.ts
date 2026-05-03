import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // PARA NGFOR E NGIF
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // PARA FORMGROUP E NGSUBMIT
import { ActivatedRoute, Router } from '@angular/router';

// IMPORTS DO ANGULAR MATERIAL
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// SERVICE
import { PlantioService } from '../../../../core/services/plantio.service';

@Component({
  selector: 'app-plantio-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSlideToggleModule
  ],
  templateUrl: './plantio-form.component.html',
  styleUrls: ['./plantio-form.component.scss']
})
export class PlantioFormComponent implements OnInit {
  // Variáveis que o HTML precisa enxergar
  form: FormGroup;
  areas: any[] = [];
  especies: any[] = [];

  constructor(
    private fb: FormBuilder,
    private service: PlantioService,
    private snackBar: MatSnackBar,
    public router: Router
  ) {
    // Inicialização do formulário com as validações da T5
    this.form = this.fb.group({
      areaId: [null, Validators.required],
      especieId: [null, Validators.required],
      quantidadeMudas: [null, [Validators.required, Validators.min(1)]],
      talhao: ['', Validators.required],
      latitude: [null, Validators.required],
      longitude: [null, Validators.required],
      temperatura: [null],
      umidade: [null],
      indicadorChuva: [false],
      metodoPlantio: ['', Validators.required],
      observacoes: ['']
    });
  }

  ngOnInit(): void {
    this.carregarDadosIniciais();
  }

  carregarDadosIniciais(): void {
    // Busca áreas ativas para o Select
    this.service.getAreasAtivas().subscribe({
      next: (res) => this.areas = res,
      error: () => this.snackBar.open('Erro ao carregar áreas.', 'OK')
    });

    // Busca espécies ativas para o Select
    this.service.getEspeciesAtivas().subscribe({
      next: (res) => this.especies = res,
      error: () => this.snackBar.open('Erro ao carregar espécies.', 'OK')
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.snackBar.open('Preencha todos os campos obrigatórios!', 'Aviso');
      return;
    }

    this.service.registrar(this.form.value).subscribe({
      next: (res) => {
        // Exibe o protocolo conforme solicitado no Trello
        alert(`Plantio registrado com sucesso! Protocolo: ${res.protocolo}`);
        this.router.navigate(['/plantios']);
      },
      error: (err) => {
        this.snackBar.open('Erro ao registrar plantio. Tente novamente.', 'Erro');
      }
    });
  }
}

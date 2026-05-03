import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatNativeDateModule } from '@angular/material/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PlantioService } from '../../../../core/services/plantio.service';

@Component({
    selector: 'app-plantio-report',
    standalone: true,
    imports: [
        CommonModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressBarModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatNativeDateModule,
        ReactiveFormsModule
    ],
    templateUrl: './plantio-report.component.html',
    styleUrl: './plantio-report.component.scss'
})
export class PlantioReportComponent implements OnInit {
    date = new FormControl(new Date());
    relatorio: any = null;

    constructor(private service: PlantioService) {}

    ngOnInit(): void {
        this.carregarRelatorio();
    }

    // Critério 2: Seletor de mês/ano no modo 'month'
    setMonthAndYear(normalizedMonthAndYear: Date, datepicker: MatDatepicker<Date>) {
        const current = this.date.value ?? new Date();
        const updated = new Date(current);
        updated.setMonth(normalizedMonthAndYear.getMonth());
        updated.setFullYear(normalizedMonthAndYear.getFullYear());
        this.date.setValue(updated);
        datepicker.close();
        this.carregarRelatorio();
    }

    carregarRelatorio() {
        const selected = this.date.value ?? new Date();
        const mes = selected.getMonth() + 1;
        const ano = selected.getFullYear();
        this.service.buscarAcumuladoMensal(mes, ano).subscribe(res => this.relatorio = res);
    }

    // Critério 3: Lógica de cores da barra de progresso
    getProgressBarColor(percent: number): string {
        if (percent >= 100) return 'progress-green';
        if (percent >= 50) return 'progress-yellow';
        return 'progress-red';
    }

    // Critério 1: Botão de impressão
    imprimir() {
        window.print();
    }
}

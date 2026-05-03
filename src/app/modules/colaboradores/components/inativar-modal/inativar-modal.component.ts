import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-inativar-modal',
  standalone: true,
  templateUrl: './inativar-modal.component.html',
  styleUrls: ['./inativar-modal.component.scss'],
})
export class InativarModalComponent {
  @Input() nomeColaborador: string = '';
  @Output() confirmou = new EventEmitter<void>();
  @Output() cancelou = new EventEmitter<void>();

  confirmar() {
    this.confirmou.emit();
  }

  cancelar() {
    this.cancelou.emit();
  }
}

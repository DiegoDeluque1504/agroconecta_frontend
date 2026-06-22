import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cantidad',
  standalone: true,
})
export class CantidadPipe implements PipeTransform {
  transform(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const texto = String(value).trim();
    const numero = Number(texto);
    if (!Number.isFinite(numero)) {
      return texto;
    }

    return numero.toString();
  }
}

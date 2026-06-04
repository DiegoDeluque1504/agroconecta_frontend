import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'moneda',
  standalone: true
})
export class MonedaPipe implements PipeTransform {
  transform(value: any): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '$0';
    }
    
    // Parsear el valor como entero para eliminar decimales
    const numero = Math.round(Number(value));
    
    // Formatear con puntos como separadores de miles
    const formateado = numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `$${formateado}`;
  }
}

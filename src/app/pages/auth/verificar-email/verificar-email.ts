import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verificar-email',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verificar-email.html',
  styleUrl: './verificar-email.css'
})
export class VerificarEmailComponent implements OnInit {

  cargando = signal(true);
  error = signal('');
  exito = signal('');

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.error.set('Token no encontrado.');
      this.cargando.set(false);
      return;
    }

    this.authService.verificarEmail(token).subscribe({
      next: (resp) => {
        this.exito.set(resp.mensaje || 'Correo verificado correctamente.');
        this.cargando.set(false);

        setTimeout(() => {
          this.router.navigate(['/catalogo']);
        }, 2500);
      },
      error: (err) => {
        this.error.set(
          err?.error?.error ||
          err?.error?.detail ||
          err?.error?.token?.[0] ||
          'No se pudo verificar el correo.'
        );

        this.cargando.set(false);
      }
    });
  }
}
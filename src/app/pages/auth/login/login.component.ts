import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { timeout, TimeoutError } from 'rxjs';
import { CommonModule } from '@angular/common';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(MessageService);

  cargando = false;

  ngOnInit(): void {
    // Limpia tokens viejos para evitar que el interceptor interfiera con el login
    if (!this.auth.estaAutenticado()) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  // Formulario reactivo con validaciones
  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // Getters para acceder fácilmente a los campos en el template
  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // Muestra los errores de validación
      return;
    }

    this.cargando = true;
    const { email, password } = this.form.value;

    this.auth.login(email, password).pipe(
      timeout(10000) // Corta si el servidor no responde en 10 segundos
    ).subscribe({
      next: () => {
        // Login exitoso: resetear cargando ANTES de navegar evita que quede atascado
        this.cargando = false;
        this.router.navigate(['/catalogo']);
      },
      error: (err) => {
        this.cargando = false;

        let msg: string;
        if (err instanceof TimeoutError) {
          // El servidor no respondió en 10s
          msg = 'El servidor no responde. Verifica tu conexión e intenta de nuevo.';
        } else if (err.status === 0) {
          // Error de red: sin conexión o backend caído
          msg = 'No se pudo conectar con el servidor. Verifica tu conexión.';
        } else if (err.status === 401 || err.status === 400) {
          // Credenciales incorrectas (Django devuelve 401 o 400)
          msg =
            err.error?.detail ||
            err.error?.error ||
            err.error?.non_field_errors?.[0] ||
            'Correo o contraseña incorrectos.';
        } else {
          // Cualquier otro error del servidor
          msg =
            err.error?.detail ||
            err.error?.error ||
            (typeof err.error === 'object' ? String(Object.values(err.error).flat()[0]) : null) ||
            `Error del servidor (${err.status}). Intenta de nuevo.`;
        }

        this.toast.add({ severity: 'error', summary: 'Error al iniciar sesión', detail: msg, life: 5000 });
      },
    });
  }
}

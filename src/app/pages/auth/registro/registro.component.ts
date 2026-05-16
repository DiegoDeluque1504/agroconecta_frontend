import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { timeout, TimeoutError } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
})
export class RegistroComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(MessageService);

  cargando = false;
  exitoso = false; // Muestra mensaje de "revisa tu correo" tras registrarse

  form: FormGroup = this.fb.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password2: ['', [Validators.required]],
    telefono: [''],
    es_productor: [false],
    es_comprador: [false],
  });

  get first_name() { return this.form.get('first_name'); }
  get last_name() { return this.form.get('last_name'); }
  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }
  get password2() { return this.form.get('password2'); }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { password, password2, es_productor, es_comprador } = this.form.value;

    if (password !== password2) {
      this.toast.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Las contraseñas no coinciden',
      });
      return;
    }

    // Al menos un rol debe estar seleccionado
    if (!es_productor && !es_comprador) {
      this.toast.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debes seleccionar al menos un rol (Productor o Comprador)',
      });
      return;
    }

    this.cargando = true;

    this.auth.registro(this.form.value).pipe(
      timeout(15000) // Corta si el servidor no responde en 15 segundos
    ).subscribe({
      next: () => {
        // Registro exitoso: mostrar pantalla de éxito
        this.exitoso = true;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;

        let msg: string;
        if (err instanceof TimeoutError) {
          msg = 'El servidor no responde. Verifica tu conexión e intenta de nuevo.';
        } else if (err.status === 0) {
          msg = 'No se pudo conectar con el servidor. Verifica tu conexión.';
        } else {
          const e = err.error;
          msg =
            e?.email?.[0] ||
            e?.password?.[0] ||
            e?.password2?.[0] ||
            e?.first_name?.[0] ||
            e?.last_name?.[0] ||
            e?.roles?.[0] ||
            e?.detail ||
            e?.error ||
            (typeof e === 'object' ? String(Object.values(e).flat()[0]) : null) ||
            'Error al registrarse. Intenta de nuevo.';
        }

        this.toast.add({ severity: 'error', summary: 'Error al registrarse', detail: msg, life: 6000 });
      },
    });
  }
}

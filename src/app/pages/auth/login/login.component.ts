import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { timeout, TimeoutError } from 'rxjs';
import { CommonModule } from '@angular/common';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import {
  getAxesLockoutMessage,
  getInvalidCredentialsMessage,
  isAxesLockoutError,
} from '../../../core/utils/login-error.util';
import {
  GUEST_EXPLORATION_MESSAGE,
  GuestExplorationService,
} from '../../../core/services/guest-exploration.service';

declare var turnstile: any;

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
export class LoginComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(MessageService);
  private guestExploration = inject(GuestExplorationService);

  cargando = false;
  mensajeModoRestringido: string | null = null;
  widgetId: string | null = null;
  captchaToken: string | null = null;

  ngOnInit(): void {
    if (!this.auth.estaAutenticado()) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }

    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'guest_limit' || this.guestExploration.enModoRestringido()) {
      this.mensajeModoRestringido = GUEST_EXPLORATION_MESSAGE;
    }
  }

  ngAfterViewInit(): void {
    this.renderCaptcha();
  }

  renderCaptcha(): void {
    if (typeof turnstile !== 'undefined') {
      try {
        this.widgetId = turnstile.render('#turnstile-container', {
          sitekey: environment.turnstileSiteKey || '1x00000000000000000000AA',
          callback: (token: string) => {
            this.captchaToken = token;
          },
          'expired-callback': () => {
            this.captchaToken = null;
          },
          'error-callback': () => {
            this.captchaToken = null;
          }
        });
      } catch (e) {
        console.error('Error rendering turnstile:', e);
      }
    } else {
      setTimeout(() => this.renderCaptcha(), 500);
    }
  }

  // Formulario reactivo con validaciones
  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required, 
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-zA-Z])(?=.*\d).+$/)
    ]],
  });

  // Getters para acceder fácilmente a los campos en el template
  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // Muestra los errores de validación
      return;
    }

    if (!this.captchaToken) {
      this.toast.add({ severity: 'warn', summary: 'Atención', detail: 'Por favor completa el captcha antes de continuar.' });
      return;
    }

    this.cargando = true;
    const { email, password } = this.form.value;

    this.auth.login(email, password, this.captchaToken).pipe(
      timeout(10000) // Corta si el servidor no responde en 10 segundos
    ).subscribe({
      next: () => {
        // Login exitoso: resetear cargando ANTES de navegar evita que quede atascado
        this.cargando = false;
        this.router.navigate(['/catalogo']);
      },
      error: (err) => {
        this.cargando = false;
        const body = err.error;
        const bloqueado = isAxesLockoutError(err.status, body);

        let summary = 'Error al iniciar sesión';
        let msg: string;

        if (err instanceof TimeoutError) {
          msg = 'El servidor no responde. Verifica tu conexión e intenta de nuevo.';
        } else if (err.status === 0) {
          msg = 'No se pudo conectar con el servidor. Verifica tu conexión.';
        } else if (bloqueado) {
          summary = 'Acceso bloqueado temporalmente';
          msg = getAxesLockoutMessage(body);
        } else if (err.status === 401 || err.status === 400) {
          msg = getInvalidCredentialsMessage(body);
          if (typeof body === 'object' && body?.non_field_errors?.[0]) {
            msg = body.non_field_errors[0];
          }
        } else {
          msg =
            (typeof body === 'object' ? body?.detail || body?.error : null) ||
            (typeof body === 'object' ? String(Object.values(body).flat()[0]) : null) ||
            `Error del servidor (${err.status}). Intenta de nuevo.`;
        }

        this.toast.add({
          severity: 'error',
          summary,
          detail: msg,
          life: bloqueado ? 8000 : 5000,
        });

        // Reset Turnstile on login failure
        if (typeof turnstile !== 'undefined' && this.widgetId !== null) {
          turnstile.reset(this.widgetId);
          this.captchaToken = null;
        }
      },
    });
  }
}

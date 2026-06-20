import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
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
import { environment } from '../../../../environments/environment';

declare var turnstile: any;

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
export class RegistroComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(MessageService);

  cargando    = false;
  exitoso     = false; // true = mostrar pantalla de verificación de email
  emailRegistrado = ''; // guardamos el email para mostrarlo en la pantalla de verificación
  widgetId: string | null = null;
  captchaToken: string | null = null;

  form: FormGroup = this.fb.group({
    first_name:   ['', [Validators.required]],
    last_name:    ['', [Validators.required]],
    email:        ['', [Validators.required, Validators.email]],
    password:     ['', [
      Validators.required, 
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-zA-Z])(?=.*\d).+$/)
    ]],
    password2:    ['', [Validators.required]],
    telefono:     [''],
    es_productor: [false],
    es_comprador: [false],
  });

  get first_name() { return this.form.get('first_name'); }
  get last_name()  { return this.form.get('last_name');  }
  get email()      { return this.form.get('email');      }
  get password()   { return this.form.get('password');   }
  get password2()  { return this.form.get('password2');  }

  ngOnInit(): void {}

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

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const { password, password2, es_productor, es_comprador } = this.form.value;

    if (password !== password2) {
      this.toast.add({ severity: 'warn', summary: 'Atención', detail: 'Las contraseñas no coinciden' });
      return;
    }

    if (!es_productor && !es_comprador) {
      this.toast.add({ severity: 'warn', summary: 'Atención', detail: 'Debes seleccionar al menos un rol (Productor o Comprador)' });
      return;
    }

    if (!this.captchaToken) {
      this.toast.add({ severity: 'warn', summary: 'Atención', detail: 'Por favor completa el captcha antes de continuar.' });
      return;
    }

    this.cargando = true;

    const payload: any = {
      ...this.form.value,
    };

    if (this.captchaToken) {
      payload.captcha_token = this.captchaToken;
    }

    this.auth.registro(payload).pipe(
      timeout(15000)
    ).subscribe({
      next: () => {
        // Guardamos el email para mostrarlo en la pantalla de verificación
        this.emailRegistrado = this.form.value.email;
        this.exitoso  = true;
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
            e?.email?.[0]     ||
            e?.password?.[0]  ||
            e?.password2?.[0] ||
            e?.first_name?.[0]||
            e?.last_name?.[0] ||
            e?.roles?.[0]     ||
            e?.detail         ||
            e?.error          ||
            (typeof e === 'object' ? String(Object.values(e).flat()[0]) : null) ||
            'Error al registrarse. Intenta de nuevo.';
        }
        this.toast.add({ severity: 'error', summary: 'Error al registrarse', detail: msg, life: 6000 });

        // Reset Turnstile on registration failure
        if (typeof turnstile !== 'undefined' && this.widgetId !== null) {
          turnstile.reset(this.widgetId);
          this.captchaToken = null;
        }
      },
    });
  }
}

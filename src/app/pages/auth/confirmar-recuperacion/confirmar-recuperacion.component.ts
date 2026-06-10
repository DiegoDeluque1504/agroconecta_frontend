import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder, FormGroup, Validators, AbstractControl,
  ValidationErrors, ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../core/services/auth.service';

function passwordsCoinciden(group: AbstractControl): ValidationErrors | null {
  const nueva = group.get('password_nueva')?.value;
  const confirmar = group.get('password_confirmar')?.value;
  return nueva && confirmar && nueva !== confirmar ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-confirmar-recuperacion',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, ToastModule, ButtonModule, PasswordModule],
  providers: [MessageService],
  templateUrl: './confirmar-recuperacion.component.html',
  styleUrls: ['./confirmar-recuperacion.component.css'],
})
export class ConfirmarRecuperacionComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  cargando = false;
  exitoso = false;
  tokenInvalido = false;
  errorServidor: string | null = null;
  countdown = 5;
  private token: string | null = null;
  private countdownInterval: any;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private msg: MessageService,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.tokenInvalido = true;
    }

    this.form = this.fb.group(
      {
        password_nueva: ['', [Validators.required, Validators.minLength(8)]],
        password_confirmar: ['', Validators.required],
      },
      { validators: passwordsCoinciden }
    );
  }

  get passwordNueva() { return this.form.get('password_nueva'); }
  get passwordConfirmar() { return this.form.get('password_confirmar'); }

  onSubmit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.errorServidor = null;

    this.auth.confirmarRecuperacion(this.token, this.passwordNueva!.value).subscribe({
      next: () => {
        this.cargando = false;
        this.exitoso = true;
        this.iniciarCountdown();
      },
      error: (err) => {
        this.cargando = false;
        const msg = err?.error?.error;
        if (msg?.includes('invalido') || msg?.includes('expirado') || msg?.includes('utilizado')) {
          this.tokenInvalido = true;
        } else {
          this.errorServidor = msg || 'Ocurrió un error. Intenta de nuevo.';
        }
      },
    });
  }

  private iniciarCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.router.navigate(['/auth/login']);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }
}

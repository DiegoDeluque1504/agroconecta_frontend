import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, ToastModule, ButtonModule, InputTextModule],
  providers: [MessageService],
  templateUrl: './recuperar-password.component.html',
  styleUrls: ['./recuperar-password.component.css'],
})
export class RecuperarPasswordComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  cargando = false;
  enviado = false;
  cooldown = 0;
  private cooldownInterval: any;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private msg: MessageService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  get email() { return this.form.get('email'); }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviar(this.email!.value);
  }

  reenviar(): void {
    this.enviado = false;
    setTimeout(() => this.onSubmit(), 100);
  }

  private enviar(email: string): void {
    this.cargando = true;
    this.auth.solicitarRecuperacion(email).subscribe({
      next: () => {
        this.cargando = false;
        this.enviado = true;
        this.iniciarCooldown();
      },
      error: () => {
        this.cargando = false;
        this.enviado = true; // Mostrar mismo mensaje para no revelar si existe
        this.iniciarCooldown();
      },
    });
  }

  private iniciarCooldown(): void {
    this.cooldown = 60;
    this.cooldownInterval = setInterval(() => {
      this.cooldown--;
      if (this.cooldown <= 0) {
        clearInterval(this.cooldownInterval);
        this.cooldown = 0;
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
  }
}

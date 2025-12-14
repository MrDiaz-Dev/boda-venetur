import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ElementRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente principal de la página de inicio de la boda.
 * Gestiona el contador regresivo, animaciones de scroll y reproducción de música de fondo.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  // Fecha objetivo de la boda
  targetDate = new Date('2026-03-25T16:00:00');

  // Signal para el tiempo restante (Zoneless state)
  timeRemaining = signal({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Signal para el modal
  showModal = signal(false);

  // Signal para el estado de la música
  isMusicPlaying = signal(true);

  private intervalId: any;
  private observer: IntersectionObserver | null = null;
  private audio: HTMLAudioElement | null = null;

  // Query para obtener todos los elementos que deben animarse
  @ViewChildren('animatable') animatableElements!: QueryList<ElementRef>;

  ngOnInit() {
    this.initializeMusic();
    this.startTimer();
  }

  ngAfterViewInit() {
    this.setupIntersectionObserver();

    // Si la lista de elementos cambia dinámicamente, re-observamos
    this.animatableElements.changes.subscribe(() => {
      this.setupIntersectionObserver();
    });
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.observer) this.observer.disconnect();
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
  }

  // Lógica del Contador
  private startTimer() {
    const update = () => {
      const now = new Date().getTime();
      const distance = this.targetDate.getTime() - now;

      if (distance < 0) {
        this.timeRemaining.set({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(this.intervalId);
        return;
      }

      this.timeRemaining.set({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    update(); // Ejecutar inmediatamente
    this.intervalId = setInterval(update, 1000);
  }

  // Lógica de Animación Scroll (Intersection Observer)
  private setupIntersectionObserver() {
    const options = {
      root: null, // viewport
      rootMargin: '0px',
      threshold: 0.15, // Disparar cuando el 15% del elemento es visible
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          // Opcional: Dejar de observar una vez animado si solo queremos que pase una vez
          // this.observer?.unobserve(entry.target);
        }
      });
    }, options);

    this.animatableElements.forEach((el) => {
      this.observer?.observe(el.nativeElement);
    });
  }

  // Lógica de Música
  /**
   * Inicializa el reproductor de música con el archivo de audio de fondo.
   * Comienza la reproducción automáticamente al cargar la página.
   */
  private initializeMusic() {
    try {
      this.audio = new Audio('/assets/perfect-theme.mp3');
      this.audio.loop = true; // Repetir la música indefinidamente
      this.audio.volume = 0.3; // Volumen bajo para no ser intrusivo

      // Reproducir automáticamente (puede ser bloqueado por el navegador)
      this.audio.play().catch(error => {
        console.warn('La reproducción automática fue bloqueada por el navegador:', error);
        this.isMusicPlaying.set(false);
      });
    } catch (error) {
      console.error('Error al inicializar la música:', error);
    }
  }

  /**
   * Alterna entre pausar y reanudar la reproducción de música.
   * Actualiza el estado del signal isMusicPlaying.
   */
  toggleMusic() {
    if (!this.audio) return;

    if (this.isMusicPlaying()) {
      this.audio.pause();
      this.isMusicPlaying.set(false);
    } else {
      this.audio.play().catch(error => {
        console.error('Error al reanudar la música:', error);
      });
      this.isMusicPlaying.set(true);
    }
  }

  // Acciones UI
  rsvp() {
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }
}

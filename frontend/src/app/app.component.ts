import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { ConsoleService, ConsoleLine } from './services/console.service';

interface NavItem { label: string; route: string; icon: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private consoleService = inject(ConsoleService);
  consoleLines$ = this.consoleService.lines$;
  consoleCollapsed = false;

  @ViewChild('consoleBody') consoleBody!: ElementRef<HTMLDivElement>;

  navItems: NavItem[] = [
    { label: 'HTTP Server', route: '/http-server', icon: '🌐' },
    { label: 'MQTT Broker', route: '/mqtt',        icon: '📡' },
    { label: 'TCP Client',  route: '/tcp-client',  icon: '⚡' },
    { label: 'Serial',      route: '/serial',      icon: '🔌' },
    { label: 'Simulator',   route: '/simulator',   icon: '🎮' },
  ];

  ngOnInit(): void {
    this.consoleService.log('Console initialized...');
  }

  toggleConsole(): void {
    this.consoleCollapsed = !this.consoleCollapsed;
  }

  clearConsole(): void {
    this.consoleService.clear();
  }

  scrollToBottom(): void {
    if (this.consoleBody) {
      const el = this.consoleBody.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}

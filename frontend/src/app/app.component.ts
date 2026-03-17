import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavItem { label: string; route: string; icon: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  navItems: NavItem[] = [
    { label: 'HTTP Server', route: '/http-server', icon: '🌐' },
    { label: 'MQTT Broker', route: '/mqtt',        icon: '📡' },
    { label: 'TCP Client',  route: '/tcp-client',  icon: '⚡' },
    { label: 'Serial',      route: '/serial',      icon: '🔌' },
    { label: 'Simulator',   route: '/simulator',   icon: '🎮' },
  ];
}

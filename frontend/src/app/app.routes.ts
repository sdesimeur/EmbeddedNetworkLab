import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'http-server', pathMatch: 'full' },
  {
    path: 'http-server',
    loadComponent: () => import('./modules/http-server/http-server.component').then(m => m.HttpServerComponent),
  },
  {
    path: 'mqtt',
    loadComponent: () => import('./modules/mqtt-broker/mqtt-broker.component').then(m => m.MqttBrokerComponent),
  },
  {
    path: 'tcp-client',
    loadComponent: () => import('./modules/tcp-client/tcp-client.component').then(m => m.TcpClientComponent),
  },
  {
    path: 'serial',
    loadComponent: () => import('./modules/serial/serial.component').then(m => m.SerialComponent),
  },
  {
    path: 'simulator',
    loadComponent: () => import('./modules/simulator/simulator.component').then(m => m.SimulatorComponent),
  },
];

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConsoleLine {
  timestamp: string;
  module: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ConsoleService {
  private lines: ConsoleLine[] = [];
  private linesSubject = new BehaviorSubject<ConsoleLine[]>([]);

  lines$ = this.linesSubject.asObservable();

  log(message: string, module = 'Shell'): void {
    const now = new Date();
    const timestamp = now.toTimeString().slice(0, 8); // HH:mm:ss
    const line: ConsoleLine = { timestamp, module, message };
    this.lines.push(line);
    this.linesSubject.next([...this.lines]);
  }

  clear(): void {
    this.lines = [];
    this.linesSubject.next([]);
  }
}

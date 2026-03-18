import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

const API = '/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // HTTP Server
  getHttpServerStatus()                         { return firstValueFrom(this.http.get<any>(`${API}/http-server/status`)); }
  startHttpServer(body: any)                    { return firstValueFrom(this.http.post<any>(`${API}/http-server/start`, body)); }
  stopHttpServer()                              { return firstValueFrom(this.http.post<any>(`${API}/http-server/stop`, {})); }
  getReceivedVideos()                           { return firstValueFrom(this.http.get<any[]>(`${API}/http-server/videos`)); }
  deleteVideo(fileName: string)                 { return firstValueFrom(this.http.delete<any>(`${API}/http-server/videos/${encodeURIComponent(fileName)}`)); }

  // MQTT Broker
  getMqttStatus()                               { return firstValueFrom(this.http.get<any>(`${API}/mqtt/status`)); }
  startMqtt(body: any)                          { return firstValueFrom(this.http.post<any>(`${API}/mqtt/start`, body)); }
  stopMqtt()                                    { return firstValueFrom(this.http.post<any>(`${API}/mqtt/stop`, {})); }

  // TCP Client
  reachServer(body: any)                        { return firstValueFrom(this.http.post<any>(`${API}/tcp/reach`, body)); }
  startThroughput(body: any)                    { return firstValueFrom(this.http.post<any>(`${API}/tcp/throughput/start`, body)); }
  stopThroughput()                              { return firstValueFrom(this.http.post<any>(`${API}/tcp/throughput/stop`, {})); }

  // Serial
  listPorts()                                   { return firstValueFrom(this.http.get<string[]>(`${API}/serial/ports`)); }
  getBaudRates()                                { return firstValueFrom(this.http.get<number[]>(`${API}/serial/baud-rates`)); }
  getSerialStatus()                             { return firstValueFrom(this.http.get<any>(`${API}/serial/status`)); }
  openSerial(body: any)                         { return firstValueFrom(this.http.post<any>(`${API}/serial/open`, body)); }
  closeSerial()                                 { return firstValueFrom(this.http.post<any>(`${API}/serial/close`, {})); }
  sendSerial(text: string)                      { return firstValueFrom(this.http.post<any>(`${API}/serial/send`, { text })); }
  setSerialBaudRate(baudRate: number)           { return firstValueFrom(this.http.post<any>(`${API}/serial/baud-rate`, { baudRate })); }

  // Config
  getSerialCommands()                           { return firstValueFrom(this.http.get<any[]>(`${API}/config/serial-commands`)); }
  saveSerialCommands(commands: any[])           { return firstValueFrom(this.http.post<any>(`${API}/config/serial-commands`, { commands })); }
  getSimulatorCommands()                        { return firstValueFrom(this.http.get<any[]>(`${API}/config/simulator-commands`)); }
  saveSimulatorCommands(commands: any[])        { return firstValueFrom(this.http.post<any>(`${API}/config/simulator-commands`, { commands })); }
}

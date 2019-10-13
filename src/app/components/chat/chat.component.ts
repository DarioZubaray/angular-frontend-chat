import { Component, OnInit } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Mensaje } from '../models/mensaje';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styles: []
})
export class ChatComponent implements OnInit {

  private client: Client;
  conectado: boolean = false;
  mensaje: Mensaje = new Mensaje();
  listaMensajes: Mensaje[] = [];

  constructor() { }

  ngOnInit() {
    this.client = new Client();
    this.client.webSocketFactory = () => {
      return new SockJS("http://localhost:8080/chat-websocket");
    }

    this.client.onConnect = (frame) => {
      console.log('Conectados= ' + this.client.connected + ' : ' + frame);
      this.conectado = true;

      this.client.subscribe('/chat/mensaje', (e) => {
        let mensajeRecibido = JSON.parse(e.body) as Mensaje;
        mensajeRecibido.fecha = new Date(mensajeRecibido.fecha);
        console.log(mensajeRecibido);
        this.listaMensajes.push(mensajeRecibido);
      });
    }

    this.client.onDisconnect = (frame) => {
      console.log('Desonectados= ' + !this.client.connected + ' : ' + frame);
      this.conectado = false;
    }
  }

  conectar(): void {
    this.client.activate();
  }

  desconectar(): void {
    this.client.deactivate();
  }

  enviarMensaje(): void {
    this.client.publish({destination: '/app/mensaje', body: JSON.stringify(this.mensaje)});
    this.mensaje.texto = '';
  }
}

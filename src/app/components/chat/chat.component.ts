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
  escribiendo: string;
  clienteId: string;

  constructor() {
    this.clienteId = 'id-' + new Date().getTime() + '-' + Math.random().toString(36).substr(2);
    console.log(this.clienteId);
   }

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

        if (!this.mensaje.color 
            && mensajeRecibido.tipo == 'NUEVO_USUARIO'
            && this.mensaje.username == mensajeRecibido.username) {
              this.mensaje.color = mensajeRecibido.color;
        }
        console.log(mensajeRecibido);
        this.listaMensajes.push(mensajeRecibido);
      });

      this.client.subscribe('/chat/escribiendo', (e) => {
        this.escribiendo = e.body;
        setTimeout(() => this.escribiendo = '', 3000);
      });

      this.client.subscribe('/chat/historial/'+this.clienteId, (e) => {
        let historial = JSON.parse(e.body) as Mensaje[];
        this.listaMensajes = historial.map( m => {
          m.fecha = new Date(m.fecha);
          return m;
        }).reverse();
      });
      this.client.publish({destination:'/app/historial', body: this.clienteId});

      this.mensaje.tipo = 'NUEVO_USUARIO';
      this.client.publish({destination: '/app/mensaje', body: JSON.stringify(this.mensaje)});
    }

    this.client.onDisconnect = (frame) => {
      console.log('Desonectados= ' + !this.client.connected + ' : ' + frame);
      this.conectado = false;
      this.mensaje = new Mensaje();
      this.listaMensajes = [];
    }
  }

  conectar(): void {
    this.client.activate();
  }

  desconectar(): void {
    this.mensaje.username = null;
    this.client.deactivate();
  }

  enviarMensaje(): void {
    this.mensaje.tipo = 'MENSAJE';
    this.client.publish({destination: '/app/mensaje', body: JSON.stringify(this.mensaje)});
    this.mensaje.texto = '';
  }

  escribiendoEvento(): void {
    this.client.publish({destination: '/app/escribiendo', body: this.mensaje.username});

  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonBackButton, IonButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonItem, IonLabel, IonRow, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { ConsultaI } from 'src/app/common/models/consultas.model';
import { FirestoreService } from 'src/app/common/services/firestore.service';

@Component({
  selector: 'app-consultas',
  templateUrl: './consultas.component.html',
  styleUrls: ['./consultas.component.scss'],
  standalone:true,
  imports:[CommonModule,FormsModule, IonHeader, IonToolbar, IonButton,IonButtons,IonBackButton,
    IonTitle,IonContent, IonGrid,IonRow,IonLabel,IonCol, IonItem,
  ]
})
export class ConsultasComponent  implements OnInit {

  consultas: ConsultaI[] = [];
  consultasFiltradas: ConsultaI[] = [];
  filtroEmail: string = '';

  constructor(private firestoreService: FirestoreService) {}

  async ngOnInit() {
    await this.cargarConsultas();
  }

  async cargarConsultas() {
    try {
      this.consultas = await this.firestoreService.getConsultas();
      this.consultasFiltradas = [...this.consultas];
      console.log('Consultas cargadas:', this.consultas);
    } catch (error) {
      console.error('Error cargando consultas:', error);
    }
  }

  aplicarFiltros() {
    this.consultasFiltradas = this.consultas.filter((consulta) =>
      consulta.payerEmail.toLowerCase().includes(this.filtroEmail.toLowerCase())
    );
  }

  async eliminarConsulta(consulta: ConsultaI) {
    const confirmacion = window.confirm(
      `¿Estás seguro de que quieres eliminar la consulta de ${consulta.payerEmail}?`
    );
    if (!confirmacion) return;

    try {
      await this.firestoreService.deleteConsulta(consulta.id);
      this.consultas = this.consultas.filter((c) => c.id !== consulta.id);
      this.consultasFiltradas = [...this.consultas];
      console.log(`Consulta eliminada: ${consulta.id}`);
      window.alert('Consulta eliminada con éxito.');
    } catch (error) {
      console.error('Error eliminando la consulta:', error);
      window.alert('Error al eliminar la consulta. Por favor, inténtalo de nuevo.');
    }
  }

}

import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton, IonButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader,
  IonModal, IonRow, IonTitle, IonToolbar
} from '@ionic/angular/standalone';
import { ConsultaI } from 'src/app/common/models/consultas.model';
import { FirestoreService } from 'src/app/common/services/firestore.service';

@Component({
  selector: 'app-consultas',
  templateUrl: './consultas.component.html',
  styleUrls: ['./consultas.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonButton, IonButtons, IonBackButton,
    IonTitle, IonContent, IonGrid, IonRow, IonCol, IonModal
  ]
})
export class ConsultasComponent implements OnInit {

  consultas: ConsultaI[] = [];
  consultasFiltradas: ConsultaI[] = [];
  filtroEmail: string = '';
  filtroDni: string='';
  filtroFecha: string = ''; // Fecha específica en formato dd/mm/yyyy
  filtroMes: string = '';   // Mes y año en formato mm/yyyy
  modalOpen = false;
  comentario: string = '';
  consultaSeleccionada: ConsultaI | null = null;

  constructor(private firestoreService: FirestoreService) {}

  async ngOnInit() {
    await this.cargarConsultas();
  }

  async cargarConsultas() {
    try {
      this.consultas = await this.firestoreService.getConsultas();
      this.consultasFiltradas = [...this.consultas];
    } catch (error) {
      console.error('Error cargando consultas:', error);
    }
  }

  aplicarFiltros() {
    this.consultasFiltradas = this.consultas.filter((consulta) => {
      // Convertir paymentDate a un objeto Date correctamente
      let fechaConsulta = new Date(consulta.paymentDate);
      if (isNaN(fechaConsulta.getTime())) {
        console.error('Fecha inválida en consulta:', consulta.paymentDate);
        return false;
      }



      if (isNaN(fechaConsulta.getTime())) {
        console.error('Fecha inválida:', consulta.paymentDate);
        return false;
      }

      // Aplicar los filtros
      const cumpleEmail = this.filtroEmail
        ? consulta.payerEmail?.toLowerCase().includes(this.filtroEmail.toLowerCase())
        : true;

      const cumpleDni = this.filtroDni
        ? consulta.dni?.includes(this.filtroDni)
        : true;

      const cumpleFecha = this.filtroFecha
        ? this.compararFechasExactas(fechaConsulta, this.filtroFecha)
        : true;

      const cumpleMes = this.filtroMes
        ? this.compararMeses(fechaConsulta, this.filtroMes)
        : true;

      return cumpleEmail && cumpleDni && cumpleFecha && cumpleMes;
    });
  }

// Comparar una fecha exacta (dd/mm/yyyy)
compararFechasExactas(fechaConsulta: Date, filtro: string): boolean {
  const [dia, mes, anio] = filtro.split('/').map(Number);
  if (!dia || !mes || !anio) return false;

  // Convertir la fecha de la consulta a formato yyyy-mm-dd para comparación
  const fechaISO = fechaConsulta.toISOString().split('T')[0]; // yyyy-mm-dd
  const fechaFiltro = new Date(anio, mes - 1, dia).toISOString().split('T')[0];

  return fechaISO === fechaFiltro;
}

// Comparar por mes y año (mm/yyyy)
compararMeses(fechaConsulta: Date, filtro: string): boolean {
  const [mes, anio] = filtro.split('/').map(Number);
  if (!mes || !anio) return false;

  return (
    fechaConsulta.getFullYear() === anio &&
    fechaConsulta.getMonth() + 1 === mes // `getMonth()` devuelve base 0
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
      window.alert('Consulta eliminada con éxito.');
    } catch (error) {
      console.error('Error eliminando la consulta:', error);
      window.alert('Error al eliminar la consulta.');
    }
  }

  abrirModalComentario(consulta: ConsultaI) {
    this.consultaSeleccionada = consulta;
    this.comentario = consulta.comentario || ''; // Cargar el comentario existente
    this.modalOpen = true;
  }

  cerrarModal() {
    this.modalOpen = false;
    this.consultaSeleccionada = null;
  }

  async guardarComentario() {
    if (!this.consultaSeleccionada) return;

    try {
      await this.firestoreService.updateConsulta(this.consultaSeleccionada.id, { comentario: this.comentario });
      this.consultaSeleccionada.comentario = this.comentario; // Actualizar localmente
      this.modalOpen = false;
      window.alert('Comentario actualizado con éxito.');
    } catch (error) {
      console.error('Error guardando comentario:', error);
      window.alert('Error al actualizar el comentario.');
    }
  }

formatFecha(fecha: string | Date): string {
  return formatDate(fecha, 'dd/MM/yyyy', 'en-US');
}


}

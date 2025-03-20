import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonBackButton, IonButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonItem, IonLabel, IonRow, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { FirestoreService } from 'src/app/common/services/firestore.service';

@Component({
  selector: 'app-consultas-manuales',
  templateUrl: './consultas-manuales.component.html',
  styleUrls: ['./consultas-manuales.component.scss'],
  standalone:true,
  imports:[IonHeader,IonToolbar,IonButtons,IonBackButton,IonTitle, IonContent,IonGrid, CommonModule,FormsModule,
    IonRow,IonCol, IonItem,IonLabel, IonButton, ReactiveFormsModule
  ]
})
export class ConsultasManualesComponent implements OnInit {
  consultasManual: any[] = [];

  mostrarFormulario = false;
  nuevaConsulta: Partial<any> = {
    dni: '',
    nombre: '',
    email: '',
    telefono: ''
  };
 consultasFiltradas: any[] = [];
  filtroEmail: string = '';
  filtroDni: string='';
  filtroFecha: string = ''; // Fecha específica en formato dd/mm/yyyy
  filtroMes: string = '';   // Mes y año en formato mm/yyyy

  constructor(private firestoreService: FirestoreService) {}

  async ngOnInit() {
    this.cargarConsultasManual();
  }

  async cargarConsultasManual() {
    try {
      const consultas = await this.firestoreService.getConsultasManual();
      this.consultasManual = consultas.map(consulta => ({
        ...consulta,
        fechaFormateada: this.formatFecha(consulta.fechaCreacion)
      }));

      // Inicializar las consultas filtradas con los datos cargados
      this.consultasFiltradas = [...this.consultasManual];

      // Aplicar filtros al cargar los datos
      this.aplicarFiltros();
    } catch (error) {
      console.error('Error cargando consultas manuales:', error);
    }
  }


  async agregarConsultaManual() {
    try {
        const nuevaConsultaConFecha = {
            ...this.nuevaConsulta,
            fechaCreacion: new Date().toISOString() // Fecha en formato ISO
        };
        await this.firestoreService.addConsultaManual(nuevaConsultaConFecha);
        this.consultasManual.push({
            ...nuevaConsultaConFecha,
            fechaFormateada: this.formatFecha(nuevaConsultaConFecha.fechaCreacion)
        });
        this.nuevaConsulta = { dni: '', nombre: '', email: '', telefono: '' };
    } catch (error) {
        console.error('Error agregando consulta manual:', error);
    }
}



toggleFormulario() {
  this.mostrarFormulario = !this.mostrarFormulario;
}

aplicarFiltros() {
  this.consultasFiltradas = this.consultasManual.filter((consulta) => {
    const fechaConsulta = new Date(consulta.fechaCreacion);

    // Validar fecha
    if (isNaN(fechaConsulta.getTime())) {
      console.error('Fecha inválida:', consulta.fechaCreacion);
      return false;
    }

    // Aplicar los filtros
    const cumpleEmail = this.filtroEmail
      ? consulta.email?.toLowerCase().includes(this.filtroEmail.toLowerCase())
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


compararFechasExactas(fechaConsulta: Date, filtro: string): boolean {
  const [dia, mes, anio] = filtro.split('/').map(Number);
  if (!dia || !mes || !anio) return false;

  const fechaISO = fechaConsulta.toISOString().split('T')[0];
  const fechaFiltro = new Date(anio, mes - 1, dia).toISOString().split('T')[0];

  return fechaISO === fechaFiltro;
}

compararMeses(fechaConsulta: Date, filtro: string): boolean {
  const [mes, anio] = filtro.split('/').map(Number);
  if (!mes || !anio) return false;

  return (
    fechaConsulta.getFullYear() === anio &&
    fechaConsulta.getMonth() + 1 === mes
  );
}


formatFecha(fecha: string | Date): string {
  return formatDate(fecha, 'dd/MM/yyyy', 'en-US');
}


}

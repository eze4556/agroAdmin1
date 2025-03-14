import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FirestoreService } from '../../common/services/firestore.service';
import { Computadoras } from '../../common/models/computadora.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonItem, IonLabel, IonList, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-comp-secciones',
  templateUrl: './comp-secciones.component.html',
  styleUrls: ['./comp-secciones.component.scss'],
  standalone:true,
  imports:[FormsModule, CommonModule, IonHeader,IonToolbar,IonTitle,IonBackButton, IonButtons,
    IonContent,IonCard,IonCardHeader,IonCardContent,IonCardTitle, IonItem,IonLabel,IonButton,IonList,
    IonSpinner
  ]
})
export class CompSeccionesComponent implements OnInit {
  computadora: Computadoras | null = null;
  isLoading: boolean = true;

  softwareArchivos: any[] = [];
  documentosArchivos: any[] = [];
  planosArchivos: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private firestoreService: FirestoreService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        this.computadora = await this.firestoreService.getComputadoraById(id);
        await this.loadArchivos('software');
        await this.loadArchivos('documentos');
        await this.loadArchivos('planos');
      } catch (error) {
        console.error('Error al obtener los detalles de la computadora:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  async loadArchivos(seccion: string) {
    if (!this.computadora?.id) return;

    try {
      const archivos = await this.firestoreService.getArchivos(this.computadora.id, seccion);
      if (seccion === 'software') {
        this.softwareArchivos = archivos;
      } else if (seccion === 'documentos') {
        this.documentosArchivos = archivos;
      } else if (seccion === 'planos') {
        this.planosArchivos = archivos;
      }
    } catch (error) {
      console.error(`Error al cargar archivos de la sección ${seccion}:`, error);
    }
  }

  async onFileSelected(event: Event, seccion: string) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !this.computadora?.id) return;

    const archivo = input.files[0];
    try {
      await this.firestoreService.addArchivo(this.computadora.id, seccion, archivo);
      await this.loadArchivos(seccion);
      console.log(`Archivo subido correctamente a la sección ${seccion}`);
    } catch (error) {
      console.error(`Error al subir archivo a la sección ${seccion}:`, error);
    }
  }
}

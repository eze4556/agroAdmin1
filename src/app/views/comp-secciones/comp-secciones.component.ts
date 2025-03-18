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
  [key: string]: any; // Permite índices dinámicos
  computadora: Computadoras | null = null;
  isLoading: boolean = true;

  manualesArchivos: any[] = [];
  planosArchivos: any[] = [];
  videosArchivos: any[] = [];
  softwareArchivos: any[] = [];
  otrosArchivos: any[] = []
  newVideoUrl: string = '';
  newSoftwareUrl: string = '';
  newVideoNombre: string= '';
  newSoftwareNombre: string='';

  constructor(
    private route: ActivatedRoute,
    private firestoreService: FirestoreService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        this.computadora = await this.firestoreService.getComputadoraById(id);
        await this.loadArchivos('manuales');
        await this.loadArchivos('planos');
        await this.loadArchivos('videos');
        await this.loadArchivos('software');
        await this.loadArchivos('otros');
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
      this[`${seccion}Archivos`] = archivos;
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
    } catch (error) {
      console.error(`Error al subir archivo a la sección ${seccion}:`, error);
    }
  }

  async onAddUrl(seccion: string) {
    let url = '';
    let nombre = '';

    if (seccion === 'videos') {
      url = this.newVideoUrl;
      nombre = this.newVideoNombre;
    } else if (seccion === 'software') {
      url = this.newSoftwareUrl;
      nombre = this.newSoftwareNombre;
    }

    if (!this.computadora?.id) {
      console.error('No se pudo identificar la computadora. Por favor, intente nuevamente.');
      return;
    }

    if (!nombre.trim() || !url.trim()) { // Validar que ambos campos sean obligatorios
      console.error('Por favor, ingrese un nombre y una URL válida.');
      return;
    }

    try {
      await this.firestoreService.addUrlToSection(this.computadora.id, seccion, nombre, url);

      // Limpiar los campos de entrada
      if (seccion === 'videos') {
        this.newVideoUrl = '';
        this.newVideoNombre = '';
      } else if (seccion === 'software') {
        this.newSoftwareUrl = '';
        this.newSoftwareNombre = '';
      }

      await this.loadArchivos(seccion); // Recargar la lista
      console.log(`URL agregada correctamente a la sección ${seccion}`);
    } catch (error) {
      console.error(`Error al agregar URL en la sección ${seccion}:`, error);
    }
  }


  async onDeleteUrl(archivo: any, seccion: string) {
    if (!this.computadora?.id || !archivo.id) return;

    try {
      await this.firestoreService.deleteUrl(this.computadora.id, seccion, archivo.id);
      await this.loadArchivos(seccion);
    } catch (error) {
      console.error(`Error al eliminar archivo en la sección ${seccion}:`, error);
    }
  }





  async onDeleteArchivo(archivo: any, seccion: string) {
    if (!this.computadora?.id) return;

    try {
      if (archivo.url) {
        // Es una URL (videos/software)
        await this.firestoreService.deleteUrl(this.computadora.id, seccion, archivo.id);
      } else {
        // Es un archivo subido (manuales/planos)
        const filePath = archivo.url.split('cloudflarestorage.com/')[1]; // Extraer el path real del archivo
        await this.firestoreService.deleteArchivo(this.computadora.id, seccion, archivo.id, filePath);
      }

      await this.loadArchivos(seccion);
      console.log(`Archivo eliminado en la sección ${seccion}`);
    } catch (error) {
      console.error(`Error al eliminar archivo en la sección ${seccion}:`, error);
    }
  }


}


import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { OverlayEventDetail } from '@ionic/core/components';
import { FirestoreService } from '../../common/services/firestore.service';
import { Computadoras } from '../../common/models/computadora.model';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonItem,
  IonButton,
  IonLabel,
  IonFooter,
  IonModal,
  IonInput,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonIcon,
  IonCardTitle,
  IonCardContent,
  IonToolbar,
  IonTitle,
  IonHeader, IonBackButton, IonButtons,
  IonSelectOption} from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  imports: [ CommonModule, FormsModule, ReactiveFormsModule, IonButtons, IonBackButton,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonIcon,
    IonFooter,
    IonInput,
    IonLabel,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonModal,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonButton, IonSelectOption],
  selector: 'app-computadora',
  templateUrl: './computadora.component.html',
  styleUrls: ['./computadora.component.scss'],
})
export class ComputadoraPage implements OnInit {
  computadoras: Computadoras[] = [];
  nuevaComputadora: Computadoras = { nombre: '', imagen: '', tipo_pc:'' };
  computadoraForm: FormGroup;
  isModalOpen: boolean = false;
  editMode: boolean = false;
  computadoraAEditar: Computadoras | null = null;
  imagenComputadora: File | null = null;

  @ViewChild(IonModal) modal!: IonModal;
  computadora: any;

  constructor(
    private firestoreService: FirestoreService,
    private fb: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private router:Router
  ) {
    this.computadoraForm = this.fb.group({
      id: [''],
      nombre: ['', Validators.required],
      imagen: [''],
      tipo_pc: ['', Validators.required], // Agregado
    });
  }

  async ngOnInit() {
    // this.cargarCategorias();
     this.computadoras = await this.firestoreService.getComputadoras();
    console.log('Computadoras obtenidas en ngOnInit:', this.computadoras);
  }

   cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  confirm() {
    this.modal.dismiss(this.nuevaComputadora, 'confirm');
  }

   onWillDismiss(event: Event) {
    const ev = event as CustomEvent<OverlayEventDetail<string>>;
    if (ev.detail.role === 'confirm') {
      // this.agregarCategoria();
    }
  }

   async cargarComputadoras() {
    try {
      this.computadoras = await this.firestoreService.getComputadoras();
      console.log('Computadoras obtenidas:', this.computadoras);
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('Error cargando computadoras:', error);
    }
  }


  onFileSelected(event: any) {
    this.imagenComputadora = event.target.files[0];
  }

  async agregarComputadora(nombre: string, imagen: File) {
    const nuevaComputadora: Computadoras = { nombre, imagen: '', tipo_pc: '' };
    try {
      const computadoraAgregada = await this.firestoreService.addComputadora(nuevaComputadora, imagen);
      this.computadoras.push(computadoraAgregada); // Asegurarse de que la categoría agregada tenga el id correcto
      console.log('Computadora agregada:', computadoraAgregada);
    } catch (error) {
      console.error('Error agregando la computadora:', error);
    }
  }

async agregarOEditarComputadora() {
    if (this.computadoraForm.invalid) {
      return;
    }

    const computadoraData = this.computadoraForm.value;

    try {
      if (this.editMode && this.computadoraAEditar) {
        computadoraData.id = this.computadoraAEditar.id;
        await this.firestoreService.updateComputadora(computadoraData, this.imagenComputadora);
      } else {
        await this.firestoreService.addComputadora(computadoraData, this.imagenComputadora);
      }
      window.alert('Computadora guardada con éxito.');
    } catch (error) {
      console.error('Error al guardar la computadora:', error);
      window.alert('Error al guardar la computadora. Por favor, inténtalo de nuevo.');
    } finally {
      this.closeModal();
      this.cargarComputadoras();
    }
  }

  async eliminarComputadora(computadora: Computadoras) {
    if (!computadora) {
      console.error('La computadora es null o undefined.');
      return;
    }

    console.log('Computadora a eliminar:', computadora);

    if (!computadora.id) {
      console.error('El id de la computadora es null o undefined.');
      return;
    }

    const confirmacion = window.confirm(`¿Estás seguro de que quieres eliminar la computadora "${computadora.nombre}"? Esta acción no se puede deshacer.`);

    if (confirmacion) {

      try {
        await this.firestoreService.deleteComputadora(computadora);
        this.computadora = this.computadora.filter((c: { id: string; }) => c.id !== computadora.id);
        console.log(`Computadora eliminada: ${computadora.id}`);
        this.cargarComputadoras();
        window.alert('Computadora eliminada con éxito.');
      } catch (error) {
        console.error('Error eliminando la Computadora:', error);
        window.alert('Error al eliminar la Computadora. Por favor, inténtalo de nuevo.');
      } finally {
        this.changeDetectorRef.detectChanges();
      }
    }
  }

  openModal() {
    this.isModalOpen = true;
    this.editMode = false;
    this.computadoraForm.reset();
  }

  closeModal() {
    this.isModalOpen = false;
    this.imagenComputadora = null;
  }

  verDetalles(computadora: Computadoras) {
    // Navegar al componente de detalles con el ID de la computadora
    console.log('Navegar a detalles de la computadora:', computadora);
    // Implementa la navegación (requiere importar Router)
    this.router.navigate(['/computadora-detalle', computadora.id]);
  }

}

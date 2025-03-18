import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonLabel, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { FirestoreService } from 'src/app/common/services/firestore.service';

@Component({
  selector: 'app-precios',
  templateUrl: './precios.component.html',
  styleUrls: ['./precios.component.scss'],
  standalone:true,
  imports:[CommonModule,FormsModule,ReactiveFormsModule, IonCard,IonCardHeader,IonCardTitle,
    IonCardContent,IonSpinner,IonButton, IonHeader,IonToolbar,IonTitle,IonButtons,IonBackButton, IonContent
  ]
})
export class PreciosComponent  implements OnInit {

  precios = {
    consultas: 0,
    suscripciones: 0,
    consultas_tec: 0,
  };
  loading = false;
  updating = false;

  constructor(private preciosService: FirestoreService) {}

  async ngOnInit() {
    await this.loadPrecios();
  }

  // 🔹 Cargar precios desde Firebase
  async loadPrecios() {
    this.loading = true;
    const data = await this.preciosService.getPrecios();
    if (data) {
      this.precios = data;
    }
    this.loading = false;
  }

  // 🔹 Guardar cambios en Firebase
  async savePrecios() {
    this.updating = true;
    try {
      await this.preciosService.updatePrecios(this.precios);
      alert('Precios actualizados correctamente');
    } catch (error) {
      alert('Hubo un error al actualizar los precios');
    }
    this.updating = false;
  }
}

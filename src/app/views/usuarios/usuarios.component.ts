import { FirestoreService } from '../../common/services/firestore.service';
import { UserService } from '../../common/services/auth.service';
import { Component, OnInit } from '@angular/core';
import { UserI } from 'src/app/common/models/users.models';
import { OverlayEventDetail } from '@ionic/core';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { formatDate } from '@angular/common';
import { IonBackButton, IonButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonItem, IonLabel, IonList, IonModal, IonRow, IonSelectOption, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  standalone: true,
  imports: [
CommonModule,
    IonHeader, IonToolbar,IonButtons,IonButton, IonBackButton,IonTitle, IonContent,IonGrid,IonRow,IonCol,IonItem,
    IonLabel, IonModal, IonSelectOption, IonList,
    FormsModule,
    ReactiveFormsModule,
  ],
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
})
export class UsuariosPage implements OnInit {
  usuarios: UserI[] = [];
  mostrarModal = false; // Controla el modal
  subscripcionSeleccionada: any = null; // Contendrá los datos de la suscripción
  usuariosFiltrados: UserI[] = [];
  filtroDNI: string = '';
  filtroActivo: string = 'todos'; // 'todos', 'activos', 'inactivos'

  constructor(
    private firestoreService: FirestoreService,
    private UserService: UserService,
  ) {}

    ngOnInit(): void {
    this.cargarUsuarios();
  }

  async cargarUsuarios() {
    try {
      this.usuarios = await this.UserService.getAllUsers();
      this.usuariosFiltrados = [...this.usuarios]; // Inicializar con todos los usuarios
      console.log('Usuarios cargados:', this.usuarios);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  }


 async eliminarUsuario(usuario: UserI) {
  const confirmacion = window.confirm(`¿Estás seguro de que quieres eliminar al usuario ? Esta acción no se puede deshacer.`);
  if (!confirmacion) return;

  console.log('Eliminando usuario:', usuario);

  try {
    await this.firestoreService.deleteUser(usuario);
    this.usuarios = this.usuarios.filter((u) => u.id !== usuario.id);
    console.log(`Usuario eliminado: ${usuario.id}`);
    window.alert('Usuario eliminado con éxito.');
  } catch (error) {
    console.error('Error eliminando el usuario:', error);
    window.alert('Error al eliminar el usuario. Por favor, inténtalo de nuevo.');
  }
}

async toggleActivo(usuario: UserI) {
  try {
    const nuevoEstado = !usuario.active; // Alternar entre true y false
    await this.UserService.updateUserState(usuario.id, { active: nuevoEstado });
    usuario.active = nuevoEstado; // Actualizar el estado localmente
    console.log(`Usuario ${usuario.nombre} actualizado a ${nuevoEstado ? 'activo' : 'inactivo'}`);
  } catch (error) {
    console.error('Error al cambiar el estado de activo:', error);
    window.alert('No se pudo actualizar el estado del usuario. Inténtalo de nuevo.');
  }
}

async verDatosSubscripcion(subscriptionId: string) {
  try {
    const subscripcion = await this.firestoreService.getSubscripcionPorId(subscriptionId);
    if (subscripcion) {
      this.subscripcionSeleccionada = subscripcion;
      this.mostrarModal = true;
    } else {
      window.alert('No se encontraron datos para esta suscripción.');
    }
  } catch (error) {
    console.error('Error obteniendo los datos de la suscripción:', error);
    window.alert('Error obteniendo los datos de la suscripción.');
  }
}

cerrarModal() {
  this.mostrarModal = false;
  this.subscripcionSeleccionada = null;
}

irChatWhatsApp(telefono: number) {
  if (telefono) {
    const url = `https://wa.me/${telefono}`;
    window.open(url, '_blank');
  } else {
    window.alert('El usuario no tiene un número de teléfono registrado.');
  }
}

getEstadoLegible(status: string): string {
  if (status === 'approved') {
    return 'Pagada';
  } else if (status === 'pending') {
    return 'Pago pendiente';
  } else {
    return 'Estado desconocido';
  }
}

formatFecha(fecha: string | Date): string {
  return formatDate(fecha, 'dd/MM/yyyy', 'en-US');
}

aplicarFiltros() {
  this.usuariosFiltrados = this.usuarios.filter((usuario) => {
    const coincideDNI = this.filtroDNI
      ? usuario.dni.toString().includes(this.filtroDNI)
      : true;

    const coincideActivo =
      this.filtroActivo === 'todos'
        ? true
        : this.filtroActivo === 'activos'
        ? usuario.active
        : !usuario.active;

    return coincideDNI && coincideActivo;
  });
}

}



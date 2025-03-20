import { Routes,RouterModule } from '@angular/router';

import { HomeComponent } from './views/home/home.component';
import { ConsultasManualesComponent } from './views/consultas-manuales/consultas-manuales.component';




export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'usuarios',
    loadComponent: () => import('./views/usuarios/usuarios.component').then((m) => m.UsuariosPage),
  },
  {
    path: 'consultas',
    loadComponent: () => import('./views/consultas/consultas.component').then((m) => m.ConsultasComponent),
  },
  { path: 'consultas-manuales', component: ConsultasManualesComponent },
  {
    path: 'computadora',
    loadComponent: () => import('./views/computadora/computadora.component').then(m => m.ComputadoraPage),
  },
  {
    path: 'precios',
    loadComponent: () => import('./views/precios/precios.component').then((m) => m.PreciosComponent),
  },
  {
    path: 'computadora-detalle/:id',
    loadComponent: () => import('./views/comp-secciones/comp-secciones.component').then((m) => m.CompSeccionesComponent),
  },
];

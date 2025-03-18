import { Routes,RouterModule } from '@angular/router';

import { HomeComponent } from './views/home/home.component';




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


import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  setDoc,
  collectionData,
  startAfter, limit, DocumentData,
  getDoc
} from '@angular/fire/firestore';
import { UserI } from '../models/users.models';

import {
  Storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from '@angular/fire/storage';
import { AngularFirestore } from '@angular/fire/compat/firestore/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';
import { Computadoras } from '../models/computadora.model';
import { ConsultaI } from '../models/consultas.model';
import { environment } from 'src/environments/environment';
import { S3 } from 'aws-sdk';



@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
    private s3: S3;

    constructor(private firestore: Firestore, private storage: Storage) {
    this.s3 = new S3({
      endpoint: 'https://06425c0d4069fc4e0e5d08120f2be6af.r2.cloudflarestorage.com',
      accessKeyId: '6167d0d3527a6151df0a973035dfeceb',
      secretAccessKey: '701a1dab83a687a60ae66beb7d53db06182cd01694e270ea095b695863838585',
      region: 'auto',
      signatureVersion: 'v4',
    });
  }

  private readonly BUCKET_NAME = 'mis-archivos';


private readonly R2_ENDPOINT = 'https://06425c0d4069fc4e0e5d08120f2be6af.r2.cloudflarestorage.com';
  private readonly R2_ACCESS_KEY_ID = '6167d0d3527a6151df0a973035dfeceb';
  private readonly R2_SECRET_ACCESS_KEY = '701a1dab83a687a60ae66beb7d53db06182cd01694e270ea095b695863838585';


 

  // Usuario
  // Eliminar un usuario
  async deleteUser(user: UserI): Promise<void> {
  try {
    if (!user || !user.id) {
      throw new Error('El usuario o el ID de usuario es nulo o no está definido.');
    }
    const userRef = doc(this.firestore, 'usuarios', user.id);
    await deleteDoc(userRef);
    console.log(`Usuario eliminado: ${user.id}`);
  } catch (error) {
    console.error('Error eliminando el usuario:', error);
    throw error;
  }
  }

 async uploadToR2(file: File, path: string): Promise<string> {
    try {
        const params = {
            Bucket: this.BUCKET_NAME,
            Key: path,
            Body: file,
            ACL: 'public-read',
        };

        await this.s3.upload(params).promise();
        console.log('Archivo subido a R2:', path);

        // Generar la URL pública en r2.dev
        return `https://pub-6e5cd7fb9264406c98bf5ce99d4d8879.r2.dev/${path}`;
    } catch (error) {
        console.error('Error subiendo a R2:', error);
        throw error;
    }
}


  // 🔹 Método para eliminar archivos de Cloudflare R2
  async deleteFromR2(path: string): Promise<void> {
    try {
      const params = {
        Bucket: this.BUCKET_NAME,
        Key: path,
      };

      await this.s3.deleteObject(params).promise();
      console.log('Archivo eliminado de R2:', path);
    } catch (error) {
      console.error('Error eliminando archivo de R2:', error);
      throw error;
    }
  }

  // 🔹 Obtener todas las computadoras ordenadas por nombre
  async getComputadoras(): Promise<Computadoras[]> {
    const computadorasSnapshot = await getDocs(
      query(collection(this.firestore, 'computadoras'), orderBy('nombre'))
    );
    return computadorasSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Computadoras[];
  }

  // 🔹 Agregar una nueva computadora con imagen en Cloudflare R2 epico
  async addComputadora(computadora: Computadoras, imagen: File): Promise<Computadoras> {
    try {
      if (imagen) {
        const imageUrl = await this.uploadToR2(imagen, `computadoras/${uuidv4()}-${imagen.name}`);
        computadora.imagen = imageUrl;
      }
      
      const id = uuidv4();
      const docRef = doc(this.firestore, `computadoras/${id}`);
      await setDoc(docRef, { ...computadora, id });

      console.log(`Computadora añadida con id: ${id}`);
      return { ...computadora, id };
    } catch (error) {
      console.error('Error añadiendo la computadora:', error);
      throw error;
    }
  }

  // 🔹 Actualizar una computadora y su imagen en R2 si cambia
  async updateComputadora(computadora: Computadoras, imagen?: File): Promise<void> {
    try {
      if (!computadora.id) {
        throw new Error('La computadora debe tener un id para ser actualizada.');
      }

      if (imagen) {
        if (computadora.imagen) {
          const imagePath = computadora.imagen.split('.com/')[1]; // Extraer la ruta del archivo
          await this.deleteFromR2(imagePath);
        }

        const newImageUrl = await this.uploadToR2(imagen, `computadoras/${uuidv4()}-${imagen.name}`);
        computadora.imagen = newImageUrl;
      }

      const computadoraRef = doc(this.firestore, 'computadoras', computadora.id);
      await updateDoc(computadoraRef, { ...computadora });

      console.log(`Computadora actualizada: ${computadora.id}`);
    } catch (error) {
      console.error('Error actualizando la computadora:', error);
      throw error;
    }
  }

  // 🔹 Eliminar una computadora y su imagen de R2
  async deleteComputadora(computadora: Computadoras): Promise<void> {
    try {
      if (!computadora || !computadora.id) {
        throw new Error('La computadora o el id de la computadora es null o undefined.');
      }

      if (computadora.imagen) {
        const imagePath = computadora.imagen.split('.com/')[1];
        await this.deleteFromR2(imagePath);
      }

      const computadoraRef = doc(this.firestore, 'computadoras', computadora.id);
      await deleteDoc(computadoraRef);

      console.log(`Computadora eliminada: ${computadora.id}`);
    } catch (error) {
      console.error('Error eliminando la computadora:', error);
      throw error;
    }
  }

  // 🔹 Agregar archivos a Cloudflare R2 dentro de una sección de una computadora
  async addArchivo(computadoraId: string, seccion: string, archivo: File) {
    try {
      const filePath = `computadoras/${computadoraId}/${seccion}/${uuidv4()}-${archivo.name}`;
      const fileUrl = await this.uploadToR2(archivo, filePath);

      const docRef = doc(collection(this.firestore, `computadoras/${computadoraId}/${seccion}`));
      await setDoc(docRef, { nombre: archivo.name, url: fileUrl });

      console.log(`Archivo ${archivo.name} añadido a la sección ${seccion}`);
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      throw error;
    }
  }

  // 🔹 Obtener archivos de una computadora por sección
  async getArchivos(computadoraId: string, seccion: string): Promise<any[]> {
    const archivosSnapshot = await getDocs(collection(this.firestore, `computadoras/${computadoraId}/${seccion}`));
    return archivosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // 🔹 Obtener una computadora por ID
  async getComputadoraById(id: string): Promise<Computadoras | null> {
    try {
      const docRef = doc(this.firestore, 'computadoras', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Computadoras;
      } else {
        console.log(`No se encontró una computadora con el ID: ${id}`);
        return null;
      }
    } catch (error) {
      console.error('Error al obtener la computadora por ID:', error);
      throw error;
    }
  }




  async getSubscripcionPorId(subscriptionId: string): Promise<any> {
    try {
      const subscripcionSnapshot = await getDocs(
        query(
          collection(this.firestore, 'subscriptions'),
          where('subscriptionId', '==', subscriptionId)
        )
      );
      if (!subscripcionSnapshot.empty) {
        return subscripcionSnapshot.docs[0].data();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error obteniendo la suscripción:', error);
      throw error;
    }
  }

  async getConsultas(): Promise<ConsultaI[]> {
    const consultasSnapshot = await getDocs(collection(this.firestore, 'consultas'));
    return consultasSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConsultaI[];
  }

  async deleteConsulta(id: string): Promise<void> {
    try {
      const consultaRef = doc(this.firestore, 'consultas', id);
      await deleteDoc(consultaRef);
      console.log(`Consulta eliminada: ${id}`);
    } catch (error) {
      console.error('Error eliminando consulta:', error);
      throw error;
    }
  }

  async addConsulta(consulta: ConsultaI): Promise<void> {
    try {
      const id = uuidv4();
      const consultaRef = doc(this.firestore, 'consultas', id);
      await setDoc(consultaRef, { ...consulta, id });
      console.log(`Consulta añadida con id: ${id}`);
    } catch (error) {
      console.error('Error añadiendo consulta:', error);
      throw error;
    }
  }
}





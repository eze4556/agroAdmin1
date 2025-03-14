import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { UserI } from '../models/users.models';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root'
})
export class UserService {
   private usersCollection: AngularFirestoreCollection<UserI>;
  private pendingUsersCollection: AngularFirestoreCollection<any>;

  private userSubject: BehaviorSubject<UserI | null>;
  public user$: Observable<UserI | null>;

constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore) {
    this.usersCollection = this.afs.collection<UserI>('usuarios');
    this.userSubject = new BehaviorSubject<UserI | null>(null);
    this.user$ = this.userSubject.asObservable();

    this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.afs.collection<UserI>('usuarios').doc(user.uid).valueChanges();
        } else {
          return new Observable<UserI | null>(observer => observer.next(null));
        }
      })
    ).subscribe(userData => this.userSubject.next(userData));
  }

  // Método para eliminar un usuario de Firebase Authentication y Firestore
  async deleteUser(userId: string): Promise<void> {
    try {
      // Eliminar usuario de Firebase Authentication
      const user = await this.afAuth.currentUser;
      if (user && user.uid === userId) {
        await user.delete();
        console.log('Usuario eliminado de Firebase Authentication');
      }

      // Eliminar documento del usuario en Firestore
      const userDoc = this.usersCollection.doc(userId);
      const userDocSnapshot = await userDoc.get().toPromise();
      if (userDocSnapshot.exists) {
        await userDoc.delete();
        console.log('Usuario eliminado de Firestore');
      }
    } catch (error) {
      console.error('Error eliminando usuario:', error);
    }
  }

  // Método para eliminar un usuario pendiente de Firestore
  async deletePendingUser(userId: string): Promise<void> {
    try {
      const pendingUserDoc = this.pendingUsersCollection.doc(userId);
      const pendingUserDocSnapshot = await pendingUserDoc.get().toPromise();
      if (pendingUserDocSnapshot.exists) {
        await pendingUserDoc.delete();
        console.log(`Usuario pendiente eliminado de Firestore: ${userId}`);
      } else {
        console.log(`El usuario pendiente no existe en Firestore: ${userId}`);
      }
    } catch (error) {
      console.error('Error eliminando usuario pendiente:', error);
    }
  }
  // Método para obtener todos los usuarios de la colección 'users'
  async getAllUsers(): Promise<UserI[]> {
    try {
      const userRecords = await this.afs.collection<UserI>('usuarios').get().toPromise();
      const users = userRecords.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserI[];
      console.log('Usuarios obtenidos:', users);
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }


  // Método para obtener todos los usuarios pendientes de la colección 'pendingUsers'
  async getPendingUsers(): Promise<any[]> {
    try {
      const pendingRecords = await this.pendingUsersCollection.get().toPromise();
      const pendingUsers = pendingRecords.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Usuarios pendientes:', pendingUsers);
      return pendingUsers;
    } catch (error) {
      console.error('Error fetching pending users:', error);
      return [];
    }
  }

  // Método para aprobar un usuario y moverlo de 'pendingUsers' a 'users'
async approveUser(userId: string): Promise<void> {
  try {
    // Obtener el documento del usuario pendiente
    const pendingUserDoc = this.pendingUsersCollection.doc(userId);
    const userData = await pendingUserDoc.get().toPromise();

    if (userData.exists) {
      const user = userData.data() as UserI;

      // Agregar el campo `approved` en el documento del usuario
      // user.approved = true;

      // Mover el usuario a la colección 'users'
      await this.usersCollection.doc(userId).set(user);

      // Eliminar el usuario de la colección 'pendingUsers'
      await pendingUserDoc.delete();

      console.log('Usuario aprobado y movido a la colección de usuarios.');
    } else {
      console.log('El usuario pendiente no existe.');
    }
  } catch (error) {
    console.error('Error approving user:', error);
  }
}

async updateUserState(userId: string, updates: Partial<UserI>): Promise<void> {
  try {
    await this.usersCollection.doc(userId).update(updates);
    console.log(`Estado del usuario ${userId} actualizado en Firestore.`);
  } catch (error) {
    console.error('Error actualizando el estado del usuario:', error);
    throw error;
  }
}


}

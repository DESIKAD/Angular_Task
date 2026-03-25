import { inject, Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth : Auth =inject(Auth)

register(email:string,password:string){
  return createUserWithEmailAndPassword (this.auth, email,password)
}
signin(email:string,password:string){
  return signInWithEmailAndPassword(this.auth,email,password)
}
logout(){
  return signOut(this.auth)
}
}

// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://127.0.0.1:8000';  // your backend URL

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
  const body = {
    username: username,
    password: password
  };

  return this.http.post(`${this.baseUrl}/login`, body).pipe(
    tap((res: any) => {
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('username', res.full_name);  
    })
  );
}


  signup(fullName: string, email: string, password: string) {
  return this.http.post(`${this.baseUrl}/signup`, {
    full_name: fullName,
    username: email,
    password: password
  });
}

  logout() {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}

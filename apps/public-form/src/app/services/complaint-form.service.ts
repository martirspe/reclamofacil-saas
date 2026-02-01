import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// --- IMPORTS - INTERFACES
import { ComplaintForm } from '../interfaces/complaint-form.interface';
import { TENANT_SLUG } from '../core/config/tenant.signal';

@Injectable({ providedIn: 'root' })
export class ComplaintFormService {
  private readonly api = `${environment.API_URL_CLAIM}/api/complaint-books`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene el primer libro de reclamaciones del tenant (ruta pública)
   * Envía el tenant slug en el header x-tenant
   */
  getActiveComplaintBook(): Observable<ComplaintForm> {
    const tenantSlug = TENANT_SLUG();
    const headers = new HttpHeaders({
      'x-tenant': tenantSlug || 'default'
    });
    return this.http.get<ComplaintForm>(`${this.api}/public/active`, { headers });
  }

  getAll(branchId?: number): Observable<ComplaintForm[]> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId.toString());
    return this.http.get<ComplaintForm[]>(this.api, { params });
  }

  getById(id: number): Observable<ComplaintForm> {
    return this.http.get<ComplaintForm>(`${this.api}/${id}`);
  }

  create(book: Partial<ComplaintForm>): Observable<ComplaintForm> {
    return this.http.post<ComplaintForm>(this.api, book);
  }

  update(id: number, book: Partial<ComplaintForm>): Observable<ComplaintForm> {
    return this.http.put<ComplaintForm>(`${this.api}/${id}`, book);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}

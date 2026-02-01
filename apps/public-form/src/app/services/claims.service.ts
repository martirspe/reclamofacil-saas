import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// --- IMPORTS - INTERFACES
import { DocumentType } from '../interfaces/document-type.interface';
import { Claim, ConsumptionType, ClaimType, Currency } from '@shared/models';

@Injectable({ providedIn: 'root' })
export class ClaimsService {

  private readonly api = `${environment.API_URL_CLAIM}/api`;

  constructor(private http: HttpClient) { }

  // --- CLAIMS (PUBLIC - NO AUTHENTICATION)
  
  /**
   * Public complaint form (no authentication)
   */
  createPublicClaim(tenantSlug: string, payload: FormData): Observable<Claim> {
    return this.http.post<Claim>(
      `${this.api}/public/${tenantSlug}/claims`,
      payload
    );
  }

  /**
   * Public: Get claim by code for tracking
   * Code pattern: REC-YYYY-###### or QUE-YYYY-######
   */
  getPublicClaimByCode(tenantSlug: string, code: string): Observable<any> {
    return this.http.get<any>(
      `${this.api}/public/${tenantSlug}/claims/${encodeURIComponent(code)}`
    );
  }

  // --- CATALOGS (PUBLIC)
  getDocumentTypes(): Observable<DocumentType[]> {
    return this.http.get<DocumentType[]>(`${this.api}/document_types`);
  }

  getConsumptionTypes(): Observable<ConsumptionType[]> {
    return this.http.get<ConsumptionType[]>(`${this.api}/consumption_types`);
  }

  getClaimTypes(): Observable<ClaimType[]> {
    return this.http.get<ClaimType[]>(`${this.api}/claim_types`);
  }

  getCurrencies(): Observable<Currency[]> {
    return this.http.get<Currency[]>(`${this.api}/currencies`);
  }
}

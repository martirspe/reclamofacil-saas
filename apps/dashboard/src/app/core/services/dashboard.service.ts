import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';

export interface DashboardStats {
  rucsRegistered: number;
  rucsGrowth: number;
  booksCreated: number;
  booksGrowth: number;
  totalClaims: number;
  claimsGrowth: number;
  solvedClaims: number;
  solvedClaimsGrowth: number;
}

export interface ClaimStatusData {
  dateRange: string;
  resolved: number;
  pending: number;
}

export interface ClaimPriorityData {
  critical: number;
  high: number;
  normal: number;
}

export interface RecentClaim {
  id: string;
  code: string;
  client: string;
  book: string;
  date: string;
  status: 'resolved' | 'pending' | 'in-progress';
}

export interface DashboardData {
  stats: DashboardStats;
  claimStatusData: ClaimStatusData[];
  claimPriorityData: ClaimPriorityData;
  recentClaims: RecentClaim[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = '/api/dashboard';
  private readonly useMockData = true; // Cambiar a false cuando la API esté lista

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los datos del dashboard
   */
  getDashboardData(): Observable<DashboardData> {
    if (this.useMockData) {
      return of(this.getMockData()).pipe(delay(500)); // Simula latencia de red
    }
    return this.http.get<DashboardData>(`${this.apiUrl}/data`).pipe(
      catchError(error => {
        console.error('Error al obtener datos del dashboard:', error);
        return of(this.getMockData());
      })
    );
  }

  /**
   * Obtiene las estadísticas del dashboard
   */
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`).pipe(
      catchError(error => {
        console.error('Error al obtener estadísticas:', error);
        return of(this.getMockStats());
      })
    );
  }

  /**
   * Obtiene los datos de estado de reclamos
   */
  getClaimStatusData(): Observable<ClaimStatusData[]> {
    return this.http.get<ClaimStatusData[]>(`${this.apiUrl}/claims/status`).pipe(
      catchError(error => {
        console.error('Error al obtener estado de reclamos:', error);
        return of(this.getMockClaimStatusData());
      })
    );
  }

  /**
   * Obtiene los datos de prioridad de reclamos
   */
  getClaimPriorityData(): Observable<ClaimPriorityData> {
    return this.http.get<ClaimPriorityData>(`${this.apiUrl}/claims/priority`).pipe(
      catchError(error => {
        console.error('Error al obtener prioridad de reclamos:', error);
        return of(this.getMockClaimPriorityData());
      })
    );
  }

  /**
   * Obtiene los reclamos recientes
   */
  getRecentClaims(limit: number = 10): Observable<RecentClaim[]> {
    return this.http.get<RecentClaim[]>(`${this.apiUrl}/claims/recent`, {
      params: { limit: limit.toString() }
    }).pipe(
      catchError(error => {
        console.error('Error al obtener reclamos recientes:', error);
        return of(this.getMockRecentClaims());
      })
    );
  }

  // Mock data methods for development
  private getMockStats(): DashboardStats {
    return {
      rucsRegistered: 39,
      rucsGrowth: 34.5,
      booksCreated: 66,
      booksGrowth: 112.0,
      totalClaims: 30,
      claimsGrowth: 71.0,
      solvedClaims: 25,
      solvedClaimsGrowth: -18.9
    };
  }

  private getMockClaimStatusData(): ClaimStatusData[] {
    return [
      { dateRange: '1-7 dic', resolved: 2, pending: 0 },
      { dateRange: '8-21 dic', resolved: 4, pending: 0 },
      { dateRange: '22-4 ene', resolved: 5, pending: 0 },
      { dateRange: '5-11 ene', resolved: 1, pending: 0 },
      { dateRange: '12-18 ene', resolved: 6, pending: 0 },
      { dateRange: '19-25 ene', resolved: 4, pending: 1 },
      { dateRange: '26-1 feb', resolved: 3, pending: 1 }
    ];
  }

  private getMockClaimPriorityData(): ClaimPriorityData {
    return {
      critical: 1,
      high: 1,
      normal: 3
    };
  }

  private getMockRecentClaims(): RecentClaim[] {
    return [
      {
        id: '1',
        code: 'REC-001',
        client: 'LUCERO SARABIA',
        book: 'Libro 1',
        date: '27/01/2025',
        status: 'resolved'
      },
      {
        id: '2',
        code: 'REC-002',
        client: 'Cliente 2',
        book: 'Libro 2',
        date: '26/01/2025',
        status: 'pending'
      },
      {
        id: '3',
        code: 'REC-003',
        client: 'Cliente 3',
        book: 'Libro 3',
        date: '25/01/2025',
        status: 'in-progress'
      }
    ];
  }

  private getMockData(): DashboardData {
    return {
      stats: this.getMockStats(),
      claimStatusData: this.getMockClaimStatusData(),
      claimPriorityData: this.getMockClaimPriorityData(),
      recentClaims: this.getMockRecentClaims()
    };
  }
}

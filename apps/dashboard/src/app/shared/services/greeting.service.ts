import { inject, Injectable, computed } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

type SafeAuthUser = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
};

@Injectable({ providedIn: 'root' })
export class GreetingService {
  private readonly auth = inject(AuthService);

  userName = computed(() => {
    const user = this.auth.user() as SafeAuthUser | null;
    const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();
    return fullName || user?.email || 'Usuario';
  });

  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    else if (hour < 18) return 'Buenas tardes';
    else return 'Buenas noches';
  });
}

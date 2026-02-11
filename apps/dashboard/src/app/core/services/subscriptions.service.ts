import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export type PlanFeatures = {
  basicReporting: boolean;
  claimTracking: boolean;
  documentUpload: boolean;
  emailNotifications: boolean;
  apiAccess: boolean;
  customBranding: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  sso: boolean;
  webhooks: boolean;
  dataExport: boolean;
  customIntegrations: boolean;
};

export type PlanDetails = {
  name: string;
  billingCycle: string;
  features: PlanFeatures;
};

export type SubscriptionRecord = {
  plan_name: string;
  status: string;
  billing_cycle_start: string | null;
  billing_cycle_end: string | null;
  payment_provider: string | null;
  payment_provider_id: string | null;
  auto_renew: boolean;
  cancelled_at: string | null;
  cancellation_reason: string | null;
};

export type UsageData = {
  claims_this_month: number;
  claims_limit: number | string;
  users: number;
  users_limit: number | string;
};

export type UsageWarnings = {
  claims_approaching_limit: boolean;
  users_approaching_limit: boolean;
};

type SubscriptionResponse = {
  subscription?: SubscriptionRecord | null;
  plan_details?: PlanDetails;
  plan_name?: string;
};

type UsageResponse = {
  usage: UsageData;
  warnings: UsageWarnings;
};

export type SubscriptionOverview = {
  subscription: SubscriptionRecord;
  plan_details: PlanDetails;
  usage: UsageData;
  warnings: UsageWarnings;
};

@Injectable({ providedIn: 'root' })
export class SubscriptionsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  createDefaultSubscription(planName = 'free'): SubscriptionRecord {
    return {
      plan_name: planName,
      status: 'active',
      billing_cycle_start: null,
      billing_cycle_end: null,
      payment_provider: null,
      payment_provider_id: null,
      auto_renew: true,
      cancelled_at: null,
      cancellation_reason: null
    };
  }

  createDefaultPlanDetails(): PlanDetails {
    return {
      name: 'Free',
      billingCycle: 'monthly',
      features: {
        basicReporting: false,
        claimTracking: true,
        documentUpload: true,
        emailNotifications: false,
        apiAccess: false,
        customBranding: false,
        advancedAnalytics: false,
        prioritySupport: false,
        sso: false,
        webhooks: false,
        dataExport: false,
        customIntegrations: false
      }
    };
  }

  createDefaultUsage(): UsageData {
    return {
      claims_this_month: 0,
      claims_limit: 0,
      users: 0,
      users_limit: 0
    };
  }

  createDefaultWarnings(): UsageWarnings {
    return {
      claims_approaching_limit: false,
      users_approaching_limit: false
    };
  }

  loadOverview(): Observable<SubscriptionOverview> {
    return forkJoin({
      subscription: this.loadSubscription(),
      usage: this.loadUsage()
    }).pipe(
      map(({ subscription, usage }) => {
        const planName = subscription?.plan_name || subscription?.subscription?.plan_name || 'free';
        const resolvedSubscription = subscription?.subscription || this.createDefaultSubscription(planName);
        const resolvedPlanDetails = subscription?.plan_details || this.createDefaultPlanDetails();
        const resolvedUsage = usage?.usage || this.createDefaultUsage();
        const resolvedWarnings = usage?.warnings || this.createDefaultWarnings();

        return {
          subscription: resolvedSubscription,
          plan_details: resolvedPlanDetails,
          usage: resolvedUsage,
          warnings: resolvedWarnings
        };
      })
    );
  }

  private loadSubscription(): Observable<SubscriptionResponse | null> {
    const url = this.getBillingUrl('subscription');
    if (!url) {
      return of({
        subscription: this.createDefaultSubscription(),
        plan_details: this.createDefaultPlanDetails(),
        plan_name: 'free'
      });
    }

    return this.http.get<SubscriptionResponse>(url).pipe(
      map((response) => ({
        subscription: response.subscription || null,
        plan_details: response.plan_details,
        plan_name: response.plan_name
      })),
      catchError(() =>
        of({
          subscription: this.createDefaultSubscription(),
          plan_details: this.createDefaultPlanDetails(),
          plan_name: 'free'
        })
      )
    );
  }

  private loadUsage(): Observable<UsageResponse | null> {
    const url = this.getBillingUrl('usage');
    if (!url) {
      return of({
        usage: this.createDefaultUsage(),
        warnings: this.createDefaultWarnings()
      });
    }

    return this.http.get<UsageResponse>(url).pipe(
      map((response) => ({
        usage: response.usage,
        warnings: response.warnings
      })),
      catchError(() =>
        of({
          usage: this.createDefaultUsage(),
          warnings: this.createDefaultWarnings()
        })
      )
    );
  }

  private getBillingUrl(path: 'subscription' | 'usage'): string | null {
    const slug = this.auth.getTenantSlug();
    if (!slug) {
      return null;
    }
    return `${environment.API_URL}/api/tenants/${slug}/billing/${path}`;
  }
}

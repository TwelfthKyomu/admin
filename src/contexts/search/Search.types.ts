import type { Currency } from '@/shared/constants/currency';

export interface SearchOrderHit {
    id: string;
    projectId: string;
    customerName: string | null;
    customerPhone: string | null;
    totalAmount: number;
    currency: Currency;
}

export interface SearchClientHit {
    id: string;
    projectId: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    email: string | null;
}

export interface SearchProductHit {
    id: string;
    projectId: string;
    name: string;
    sku: string;
}

export interface SearchResults {
    orders: SearchOrderHit[];
    clients: SearchClientHit[];
    products: SearchProductHit[];
}

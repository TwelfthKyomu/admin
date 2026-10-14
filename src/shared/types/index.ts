export interface Option<T = string> {
    value: T;
    label: string;
    keywords?: string[];
    disabled?: boolean;
}

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

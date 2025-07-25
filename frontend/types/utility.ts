export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E };

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncData<T, E = Error> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E };

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T, E = Error> {
  data: T | null;
  loading: boolean;
  error: E | null;
  status: LoadingState;
}

export type KeyOf<T> = keyof T;

export type ValueOf<T> = T[keyof T];

export type NonEmptyArray<T> = [T, ...T[]];

export type Flatten<T> = T extends Array<infer U> ? U : T;

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export type ExtractArrayType<T> = T extends (infer U)[] ? U : never;

export type FormErrors<T> = {
  [K in keyof T]?: T[K] extends object ? FormErrors<T[K]> : string;
};

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

export interface FilterConfig<T> {
  field: keyof T;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

export type Constructor<T = {}> = new (...args: any[]) => T;

export type Mixin<T extends Constructor> = InstanceType<T>;

export type EventHandler<T = any> = (event: T) => void;

export type PromiseType<T> = T extends Promise<infer P> ? P : never;

export type ReturnTypeAsync<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R> ? R : never;

export interface StoreState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;
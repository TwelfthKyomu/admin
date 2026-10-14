type Flat<T> = { [K in keyof T]: T[K] } & {};

export type NullToOptional<T> = T extends Date
    ? T
    : T extends (infer Item)[]
      ? NullToOptional<Item>[]
      : T extends object
        ? Flat<
              {
                  [K in keyof T as null extends T[K]
                      ? K
                      : never]?: NullToOptional<Exclude<T[K], null>>;
              } & {
                  [K in keyof T as null extends T[K]
                      ? never
                      : K]: NullToOptional<T[K]>;
              }
          >
        : T;

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null) return false;

    const prototype = Object.getPrototypeOf(value);

    return prototype === Object.prototype || prototype === null;
}

function dropNulls(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(dropNulls);
    if (!isPlainObject(value)) return value;

    const result: Record<string, unknown> = {};

    for (const [key, field] of Object.entries(value)) {
        if (field !== null) result[key] = dropNulls(field);
    }

    return result;
}

export function nullToOptional<T>(value: T): NullToOptional<T> {
    return dropNulls(value) as NullToOptional<T>;
}

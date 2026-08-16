// Narrow override for ONE export of @rodrigo-barraza/utilities-library/rate.
//
// This is NOT the "untyped package" placeholder the other shims here were —
// those are gone, and every other subpath now resolves the library's own
// published types. This file exists because the library's `debounce`/`throttle`
// constraint is unsatisfiable in practice:
//
//   export declare function debounce<T extends (...parameters: unknown[]) => unknown>(...)
//
// Parameters are contravariant, so `unknown` is not assignable to a concrete
// parameter type and an ordinary callback like `(value: string) => void` is
// rejected. `never[]` is the constraint that admits any function.
//
// Delete this file once utilities-library ships the corrected constraint.
declare module "@rodrigo-barraza/utilities-library/rate" {
  export function debounce<T extends (...args: never[]) => unknown>(
    func: T,
    wait: number,
    options?: { leading?: boolean },
  ): T & { cancel: () => void };

  export function throttle<T extends (...args: never[]) => unknown>(
    func: T,
    wait: number,
    options?: { leading?: boolean; trailing?: boolean },
  ): T & { cancel: () => void };
}

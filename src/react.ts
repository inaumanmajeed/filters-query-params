import * as React from "react";
import { z } from "zod";
import { buildUrl, mergeFilters, parseQuery, resetFilters } from "./core";
import type { AnySchema, BuildOptions, ParseOptions } from "./types";

export interface UseFiltersOptions<TSchema extends AnySchema> {
  parse?: ParseOptions<TSchema>;
  build?: BuildOptions<TSchema>;
  basePath?: string;
}

/**
 * Generic hook for managing URL-synced filters with any router
 * @param schema - Zod schema for filter validation
 * @param getSearch - Function to get current search string
 * @param pushUrl - Function to navigate to new URL
 * @param opts - Options for parsing and building
 * @returns Filter state and actions
 */
export function useFiltersGeneric<TSchema extends AnySchema>(
  schema: TSchema,
  getSearch: () => string,
  pushUrl: (url: string) => void,
  opts: UseFiltersOptions<TSchema> = {}
) {
  const basePath =
    opts.basePath ||
    (typeof window !== "undefined" ? window.location.pathname : "/");
  const search = getSearch();
  const filters = React.useMemo(
    () =>
      parseQuery(schema, search, {
        coerceTypes: true,
        dropEmpty: true,
        trimStrings: true,
        stripUnknown: true,
        ...opts.parse,
      }),
    [schema, search, opts.parse?.arrayFormat] // basic deps
  );

  const setFilters = React.useCallback(
    (next: Partial<z.infer<TSchema>>) => {
      const merged = mergeFilters<TSchema>(filters, next, { dropEmpty: true });
      const url = buildUrl(basePath, schema, merged, {
        encodeDate: true,
        dropEmpty: true,
        trimStrings: true,
        stripUnknown: true,
        ...opts.build,
      });
      pushUrl(url);
    },
    [filters, basePath, schema, pushUrl, opts.build]
  );

  const reset = React.useCallback(
    (defaults?: Partial<z.infer<TSchema>>) => {
      const value = resetFilters(schema, defaults);
      const url = buildUrl(basePath, schema, value, {
        encodeDate: true,
        dropEmpty: true,
        trimStrings: true,
        stripUnknown: true,
        ...opts.build,
      });
      pushUrl(url);
    },
    [basePath, schema, pushUrl, opts.build]
  );

  return { filters, setFilters, reset } as const;
}

/**
 * Hook for managing filters with Next.js App Router
 * Uses useSearchParams and useRouter from next/navigation
 * @param schema - Zod schema for filter validation
 * @param opts - Options for parsing and building
 * @returns Filter state and actions
 */
export function useNextAppFilters<TSchema extends AnySchema>(
  schema: TSchema,
  opts: UseFiltersOptions<TSchema> = {}
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nextNav = require("next/navigation") as any;
    const router = nextNav.useRouter();
    const searchParams = nextNav.useSearchParams();
    return useFiltersGeneric(
      schema,
      () => `?${searchParams.toString()}`,
      (url) => router.push(url),
      opts
    );
  } catch (error) {
    throw new Error(
      "useNextAppFilters requires 'next/navigation' to be installed. Make sure you're using Next.js 13+ with App Router."
    );
  }
}

/**
 * Hook for managing filters with Next.js Pages Router
 * Uses useRouter from next/router
 * @param schema - Zod schema for filter validation
 * @param opts - Options for parsing and building
 * @returns Filter state and actions
 */
export function useNextPagesFilters<TSchema extends AnySchema>(
  schema: TSchema,
  opts: UseFiltersOptions<TSchema> = {}
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nextRouter = require("next/router") as any;
    const router = nextRouter.useRouter();
    return useFiltersGeneric(
      schema,
      () => (typeof window !== "undefined" ? window.location.search : ""),
      (url) => router.push(url, undefined, { shallow: true } as any),
      { basePath: router.pathname, ...opts }
    );
  } catch (error) {
    throw new Error(
      "useNextPagesFilters requires 'next/router' to be installed. Make sure you're using Next.js with Pages Router."
    );
  }
}

/**
 * Hook for managing filters with React Router v6
 * Uses useLocation and useNavigate from react-router-dom
 * @param schema - Zod schema for filter validation
 * @param opts - Options for parsing and building
 * @returns Filter state and actions
 */
export function useReactRouterFilters<TSchema extends AnySchema>(
  schema: TSchema,
  opts: UseFiltersOptions<TSchema> = {}
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rr = require("react-router-dom") as any;
    const navigate = rr.useNavigate();
    const location = rr.useLocation();
    return useFiltersGeneric(
      schema,
      () => location.search,
      (url) => navigate(url, { replace: false } as any),
      { basePath: location.pathname, ...opts }
    );
  } catch (error) {
    throw new Error(
      "useReactRouterFilters requires 'react-router-dom' to be installed. Make sure you're using React Router v6."
    );
  }
}

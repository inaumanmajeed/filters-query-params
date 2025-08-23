import * as React from "react";
import { z } from "zod";
import { buildUrl, mergeFilters, parseQuery, resetFilters } from "./core";
import type { AnySchema, BuildOptions, ParseOptions } from "./types";

export interface UseFiltersOptions<TSchema extends AnySchema> {
  parse?: ParseOptions<TSchema>;
  build?: BuildOptions<TSchema>;
  basePath?: string;
}

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
    [schema, search, opts.parse?.arrayFormat]
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

export function useNextAppFilters<TSchema extends AnySchema>(
  schema: TSchema,
  opts: UseFiltersOptions<TSchema> = {}
) {
  try {

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

export function useNextPagesFilters<TSchema extends AnySchema>(
  schema: TSchema,
  opts: UseFiltersOptions<TSchema> = {}
) {
  try {

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

export function useReactRouterFilters<TSchema extends AnySchema>(
  schema: TSchema,
  opts: UseFiltersOptions<TSchema> = {}
) {
  try {

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
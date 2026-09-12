/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as generate from "../generate.js";
import type * as lib_boardFallback from "../lib/boardFallback.js";
import type * as lib_contentPolicy from "../lib/contentPolicy.js";
import type * as lib_fal from "../lib/fal.js";
import type * as lib_placeholderStill from "../lib/placeholderStill.js";
import type * as lib_xai from "../lib/xai.js";
import type * as media from "../media.js";
import type * as projects from "../projects.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  generate: typeof generate;
  "lib/boardFallback": typeof lib_boardFallback;
  "lib/contentPolicy": typeof lib_contentPolicy;
  "lib/fal": typeof lib_fal;
  "lib/placeholderStill": typeof lib_placeholderStill;
  "lib/xai": typeof lib_xai;
  media: typeof media;
  projects: typeof projects;
  validators: typeof validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

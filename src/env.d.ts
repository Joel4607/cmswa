/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type ENV = {
  DB?: D1Database;
};

type Runtime = import("@astrojs/cloudflare").AdvancedRuntime<ENV>;

declare namespace App {
  interface Locals extends Runtime {}
}

import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

/**
 * OpenNext adapter config.
 *
 * The defaults are deliberate: Cadence reads and writes all of its data from
 * the browser via the Firebase Web SDK, so there is no server-side cache to
 * configure (no incremental cache, tag cache, or queue). If server-rendered
 * data fetching is added later, wire an R2 or KV incremental cache here.
 *
 * @see https://opennext.js.org/cloudflare/caching
 */
export default defineCloudflareConfig();

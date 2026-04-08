#!/usr/bin/env node
/**
 * LP Core Flow Audit — pre/post migration baseline capture.
 *
 * Captures screenshots of key public routes at desktop + mobile viewports.
 * Used by the React 19 + Tailwind 4 migration plan to verify zero visual
 * regression. See `docs/planning/lp-react19-tailwind4-migration.md`.
 *
 * Usage:
 *   node tests/core-flow-audit.mjs pre-migration    # before any changes
 *   node tests/core-flow-audit.mjs post-migration   # after Tailwind 4
 *
 * Requirements:
 *   - LP dev server running at http://localhost:8080
 *   - Playwright installed (it's in package.json as @playwright/test)
 *
 * Output:
 *   tests/baselines/{label}/{route-slug}-{viewport}.png
 */

import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const LABEL = process.argv[2] || 'pre-migration';
const BASE_URL = process.env.LP_BASE_URL || 'http://localhost:8080';
const OUTPUT_DIR = resolve(REPO_ROOT, 'tests', 'baselines', LABEL);

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile',  width:  375, height: 812 },
];

// Public routes — no auth needed. Stable collection: prof-g-media.
const ROUTES = [
  { slug: 'landing',              path: '/' },
  { slug: 'stories',              path: '/stories' },
  { slug: 'profiles',             path: '/profiles' },
  { slug: 'feed',                 path: '/feed' },
  { slug: 'collection-detail',    path: '/public/collections/prof-g-media' },
  { slug: 'lifeline-detail',      path: '/public/collections/prof-g-media/lifelines/scotts-life-lessons?from=collection' },
  { slug: 'collection-feed',      path: '/public/collections/prof-g-media/feed' },
  { slug: 'collection-stories',   path: '/public/collections/prof-g-media/stories' },
  { slug: 'collection-profiles',  path: '/public/collections/prof-g-media/profiles' },
  { slug: 'admin-login',          path: '/admin/login' },
];

async function run() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  console.log(`[core-flow-audit] label=${LABEL}`);
  console.log(`[core-flow-audit] output=${OUTPUT_DIR}`);
  console.log(`[core-flow-audit] routes=${ROUTES.length}  viewports=${VIEWPORTS.length}`);

  const browser = await chromium.launch({ headless: true });
  const results = [];
  let failures = 0;

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // Surface errors but don't crash the run
    const errors = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text().slice(0, 200)}`);
    });

    for (const route of ROUTES) {
      const url = `${BASE_URL}${route.path}`;
      const filename = `${route.slug}-${viewport.name}.png`;
      const outPath = resolve(OUTPUT_DIR, filename);
      const routeErrors = [];
      const errorWatcher = (msg) => routeErrors.push(msg);
      errors.length = 0;

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
        // Small settle for any async color scheme / data fetches
        await page.waitForTimeout(800);
        await page.screenshot({ path: outPath, fullPage: false });
        console.log(`  ✓ ${viewport.name.padEnd(7)} ${route.slug.padEnd(24)} ${url}`);
        if (errors.length > 0) {
          console.log(`    ! ${errors.length} console error(s): ${errors[0]}`);
        }
        results.push({ route: route.slug, viewport: viewport.name, ok: true, errors: [...errors] });
      } catch (err) {
        failures++;
        console.log(`  ✗ ${viewport.name.padEnd(7)} ${route.slug.padEnd(24)} ${err.message}`);
        results.push({ route: route.slug, viewport: viewport.name, ok: false, error: err.message });
      }
    }

    await context.close();
  }

  await browser.close();

  console.log('');
  console.log(`[core-flow-audit] done. ${results.length - failures}/${results.length} captures successful.`);
  if (failures > 0) {
    console.log(`[core-flow-audit] ${failures} failures — see log above.`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('[core-flow-audit] fatal:', err);
  process.exit(1);
});

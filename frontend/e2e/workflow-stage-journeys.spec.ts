import { test, expect, type Page, type Route } from '@playwright/test';

async function waitForBootstrap(page: Page) {
  await page.waitForLoadState('networkidle');
  await expect(page.getByAltText('Loading')).toHaveCount(0, { timeout: 15000 });
}

function json(route: Route, data: unknown) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  });
}

async function setupApiMocks(page: Page, stageTopLevel: 1 | 4 | 5) {
  const legacyStage = stageTopLevel === 1 ? 1 : stageTopLevel === 4 ? 7 : 9;

  await page.route('**/api/v1/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.endsWith('/auth/refresh') && method === 'POST') {
      return json(route, {
        accessToken: 'fake-token',
        refreshToken: 'fake-refresh',
      });
    }

    if (url.endsWith('/auth/me') && method === 'GET') {
      return json(route, {
        user: {
          _id: 'u1',
          email: 'pm@example.com',
          fullName: 'PM User',
          role: 'PM',
          tenants: [{ tenantId: 't1', tenantSlug: 'demo', name: 'Demo Tenant', role: 'PM' }],
        },
      });
    }

    if (url.includes('/demo/organizations') && method === 'GET') {
      return json(route, { organization: { _id: 't1', slug: 'demo', name: 'Demo Tenant', orgType: 'provincial_gov' } });
    }

    if (url.includes('/demo/projects/p1/workflow') && method === 'GET') {
      return json(route, {
        projectId: 'p1',
        stageTopLevel,
        stageCheckpoint: `stage${stageTopLevel}.checkpoint`,
        topLevelStages: [
          { id: 1, key: 'initiation', label: 'Initiation' },
          { id: 2, key: 'project_planning', label: 'Project Planning' },
          { id: 3, key: 'project_execution', label: 'Project Execution' },
          { id: 4, key: 'monitoring_control', label: 'Monitoring & Control' },
          { id: 5, key: 'closure', label: 'Closure' },
        ],
        gateRequirements: [],
        canAdvance: true,
      });
    }

    if (url.includes('/demo/projects/p1/stage-status') && method === 'GET') {
      return json(route, {
        currentStage: legacyStage,
        missing: [],
        requiredDocuments: [],
        stageRequirements: {},
        stage7Readiness: { periods: [], pendingVariationCount: 0 },
        activitiesMissingImages: [],
      });
    }

    if (url.includes('/demo/projects/p1') && method === 'GET' && !url.includes('/projects/p1/')) {
      return json(route, {
        project: {
          id: 'p1',
          _id: 'p1',
          name: 'Madima Water Scheme',
          refCode: 'EVD-2026-001',
          status: 'active',
          currentStage: legacyStage,
          stageTopLevel,
          contractValueOriginal: 10000000,
          contractValueAdjusted: 10000000,
          contractValue: 10000000,
          expenditureToDate: 1000000,
          balance: 9000000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    if (url.includes('/demo/projects/p1/procurement-trails') && method === 'GET') return json(route, { trails: [] });
    if (url.includes('/demo/projects/p1/performance') && method === 'GET') return json(route, { latest: null, snapshots: [], derived: null });
    if (url.includes('/demo/projects/p1/eot') && method === 'GET') return json(route, { requests: [] });
    if (url.includes('/demo/projects/p1/penalties') && method === 'GET') return json(route, { penalties: [] });
    if (url.includes('/demo/projects/p1/audit') && method === 'GET') return json(route, { entries: [], page: 1, limit: 15, total: 0 });
    if (url.includes('/demo/projects/p1/approvals/pending') && method === 'GET') return json(route, { approvals: [] });
    if (url.includes('/demo/projects/p1/funding-sources') && method === 'GET') return json(route, { fundingSources: [] });
    if (url.includes('/demo/projects/p1/variations') && method === 'GET') return json(route, { variationOrders: [] });
    if (url.includes('/demo/projects/p1/media') && method === 'GET') return json(route, { media: [] });
    if (url.includes('/demo/projects') && method === 'GET') return json(route, { projects: [], total: 0 });

    return json(route, {});
  });
}

async function loginAndOpenProject(page: Page) {
  await page.goto('/demo/projects/p1');
  await waitForBootstrap(page);
  await expect(page.getByRole('button', { name: 'Workflow' })).toBeVisible();
}

test.describe('workflow stage journeys', () => {
  test('stage 1 shows procurement trail journey', async ({ page }) => {
    await setupApiMocks(page, 1);
    await loginAndOpenProject(page);
    await expect(page.getByText('Sub-consultant procurement trails')).toBeVisible();
    await expect(page.getByText('Extension of Time')).toHaveCount(0);
  });

  test('stage 4 shows construction control journey', async ({ page }) => {
    await setupApiMocks(page, 4);
    await loginAndOpenProject(page);
    await expect(page.getByText('Performance Snapshot')).toBeVisible();
    await expect(page.getByText('Extension of Time')).toBeVisible();
    await expect(page.getByText('Penalties')).toBeVisible();
  });

  test('stage 5 shows closure deliverables journey', async ({ page }) => {
    await setupApiMocks(page, 5);
    await loginAndOpenProject(page);
    await expect(page.getByText('Project Closure Deliverables')).toBeVisible();
    await expect(page.getByText('Extension of Time')).toHaveCount(0);
  });
});

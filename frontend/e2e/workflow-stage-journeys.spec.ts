import { test, expect, type Page, type Route } from '@playwright/test';

async function waitForBootstrap(page: Page) {
  await page.waitForLoadState('domcontentloaded');
}

function json(route: Route, data: unknown) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  });
}

type MockOptions = {
  approverAccess?: boolean;
  gateBlocked?: boolean;
};

async function setupApiMocks(page: Page, stageTopLevel: 1 | 4 | 5, options: MockOptions = {}) {
  const legacyStage = stageTopLevel === 1 ? 1 : stageTopLevel === 4 ? 7 : 9;
  const approverAccess = Boolean(options.approverAccess);
  const gateBlocked = Boolean(options.gateBlocked);

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
      const membershipRole = approverAccess ? 'CLIENT_APPROVER' : 'PM';
      return json(route, {
        user: {
          _id: 'u1',
          email: 'pm@example.com',
          fullName: 'PM User',
          role: membershipRole,
          canApproveDocuments: approverAccess,
          tenants: [{ tenantId: 't1', tenantSlug: 'demo', name: 'Demo Tenant', role: membershipRole }],
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
    if (url.includes('/demo/projects/p1/workflow/advance') && method === 'POST') {
      if (gateBlocked) {
        return route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'WORKFLOW_GATE_FAILED',
            message: 'Workflow checkpoint requirements not met',
            requirements: [
              {
                code: 'MISSING_APPROVAL',
                checkpoint: 'stage4.interim_payment.approval',
                entityType: 'deliverable',
                entityKey: 'monthly-progress-report',
                detail: 'Monthly progress report is required for billing period 2026-03',
              },
            ],
          }),
        });
      }
      return json(route, { advanced: true });
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
    if (url.includes('/demo/projects/p1/approvals/pending') && method === 'GET') {
      return json(route, {
        approvals: approverAccess
          ? [
              {
                id: 'approval-1',
                stage: legacyStage,
                documentCategory: 'monthly-progress-report',
                fileId: 'file-1',
              },
            ]
          : [],
      });
    }
    if (url.includes('/demo/projects/p1/funding-sources') && method === 'GET') return json(route, { fundingSources: [] });
    if (url.includes('/demo/projects/p1/variations') && method === 'GET') return json(route, { variationOrders: [] });
    if (url.includes('/demo/projects/p1/media') && method === 'GET') return json(route, { media: [] });
    if (url.includes('/demo/projects') && method === 'GET') return json(route, { projects: [], total: 0 });

    return route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        message: `Unhandled mocked endpoint: ${method} ${url}`,
      }),
    });
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

  test('workflow gate failure shows canonical blocker details', async ({ page }) => {
    await setupApiMocks(page, 4, { gateBlocked: true });
    await loginAndOpenProject(page);
    await page.getByRole('button', { name: /run gate check/i }).click();
    await expect(page.getByText(/Gate blockers/i)).toBeVisible();
    await expect(page.getByText(/Monthly progress report is required/i)).toBeVisible();
  });

  test('approver access shows approver actions panel', async ({ page }) => {
    await setupApiMocks(page, 4, { approverAccess: true });
    await loginAndOpenProject(page);
    await expect(page.getByText(/Approver Actions/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Approve$/ })).toBeVisible();
  });
});

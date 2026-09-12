import { test as base, expect, Page } from '@playwright/test';

export interface NetworkErrorEntry {
  method: string;
  url: string;
  status?: number;
  errorText?: string;
  timestamp: string;
}

export interface ConsoleErrorEntry {
  type: string;
  text: string;
  timestamp: string;
}

export interface PageErrorEntry {
  message: string;
  stack?: string;
  timestamp: string;
}

export interface MonitorLog {
  consoleErrors: ConsoleErrorEntry[];
  consoleWarns: ConsoleErrorEntry[];
  pageErrors: PageErrorEntry[];
  networkErrors: NetworkErrorEntry[];
}

export const PERSONAS = {
  tourist: {
    id: 'user-tourist-01',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@travelsathi.in',
    role: 'tourist',
    token: 'mock_jwt_token_tourist_2026',
  },
  host: {
    id: 'user-host-01',
    name: 'Sunil Thakur',
    email: 'sunil.thakur@pineshade.in',
    role: 'host',
    token: 'mock_jwt_token_host_2026',
  },
  dmo: {
    id: 'user-dmo-01',
    name: 'Dr. Rajesh Verma, IAS',
    email: 'officer.tourism@nic.in',
    role: 'dmo',
    token: 'mock_jwt_token_dmo_2026',
  },
  admin: {
    id: 'user-admin-01',
    name: 'Chief Security Officer',
    email: 'admin.ops@travelsathi.gov.in',
    role: 'admin',
    token: 'mock_jwt_token_admin_2026',
  }
};

export async function attachMonitoring(page: Page): Promise<MonitorLog> {
  const log: MonitorLog = {
    consoleErrors: [],
    consoleWarns: [],
    pageErrors: [],
    networkErrors: []
  };

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    const timestamp = new Date().toISOString();
    if (type === 'error') {
      log.consoleErrors.push({ type, text, timestamp });
    } else if (type === 'warning' || type === 'warn') {
      log.consoleWarns.push({ type, text, timestamp });
    }
  });

  page.on('pageerror', err => {
    log.pageErrors.push({
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
  });

  page.on('requestfailed', req => {
    log.networkErrors.push({
      method: req.method(),
      url: req.url(),
      errorText: req.failure()?.errorText || 'Failed',
      timestamp: new Date().toISOString()
    });
  });

  page.on('response', resp => {
    const status = resp.status();
    if (status >= 400 && !resp.url().includes('favicon')) {
      log.networkErrors.push({
        method: resp.request().method(),
        url: resp.url(),
        status,
        timestamp: new Date().toISOString()
      });
    }
  });

  return log;
}

export async function setPersona(page: Page, role: keyof typeof PERSONAS) {
  const user = PERSONAS[role];
  await page.addInitScript(({ u, r }) => {
    localStorage.setItem('travelsathi_token', u.token);
    localStorage.setItem('travelsathi_role', r);
    localStorage.setItem('travelsathi_user', JSON.stringify(u));
  }, { u: user, r: role });
}

export async function clearSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('travelsathi_token');
    localStorage.removeItem('travelsathi_user');
    localStorage.setItem('travelsathi_role', 'tourist');
  });
}

export const test = base.extend<{ monitor: MonitorLog }>({
  monitor: async ({ page }, use) => {
    const monitor = await attachMonitoring(page);
    await use(monitor);
  },
});

export { expect };

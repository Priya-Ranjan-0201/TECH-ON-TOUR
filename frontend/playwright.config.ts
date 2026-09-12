import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',

    fullyParallel: true,

    forbidOnly: !!process.env.CI,

    retries: process.env.CI ? 2 : 0,

    reporter: [['html', { open: 'never' }], ['list']],

    use: {
        baseURL: 'http://localhost:5173',

        screenshot: 'only-on-failure',

        video: 'retain-on-failure',

        trace: 'on-first-retry',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },

        {
            name: 'mobile',
            use: { ...devices['Pixel 5'] },
        },
    ],
});
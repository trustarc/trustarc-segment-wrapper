/**
 * Centralized logging function for the consent wrapper
 */
export const log = (...args: any[]): void => {
    console.log('[consent wrapper debug]', ...args);
};

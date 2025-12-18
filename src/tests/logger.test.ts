import { log } from '../lib/logger';

describe('logger', () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
        // Mock console.log to prevent actual logging during tests
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        // Restore the original console.log after each test
        consoleLogSpy.mockRestore();
    });

    test('should log with prefix "[consent wrapper debug]"', () => {
        const message = 'Test message';
        log(message);

        expect(consoleLogSpy).toHaveBeenCalledWith('[consent wrapper debug]', message);
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    test('should log multiple arguments', () => {
        const arg1 = 'First argument';
        const arg2 = { key: 'value' };
        const arg3 = 123;
        
        log(arg1, arg2, arg3);

        expect(consoleLogSpy).toHaveBeenCalledWith('[consent wrapper debug]', arg1, arg2, arg3);
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    test('should handle no arguments', () => {
        log();

        expect(consoleLogSpy).toHaveBeenCalledWith('[consent wrapper debug]');
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    test('should handle objects and arrays', () => {
        const obj = { name: 'test', value: 42 };
        const arr = [1, 2, 3];
        
        log(obj, arr);

        expect(consoleLogSpy).toHaveBeenCalledWith('[consent wrapper debug]', obj, arr);
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
});

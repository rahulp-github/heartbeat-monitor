import { isValidEvent, detectMissedHeartbeats } from './main.js';

const test = (name, fn) => {
    const passed = fn();
    console.log(passed ? `PASS: ${name}` : `FAIL: ${name}`);
    return passed;
};

const results = [];

results.push(test('Working alert case - triggers alert when 3 heartbeats missed', () => {
    const events = [
        { service: 'email', timestamp: '2025-08-04T10:00:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:01:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:02:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:06:00Z' }
    ];
    const alerts = detectMissedHeartbeats(events, 60, 3);
    return alerts.length === 1 &&
           alerts[0].service === 'email' &&
           alerts[0].alert_at === '2025-08-04T10:03:00.000Z';
}));

results.push(test('Near-miss case - no alert when only 2 heartbeats missed', () => {
    const events = [
        { service: 'email', timestamp: '2025-08-04T10:00:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:01:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:02:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:05:00Z' }
    ];
    const alerts = detectMissedHeartbeats(events, 60, 3);
    return alerts.length === 0;
}));

results.push(test('Unordered input - handles events not in chronological order', () => {
    const events = [
        { service: 'email', timestamp: '2025-08-04T10:06:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:00:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:02:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:01:00Z' }
    ];
    const alerts = detectMissedHeartbeats(events, 60, 3);
    return alerts.length === 1 && alerts[0].alert_at === '2025-08-04T10:03:00.000Z';
}));

results.push(test('Malformed event - missing timestamp', () => {
    const events = [
        { service: 'email', timestamp: '2025-08-04T10:00:00Z' },
        { service: 'email' },
        { service: 'email', timestamp: '2025-08-04T10:06:00Z' }
    ];
    const alerts = detectMissedHeartbeats(events, 60, 3);
    return alerts.length === 1 && alerts[0].alert_at === '2025-08-04T10:01:00.000Z';
}));

results.push(test('Malformed event - missing service', () => {
    const events = [
        { service: 'email', timestamp: '2025-08-04T10:00:00Z' },
        { timestamp: '2025-08-04T10:03:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:06:00Z' }
    ];
    const alerts = detectMissedHeartbeats(events, 60, 3);
    return alerts.length === 1 && alerts[0].alert_at === '2025-08-04T10:01:00.000Z';
}));

results.push(test('Malformed event - invalid timestamp format', () => {
    const events = [
        { service: 'email', timestamp: '2025-08-04T10:00:00Z' },
        { service: 'email', timestamp: 'not-a-real-timestamp' },
        { service: 'email', timestamp: '2025-08-04T10:06:00Z' }
    ];
    const alerts = detectMissedHeartbeats(events, 60, 3);
    return alerts.length === 1 && alerts[0].alert_at === '2025-08-04T10:01:00.000Z';
}));

results.push(test('Multiple services - each tracked independently', () => {
    const events = [
        { service: 'email', timestamp: '2025-08-04T10:00:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:06:00Z' },
        { service: 'sms', timestamp: '2025-08-04T10:00:00Z' },
        { service: 'sms', timestamp: '2025-08-04T10:02:00Z' }
    ];
    const alerts = detectMissedHeartbeats(events, 60, 3);
    return alerts.length === 1 && alerts[0].service === 'email';
}));

results.push(test('Only one alert per service - stops after first alert', () => {
    const events = [
        { service: 'email', timestamp: '2025-08-04T10:00:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:06:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:12:00Z' }
    ];
    const alerts = detectMissedHeartbeats(events, 60, 3);
    return alerts.length === 1 && alerts[0].alert_at === '2025-08-04T10:01:00.000Z';
}));

results.push(test('isValidEvent - returns true for valid event', () => {
    return isValidEvent({ service: 'email', timestamp: '2025-08-04T10:00:00Z' }) === true;
}));

results.push(test('isValidEvent - returns false for missing service', () => {
    return isValidEvent({ timestamp: '2025-08-04T10:00:00Z' }) === false;
}));

results.push(test('isValidEvent - returns false for missing timestamp', () => {
    return isValidEvent({ service: 'email' }) === false;
}));

results.push(test('isValidEvent - returns false for invalid timestamp', () => {
    return isValidEvent({ service: 'email', timestamp: 'invalid' }) === false;
}));

results.push(test('Empty events array - returns empty alerts', () => {
    return detectMissedHeartbeats([], 60, 3).length === 0;
}));

results.push(test('Single event - no alert possible', () => {
    const events = [{ service: 'email', timestamp: '2025-08-04T10:00:00Z' }];
    return detectMissedHeartbeats(events, 60, 3).length === 0;
}));

const passed = results.filter(r => r).length;
const failed = results.filter(r => !r).length;
console.log(`\n${passed} passed, ${failed} failed`);

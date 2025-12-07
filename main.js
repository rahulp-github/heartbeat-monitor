import dayjs from 'dayjs';

export const isValidEvent = (event) => {
    if (!event.service || typeof event.service !== 'string') {
        return false;
    }
    if (!event.timestamp) {
        return false;
    }
    const parsed = dayjs(event.timestamp);
    return parsed.isValid();
};

export const groupEventsByService = (events) => {
    const groups = {};
    for (const event of events) {
        if (!groups[event.service]) {
            groups[event.service] = [];
        }
        groups[event.service].push(event);
    }
    return groups;
};

export const detectMissedHeartbeats = (events, expectedIntervalSeconds, allowedMisses) => {
    const validEvents = events.filter(isValidEvent);
    const groupedEvents = groupEventsByService(validEvents);
    const threshold = expectedIntervalSeconds * (allowedMisses + 1);
    const alerts = [];

    for (const service in groupedEvents) {
        const serviceEvents = groupedEvents[service];

        const sortedEvents = serviceEvents.sort((a, b) => {
            return dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix();
        });

        for (let i = 1; i < sortedEvents.length; i++) {
            const previousTime = dayjs(sortedEvents[i - 1].timestamp);
            const currentTime = dayjs(sortedEvents[i].timestamp);
            const gapSeconds = currentTime.diff(previousTime, 'second');

            if (gapSeconds >= threshold) {
                const alertAt = previousTime.add(expectedIntervalSeconds, 'second');
                alerts.push({
                    service: service,
                    alert_at: alertAt.toISOString()
                });
                break;
            }
        }
    }

    return alerts;
};

if (process.argv[1].includes('main.js')) {
    const events = [
        { service: 'email', timestamp: '2025-08-04T10:00:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:01:00Z' },
        { service: 'sms', timestamp: '2025-08-04T10:00:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:02:00Z' },
        { service: 'push', timestamp: '2025-08-04T10:00:00Z' },
        { service: 'push', timestamp: '2025-08-04T10:01:00Z' },
        { service: 'push', timestamp: '2025-08-04T10:02:00Z' },
        { service: 'push', timestamp: '2025-08-04T10:06:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:06:00Z' },
        { service: 'sms', timestamp: '2025-08-04T10:03:00Z' },
        { service: 'sms', timestamp: '2025-08-04T10:02:00Z' },
        { service: 'email' },
        { service: 'sms', timestamp: 'not-a-real-timestamp' },
        { timestamp: '2025-08-04T10:04:00Z' },
        { service: 'sms', timestamp: '2025-08-04T10:04:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:07:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:10:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:13:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:16:00Z' },
        { service: 'sms', timestamp: '2025-08-04T10:06:00Z' },
        { service: 'sms', timestamp: '2025-08-04T10:07:00Z' },
        { service: 'sms', timestamp: '2025-08-04T10:08:00Z' },
        { service: 'sms', timestamp: '2025-08-04T10:12:00Z' },
        { service: 'sms', timestamp: '2025-08-04T10:16:00Z' },
        { service: 'push', timestamp: '2025-08-04T10:12:00Z' },
        { service: 'push', timestamp: '2025-08-04T10:13:00Z' },
        { service: 'push', timestamp: '2025-08-04T10:14:00Z' },
        { service: 'push', timestamp: '2025-08-04T10:20:00Z' },
        { service: 'email', timestamp: '2025-08-04T10:22:00Z' }
    ];

    const expectedIntervalSeconds = 60;
    const allowedMisses = 3;

    const alerts = detectMissedHeartbeats(events, expectedIntervalSeconds, allowedMisses);
    console.log(JSON.stringify(alerts, null, 2));
}

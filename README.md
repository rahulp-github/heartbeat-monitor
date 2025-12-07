# Heartbeat Monitoring System

Detects when services miss 3 consecutive heartbeats and triggers alerts.

## Setup & Run

```bash
npm install
node main.js
```

Uses `dayjs` for date parsing and calculations.

## Run Tests

```bash
node test.js
```

## Approach

### Defining "3 Missed Heartbeats"

A service misses 3 heartbeats when the gap between two consecutive received heartbeats is:

```
gap >= expected_interval_seconds × (allowed_misses + 1)
```

With `interval=60` and `allowed_misses=3`, threshold = 240 seconds.

The `alert_at` is the **first expected but missed heartbeat time** (previous heartbeat + interval).

### Handling Unordered Events

Events are grouped by service, then sorted chronologically before gap detection.

### Treating Malformed Events

Skipped entirely. An event is malformed if:
- Missing `service` or `timestamp` field
- Invalid timestamp format

## Output

```json
[{ "service": "email", "alert_at": "2025-08-04T10:03:00.000Z" }]
```

At most one alert per service.

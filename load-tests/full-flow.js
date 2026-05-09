/**
 * k6 load test — Full end-to-end flow
 * Each VU simulates one complete trip: location ping → match → accept → start → complete
 *
 * Run: k6 run load-tests/full-flow.js
 */
import http from "k6/http";
import { check, sleep, group } from "k6";
import { Trend, Counter } from "k6/metrics";

const flowLatency  = new Trend("full_flow_latency_ms", true);
const flowErrors   = new Counter("full_flow_errors");

export const options = {
  vus: 50,
  duration: "3m",
  thresholds: {
    full_flow_errors:    ["count<10"],
    full_flow_latency_ms: ["p(95)<3000"],
  },
};

const BASE_URL      = __ENV.BASE_URL || "http://localhost:8080";
const DRIVER_JWT    = __ENV.DRIVER_JWT || "test-driver-token";
const RIDER_JWT     = __ENV.RIDER_JWT  || "test-rider-token";

const driverHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${DRIVER_JWT}` };
const riderHeaders  = { "Content-Type": "application/json", Authorization: `Bearer ${RIDER_JWT}` };

export default function () {
  const driverId = `driver-${__VU}`;
  const riderId  = `rider-${__VU}`;
  const flowStart = Date.now();

  // 1. Driver sends location ping
  group("driver location ping", () => {
    const res = http.post(
      `${BASE_URL}/v1/drivers/${driverId}/location`,
      JSON.stringify({ lat: 37.7749, lng: -122.4194, speed: 0, heading: 0 }),
      { headers: driverHeaders }
    );
    check(res, { "location accepted": (r) => r.status === 202 });
  });

  sleep(0.5);

  // 2. Rider requests a match
  let tripId;
  group("rider requests match", () => {
    const res = http.post(
      `${BASE_URL}/v1/trips/match`,
      JSON.stringify({
        riderId, pickupLat: 37.7750, pickupLng: -122.4180,
        dropoffLat: 37.7900, dropoffLng: -122.4000,
      }),
      { headers: riderHeaders }
    );
    const ok = check(res, { "match 200": (r) => r.status === 200 });
    if (ok) {
      const body = JSON.parse(res.body);
      tripId = body.tripId;
    } else {
      flowErrors.add(1);
    }
  });

  if (!tripId) return;
  sleep(1);

  // 3. Driver accepts
  group("driver accepts trip", () => {
    const res = http.post(
      `${BASE_URL}/v1/trips/${tripId}/accept?driverId=${driverId}`,
      null, { headers: driverHeaders }
    );
    check(res, { "accepted 200": (r) => r.status === 200 });
  });

  sleep(1);

  // 4. Driver arriving
  group("driver arriving", () => {
    http.post(`${BASE_URL}/v1/trips/${tripId}/arriving`, null, { headers: driverHeaders });
  });

  sleep(1);

  // 5. Trip starts
  group("trip start", () => {
    http.post(`${BASE_URL}/v1/trips/${tripId}/start`, null, { headers: driverHeaders });
  });

  sleep(2);

  // 6. Trip completes
  group("trip complete", () => {
    const res = http.post(
      `${BASE_URL}/v1/trips/${tripId}/complete?finalFare=12.50`,
      null, { headers: driverHeaders }
    );
    check(res, { "completed 200": (r) => r.status === 200 });
  });

  flowLatency.add(Date.now() - flowStart);
  sleep(1);
}

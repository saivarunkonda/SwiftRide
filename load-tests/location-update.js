/**
 * k6 load test — Location Service
 * Simulates 1000 concurrent drivers sending GPS pings
 *
 * Run: k6 run load-tests/location-update.js
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Trend } from "k6/metrics";

const errors   = new Counter("location_errors");
const latency  = new Trend("location_latency_ms", true);

export const options = {
  stages: [
    { duration: "30s", target: 100  },  // ramp up
    { duration: "2m",  target: 1000 },  // sustained load
    { duration: "30s", target: 0    },  // ramp down
  ],
  thresholds: {
    http_req_duration:    ["p(95)<200"],  // 95% of requests under 200ms
    http_req_failed:      ["rate<0.01"],  // less than 1% errors
    location_latency_ms:  ["p(99)<500"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const JWT      = __ENV.JWT_TOKEN || "test-driver-token";

export default function () {
  const driverId = `driver-${__VU}`; // each VU = one driver

  // simulate GPS drift
  const lat = 37.7749 + (Math.random() - 0.5) * 0.1;
  const lng = -122.4194 + (Math.random() - 0.5) * 0.1;

  const start = Date.now();
  const res = http.post(
    `${BASE_URL}/v1/drivers/${driverId}/location`,
    JSON.stringify({ lat, lng, speed: 30 + Math.random() * 40, heading: Math.random() * 360 }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${JWT}`,
      },
    }
  );
  latency.add(Date.now() - start);

  const ok = check(res, {
    "status 202": (r) => r.status === 202,
  });
  if (!ok) errors.add(1);

  sleep(1); // 1 ping per second per driver
}

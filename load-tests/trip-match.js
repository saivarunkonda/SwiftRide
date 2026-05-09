/**
 * k6 load test — Trip Matching Service
 * Simulates riders requesting trips concurrently
 *
 * Run: k6 run load-tests/trip-match.js
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const matchRate    = new Rate("match_success_rate");
const noDriverRate = new Rate("no_driver_rate");
const matchLatency = new Trend("match_latency_ms", true);

export const options = {
  stages: [
    { duration: "20s", target: 50  },
    { duration: "1m",  target: 200 },
    { duration: "20s", target: 0   },
  ],
  thresholds: {
    http_req_duration:  ["p(95)<500"],
    match_success_rate: ["rate>0.8"],   // at least 80% of requests find a driver
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const JWT      = __ENV.JWT_TOKEN || "test-rider-token";

// San Francisco bounding box
const SF = { minLat: 37.70, maxLat: 37.83, minLng: -122.52, maxLng: -122.35 };

function randCoord(min, max) {
  return min + Math.random() * (max - min);
}

export default function () {
  const pickupLat  = randCoord(SF.minLat, SF.maxLat);
  const pickupLng  = randCoord(SF.minLng, SF.maxLng);
  const dropoffLat = randCoord(SF.minLat, SF.maxLat);
  const dropoffLng = randCoord(SF.minLng, SF.maxLng);

  const start = Date.now();
  const res = http.post(
    `${BASE_URL}/v1/trips/match`,
    JSON.stringify({
      riderId: `rider-${__VU}`,
      pickupLat, pickupLng, dropoffLat, dropoffLng,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${JWT}`,
      },
    }
  );
  matchLatency.add(Date.now() - start);

  check(res, { "status 200": (r) => r.status === 200 });

  if (res.status === 200) {
    const body = JSON.parse(res.body);
    matchRate.add(body.status === "MATCHED");
    noDriverRate.add(body.status === "NO_DRIVERS_AVAILABLE");
  }

  sleep(2);
}

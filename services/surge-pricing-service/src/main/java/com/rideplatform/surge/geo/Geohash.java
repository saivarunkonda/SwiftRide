package com.rideplatform.surge.geo;

/**
 * Minimal geohash encoder.
 * Encodes lat/lng into a base32 geohash string at a given precision.
 * Precision 5 = ~5km x 5km cell — good for city-zone surge pricing.
 */
public final class Geohash {

    private static final String BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

    private Geohash() {}

    public static String encode(double lat, double lng, int precision) {
        double minLat = -90, maxLat = 90;
        double minLng = -180, maxLng = 180;

        StringBuilder hash = new StringBuilder();
        int bits = 0, bitsTotal = 0, hashValue = 0;
        boolean isLng = true;

        while (hash.length() < precision) {
            double mid;
            if (isLng) {
                mid = (minLng + maxLng) / 2;
                if (lng > mid) { hashValue = (hashValue << 1) | 1; minLng = mid; }
                else           { hashValue = (hashValue << 1);      maxLng = mid; }
            } else {
                mid = (minLat + maxLat) / 2;
                if (lat > mid) { hashValue = (hashValue << 1) | 1; minLat = mid; }
                else           { hashValue = (hashValue << 1);      maxLat = mid; }
            }
            isLng = !isLng;

            if (++bits == 5) {
                hash.append(BASE32.charAt(hashValue));
                bits = 0;
                hashValue = 0;
            }
            bitsTotal++;
        }
        return hash.toString();
    }
}

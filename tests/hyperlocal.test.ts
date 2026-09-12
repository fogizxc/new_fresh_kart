import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDistanceKm, calculateDeliveryEta, isShopOpen } from '../server/services/hyperlocal.ts';

test('hyperlocal distance accurately computes kilometers between coordinates', () => {
  // Connaught Place to Lajpat Nagar (~8.5 - 9.5 km)
  const cp = { lat: 28.6304, lng: 77.2177 };
  const lajpat = { lat: 28.5678, lng: 77.2433 };
  const dist = calculateDistanceKm(cp, lajpat);
  assert.ok(dist >= 7.0 && dist <= 10.0, `Calculated distance ${dist}km is in expected range`);
});

test('hyperlocal ETA calculation provides realistic quick-commerce delivery brackets', () => {
  const eta = calculateDeliveryEta(3.0, 8); // 3 km away, 8 min prep
  assert.ok(eta.minMinutes >= 10, 'Minimum quick commerce ETA should be at least 10 mins');
  assert.ok(eta.maxMinutes <= 35, 'Maximum quick commerce ETA should remain sub-35 mins for 3km');
  assert.match(eta.displayText, /mins$/);
});

test('shop opening hours properly detects operating windows', () => {
  const afternoon = new Date('2026-09-12T14:30:00');
  assert.equal(isShopOpen('07:00', '23:00', afternoon), true);

  const lateNight = new Date('2026-09-12T03:00:00');
  assert.equal(isShopOpen('07:00', '23:00', lateNight), false);
});

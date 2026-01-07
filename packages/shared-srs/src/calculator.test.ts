import { describe, it, expect, beforeEach } from 'vitest';
import { SrsCalculator, DEFAULT_SRS_PARAMS } from './calculator';
import type { SrsState } from './calculator';

describe('SrsCalculator', () => {
  let calculator: SrsCalculator;

  beforeEach(() => {
    calculator = new SrsCalculator();
  });

  describe('getInitialState', () => {
    it('should return initial state with default ease factor', () => {
      const state = calculator.getInitialState();
      expect(state.easeFactor).toBe(2.5);
      expect(state.intervalDays).toBe(0);
      expect(state.repetitions).toBe(0);
    });
  });

  describe('calculate with rating 0 (Again)', () => {
    it('should reset repetitions and set interval to 1 day', () => {
      const currentState: SrsState = {
        easeFactor: 2.5,
        intervalDays: 10,
        repetitions: 5,
      };

      const result = calculator.calculate({
        currentState,
        rating: 0,
      });

      expect(result.repetitions).toBe(0);
      expect(result.interval_days).toBe(1);
      expect(result.ease_factor).toBe(2.3); // 2.5 - 0.2
    });

    it('should not go below minimum ease factor', () => {
      const currentState: SrsState = {
        easeFactor: 1.4,
        intervalDays: 1,
        repetitions: 1,
      };

      const result = calculator.calculate({
        currentState,
        rating: 0,
      });

      expect(result.ease_factor).toBe(DEFAULT_SRS_PARAMS.minEaseFactor);
    });
  });

  describe('calculate with rating 1 (Hard)', () => {
    it('should increment repetitions and apply hard modifier', () => {
      const currentState: SrsState = {
        easeFactor: 2.5,
        intervalDays: 6,
        repetitions: 2,
      };

      const result = calculator.calculate({
        currentState,
        rating: 1,
      });

      expect(result.repetitions).toBe(3);
      // interval = round(6 * 2.36) * 1.2 = round(14.16 * 1.2) = 17
      expect(result.interval_days).toBeGreaterThan(currentState.intervalDays);
    });
  });

  describe('calculate with rating 2 (Good)', () => {
    it('should set first interval on first correct answer', () => {
      const currentState: SrsState = {
        easeFactor: 2.5,
        intervalDays: 0,
        repetitions: 0,
      };

      const result = calculator.calculate({
        currentState,
        rating: 2,
      });

      expect(result.repetitions).toBe(1);
      expect(result.interval_days).toBe(DEFAULT_SRS_PARAMS.firstInterval);
    });

    it('should set second interval on second correct answer', () => {
      const currentState: SrsState = {
        easeFactor: 2.5,
        intervalDays: 1,
        repetitions: 1,
      };

      const result = calculator.calculate({
        currentState,
        rating: 2,
      });

      expect(result.repetitions).toBe(2);
      expect(result.interval_days).toBe(DEFAULT_SRS_PARAMS.secondInterval);
    });

    it('should multiply interval by ease factor on subsequent reviews', () => {
      const currentState: SrsState = {
        easeFactor: 2.5,
        intervalDays: 6,
        repetitions: 2,
      };

      const result = calculator.calculate({
        currentState,
        rating: 2,
      });

      expect(result.repetitions).toBe(3);
      // interval = round(6 * 2.5) = 15
      expect(result.interval_days).toBe(15);
    });
  });

  describe('calculate with rating 3 (Easy)', () => {
    it('should apply easy bonus to interval', () => {
      const currentState: SrsState = {
        easeFactor: 2.5,
        intervalDays: 6,
        repetitions: 2,
      };

      const result = calculator.calculate({
        currentState,
        rating: 3,
      });

      expect(result.repetitions).toBe(3);
      // interval = round(round(6 * 2.6) * 1.3) = round(15.6 * 1.3) = 20
      expect(result.interval_days).toBeGreaterThan(15);
    });

    it('should increase ease factor', () => {
      const currentState: SrsState = {
        easeFactor: 2.3,
        intervalDays: 6,
        repetitions: 2,
      };

      const result = calculator.calculate({
        currentState,
        rating: 3,
      });

      expect(result.ease_factor).toBeGreaterThan(currentState.easeFactor);
    });
  });

  describe('due_date calculation', () => {
    it('should calculate correct due date', () => {
      const reviewedAt = new Date('2025-01-07T10:00:00Z');
      const currentState: SrsState = {
        easeFactor: 2.5,
        intervalDays: 0,
        repetitions: 0,
      };

      const result = calculator.calculate({
        currentState,
        rating: 2,
        reviewedAt,
      });

      const expectedDueDate = new Date('2025-01-08T10:00:00Z');
      expect(result.due_date.toISOString()).toBe(expectedDueDate.toISOString());
    });
  });

  describe('previewNextDueDates', () => {
    it('should return due dates for all ratings', () => {
      const currentState: SrsState = {
        easeFactor: 2.5,
        intervalDays: 6,
        repetitions: 2,
      };
      const reviewedAt = new Date('2025-01-07T10:00:00Z');

      const preview = calculator.previewNextDueDates(currentState, reviewedAt);

      expect(preview[0]).toBeInstanceOf(Date);
      expect(preview[1]).toBeInstanceOf(Date);
      expect(preview[2]).toBeInstanceOf(Date);
      expect(preview[3]).toBeInstanceOf(Date);

      // Again should have shortest interval
      expect(preview[0].getTime()).toBeLessThan(preview[2].getTime());
      // Easy should have longest interval
      expect(preview[3].getTime()).toBeGreaterThan(preview[2].getTime());
    });
  });

  describe('ease factor bounds', () => {
    it('should not exceed maximum ease factor', () => {
      const currentState: SrsState = {
        easeFactor: 2.5,
        intervalDays: 30,
        repetitions: 10,
      };

      // Easy rating increases ease factor
      const result = calculator.calculate({
        currentState,
        rating: 3,
      });

      expect(result.ease_factor).toBeLessThanOrEqual(DEFAULT_SRS_PARAMS.maxEaseFactor);
    });

    it('should not go below minimum ease factor', () => {
      const currentState: SrsState = {
        easeFactor: 1.4,
        intervalDays: 1,
        repetitions: 1,
      };

      // Hard rating decreases ease factor
      const result = calculator.calculate({
        currentState,
        rating: 1,
      });

      expect(result.ease_factor).toBeGreaterThanOrEqual(DEFAULT_SRS_PARAMS.minEaseFactor);
    });
  });
});

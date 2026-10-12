import { describe, expect, it } from 'vitest';
import { inssEmployee, irrfMonthly, salaryDeductions } from './payrollTaxes';

describe('inssEmployee', () => {
  describe('when the salary is zero', () => {
    it('charges nothing', () => {
      expect(inssEmployee(0)).toBe(0);
    });
  });

  describe('at the edge of each bracket', () => {
    it.each([
      [1621.0, 121.58],
      [2902.84, 236.94],
      [4354.27, 411.11],
      [8475.55, 988.09],
    ])('charges progressively up to %d', (gross, expected) => {
      expect(inssEmployee(gross)).toBe(expected);
    });
  });

  describe('when the salary falls inside a bracket', () => {
    it('applies each rate only to the slice inside its bracket', () => {
      expect(inssEmployee(3000)).toBe(248.6);
    });
  });

  describe('when the salary is above the contribution ceiling', () => {
    it('caps the contribution at the ceiling amount', () => {
      expect(inssEmployee(20000)).toBe(988.09);
    });
  });
});

describe('irrfMonthly', () => {
  describe('when the legal deductions are smaller than the simplified discount', () => {
    it('uses the simplified discount and owes nothing at 3000', () => {
      expect(irrfMonthly(3000, inssEmployee(3000), 0)).toBe(0);
    });
  });

  describe('when the gross salary is exactly in the exemption limit of 5000', () => {
    it('owes nothing because the reduction cancels the tax', () => {
      expect(irrfMonthly(5000, inssEmployee(5000), 0)).toBe(0);
    });
  });

  describe('when the gross salary is in the reduction range', () => {
    it('subtracts the declining reduction from the tax at 6000', () => {
      expect(irrfMonthly(6000, inssEmployee(6000), 0)).toBe(385.1);
    });

    it('never reduces the tax below zero', () => {
      expect(irrfMonthly(5100, inssEmployee(5100), 0)).toBeGreaterThanOrEqual(0);
    });

    it('discounts dependents from the base when legal deductions win', () => {
      expect(irrfMonthly(6000, inssEmployee(6000), 2)).toBe(280.83);
    });
  });

  describe('when the gross salary is at or above 7350', () => {
    it('gives no reduction and taxes the full progressive amount', () => {
      expect(irrfMonthly(7350, inssEmployee(7350), 0)).toBe(884.13);
    });

    it('taxes a high salary at the top rate', () => {
      expect(irrfMonthly(10000, inssEmployee(10000), 0)).toBe(1569.55);
    });
  });
});

describe('salaryDeductions', () => {
  describe('when the salary pays both taxes', () => {
    it('returns INSS and IRRF rounded to cents', () => {
      expect(salaryDeductions(6000, 0)).toEqual([
        { label: 'INSS', amount: 641.51 },
        { label: 'IRRF', amount: 385.1 },
      ]);
    });
  });

  describe('when the salary is exempt from IRRF', () => {
    it('omits the zero IRRF line', () => {
      expect(salaryDeductions(3000, 0)).toEqual([{ label: 'INSS', amount: 248.6 }]);
    });
  });

  describe('when the salary is zero', () => {
    it('returns no deductions', () => {
      expect(salaryDeductions(0, 0)).toEqual([]);
    });
  });
});

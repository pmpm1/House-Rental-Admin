import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHomeLoan, calculateProfitLoss } from '../src/calculators.js';

test('calculateHomeLoan returns amortized payment and totals', () => {
  const result = calculateHomeLoan({ propertyValue: 100_000_000, downPaymentPercent: 50, annualInterestRate: 11, loanYears: 25 });
  assert.equal(result.creditLimit, 50_000_000);
  assert.equal(result.downPaymentAmount, 50_000_000);
  assert.equal(result.monthlyPayment, 490056.54);
  assert.equal(result.totalInterest, 97016961.54);
});

test('calculateProfitLoss returns daily, monthly, yearly, and ROI values', () => {
  const result = calculateProfitLoss({ purchasePrice: 100_000_000, currentValue: 112_000_000, monthlyRent: 900_000, monthlyExpenses: 250_000, otherMonthlyIncome: 50_000 });
  assert.equal(result.monthlyProfit, 700_000);
  assert.equal(result.yearlyProfit, 8_400_000);
  assert.equal(result.dailyProfit, 23013.7);
  assert.equal(result.capitalGainLoss, 12_000_000);
  assert.equal(result.roiPercent, 8.4);
});

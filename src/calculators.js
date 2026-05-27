export function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function calculateHomeLoan({ propertyValue, downPaymentPercent, annualInterestRate, loanYears }) {
  const property = Number(propertyValue);
  const downPercent = Number(downPaymentPercent);
  const interest = Number(annualInterestRate);
  const years = Number(loanYears);

  if (property <= 0 || downPercent < 0 || downPercent >= 100 || interest < 0 || years <= 0) {
    throw new Error('Property value and loan period must be positive; down payment must be 0-99%; interest cannot be negative.');
  }

  const downPaymentAmount = property * (downPercent / 100);
  const creditLimit = property - downPaymentAmount;
  const months = years * 12;
  const monthlyRate = interest / 100 / 12;
  const monthlyPayment = monthlyRate === 0
    ? creditLimit / months
    : creditLimit * (monthlyRate * ((1 + monthlyRate) ** months)) / (((1 + monthlyRate) ** months) - 1);
  const totalPayment = monthlyPayment * months;
  const totalInterest = totalPayment - creditLimit;

  return {
    propertyValue: roundMoney(property),
    downPaymentPercent: roundMoney(downPercent),
    downPaymentAmount: roundMoney(downPaymentAmount),
    creditLimit: roundMoney(creditLimit),
    annualInterestRate: roundMoney(interest),
    loanYears: years,
    monthlyPayment: roundMoney(monthlyPayment),
    totalPayment: roundMoney(totalPayment),
    totalInterest: roundMoney(totalInterest)
  };
}

export function calculateProfitLoss({ purchasePrice, currentValue, monthlyRent, monthlyExpenses, otherMonthlyIncome = 0 }) {
  const purchase = Number(purchasePrice);
  const current = Number(currentValue);
  const rent = Number(monthlyRent);
  const expenses = Number(monthlyExpenses);
  const otherIncome = Number(otherMonthlyIncome);

  if (purchase < 0 || current < 0 || rent < 0 || expenses < 0 || otherIncome < 0) {
    throw new Error('Financial values cannot be negative.');
  }

  const monthlyProfit = rent + otherIncome - expenses;
  const yearlyProfit = monthlyProfit * 12;
  const dailyProfit = yearlyProfit / 365;
  const capitalGainLoss = current - purchase;
  const totalYearOneProfitLoss = yearlyProfit + capitalGainLoss;
  const roiPercent = purchase === 0 ? 0 : (yearlyProfit / purchase) * 100;

  return {
    monthlyProfit: roundMoney(monthlyProfit),
    yearlyProfit: roundMoney(yearlyProfit),
    dailyProfit: roundMoney(dailyProfit),
    capitalGainLoss: roundMoney(capitalGainLoss),
    totalYearOneProfitLoss: roundMoney(totalYearOneProfitLoss),
    roiPercent: roundMoney(roiPercent)
  };
}

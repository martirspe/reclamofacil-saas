const moment = require('moment');

exports.formatDate = (date) => moment(date).format('DD/MM/YYYY - hh:mmA');

exports.prepareEmailData = (reclamo) => {
  const {
    code,
    order_number,
    claimed_amount,
    description,
    detail,
    request,
    district,
    province,
    department,
    Customer,
    ConsumptionType,
    ClaimType,
    Currency,
  } = reclamo;

  const currencySymbol = Currency?.symbol || '';
  const currencyCode = Currency?.code || '';
  const numericAmount = Number(claimed_amount);
  const amountFormatted = Number.isFinite(numericAmount)
    ? `${currencySymbol ? `${currencySymbol} ` : ''}${numericAmount.toFixed(2)}`
    : claimed_amount;

  // Construir información de ubicación
  const locationInfo = [district, province, department]
    .filter(Boolean)
    .join(' / ');

  return {
    claimCode: code,
    customerFirstName: Customer.first_name,
    customerLastName: Customer.last_name,
    consumptionType: ConsumptionType.name,
    claimType: ClaimType.name,
    orderNumber: order_number,
    claimedAmount: amountFormatted,
    currencyCode,
    currencySymbol,
    claimDescription: description,
    claimDetail: detail,
    claimRequest: request,
    locationInfo: locationInfo || null,
  };
};
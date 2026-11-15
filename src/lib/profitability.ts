/**
 * Deterministic Profitability Calculation Engine
 * All math performed here — Gemini is never used for financial calculations.
 */

import type { FulfillmentSettings, ProfitabilityResult, ReferencePriceConfig } from '@/types';
import { DEFAULT_REFERENCE_PRICES } from '@/types';

export function calculateProfitability(
  supplierPriceCNY: number | null | undefined,
  supplierPriceUSD: number | null | undefined,
  settings: FulfillmentSettings,
  referencePrices?: ReferencePriceConfig[],
): ProfitabilityResult {
  const prices = referencePrices ?? DEFAULT_REFERENCE_PRICES;

  // ── 1. Convert supplier cost to USD ────────────────────────────────────
  let supplierCostUSD: number;
  if (supplierPriceUSD != null && supplierPriceUSD > 0) {
    supplierCostUSD = supplierPriceUSD;
  } else if (supplierPriceCNY != null && supplierPriceCNY > 0) {
    supplierCostUSD = supplierPriceCNY * settings.cny_to_usd_rate;
  } else {
    supplierCostUSD = 0;
  }

  // ── 2. Per-unit cost components ────────────────────────────────────────
  const chinaDomesticShipping = settings.china_domestic_shipping_usd;
  const sourcingAgentFee = supplierCostUSD * (settings.sourcing_agent_fee_pct / 100);
  const internationalShipping = settings.international_shipping_usd;
  const packagingCost = settings.packaging_cost_usd;
  const customsDuty = supplierCostUSD * (settings.customs_duty_pct / 100);

  const totalLandedCost =
    supplierCostUSD +
    chinaDomesticShipping +
    sourcingAgentFee +
    internationalShipping +
    packagingCost +
    customsDuty;

  // ── 3. Choose best reference price ────────────────────────────────────
  // Find the most profitable reference price that still allows target margin
  let bestPrice: number | null = null;
  let bestConfig: string | null = null;

  for (const ref of prices.filter(p => p.is_active)) {
    const sellingPrice = ref.retail_price_usd;
    const etsyListingFee = settings.etsy_listing_fee_usd;
    const etsyTransactionFee = sellingPrice * (settings.etsy_transaction_fee_pct / 100);
    const etsyPaymentProcessing = sellingPrice * (settings.etsy_payment_processing_pct / 100);
    const advertisingCost = settings.advertising_cost_usd;
    const damageRefundAllowance = sellingPrice * (settings.damage_refund_pct / 100);

    const totalFees =
      etsyListingFee + etsyTransactionFee + etsyPaymentProcessing + advertisingCost + damageRefundAllowance;

    const netProfit = sellingPrice - totalLandedCost - totalFees;
    const margin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

    if (margin >= settings.target_margin_pct) {
      if (bestPrice === null || sellingPrice > bestPrice) {
        bestPrice = sellingPrice;
        bestConfig = ref.config_name;
      }
    }
  }

  // If no reference price meets target, use the highest reference price
  if (bestPrice === null) {
    const activePrices = prices.filter(p => p.is_active);
    if (activePrices.length > 0) {
      const highest = activePrices.reduce((a, b) =>
        a.retail_price_usd > b.retail_price_usd ? a : b
      );
      bestPrice = highest.retail_price_usd;
      bestConfig = highest.config_name;
    } else {
      bestPrice = 0;
    }
  }

  const suggestedSellingPrice = bestPrice;

  // ── 4. Fee calculations based on suggested price ───────────────────────
  const etsyListingFee = settings.etsy_listing_fee_usd;
  const etsyTransactionFee = suggestedSellingPrice * (settings.etsy_transaction_fee_pct / 100);
  const etsyPaymentProcessing = suggestedSellingPrice * (settings.etsy_payment_processing_pct / 100);
  const advertisingCost = settings.advertising_cost_usd;
  const damageRefundAllowance = suggestedSellingPrice * (settings.damage_refund_pct / 100);

  const totalFeesAndCosts =
    totalLandedCost + etsyListingFee + etsyTransactionFee + etsyPaymentProcessing + advertisingCost + damageRefundAllowance;

  const estimatedNetProfit = suggestedSellingPrice - totalFeesAndCosts;
  const netProfitMarginPct = suggestedSellingPrice > 0
    ? (estimatedNetProfit / suggestedSellingPrice) * 100
    : 0;
  const returnOnCostPct = totalLandedCost > 0
    ? (estimatedNetProfit / totalLandedCost) * 100
    : 0;

  // ── 5. Break-even price ────────────────────────────────────────────────
  // Break-even: sellingPrice - totalLandedCost - (sellingPrice * fee_rate) = 0
  // sellingPrice * (1 - fee_rate) = totalLandedCost
  const feeRate =
    (settings.etsy_transaction_fee_pct + settings.etsy_payment_processing_pct + settings.damage_refund_pct) / 100;
  const fixedFees = etsyListingFee + advertisingCost;

  const breakEvenPrice = (totalLandedCost + fixedFees) / (1 - feeRate);

  // ── 6. Max supplier price at target margin ─────────────────────────────
  // netProfit / sellingPrice >= target_margin_pct / 100
  // (selling - landed_cost_base - sourcing_pct * supplier - customs_pct * supplier - fees) / selling >= target
  // This requires iterative or algebraic approach; use simplified linear approximation:
  const targetMarginDecimal = settings.target_margin_pct / 100;
  const availableForCost = suggestedSellingPrice * (1 - targetMarginDecimal) - fixedFees -
    etsyTransactionFee - etsyPaymentProcessing - damageRefundAllowance -
    chinaDomesticShipping - internationalShipping - packagingCost;
  const maxSupplierPriceFactor = 1 + (settings.sourcing_agent_fee_pct / 100) + (settings.customs_duty_pct / 100);
  const maxSupplierPriceAtTargetMargin = availableForCost > 0 ? availableForCost / maxSupplierPriceFactor : 0;

  const meetsTargetMargin = netProfitMarginPct >= settings.target_margin_pct;

  return {
    supplier_cost_usd: round4(supplierCostUSD),
    china_domestic_shipping: round4(chinaDomesticShipping),
    sourcing_agent_fee: round4(sourcingAgentFee),
    international_shipping: round4(internationalShipping),
    packaging_cost: round4(packagingCost),
    customs_duty: round4(customsDuty),
    total_landed_cost: round4(totalLandedCost),
    etsy_listing_fee: round4(etsyListingFee),
    etsy_transaction_fee: round4(etsyTransactionFee),
    etsy_payment_processing: round4(etsyPaymentProcessing),
    advertising_cost: round4(advertisingCost),
    damage_refund_allowance: round4(damageRefundAllowance),
    total_fees_and_costs: round4(totalFeesAndCosts),
    suggested_selling_price: round2(suggestedSellingPrice),
    estimated_net_profit: round4(estimatedNetProfit),
    net_profit_margin_pct: round2(netProfitMarginPct),
    return_on_cost_pct: round2(returnOnCostPct),
    break_even_price: round2(breakEvenPrice),
    max_supplier_price_at_target_margin: round4(maxSupplierPriceAtTargetMargin),
    meets_target_margin: meetsTargetMargin,
    reference_price_config: bestConfig,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export function percentToRatio(percent: number): number {
  return percent / 100;
}

export function ratioToPercent(ratio: number): number {
  return ratio * 100;
}

// 修复历史记录中被多除一次 100 的比例值（例如 70% 被存成 0.007）。
// 酒店出租率与餐饮/客房比低于 1% 视为异常，按多除一次 100 还原。
export function repairLegacyRatio(value: number): number {
  return value > 0 && value < 0.01 ? value * 100 : value;
}

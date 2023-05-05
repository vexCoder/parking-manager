import _ from "lodash";
import { PixelRatio } from "react-native";

const bp = {
  xs: 1.5,
  sm: 2,
  md: 2.5,
  lg: 3,
  xl: 4,
};

export const mapBreakpoint = <T>(values: T[]) => {
  const ratio = PixelRatio.get();
  let value = values[0];
  if (ratio <= bp.xl) value = values[4];
  if (ratio <= bp.lg) value = values[3];
  if (ratio <= bp.md) value = values[2];
  if (ratio <= bp.sm) value = values[1];
  if (ratio <= bp.xs) value = values[0];

  if (value === undefined) value = _.last(values) as T;

  return value;
};

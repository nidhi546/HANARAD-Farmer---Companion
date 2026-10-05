/**
 * Shared sizing for the floating custom tab bar (BottomTabNavigator).
 * The bar is absolutely positioned, so tab screens must leave this much
 * space at the bottom of their scroll content or it hides behind the bar.
 */
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const TAB_BAR_HEIGHT = 62;
export const TAB_BAR_FAB_DIAMETER = 60;
export const TAB_BAR_FAB_LIFT = 26;

// Bottom padding the bar adds itself (see CustomBar root style).
export function tabBarBottomPadding(insets) {
  return insets.bottom || 12;
}

// Space a tab screen should reserve below its last item.
export function useTabBarSpace(extra = 24) {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + tabBarBottomPadding(insets) + extra;
}

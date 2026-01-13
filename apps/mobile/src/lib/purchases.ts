import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOfferings,
} from 'react-native-purchases'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

// Get API key based on platform
const REVENUECAT_API_KEY = Platform.select({
  ios: Constants.expoConfig?.extra?.revenuecatApiKeyIos as string,
  android: Constants.expoConfig?.extra?.revenuecatApiKeyAndroid as string,
})

/**
 * Initialize RevenueCat with the user ID from Supabase auth
 * Call this after user authentication
 */
export async function initializePurchases(userId: string): Promise<void> {
  if (!REVENUECAT_API_KEY) {
    console.warn(
      'RevenueCat API key not configured. ' +
        'Please set EXPO_PUBLIC_REVENUECAT_API_KEY_IOS and/or ' +
        'EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID in your environment.'
    )
    return
  }

  try {
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId,
    })
  } catch (error) {
    console.error('Failed to configure RevenueCat:', error)
  }
}

/**
 * Get available offerings (products)
 */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  try {
    const offerings = await Purchases.getOfferings()
    return offerings
  } catch (error) {
    console.error('Failed to get offerings:', error)
    return null
  }
}

/**
 * Purchase a package (subscription or one-time)
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ customerInfo: CustomerInfo | null; error: Error | null }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg)
    return { customerInfo, error: null }
  } catch (error) {
    // Check if user cancelled
    if ((error as { userCancelled?: boolean }).userCancelled) {
      return { customerInfo: null, error: null }
    }
    return { customerInfo: null, error: error as Error }
  }
}

/**
 * Restore purchases (useful for new device or reinstall)
 */
export async function restorePurchases(): Promise<{
  customerInfo: CustomerInfo | null
  error: Error | null
}> {
  try {
    const customerInfo = await Purchases.restorePurchases()
    return { customerInfo, error: null }
  } catch (error) {
    return { customerInfo: null, error: error as Error }
  }
}

/**
 * Get current customer info (entitlements, subscriptions)
 */
export async function getCustomerInfo(): Promise<{
  customerInfo: CustomerInfo | null
  error: Error | null
}> {
  try {
    const customerInfo = await Purchases.getCustomerInfo()
    return { customerInfo, error: null }
  } catch (error) {
    return { customerInfo: null, error: error as Error }
  }
}

/**
 * Check if user has active "plus" entitlement
 */
export function checkPlusEntitlement(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active['plus'] !== undefined
}

/**
 * Log out from RevenueCat (when user signs out)
 */
export async function logOutPurchases(): Promise<void> {
  try {
    await Purchases.logOut()
  } catch (error) {
    console.error('Failed to log out from RevenueCat:', error)
  }
}

// Offering identifiers
export const OFFERING_IDS = {
  PLUS_SUBSCRIPTION: 'plus_monthly',
  CREDIT_50: 'credit_50',
  CREDIT_100: 'credit_100',
  CREDIT_250: 'credit_250',
} as const

// Entitlement identifiers
export const ENTITLEMENT_IDS = {
  PLUS: 'plus',
} as const

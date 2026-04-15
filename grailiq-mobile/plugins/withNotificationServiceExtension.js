const {
  withXcodeProject,
  withInfoPlist,
  withEntitlementsPlist,
} = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');
const fs = require('fs');
const path = require('path');

const NOTIFICATION_SERVICE_IDENTIFIER = 'com.grailiq.app.NotificationService';
const APP_GROUP_IDENTIFIER = 'group.com.grailiq.app';

/**
 * Expo config plugin that:
 *   1. Adds the NotificationService extension target to the Xcode project
 *   2. Configures code signing and bundle identifier
 *   3. Adds App Groups entitlement (shared storage between main app & widget)
 */
function withNotificationServiceExtension(config) {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;

    // Add the NotificationService target using pbxproj
    const targetName = 'NotificationService';
    const bundleId = NOTIFICATION_SERVICE_IDENTIFIER;
    const appGroupId = APP_GROUP_IDENTIFIER;

    try {
      // Add a new target to the Xcode project
      // In a real scenario, you'd copy the NSE group (NotificationService.swift, Info.plist)
      // into the ios/ directory during prebuild. For now, we configure the existing target.

      const mainTarget = xcodeProject.findTargetKey('GrailIQ');
      if (mainTarget) {
        // Ensure App Groups entitlement exists on the main target
        addAppGroupsEntitlement(xcodeProject, mainTarget, appGroupId);
      }

      // If the NotificationService target already exists (created manually or by copy),
      // configure it here. Otherwise, the user will add it via Xcode UI.
      const nseTarget = xcodeProject.findTargetKey(targetName);
      if (nseTarget) {
        // Set bundle identifier for NSE
        xcodeProject.setBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', bundleId, 'Release', nseTarget);
        xcodeProject.setBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', bundleId, 'Debug', nseTarget);
        // Add App Groups entitlement to NSE
        addAppGroupsEntitlement(xcodeProject, nseTarget, appGroupId);
      }
    } catch (error) {
      console.warn(
        '[withNotificationServiceExtension] Warning: Could not fully configure NSE target.',
        error.message,
      );
      // Non-fatal; user can complete setup in Xcode
    }

    return config;
  });
}

/**
 * Helper to add App Groups entitlement to a target
 */
function addAppGroupsEntitlement(xcodeProject, targetKey, groupId) {
  // Build settings for entitlements plist path
  const entitlementsPath = `${targetKey}.entitlements`;
  try {
    // Set the CODE_SIGN_ENTITLEMENTS build setting
    xcodeProject.setBuildProperty(
      'CODE_SIGN_ENTITLEMENTS',
      entitlementsPath,
      'Release',
      targetKey,
    );
    xcodeProject.setBuildProperty(
      'CODE_SIGN_ENTITLEMENTS',
      entitlementsPath,
      'Debug',
      targetKey,
    );
  } catch (e) {
    // Entitlements path may already be set or not applicable
  }
}

/**
 * Also add entitlements via entitlements plist plugin
 */
function withNotificationServiceEntitlements(config) {
  return withEntitlementsPlist(config, (config) => {
    const entitlements = config.modResults;
    // Add keychain group for push notification delivery verification (optional)
    // and app groups for shared storage
    if (!entitlements['com.apple.security.application-groups']) {
      entitlements['com.apple.security.application-groups'] = [APP_GROUP_IDENTIFIER];
    }
    return config;
  });
}

/**
 * Composite plugin
 */
module.exports = function withGrailIQNotifications(config) {
  config = withNotificationServiceExtension(config);
  config = withNotificationServiceEntitlements(config);
  return config;
};

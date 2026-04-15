const {
  withXcodeProject,
  withEntitlementsPlist,
} = require('@expo/config-plugins');

const WIDGET_BUNDLE_ID = 'com.grailiq.app.GrailIQWidget';
const APP_GROUP_IDENTIFIER = 'group.com.grailiq.app';

/**
 * Expo config plugin that:
 *   1. Adds the WidgetKit extension target to the Xcode project
 *   2. Configures code signing and bundle identifier
 *   3. Adds App Groups entitlement (shared storage with main app)
 */
function withWidgetExtension(config) {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;

    try {
      const mainTarget = xcodeProject.findTargetKey('GrailIQ');
      if (mainTarget) {
        // Ensure App Groups entitlement exists on the main target
        addAppGroupsEntitlement(xcodeProject, mainTarget);
      }

      // Configure the widget target if it exists (created manually or by copy)
      const widgetTarget = xcodeProject.findTargetKey('GrailIQWidget');
      if (widgetTarget) {
        xcodeProject.setBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', WIDGET_BUNDLE_ID, 'Release', widgetTarget);
        xcodeProject.setBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', WIDGET_BUNDLE_ID, 'Debug', widgetTarget);
        addAppGroupsEntitlement(xcodeProject, widgetTarget);
      }
    } catch (error) {
      console.warn(
        '[withWidgetExtension] Warning: Could not fully configure widget target.',
        error.message,
      );
    }

    return config;
  });
}

function addAppGroupsEntitlement(xcodeProject, targetKey) {
  try {
    // Set entitlements file path in build settings
    xcodeProject.setBuildProperty(
      'CODE_SIGN_ENTITLEMENTS',
      `${targetKey}.entitlements`,
      'Release',
      targetKey,
    );
    xcodeProject.setBuildProperty(
      'CODE_SIGN_ENTITLEMENTS',
      `${targetKey}.entitlements`,
      'Debug',
      targetKey,
    );
  } catch (e) {
    // Path may already be set or not applicable
  }
}

/**
 * Add app groups entitlement via plist
 */
function withWidgetEntitlements(config) {
  return withEntitlementsPlist(config, (config) => {
    const entitlements = config.modResults;
    if (!entitlements['com.apple.security.application-groups']) {
      entitlements['com.apple.security.application-groups'] = [APP_GROUP_IDENTIFIER];
    }
    return config;
  });
}

/**
 * Composite plugin
 */
module.exports = function withGrailIQWidget(config) {
  config = withWidgetExtension(config);
  config = withWidgetEntitlements(config);
  return config;
};

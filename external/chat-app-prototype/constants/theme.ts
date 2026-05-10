// Theme constants for iMessage app

// Color primitives
const ColorPrimitives = {
  // Base colors
  white: '#ffffff',
  black: '#000000',
  blue: '#007aff',
  red: '#ff002d',

  // Gray scale
  gray100: '#f2f2f7',
  gray200: '#f2f2f2',
  gray300: '#e9e9eb',
  gray400: '#e0e0e0',
  gray500: '#c9c9cb',
  gray600: '#c8c7cc',
  gray700: '#a2a1a3',
  gray800: '#909093',
  gray900: '#8e8e93',
} as const;

export const Colors = {
  // Primary Colors
  systemBlue: ColorPrimitives.blue,
  systemRed: ColorPrimitives.red,

  // Text Colors
  white: ColorPrimitives.white,
  black: ColorPrimitives.black,
  textSecondary: ColorPrimitives.gray900,
  textTertiary: ColorPrimitives.gray800,
  placeholder: ColorPrimitives.gray500,
  inputIcon: ColorPrimitives.gray800,
  micIcon: ColorPrimitives.gray700,
  dividerGray: ColorPrimitives.gray600,

  // Background Colors
  messageBubbleGray: ColorPrimitives.gray300,
  messageBubbleBlue: ColorPrimitives.blue,
  inputBackground: 'rgba(255, 255, 255, 0.9)',
  blurBackground: 'rgba(255, 255, 255, 0.75)',
  semiTransparentWhite: '#FFFFFF80',
  addButtonBackground: ColorPrimitives.gray300,
  screenBackground: ColorPrimitives.white,
  inboxBackground: ColorPrimitives.gray100,
  chatItemBackground: ColorPrimitives.white,
  groupAvatarBackground: ColorPrimitives.gray200,
  avatarPlaceholder: ColorPrimitives.gray400,

  // Border Colors
  border: ColorPrimitives.gray300,
  inputBorder: ColorPrimitives.gray300,
  reactionBorder: ColorPrimitives.white,
} as const;

export const Typography = {
  fontFamily: 'SF Pro',

  // Font Sizes
  message: 16,
  timestamp: 13,
  contactName: 11,
  input: 17,
  delivered: 12,
  reactionEmoji: 14,
  chatItemPreview: 15,

  // Font Weights
  regular: '400' as const,
  medium: '500' as const,
  bold: 'bold' as const,

  // Line Heights
  messageLineHeight: 20,
  timestampLineHeight: 14,
  inputLineHeight: 20,
  chatItemNameLineHeight: 22,
} as const;

export const Spacing = {
  // Padding
  messagePadding: 12,
  messagePaddingVertical: 7,
  containerPadding: 16,
  inputPadding: 12,
  inputPaddingVertical: 8,

  // Margins
  messageMargin: 1,
  groupSpacing: 8,
  timestampMargin: 16,
  deliveredMarginTop: 2,

  // Specific measurements
  inputHeight: 38,
  addButtonSize: 34,
  profileImageSize: 50,
  reactionSize: 34,
  iconSize: 22,
  smallIconSize: 16,
  micIconContainerSize: 16,
  micIconContainerRight: 12,
  reactionContainerHeight: 43,
  reactionContainerWidth: 35,
  reactionTailSize: 30,
  tailDotLargeSize: 10,
  tailDotSmallSize: 5,

  // Avatar sizes
  avatarSize: 45,

  // Inbox specific
  chatItemRowGap: 6,
  chatItemRowPaddingBottom: 6,
  chatItemRowPaddingLeft: 26,
  chatItemContainerPaddingRight: 17,
  chatItemContainerGap: 10,
  unreadIndicatorSize: 11,
  unreadIndicatorLeft: 8,
  unreadIndicatorTop: 32.5,
  groupAvatar1Size: 24,
  groupAvatar2Size: 14,
  groupAvatar1Position: 5,
  groupAvatar2Position: 7,
  chevronSize: 13,
  nameMaxWidth: 200,
  timeContainerWidth: 110,
  separatorMarginLeft: 78,

  // Border radius
  messageBorderRadius: 16,
  inputBorderRadius: 80,
  addButtonBorderRadius: 17,
  profileBorderRadius: 25,
  reactionBorderRadius: 17,
  tailDotBorderRadius: 100,
  avatarBorderRadius: 22.5,
  groupAvatar1BorderRadius: 12,
  groupAvatar2BorderRadius: 7,
  unreadIndicatorBorderRadius: 5.5,
} as const;

export const Layout = {
  // Keyboard
  keyboardAnimationDuration: 250,
  deliveredDelay: 1500,

  // Message constraints
  maxMessageWidth: '75%',
  messageMarginSide: '0%',

  // Navigation
  navigationHeight: 44,
  navigationPaddingTop: 75,
  navigationPaddingBottom: 16,
  navigationButtonSize: 44,

  // Input
  inputPaddingBottom: 34,
  inputPaddingBottomKeyboard: 8,
} as const;

import { Colors } from '../constants/theme';

/**
 * Formats a color string by adding # prefix if needed
 */
const formatColor = (color?: string): string | undefined => {
  if (!color) return undefined;
  return color.startsWith('#') ? color : `#${color}`;
};

/**
 * Checks if a background color is white or very close to white
 */
const isWhiteBackground = (bgColor?: string): boolean => {
  if (!bgColor) return false;

  const color = formatColor(bgColor);
  if (!color) return false;

  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Check if all RGB values are close to white (above 240)
  return r > 240 && g > 240 && b > 240;
};

/**
 * Adds transparency to a color for softer appearance
 */
export const addTransparency = (
  color?: string,
  opacity: number = 0.6
): string | undefined => {
  if (!color) return undefined;

  const formattedColor = formatColor(color);
  if (!formattedColor) return undefined;

  // Convert hex to RGB and add alpha
  const hex = formattedColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

interface DynamicStyles {
  bubbleBackground: string;
  titleColor: string | undefined;
  artistColor: string | undefined;
  labelColor: string | undefined;
  iconColor: string | undefined;
  backgroundStrokeColor: string | undefined;
}

/**
 * Generates dynamic styles based on Apple Music artwork colors
 */
export const getDynamicStyles = (
  artworkColors:
    | {
        bgColor?: string;
        textColor1?: string;
        textColor2?: string;
        textColor3?: string;
        textColor4?: string;
      }
    | undefined,
  isSender: boolean,
  shouldUseApiColors: boolean
): DynamicStyles => {
  if (shouldUseApiColors && artworkColors) {
    return {
      bubbleBackground: isWhiteBackground(artworkColors.bgColor)
        ? Colors.messageBubbleGray
        : formatColor(artworkColors.bgColor) || Colors.messageBubbleGray,
      titleColor: formatColor(artworkColors.textColor1),
      artistColor: formatColor(artworkColors.textColor2),
      labelColor: formatColor(artworkColors.textColor3),
      iconColor: formatColor(artworkColors.textColor3),
      backgroundStrokeColor: addTransparency(artworkColors.textColor4, 0.4),
    };
  }

  // Default colors based on sender
  return {
    bubbleBackground: isSender ? Colors.systemBlue : Colors.messageBubbleGray,
    titleColor: isSender ? Colors.white : Colors.black,
    artistColor: isSender ? Colors.white : Colors.black,
    labelColor: isSender ? Colors.white : Colors.black,
    iconColor: isSender ? Colors.white : Colors.black,
    backgroundStrokeColor: undefined,
  };
};

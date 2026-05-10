import { addTransparency, getDynamicStyles } from '../colorHelpers';
import { Colors } from '../../constants/theme';

describe('addTransparency', () => {
  it('returns undefined for missing color', () => {
    expect(addTransparency(undefined)).toBeUndefined();
  });

  it('produces an rgba string with the requested opacity', () => {
    expect(addTransparency('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('accepts colors without leading #', () => {
    expect(addTransparency('00ff00', 0.25)).toBe('rgba(0, 255, 0, 0.25)');
  });

  it('uses 0.6 as the default opacity', () => {
    expect(addTransparency('#0000ff')).toBe('rgba(0, 0, 255, 0.6)');
  });
});

describe('getDynamicStyles', () => {
  it('falls back to sender defaults when API colors should not be used', () => {
    const styles = getDynamicStyles(undefined, true, false);
    expect(styles.bubbleBackground).toBe(Colors.systemBlue);
    expect(styles.titleColor).toBe(Colors.white);
    expect(styles.backgroundStrokeColor).toBeUndefined();
  });

  it('falls back to recipient defaults when not sender', () => {
    const styles = getDynamicStyles(undefined, false, false);
    expect(styles.bubbleBackground).toBe(Colors.messageBubbleGray);
    expect(styles.titleColor).toBe(Colors.black);
  });

  it('applies API artwork colors when allowed', () => {
    const styles = getDynamicStyles(
      {
        bgColor: '123456',
        textColor1: 'ffffff',
        textColor2: 'eeeeee',
        textColor3: 'cccccc',
        textColor4: 'aaaaaa',
      },
      false,
      true
    );
    expect(styles.bubbleBackground).toBe('#123456');
    expect(styles.titleColor).toBe('#ffffff');
    expect(styles.backgroundStrokeColor).toMatch(/^rgba\(170, 170, 170/);
  });

  it('avoids near-white API backgrounds in favor of message bubble gray', () => {
    const styles = getDynamicStyles({ bgColor: 'fafafa' }, false, true);
    expect(styles.bubbleBackground).toBe(Colors.messageBubbleGray);
  });
});

// The pixel theme for react-native-calendars. Shared by the Diary calendar and
// CalendarPickerModal, so every calendar in the app draws the same grid.
import { PIXEL, PIXEL_BOLD, TYPE } from './typography';
import { OUTLINE, PAPER, INK, INK_MUTED, BORDER_W_INNER } from './pixel';

export const TODAY_ACCENT = '#4F46E5';

// The arrow's total footprint, unchanged from the bare chevron it replaces.
// The month title only has ~188px between the two arrows and "September 2026"
// takes 173px of it, so an arrow that grew even a few px would push the title
// into wrapping -- the box is drawn INSIDE the old 20px, not around it.
export const ARROW_BOX = 20;

export const CALENDAR_THEME = {
    calendarBackground: PAPER,
    textSectionTitleColor: INK_MUTED,
    selectedDayBackgroundColor: INK,
    selectedDayTextColor: '#ffffff',
    todayTextColor: TODAY_ACCENT,
    dayTextColor: '#1F2937',
    textDisabledColor: '#CBD5E1',
    arrowColor: INK,
    // The calendar renders its own text, so the pixel face has to be handed to it here
    textDayFontFamily: PIXEL,
    textMonthFontFamily: PIXEL_BOLD,
    textDayHeaderFontFamily: PIXEL_BOLD,
    textDayFontSize: TYPE.bodyLg.fontSize, // 14: Silkscreen is wide -- 16 crowded the day cells
    'stylesheet.calendar.header': {
        // The library's weekday label is a 32px, single-line box. In the bold pixel
        // face at 12, "SUN" is 33px and "MON" 34.5px, so both were cut to "SU…" /
        // "MO…". Restated wholesale (like every key here) at the day-cell width, and
        // at 11, where the widest label, "MON", is 31.6px.
        dayHeader: {
            marginTop: 2,
            marginBottom: 7,
            width: 34,
            textAlign: 'center',
            fontSize: 11,
            fontFamily: PIXEL_BOLD,
            color: INK_MUTED,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingLeft: 10,
            paddingRight: 10,
            marginTop: 6,
            alignItems: 'center',
            marginBottom: 10,
        },
        // The library wraps renderHeader() in this view and ships it without a flex,
        // so it sized to the month name and carried the right arrow out of the row --
        // "September 2026" alone is wider than the space between the two arrows.
        // flex:1 pins it to the middle third; since both arrows are the same width,
        // that region is exactly centered, which is what centers the title.
        headerContainer: {
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
        },
        week: {
            marginTop: 5,
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingBottom: 5,
            // Hard rule under the weekday names, so the grid reads as a drawn table
            borderBottomWidth: BORDER_W_INNER,
            borderBottomColor: OUTLINE,
        }
    },
    // Square day cells. Each key here REPLACES the library's own wholesale, so
    // anything the default supplied (a background colour, a radius) is restated.
    'stylesheet.day.basic': {
        base: {
            // 34 outer less the 2px border each side = a 30x30 content box, which is
            // what the day number (~20px with its marginTop) and the dot row (8px) need.
            width: 34,
            height: 34,
            alignItems: 'center',
            // Every cell carries the border and only its COLOUR changes, so selecting
            // a day cannot shrink that one cell's content box and jog its number down
            // while the rest of the row stays put.
            borderWidth: BORDER_W_INNER,
            borderColor: 'transparent',
        },
        selected: {
            backgroundColor: INK,
            borderColor: OUTLINE,
            borderRadius: 0, // Replaces the library's 16 -- pixel cells are square
        },
        today: {
            backgroundColor: 'transparent',
            borderColor: TODAY_ACCENT,
            borderRadius: 0,
        },
    },
    'stylesheet.dot': {
        dot: {
            width: 6,
            height: 6,
            borderRadius: 0, // Square pips rather than round dots
            marginTop: 2,
            marginHorizontal: 1,
            // Restated deliberately: this is how the library hides the pip on an
            // unmarked day, and overriding `dot` wholesale drops it. Losing it went
            // unnoticed only because an unmarked pip has no backgroundColor to show.
            opacity: 0,
        }
    }
} as const;

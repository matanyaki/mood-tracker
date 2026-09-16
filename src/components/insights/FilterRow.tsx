import React from 'react';
import { View, StyleSheet } from 'react-native';
import PixelSelect from '../ui/PixelSelect';

interface FilterRowProps {
    selectedMonth: string;
    setSelectedMonth: (month: string) => void;
    selectedYear: string;
    setSelectedYear: (year: string) => void;
    years: string[];
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Month and year selection for InsightsScreen.
 *
 * The @react-native-picker/picker dropdowns this replaces render as native
 * controls -- a rounded iOS wheel and a Material dialog -- and neither takes a
 * square outline or the pixel face, so there was no way to style them into the
 * rest of the screen. PixelSelect is drawn by us, so it can be.
 */
export const FilterRow = React.memo(function FilterRow({
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    years
}: FilterRowProps) {
    const monthOptions = MONTH_NAMES.map((label, i) => ({
        label,
        value: (i + 1).toString(),
    }));

    const yearOptions = years.map(y => ({ label: y, value: y }));

    return (
        <View style={styles.container}>
            {/* Month runs wider: "SEPTEMBER" is nine characters of a typeface that
                draws ~0.76em per character, against four for any year. */}
            <PixelSelect
                eyebrow="[ MONTH ]"
                options={monthOptions}
                value={selectedMonth}
                onChange={setSelectedMonth}
                flex={1.7}
            />
            <PixelSelect
                eyebrow="[ YEAR ]"
                options={yearOptions}
                value={selectedYear}
                onChange={setSelectedYear}
                flex={1}
            />
        </View>
    );
});

FilterRow.displayName = 'FilterRow';

export default FilterRow;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
});

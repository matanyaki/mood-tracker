import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface FilterRowProps {
    selectedMonth: string;
    setSelectedMonth: (month: string) => void;
    selectedYear: string;
    setSelectedYear: (year: string) => void;
    years: string[];
}

export default function FilterRow({
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    years
}: FilterRowProps) {
    return (
        <View style={styles.filterRow}>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedMonth}
                    onValueChange={(itemValue) => setSelectedMonth(itemValue)}
                    style={styles.picker}
                >
                    {Array.from({ length: 12 }, (_, i) => (
                        <Picker.Item
                            key={i}
                            label={new Date(0, i).toLocaleString('default', { month: 'long' })}
                            value={(i + 1).toString()}
                        />
                    ))}
                </Picker>
            </View>

            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedYear}
                    onValueChange={(itemValue) => setSelectedYear(itemValue)}
                    style={styles.picker}
                >
                    {years.map(y => <Picker.Item key={y} label={y} value={y} />)}
                </Picker>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 10
    },
    pickerContainer: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        borderColor: '#e2e8f0',
        borderWidth: 1
    },
    picker: {
        height: 50,
    }
});

import React from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { T } from "../services/theme";

// ─── Section wrapper ───────────────────────────────────────────
export const Card = ({ children, style }: any) => (
    <View style={[styles.card, style]}>{children}</View>
);

// ─── Section label (ALL-CAPS small label) ──────────────────────
export const SectionLabel = ({ children }: any) => (
    <Text style={styles.sectionLabel}>{children}</Text>
);

// ─── Stat card ─────────────────────────────────────────────────
export const StatCard = ({ label, value, valueColor }: any) => (
    <View style={styles.statCard}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, valueColor && { color: valueColor }]}>
            {value}
        </Text>
    </View>
);

// ─── Action button ─────────────────────────────────────────────
type BtnVariant = "default" | "primary" | "success" | "danger" | "warning";

export const Btn = ({
    label,
    onPress,
    variant = "default",
    disabled,
}: {
    label: string;
    onPress?: () => void;
    variant?: BtnVariant;
    disabled?: boolean;
}) => {
    const v = {
        default: { bg: T.surface, text: T.muted, border: T.border },
        primary: { bg: T.purple.bg, text: T.purple.text, border: T.purple.border },
        success: { bg: T.green.bg, text: T.green.text, border: T.green.border },
        danger: { bg: T.surface, text: T.red.text, border: T.red.border },
        warning: { bg: T.amber.bg, text: T.amber.text, border: T.amber.border },
    }[variant];

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            style={[
                styles.btn,
                { backgroundColor: v.bg, borderColor: v.border },
                disabled && { opacity: 0.4 },
            ]}
        >
            <Text style={[styles.btnText, { color: v.text }]}>{label}</Text>
        </TouchableOpacity>
    );
};

// ─── Status badge (pill) ───────────────────────────────────────
export const Badge = ({ label, variant = "default" }: { label: string; variant?: BtnVariant }) => {
    const v = {
        default: { bg: T.surface, text: T.muted, border: T.border },
        primary: { bg: T.purple.bg, text: T.purple.text, border: T.purple.border },
        success: { bg: T.green.bg, text: T.green.text, border: T.green.border },
        danger: { bg: T.red.bg, text: T.red.text, border: T.red.border },
        warning: { bg: T.amber.bg, text: T.amber.text, border: T.amber.border },
    }[variant];

    return (
        <View style={[styles.badge, { backgroundColor: v.bg, borderColor: v.border }]}>
            <Text style={[styles.badgeText, { color: v.text }]}>{label}</Text>
        </View>
    );
};

// ─── Status dot + label ────────────────────────────────────────
export const StatusRow = ({ status }: { status: "running" | "paused" | "stopped" | "connected" | "disconnected" | string }) => {
    const map: Record<string, { color: string; label: string }> = {
        running: { color: T.green.text, label: "Running" },
        connected: { color: T.green.text, label: "Connected" },
        paused: { color: T.amber.text, label: "Paused" },
        stopped: { color: T.red.text, label: "Stopped" },
        disconnected: { color: T.red.text, label: "Disconnected" },
        completed: { color: "#60A5FA", label: "Completed" },
    };
    const s = map[status] ?? { color: T.muted, label: status };
    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.color }} />
            <Text style={{ color: s.color, fontSize: 13, fontWeight: "500" }}>{s.label}</Text>
        </View>
    );
};

// ─── Text input ────────────────────────────────────────────────
export const Input = (props: any) => (
    <TextInput
        placeholderTextColor={T.hint}
        style={[styles.input, props.style]}
        {...props}
    />
);

// ─── Screen header ─────────────────────────────────────────────
export const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSub}>{subtitle}</Text>}
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: T.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 0.5,
        borderColor: T.border,
    },
    sectionLabel: {
        color: T.muted,
        fontSize: 10,
        fontWeight: "600",
        letterSpacing: 0.7,
        textTransform: "uppercase",
        marginBottom: 8,
        marginTop: 14,
    },
    statCard: {
        backgroundColor: T.surface,
        borderRadius: 10,
        padding: 12,
        borderWidth: 0.5,
        borderColor: T.border,
        flex: 1,
    },
    statLabel: { color: T.muted, fontSize: 11 },
    statValue: { color: T.text, fontSize: 22, fontWeight: "600", marginTop: 4 },
    btn: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        borderWidth: 0.5,
        alignItems: "center",
        marginBottom: 7,
    },
    btnText: { fontSize: 13, fontWeight: "500" },
    badge: {
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 20,
        borderWidth: 0.5,
    },
    badgeText: { fontSize: 10, fontWeight: "500" },
    input: {
        backgroundColor: T.bg,
        color: T.text,
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: T.border,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 13,
        marginBottom: 8,
    },
    headerTitle: { color: T.text, fontSize: 22, fontWeight: "600" },
    headerSub: { color: T.muted, fontSize: 13, marginTop: 3 },
});
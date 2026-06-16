import React, { useState, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    StyleSheet,
    Animated,
} from "react-native";
import { T } from "../services/theme";

const { width } = Dimensions.get("window");

const STEPS = [
    {
        num: "Step 1 of 4",
        title: "Connect your Instagram",
        subtitle: "Sign in once with a secure browser session. Your password is never stored.",
        features: [
            { icon: "🔒", title: "End-to-end secure", sub: "Credentials used once, never saved" },
            { icon: "🍪", title: "Session cookies only", sub: "Encrypted and stored locally" },
            { icon: "⚡", title: "One-time setup", sub: "Connect once, stays connected" },
        ],
        iconBg: [T.purple.bg, T.purple.bg, T.surface],
    },
    {
        num: "Step 2 of 4",
        title: "Choose what you want to see",
        subtitle: "Pick topics and creators that match your interests.",
        features: [
            { icon: "🤖", title: "Topics you love", sub: "AI, Tech, Gaming, Finance & more" },
            { icon: "👤", title: "Creators you trust", sub: "Add specific accounts to follow" },
            { icon: "🎯", title: "Precise targeting", sub: "Mix topics and creators freely" },
        ],
        iconBg: [T.purple.bg, T.purple.bg, T.surface],
    },
    {
        num: "Step 3 of 4",
        title: "Activate personalisation",
        subtitle: "FeedFlow runs quietly in the background, training your feed.",
        features: [
            { icon: "▶", title: "Likes & watches", sub: "Engages with content you care about" },
            { icon: "💾", title: "Saves & profiles", sub: "Signals Instagram what you prefer" },
            { icon: "🔁", title: "Auto-cycles", sub: "Runs on a schedule you control" },
        ],
        iconBg: [T.green.bg, T.green.bg, T.surface],
    },
    {
        num: "Step 4 of 4",
        title: "Your feed gets better every day",
        subtitle: "Track alignment scores, activity logs, and watch your feed transform.",
        features: [
            { icon: "📊", title: "Analytics dashboard", sub: "See every action FeedFlow takes" },
            { icon: "🎯", title: "Feed alignment score", sub: "Measures how tuned your feed is" },
            { icon: "✏️", title: "Always adjustable", sub: "Change interests anytime" },
        ],
        iconBg: [T.purple.bg, T.purple.bg, T.surface],
    },
];

export default function OnboardingScreen({ navigation }: any) {
    const [step, setStep] = useState<"splash" | number>("splash");
    const progress = useRef(new Animated.Value(0)).current;

    const goToStep = (n: number) => {
        setStep(n);
        Animated.timing(progress, {
            toValue: (n + 1) / STEPS.length,
            duration: 350,
            useNativeDriver: false,
        }).start();
    };

    const handleNext = () => {
        if (step === "splash") { goToStep(0); return; }
        if (step < STEPS.length - 1) { goToStep((step as number) + 1); return; }
        navigation.navigate("InstagramConnect");
    };

    const handleBack = () => {
        if (step === "splash") return;
        if (step === 0) { setStep("splash"); return; }
        goToStep((step as number) - 1);
    };

    const isLastStep = step === STEPS.length - 1;

    // ─── Splash ────────────────────────────────────────────────
    if (step === "splash") {
        return (
            <View style={styles.container}>
                <View style={styles.splashCenter}>
                    <View style={styles.logoMark}>
                        <Text style={{ fontSize: 28 }}>⚡</Text>
                    </View>
                    <Text style={styles.appName}>FeedFlow</Text>
                    <Text style={styles.tagline}>
                        Your Instagram, tuned exactly{"\n"}to what you love
                    </Text>
                </View>

                <View style={styles.splashFeatureRow}>
                    {[
                        { icon: "🔗", label: "Connect" },
                        { icon: "🎯", label: "Personalise" },
                        { icon: "📈", label: "Improve" },
                    ].map((item, i) => (
                        <View key={i} style={styles.splashPill}>
                            <Text style={{ fontSize: 14 }}>{item.icon}</Text>
                            <Text style={styles.splashPillText}>{item.label}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.btnPrimary} onPress={handleNext} activeOpacity={0.8}>
                        <Text style={styles.btnPrimaryText}>Get started</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.btnGhost}
                        onPress={() => navigation.navigate("InstagramConnect")}
                        activeOpacity={0.6}
                    >
                        <Text style={styles.btnGhostText}>I already have an account</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ─── Steps ─────────────────────────────────────────────────
    const current = STEPS[step as number];
    const progressWidth = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
    });

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.stepHeader}>
                <Text style={styles.logoText}>FEEDFLOW</Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>

            {/* Dots */}
            <View style={styles.dots}>
                {STEPS.map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            (step as number) === i && styles.dotActive,
                            (step as number) > i && styles.dotDone,
                        ]}
                    />
                ))}
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.stepNum}>{current.num}</Text>
                <Text style={styles.stepTitle}>{current.title}</Text>
                <Text style={styles.stepSub}>{current.subtitle}</Text>

                <View style={styles.featureList}>
                    {current.features.map((feat, i) => (
                        <View key={i} style={styles.featureRow}>
                            <View style={[styles.featureIcon, { backgroundColor: current.iconBg[i] }]}>
                                <Text style={{ fontSize: 16 }}>{feat.icon}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.featureTitle}>{feat.title}</Text>
                                <Text style={styles.featureSub}>{feat.sub}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.btnPrimary, isLastStep && styles.btnSuccess]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.btnPrimaryText, isLastStep && { color: T.green.text }]}>
                        {isLastStep ? "Start setup →" : "Next"}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnGhost} onPress={handleBack} activeOpacity={0.6}>
                    <Text style={styles.btnGhostText}>Back</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: T.bg,
        paddingTop: 56,
        paddingHorizontal: 24,
        paddingBottom: 32,
    },

    // ── Splash ──────────────────────────────────────
    splashCenter: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
    logoMark: {
        width: 72,
        height: 72,
        borderRadius: 20,
        backgroundColor: T.surface,
        borderWidth: 0.5,
        borderColor: T.border,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    appName: {
        color: T.text,
        fontSize: 28,
        fontWeight: "600",
        letterSpacing: -0.5,
    },
    tagline: {
        color: T.muted,
        fontSize: 15,
        textAlign: "center",
        lineHeight: 22,
    },
    splashFeatureRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
        marginBottom: 32,
    },
    splashPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: T.surface,
        borderWidth: 0.5,
        borderColor: T.border,
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    splashPillText: {
        color: T.muted,
        fontSize: 12,
        fontWeight: "500",
    },

    // ── Step header ──────────────────────────────────
    stepHeader: {
        alignItems: "center",
        marginBottom: 16,
    },
    logoText: {
        color: T.purple.text,
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 2,
        opacity: 0.7,
    },

    // ── Progress ─────────────────────────────────────
    progressTrack: {
        height: 2,
        backgroundColor: T.border,
        borderRadius: 1,
        marginBottom: 20,
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#6366F1",
        borderRadius: 1,
    },

    // ── Dots ─────────────────────────────────────────
    dots: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
        marginBottom: 32,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: T.border,
    },
    dotActive: {
        width: 20,
        backgroundColor: "#6366F1",
    },
    dotDone: {
        backgroundColor: T.purple.border,
    },

    // ── Step content ─────────────────────────────────
    stepContent: {
        flexGrow: 1,
    },
    stepNum: {
        color: "#6366F1",
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.6,
        marginBottom: 8,
    },
    stepTitle: {
        color: T.text,
        fontSize: 22,
        fontWeight: "600",
        lineHeight: 30,
        marginBottom: 10,
    },
    stepSub: {
        color: T.muted,
        fontSize: 14,
        lineHeight: 21,
        marginBottom: 24,
    },

    // ── Feature rows ─────────────────────────────────
    featureList: {
        gap: 10,
    },
    featureRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        backgroundColor: T.surface,
        borderRadius: 12,
        padding: 14,
        borderWidth: 0.5,
        borderColor: T.border,
    },
    featureIcon: {
        width: 36,
        height: 36,
        borderRadius: 9,
        justifyContent: "center",
        alignItems: "center",
        flexShrink: 0,
    },
    featureTitle: {
        color: "#E2E8F0",
        fontSize: 13,
        fontWeight: "500",
    },
    featureSub: {
        color: T.muted,
        fontSize: 11,
        marginTop: 2,
    },

    // ── Buttons ──────────────────────────────────────
    actions: {
        gap: 6,
        marginTop: 24,
    },
    btnPrimary: {
        backgroundColor: T.purple.bg,
        borderWidth: 0.5,
        borderColor: T.purple.border,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: "center",
    },
    btnSuccess: {
        backgroundColor: T.green.bg,
        borderColor: T.green.border,
    },
    btnPrimaryText: {
        color: T.purple.text,
        fontSize: 14,
        fontWeight: "500",
    },
    btnGhost: {
        paddingVertical: 10,
        alignItems: "center",
    },
    btnGhostText: {
        color: T.hint,
        fontSize: 13,
    },
});
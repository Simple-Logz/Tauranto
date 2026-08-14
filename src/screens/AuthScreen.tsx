import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase, supabaseConfigured } from "../lib/api";
import { colors, radius, shadow } from "../theme/tokens";

type Mode = "sign-in" | "create";
type Notice = { kind: "error" | "success"; text: string } | null;

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const isCreate = mode === "create";

  function switchMode(next: Mode) {
    setMode(next);
    setNotice(null);
  }

  async function submit() {
    const cleanEmail = email.trim().toLowerCase();
    setNotice(null);
    if (!supabaseConfigured) {
      setNotice({ kind: "error", text: "This build is not connected to Supabase. Add the public Supabase URL and anon key, then rebuild." });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setNotice({ kind: "error", text: "Enter a valid work email address." });
      return;
    }
    if (password.length < 6) {
      setNotice({ kind: "error", text: "Your password must contain at least 6 characters." });
      return;
    }

    setBusy(true);
    try {
      if (isCreate) {
        const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password });
        if (error) throw error;
        if (data.session) {
          setNotice({ kind: "success", text: "Account created. Signing you in…" });
        } else {
          setMode("sign-in");
          setNotice({ kind: "success", text: "Account created. Confirm the message Supabase sent to your email, then sign in here." });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        setNotice({ kind: "success", text: "Signed in securely. Opening your workspace…" });
      }
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Authentication failed. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.phoneFrame}>
            <View style={styles.brandRow}>
              <View style={styles.mark}><Text style={styles.markText}>T</Text></View>
              <View>
                <Text style={styles.brand}>TAURANTO</Text>
                <Text style={styles.brandMeta}>RESTAURANT VOICEOPS</Text>
              </View>
              <View style={styles.securePill}>
                <Ionicons name="shield-checkmark" size={13} color={colors.leafDeep} />
                <Text style={styles.secureText}>Private</Text>
              </View>
            </View>

            <View style={styles.intro}>
              <Text style={styles.kicker}>HUMAN-APPROVED AUTOMATION</Text>
              <Text style={styles.title}>Run the shift without losing control.</Text>
              <Text style={styles.copy}>Capture instructions, verify the transcript, and approve every action before Tauranto sends it.</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{isCreate ? "Create your pilot account" : "Welcome back"}</Text>
              <Text style={styles.formCopy}>
                {isCreate ? "Use the email address that should own this restaurant workspace." : "Sign in with the account registered in your Tauranto workspace."}
              </Text>

              {!supabaseConfigured && (
                <View style={[styles.notice, styles.noticeError]}>
                  <Ionicons name="warning-outline" size={17} color="#A33F29" />
                  <Text style={[styles.noticeText, styles.noticeErrorText]}>Supabase configuration is missing from this build.</Text>
                </View>
              )}
              {notice && (
                <View style={[styles.notice, notice.kind === "error" ? styles.noticeError : styles.noticeSuccess]}>
                  <Ionicons name={notice.kind === "error" ? "alert-circle-outline" : "checkmark-circle-outline"} size={17} color={notice.kind === "error" ? "#A33F29" : colors.leafDeep} />
                  <Text style={[styles.noticeText, notice.kind === "error" && styles.noticeErrorText]}>{notice.text}</Text>
                </View>
              )}

              <Text style={styles.label}>Work email</Text>
              <View style={styles.field}>
                <Ionicons name="mail-outline" size={18} color={colors.muted} />
                <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="manager@restaurant.com" placeholderTextColor="#98A198" style={styles.input} />
              </View>

              <Text style={styles.label}>Password</Text>
              <View style={styles.field}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
                <TextInput value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" placeholder={isCreate ? "Create a password" : "Enter your password"} placeholderTextColor="#98A198" style={styles.input} onSubmitEditing={submit} />
                <Pressable onPress={() => setShowPassword((current) => !current)} hitSlop={10}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={19} color={colors.muted} />
                </Pressable>
              </View>

              <Pressable disabled={busy} onPress={submit} style={({ pressed }) => [styles.primary, pressed && styles.pressed, busy && styles.disabled]}>
                {busy ? <ActivityIndicator color="white" /> : <><Text style={styles.primaryText}>{isCreate ? "Create secure account" : "Sign in securely"}</Text><Ionicons name="arrow-forward" size={17} color="white" /></>}
              </Pressable>

              <View style={styles.switchRow}>
                <Text style={styles.switchCopy}>{isCreate ? "Already have an account?" : "New to Tauranto?"}</Text>
                <Pressable onPress={() => switchMode(isCreate ? "sign-in" : "create")} disabled={busy}>
                  <Text style={styles.switchAction}>{isCreate ? "Sign in" : "Create account"}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.privacyRow}>
              <Ionicons name="mic-off-outline" size={15} color={colors.muted} />
              <Text style={styles.note}>The microphone stays off until you enable standby or tap Speak.</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#EEF1EA" }, keyboard: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingVertical: 24 },
  phoneFrame: { width: "100%", maxWidth: 460, backgroundColor: colors.cream, borderRadius: 30, padding: 22, borderWidth: 1, borderColor: "#DDE3D8", ...shadow },
  brandRow: { flexDirection: "row", alignItems: "center" }, mark: { width: 43, height: 43, borderRadius: 14, backgroundColor: colors.leafDeep, alignItems: "center", justifyContent: "center", marginRight: 11 },
  markText: { fontFamily: "DMSans_700Bold", fontSize: 21, color: "white" }, brand: { fontFamily: "DMSans_700Bold", fontSize: 12, letterSpacing: 1.1, color: colors.ink },
  brandMeta: { fontFamily: "DMSans_600SemiBold", fontSize: 7, letterSpacing: 1.2, color: colors.muted, marginTop: 2 },
  securePill: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: colors.leafPale, borderRadius: 99 }, secureText: { fontFamily: "DMSans_700Bold", fontSize: 8, color: colors.leafDeep },
  intro: { paddingTop: 30, paddingBottom: 20 }, kicker: { fontFamily: "DMSans_700Bold", fontSize: 8, letterSpacing: 1.35, color: colors.leafDeep },
  title: { fontFamily: "DMSans_700Bold", fontSize: 30, lineHeight: 35, letterSpacing: -0.6, color: colors.ink, marginTop: 9 }, copy: { fontFamily: "DMSans_400Regular", fontSize: 12, lineHeight: 19, color: colors.inkSoft, marginTop: 10 },
  formCard: { backgroundColor: colors.paper, borderRadius: radius.lg, padding: 17, borderWidth: 1, borderColor: colors.line }, formTitle: { fontFamily: "DMSans_700Bold", fontSize: 19, color: colors.ink },
  formCopy: { fontFamily: "DMSans_400Regular", fontSize: 10, lineHeight: 15, color: colors.muted, marginTop: 5, marginBottom: 16 },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 12, padding: 11, marginBottom: 13 }, noticeError: { backgroundColor: colors.tomatoPale, borderWidth: 1, borderColor: "#F0C8BB" }, noticeSuccess: { backgroundColor: colors.leafPale, borderWidth: 1, borderColor: "#D6E2C8" },
  noticeText: { flex: 1, fontFamily: "DMSans_500Medium", fontSize: 9, lineHeight: 14, color: colors.leafDeep }, noticeErrorText: { color: "#8D3724" },
  label: { fontFamily: "DMSans_700Bold", fontSize: 9, color: colors.inkSoft, marginBottom: 6, marginLeft: 2 }, field: { height: 50, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: "#FBFCF9", paddingHorizontal: 13, marginBottom: 13 },
  input: { flex: 1, height: "100%", fontFamily: "DMSans_500Medium", fontSize: 12, color: colors.ink }, primary: { height: 50, borderRadius: 14, backgroundColor: colors.leafDeep, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", marginTop: 3 }, primaryText: { fontFamily: "DMSans_700Bold", color: "white", fontSize: 11 },
  pressed: { opacity: 0.88 }, disabled: { opacity: 0.62 }, switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5, marginTop: 16 }, switchCopy: { fontFamily: "DMSans_400Regular", fontSize: 10, color: colors.muted }, switchAction: { fontFamily: "DMSans_700Bold", fontSize: 10, color: colors.leafDeep },
  privacyRow: { flexDirection: "row", justifyContent: "center", alignItems: "flex-start", gap: 7, paddingHorizontal: 14, paddingTop: 17 }, note: { flex: 1, fontFamily: "DMSans_400Regular", fontSize: 8, lineHeight: 13, color: colors.muted, textAlign: "center" },
});

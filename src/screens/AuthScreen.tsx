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
              <Text style={styles.brand}>TAURANTO</Text>
            </View>

            <View style={styles.intro}>
              <Text style={styles.title}>Run your restaurant without losing control.</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{isCreate ? "Create your pilot account" : "Welcome back"}</Text>

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

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream }, keyboard: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingVertical: 28 },
  phoneFrame: { width: "100%", maxWidth: 460 },
  brandRow: { flexDirection: "row", alignItems: "center" }, mark: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#315B3D", alignItems: "center", justifyContent: "center", marginRight: 12 },
  markText: { fontFamily: "Manrope_800ExtraBold", fontSize: 23, color: "white" }, brand: { fontFamily: "Manrope_800ExtraBold", fontSize: 15, letterSpacing: 1.8, color: colors.ink },
  intro: { paddingTop: 34, paddingBottom: 26 },
  title: { fontFamily: "Manrope_800ExtraBold", fontSize: 34, lineHeight: 40, letterSpacing: -0.8, color: colors.ink },
  formCard: { backgroundColor: colors.paper, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.line, ...shadow }, formTitle: { fontFamily: "Manrope_800ExtraBold", fontSize: 22, color: colors.ink, marginBottom: 20 },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 12, padding: 11, marginBottom: 13 }, noticeError: { backgroundColor: colors.tomatoPale, borderWidth: 1, borderColor: "#F0C8BB" }, noticeSuccess: { backgroundColor: colors.leafPale, borderWidth: 1, borderColor: "#D6E2C8" },
  noticeText: { flex: 1, fontFamily: "Manrope_600SemiBold", fontSize: 9, lineHeight: 14, color: colors.leafDeep }, noticeErrorText: { color: "#8D3724" },
  label: { fontFamily: "Manrope_800ExtraBold", fontSize: 12, color: colors.inkSoft, marginBottom: 8, marginLeft: 2 }, field: { height: 58, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: "#FBFCF9", paddingHorizontal: 15, marginBottom: 17 },
  input: { flex: 1, height: "100%", fontFamily: "Manrope_600SemiBold", fontSize: 15, color: colors.ink }, primary: { height: 58, borderRadius: 16, backgroundColor: "#315B3D", flexDirection: "row", gap: 9, alignItems: "center", justifyContent: "center", marginTop: 3 }, primaryText: { fontFamily: "Manrope_800ExtraBold", color: "white", fontSize: 15 },
  pressed: { opacity: 0.88 }, disabled: { opacity: 0.62 }, switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 20 }, switchCopy: { fontFamily: "Manrope_500Medium", fontSize: 13, color: colors.muted }, switchAction: { fontFamily: "Manrope_800ExtraBold", fontSize: 13, color: "#315B3D" },
});

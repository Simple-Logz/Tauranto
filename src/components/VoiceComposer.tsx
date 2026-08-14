import React, { useEffect, useRef, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Switch, Text, TextInput, Vibration, View } from "react-native";
import * as Speech from "expo-speech";
import { Ionicons } from "@expo/vector-icons";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { colors, radius, shadow } from "../theme/tokens";
import { interpretCommand } from "../lib/interpreter";
import { VoiceCommand } from "../lib/models";

type VoiceMode = "off" | "standby" | "command";
const configuredWakePhrase = (process.env.EXPO_PUBLIC_WAKE_PHRASE || "hey tauranto").toLowerCase();
const wakeAliases = Array.from(new Set([
  configuredWakePhrase,
  "hey tauranto", "hi tauranto", "hello tauranto",
  "hey toronto", "hi toronto", "hello toronto",
  "okay tauranto", "ok tauranto", "okay toronto", "ok toronto",
]));

function findWakePhrase(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  for (const alias of wakeAliases) {
    const index = normalized.indexOf(alias);
    if (index >= 0) return { matched: alias, remainder: normalized.slice(index + alias.length).trim() };
  }
  return null;
}

export function VoiceComposer({ onCommand }: { onCommand: (command: VoiceCommand) => void | Promise<void> }) {
  const [mode, setMode] = useState<VoiceMode>("off");
  const [transcript, setTranscript] = useState("");
  const [manual, setManual] = useState(false);
  const [message, setMessage] = useState("");
  const [lastHeard, setLastHeard] = useState("");
  const modeRef = useRef<VoiceMode>("off");
  const enabledRef = useRef(false);
  const processingRef = useRef(false);
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const changeMode = (next: VoiceMode) => { modeRef.current = next; setMode(next); };

  useSpeechRecognitionEvent("result", (event) => {
    const heard = event.results[0]?.transcript?.trim() || "";
    if (!heard) return;
    setLastHeard(heard);
    if (modeRef.current === "standby") {
      const wake = findWakePhrase(heard);
      if (!wake) {
        if (event.isFinal) setMessage(`Heard “${heard}” · still waiting for Tauranto`);
        return;
      }
      processingRef.current = true;
      ExpoSpeechRecognitionModule.stop();
      if (wake.remainder && event.isFinal) {
        void submit(wake.remainder);
      } else {
        Speech.stop();
        Speech.speak("Yes. What would you like me to do?", {
          rate: .94,
          onDone: () => void beginCommand(),
          onError: () => void beginCommand(),
        });
      }
      return;
    }
    if (modeRef.current === "command") {
      setTranscript(heard);
      if (event.isFinal) void submit(heard);
    }
  });

  useSpeechRecognitionEvent("end", () => {
    if (enabledRef.current && modeRef.current === "standby" && !processingRef.current) {
      if (restartTimer.current) clearTimeout(restartTimer.current);
      restartTimer.current = setTimeout(() => void startStandby(false), 300);
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    if (event.error === "aborted" || event.error === "no-speech") return;
    setMessage(`Voice service: ${event.message || event.error}`);
  });

  useEffect(() => () => {
    enabledRef.current = false;
    if (restartTimer.current) clearTimeout(restartTimer.current);
    ExpoSpeechRecognitionModule.abort();
    Speech.stop();
  }, []);

  async function ensurePermission() {
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Microphone permission needed", "Enable microphone and speech recognition in Settings.");
      return false;
    }
    return true;
  }

  function launchStandbyRecognition() {
    if (!enabledRef.current) return;
    processingRef.current = false;
    changeMode("standby");
    try {
      // Short recognition sessions restart automatically and are more dependable across mobile browsers.
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start standby listening.");
    }
  }

  async function startStandby(announce = true) {
    if (!enabledRef.current || !(await ensurePermission())) return;
    setMessage(Platform.OS === "web" ? "Foreground browser standby · keep this screen open" : "Foreground standby · keep Tauranto open");
    changeMode("standby");
    if (announce) {
      Speech.stop();
      Speech.speak("Tauranto standby is on. Say hey Tauranto when you need me.", {
        rate: .94,
        onDone: launchStandbyRecognition,
        onError: launchStandbyRecognition,
      });
    } else {
      launchStandbyRecognition();
    }
  }

  async function beginCommand() {
    if (!(await ensurePermission())) return;
    processingRef.current = false;
    changeMode("command");
    setTranscript("");
    setMessage("Listening now…");
    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: false,
      requiresOnDeviceRecognition: false,
      addsPunctuation: true,
    });
  }

  async function toggleStandby(value: boolean) {
    enabledRef.current = value;
    setMessage("");
    setLastHeard("");
    if (!value) {
      processingRef.current = false;
      changeMode("off");
      ExpoSpeechRecognitionModule.abort();
      Vibration.vibrate([0, 90, 70, 90]);
      Speech.speak("Tauranto is off.", { rate: .94 });
      return;
    }
    await startStandby();
  }

  async function listen() {
    if (mode === "command") { ExpoSpeechRecognitionModule.stop(); return; }
    processingRef.current = true;
    ExpoSpeechRecognitionModule.abort();
    await beginCommand();
  }

  async function submit(value = transcript) {
    if (!value.trim() || processingRef.current && modeRef.current === "command" && !transcript) return;
    processingRef.current = true;
    ExpoSpeechRecognitionModule.stop();
    setTranscript(value.trim());
    setMessage("Creating a reviewable proposal…");
    try {
      await onCommand(interpretCommand(value));
      setTranscript("");
      setManual(false);
      const resume = () => {
        processingRef.current = false;
        if (enabledRef.current) void startStandby(false); else changeMode("off");
      };
      Speech.speak("Instruction captured. It will not run until a manager approves it.", { rate: .94, onDone: resume, onError: resume });
    } catch (error) {
      processingRef.current = false;
      setMessage(error instanceof Error ? error.message : "Tauranto could not create the proposal.");
      if (enabledRef.current) void startStandby(false);
    }
  }

  const standby = mode === "standby";
  const listening = mode === "command";
  return <View>
    <View style={styles.card}>
      <View style={styles.shiftRow}>
        <View style={[styles.statusDot, standby ? styles.statusReady : listening ? styles.statusStarting : null]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.shiftTitle}>{standby ? "Standby is listening" : listening ? "Listening to you" : "Voice assistant is off"}</Text>
          <Text style={styles.shiftSub}>{standby ? "Say “Hey Tauranto,” “Hi Tauranto,” or “Hey Toronto”" : listening ? "Speak one complete instruction" : "Turn on standby or use the large Speak button"}</Text>
        </View>
        <Switch value={mode !== "off"} onValueChange={toggleStandby} trackColor={{ false: colors.line, true: colors.leaf }} thumbColor="white" />
      </View>

      <Text style={styles.prompt}>{listening ? "Go ahead. I’m listening." : standby ? "Tauranto is ready." : "What needs to happen?"}</Text>
      <Text style={styles.help}>Every instruction becomes a draft. Nothing changes until the required managers approve it.</Text>

      {transcript ? <View style={styles.transcript}><Text style={styles.transcriptLabel}>LIVE TRANSCRIPT</Text><Text style={styles.transcriptText}>“{transcript}”</Text></View> : null}
      {message ? <View style={styles.message}><Ionicons name={message.startsWith("Heard") ? "ear-outline" : "information-circle-outline"} size={17} color={colors.leafDeep}/><Text style={styles.messageText}>{message}</Text></View> : null}
      {!transcript && standby && lastHeard ? <Text style={styles.lastHeard}>Last heard: “{lastHeard}”</Text> : null}

      <Pressable onPress={listen} style={[styles.speakButton, listening && styles.stopButton]}>
        <View style={styles.speakIcon}><Ionicons name={listening ? "stop" : "mic"} size={25} color="white" /></View>
        <View style={{flex:1}}><Text style={styles.speakTitle}>{listening ? "Stop listening" : "Speak now"}</Text><Text style={styles.speakSub}>{listening ? "Use the transcript above to verify what I heard" : "Best option in a noisy kitchen"}</Text></View>
        <Ionicons name="chevron-forward" size={21} color="white" />
      </Pressable>

      <Pressable onPress={() => setManual(value => !value)} style={styles.typeButton}>
        <Ionicons name="keypad-outline" size={21} color={colors.ink} /><Text style={styles.typeText}>{manual ? "Close typing" : "Type an instruction instead"}</Text>
      </Pressable>
    </View>

    {manual && <View style={styles.inputBar}><TextInput value={transcript} onChangeText={setTranscript} placeholder="Example: Mark salmon unavailable until Friday" placeholderTextColor={colors.muted} multiline style={styles.input}/><Pressable onPress={() => void submit()} style={styles.send}><Ionicons name="arrow-up" size={21} color="white" /></Pressable></View>}
  </View>;
}

const styles = StyleSheet.create({
  card:{backgroundColor:"#E8F0DB",borderRadius:24,padding:18,borderWidth:1,borderColor:"#D3DFC4",...shadow},
  shiftRow:{flexDirection:"row",alignItems:"center",gap:11},statusDot:{width:12,height:12,borderRadius:6,backgroundColor:colors.muted},statusReady:{backgroundColor:"#3F8A50"},statusStarting:{backgroundColor:colors.saffron},
  shiftTitle:{fontFamily:"DMSans_700Bold",fontSize:17,color:colors.ink},shiftSub:{fontFamily:"DMSans_400Regular",fontSize:12.5,lineHeight:17,color:colors.inkSoft,marginTop:3},
  prompt:{fontFamily:"DMSans_700Bold",fontSize:31,lineHeight:36,letterSpacing:-.7,color:colors.ink,marginTop:24},help:{fontFamily:"DMSans_400Regular",fontSize:14,lineHeight:21,color:colors.inkSoft,marginTop:7},
  transcript:{backgroundColor:"#FFFFFFC9",borderRadius:radius.md,padding:13,marginTop:14},transcriptLabel:{fontFamily:"DMSans_700Bold",fontSize:9,letterSpacing:1,color:colors.leafDeep},transcriptText:{fontFamily:"DMSans_600SemiBold",fontSize:15,lineHeight:21,color:colors.ink,marginTop:5},
  message:{flexDirection:"row",alignItems:"flex-start",gap:7,backgroundColor:"#FFFFFF85",borderRadius:12,padding:10,marginTop:12},messageText:{flex:1,fontFamily:"DMSans_500Medium",fontSize:12,lineHeight:17,color:colors.inkSoft},lastHeard:{fontFamily:"DMSans_500Medium",fontSize:11,color:colors.muted,marginTop:8},
  speakButton:{minHeight:66,borderRadius:17,backgroundColor:colors.leafDeep,flexDirection:"row",alignItems:"center",gap:11,paddingHorizontal:13,marginTop:17},stopButton:{backgroundColor:colors.tomato},speakIcon:{width:42,height:42,borderRadius:13,backgroundColor:"#FFFFFF22",alignItems:"center",justifyContent:"center"},speakTitle:{fontFamily:"DMSans_700Bold",fontSize:15,color:"white"},speakSub:{fontFamily:"DMSans_400Regular",fontSize:11.5,color:"#FFFFFFCC",marginTop:3},
  typeButton:{height:52,borderRadius:15,backgroundColor:colors.paper,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,borderWidth:1,borderColor:"#D4DDCA",marginTop:9},typeText:{fontFamily:"DMSans_700Bold",fontSize:13,color:colors.ink},
  inputBar:{flexDirection:"row",alignItems:"flex-end",backgroundColor:colors.paper,borderRadius:radius.md,borderWidth:1,borderColor:colors.line,marginTop:10,padding:9,gap:8,...shadow},input:{flex:1,minHeight:48,maxHeight:100,fontFamily:"DMSans_400Regular",fontSize:14,lineHeight:20,color:colors.ink,padding:10},send:{width:46,height:46,borderRadius:14,backgroundColor:colors.leafDeep,alignItems:"center",justifyContent:"center"},
});

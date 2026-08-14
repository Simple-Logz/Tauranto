import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput, Alert, Switch, Vibration } from "react-native";
import * as Speech from "expo-speech";
import { Ionicons } from "@expo/vector-icons";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { colors, radius, shadow } from "../theme/tokens";
import { interpretCommand } from "../lib/interpreter";
import { VoiceCommand } from "../lib/models";

type VoiceMode = "off" | "standby" | "command";
const wakePhrase = (process.env.EXPO_PUBLIC_WAKE_PHRASE || "hey tauranto").toLowerCase();
const examples = ["86 the salmon until Friday", "Close tomorrow at 7 PM", "Call the produce supplier at 9 AM"];

export function VoiceComposer({ onCommand }: { onCommand: (command: VoiceCommand) => void | Promise<void> }) {
  const [mode, setMode] = useState<VoiceMode>("off");
  const [transcript, setTranscript] = useState("");
  const [manual, setManual] = useState(false);
  const [message, setMessage] = useState("");
  const modeRef = useRef<VoiceMode>("off");
  const enabledRef = useRef(false);
  const processingRef = useRef(false);
  const changeMode = (next: VoiceMode) => { modeRef.current = next; setMode(next); };

  useSpeechRecognitionEvent("result", (event) => {
    const heard = event.results[0]?.transcript?.trim() || "";
    if (!heard) return;
    if (modeRef.current === "standby") {
      const normalized = heard.toLowerCase();
      const index = normalized.indexOf(wakePhrase);
      if (index < 0) return;
      const remainder = heard.slice(index + wakePhrase.length).replace(/^[,.:;\s-]+/, "").trim();
      ExpoSpeechRecognitionModule.stop();
      Speech.speak("Yes. What would you like me to do?", { rate: .94 });
      if (remainder && event.isFinal) void submit(remainder);
      else setTimeout(() => void beginCommand(), 650);
      return;
    }
    if (modeRef.current === "command") {
      setTranscript(heard);
      if (event.isFinal) void submit(heard);
    }
  });

  useSpeechRecognitionEvent("end", () => {
    if (enabledRef.current && modeRef.current === "standby" && !processingRef.current) setTimeout(() => void startStandby(false), 450);
  });
  useSpeechRecognitionEvent("error", (event) => {
    if (event.error === "aborted" || event.error === "no-speech") return;
    setMessage(`Voice service: ${event.message || event.error}`);
  });
  useEffect(() => () => { enabledRef.current = false; ExpoSpeechRecognitionModule.abort(); Speech.stop(); }, []);

  async function ensurePermission() {
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) { Alert.alert("Microphone permission needed", "Enable microphone and speech recognition in Settings."); return false; }
    return true;
  }
  async function startStandby(announce = true) {
    if (!enabledRef.current || !(await ensurePermission())) return;
    processingRef.current = false; changeMode("standby");
    setMessage("Foreground pilot mode · recognition may use your phone’s speech service");
    if (announce) Speech.speak(`Tauranto standby is on. Say ${wakePhrase} when you need me.`, { rate: .94 });
    ExpoSpeechRecognitionModule.start({ lang: "en-US", interimResults: true, continuous: true, requiresOnDeviceRecognition: false, addsPunctuation: true });
  }
  async function beginCommand() {
    if (!(await ensurePermission())) return;
    processingRef.current = false; changeMode("command"); setTranscript("");
    ExpoSpeechRecognitionModule.start({ lang: "en-US", interimResults: true, continuous: false, requiresOnDeviceRecognition: false, addsPunctuation: true });
  }
  async function toggleStandby(value: boolean) {
    enabledRef.current = value; setMessage("");
    if (!value) {
      processingRef.current = false; changeMode("off"); ExpoSpeechRecognitionModule.abort();
      Vibration.vibrate([0, 90, 70, 90, 70, 90]); Speech.speak("Tauranto is off. I will not listen for commands.", { rate: .94 }); return;
    }
    await startStandby();
  }
  async function listen() { if (mode === "command") { ExpoSpeechRecognitionModule.stop(); return; } await beginCommand(); }
  async function submit(value = transcript) {
    if (!value.trim() || processingRef.current) return;
    processingRef.current = true; ExpoSpeechRecognitionModule.stop(); await onCommand(interpretCommand(value)); setTranscript(""); setManual(false);
    const resume = () => { processingRef.current = false; if (enabledRef.current) void startStandby(false); else changeMode("off"); };
    Speech.speak("I captured that instruction. Nothing will happen until the required managers approve it.", { rate: .94, onDone: resume, onError: resume });
  }

  const standby = mode === "standby", listening = mode === "command";
  return <View>
    <View style={styles.card}>
      <View style={styles.shiftRow}><View style={[styles.statusDot, standby ? styles.statusReady : listening ? styles.statusStarting : null]} /><View style={{ flex: 1 }}><Text style={styles.shiftTitle}>Voice standby</Text><Text style={styles.shiftSub}>{standby ? `Waiting for “${wakePhrase}” while Tauranto is open` : listening ? "Listening for your instruction…" : `Say “${wakePhrase}” after turning standby on`}</Text></View><Switch value={mode !== "off"} onValueChange={toggleStandby} trackColor={{ false: colors.line, true: colors.leaf }} thumbColor="white" /></View>
      <View style={styles.divider} /><Text style={styles.prompt}>{listening ? "I’m listening." : standby ? "Tauranto is ready." : "Speak, tap or type."}</Text>
      <Text style={styles.help}>{listening ? "Finish naturally. Tauranto will stop automatically." : "Every instruction becomes a proposal. No business action runs before manager approval."}</Text>
      {transcript ? <View style={styles.transcript}><Text style={styles.transcriptText}>“{transcript}”</Text></View> : null}{message ? <Text style={styles.warning}>{message}</Text> : null}
      <View style={styles.actions}><Pressable onPress={listen} style={[styles.action, listening && styles.actionLive]}><Ionicons name={listening ? "stop" : "mic-outline"} size={21} color={colors.ink} /><Text style={styles.actionText}>{listening ? "Stop" : "Tap to speak"}</Text></Pressable><Pressable onPress={() => setManual(value => !value)} style={styles.action}><Ionicons name="keypad-outline" size={20} color={colors.ink} /><Text style={styles.actionText}>Type instead</Text></Pressable></View>
    </View>
    {manual && <View style={styles.inputBar}><TextInput value={transcript} onChangeText={setTranscript} placeholder="Type an instruction…" placeholderTextColor={colors.muted} multiline style={styles.input}/><Pressable onPress={() => void submit()} style={styles.send}><Ionicons name="arrow-up" size={19} color="white" /></Pressable></View>}
    <View style={styles.examples}>{examples.map(example => <Pressable key={example} onPress={() => { setTranscript(example); setManual(true); }} style={styles.chip}><Text style={styles.chipText}>{example}</Text></Pressable>)}</View>
  </View>;
}

const styles = StyleSheet.create({card:{backgroundColor:"#E8F0DB",borderRadius:radius.lg,padding:17,borderWidth:1,borderColor:"#D7E2C7",...shadow},shiftRow:{flexDirection:"row",alignItems:"center",gap:10},statusDot:{width:10,height:10,borderRadius:5,backgroundColor:colors.muted},statusReady:{backgroundColor:"#4A8B55"},statusStarting:{backgroundColor:colors.saffron},shiftTitle:{fontFamily:"DMSans_700Bold",fontSize:13,color:colors.ink},shiftSub:{fontFamily:"DMSans_400Regular",fontSize:9,color:colors.inkSoft,marginTop:3},divider:{height:1,backgroundColor:"#D2DEC1",marginVertical:16},prompt:{fontFamily:"DMSans_700Bold",fontSize:25,letterSpacing:-.5,color:colors.ink},help:{fontFamily:"DMSans_400Regular",fontSize:11,lineHeight:17,color:colors.inkSoft,marginTop:7,maxWidth:340},transcript:{backgroundColor:"#FFFFFFB8",borderRadius:radius.md,padding:11,marginTop:12},transcriptText:{fontFamily:"DMSans_500Medium",fontSize:11,color:colors.ink},warning:{fontFamily:"DMSans_500Medium",fontSize:9,color:colors.inkSoft,marginTop:9},actions:{flexDirection:"row",gap:8,marginTop:17},action:{flex:1,height:44,borderRadius:13,backgroundColor:colors.paper,flexDirection:"row",gap:7,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:"#D4DDCA"},actionLive:{backgroundColor:colors.tomatoPale,borderColor:"#E9B7A7"},actionText:{fontFamily:"DMSans_700Bold",fontSize:10,color:colors.ink},inputBar:{flexDirection:"row",alignItems:"flex-end",backgroundColor:colors.paper,borderRadius:radius.md,borderWidth:1,borderColor:colors.line,marginTop:10,padding:8,gap:8,...shadow},input:{flex:1,minHeight:40,maxHeight:90,fontFamily:"DMSans_400Regular",color:colors.ink,padding:10},send:{width:38,height:38,borderRadius:12,backgroundColor:colors.leafDeep,alignItems:"center",justifyContent:"center"},examples:{flexDirection:"row",gap:7,marginTop:10},chip:{flex:1,borderRadius:12,borderWidth:1,borderColor:colors.line,backgroundColor:colors.paper,paddingHorizontal:8,paddingVertical:8},chipText:{fontFamily:"DMSans_500Medium",color:colors.inkSoft,fontSize:8,lineHeight:11,textAlign:"center"}});

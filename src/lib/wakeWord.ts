import{useEffect,useRef,useState}from"react";
import{ExpoSpeechRecognitionModule,useSpeechRecognitionEvent}from"expo-speech-recognition";
import{findWake}from"./wakeMatch";

// Module-level, not per-hook: once the OS has granted microphone/speech
// permission this session, every later call to start() — including the
// silent restarts that happen every RESTART_DURING_CAPTURE_MS/
// RESTART_DURING_WAKE_MS while the app is actively listening — skips
// re-querying permission state entirely instead of asking the OS again on
// every single restart tick. A user should be asked once, ever, not have
// the app re-check dozens of times a minute while listening; if permission
// is later actually revoked, ExpoSpeechRecognitionModule.start() itself
// fails and the existing error handling below (which flips `supported` to
// false on "not-allowed"/"service-not-allowed") already covers that case.
let permissionGranted=false;

// How long to keep listening after the wake phrase, waiting for the
// instruction that follows it, before giving up and reporting nothing heard.
const WAKE_GRACE_MS=4500;
// Once the user has started speaking the instruction, how long a pause has
// to last before we treat the instruction as finished and hand it off.
const SPEECH_GAP_MS=1500;
// Absolute ceiling on one capture attempt, regardless of how many times the
// OS restarts the recognizer underneath us — a safety net so a run of
// recognizer hiccups can't hold the microphone open forever.
const MAX_CAPTURE_MS=14000;
// Mobile recognizers routinely end a "continuous" session after a couple of
// seconds of silence — this is normal, not a failure. When that happens
// mid-capture we restart immediately and keep accumulating into the SAME
// capture rather than treating the restart as "nothing was said."
const RESTART_DURING_CAPTURE_MS=60;
const RESTART_DURING_WAKE_MS=350;

/**
 * Always-on wake-word listener for "Hey Tauranto".
 *
 * This uses `expo-speech-recognition` — the OS's built-in speech recognizer
 * (on-device where the platform supports it), already an installed
 * dependency and already declared in app.json's permission strings. It is
 * not a dedicated low-power wake chip, and it is not a purpose-built
 * wake-word engine — deliberately: Picovoice Porcupine (the usual
 * off-the-shelf option) discontinued its free tier entirely in mid-2026, so
 * this app depends on no vendor account, no per-device key, and nothing
 * that can be taken away by a pricing change. Reliability instead comes from
 * findWake()'s two-stage matching below: a fast list of mis-hears we've
 * already confirmed happen, then a fuzzy edit-distance fallback so a
 * mis-hearing nobody has reported yet still wakes the app.
 *
 * What this version fixes: mobile recognizers end a "continuous" session
 * after a couple of seconds of silence even mid-sentence — that is normal
 * platform behavior, not a dropped call. The previous version treated every
 * session end as "the user is done talking," which reset back to
 * wake-listening and silently swallowed whatever the user said next if it
 * arrived after the OS's own session boundary (extremely easy to trigger:
 * say "Hey Tauranto", pause half a second to see it react, then speak the
 * command — exactly how people naturally use a wake word). Now, ending a
 * session while we're mid-capture just restarts the recognizer as fast as
 * possible WITHOUT resetting phase or losing what was already heard; only
 * our own silence timer — which tracks real speech, not native session
 * boundaries — decides when the instruction is finished.
 */
export function useWakeWord(active:boolean,onCommand:(text:string)=>void){
 const[supported,setSupported]=useState(true);
 const[listening,setListening]=useState(false);
 const[awake,setAwake]=useState(false);
 const restartTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const silenceTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const captureCapTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const phaseRef=useRef<"wake"|"capture">("wake");
 // committedText: everything captured from native sessions that have
 // already ended during this capture attempt. sessionText: what the
 // CURRENTLY-RUNNING native session has transcribed so far. The two are
 // joined for the text handed back, so a mid-instruction session restart
 // doesn't erase what came before it.
 const committedRef=useRef("");
 const sessionRef=useRef("");
 const onCommandRef=useRef(onCommand);
 onCommandRef.current=onCommand;

 useEffect(()=>{try{setSupported(ExpoSpeechRecognitionModule.isRecognitionAvailable())}catch{setSupported(false)}},[]);

 const clearTimers=()=>{
  if(restartTimer.current){clearTimeout(restartTimer.current);restartTimer.current=null}
  if(silenceTimer.current){clearTimeout(silenceTimer.current);silenceTimer.current=null}
  if(captureCapTimer.current){clearTimeout(captureCapTimer.current);captureCapTimer.current=null}
 };
 const resetPhase=()=>{phaseRef.current="wake";committedRef.current="";sessionRef.current="";setAwake(false)};

 const start=async()=>{
  try{
   if(!permissionGranted){
    const perm=await ExpoSpeechRecognitionModule.getPermissionsAsync();
    if(!perm.granted){
     const req=await ExpoSpeechRecognitionModule.requestPermissionsAsync();
     if(!req.granted){setSupported(false);return}
    }
    permissionGranted=true;
   }
   ExpoSpeechRecognitionModule.start({lang:"en-US",interimResults:true,continuous:true,contextualStrings:["Hey Tauranto","Tauranto"]});
   setListening(true);
  }catch{setSupported(false);setListening(false)}
 };
 const stop=()=>{
  clearTimers();
  try{ExpoSpeechRecognitionModule.abort()}catch{}
  setListening(false);resetPhase();
 };

 useEffect(()=>{
  if(active&&supported){resetPhase();void start()}else{stop()}
  return()=>stop();
 },[active,supported]);

 const capturedText=()=>[committedRef.current,sessionRef.current].filter(Boolean).join(" ").trim();
 const finalizeCommand=()=>{
  clearTimers();
  const text=capturedText();
  resetPhase();
  onCommandRef.current(text);
 };
 const armSilenceTimer=()=>{
  if(silenceTimer.current)clearTimeout(silenceTimer.current);
  silenceTimer.current=setTimeout(finalizeCommand,capturedText()?SPEECH_GAP_MS:WAKE_GRACE_MS);
 };
 const beginCapture=()=>{
  phaseRef.current="capture";committedRef.current="";sessionRef.current="";setAwake(true);
  if(captureCapTimer.current)clearTimeout(captureCapTimer.current);
  captureCapTimer.current=setTimeout(finalizeCommand,MAX_CAPTURE_MS);
 };

 useSpeechRecognitionEvent("result",e=>{
  if(!active)return;
  const said=e.results?.[0]?.transcript||"";
  if(phaseRef.current==="wake"){
   const match=findWake(said);
   if(!match)return;
   beginCapture();
   const remainder=said.slice(match.end).trim();
   if(remainder)sessionRef.current=remainder;
   armSilenceTimer();
   return;
  }
  // Already past the wake phrase: this native session's transcript may or
  // may not still carry the wake phrase as a prefix depending on platform —
  // strip it if present, otherwise the whole segment is instruction text.
  const again=findWake(said);
  sessionRef.current=(again?said.slice(again.end):said).trim();
  armSilenceTimer();
 });
 useSpeechRecognitionEvent("end",()=>{
  setListening(false);
  if(phaseRef.current==="capture"){
   // Commit what this session captured and restart fast — this is a
   // platform session boundary, not the user finishing their sentence.
   // Whether the instruction is actually complete is decided solely by
   // armSilenceTimer/finalizeCommand above.
   const joined=capturedText();
   committedRef.current=joined;sessionRef.current="";
   if(active&&supported)restartTimer.current=setTimeout(()=>void start(),RESTART_DURING_CAPTURE_MS);
   return;
  }
  if(active&&supported)restartTimer.current=setTimeout(()=>void start(),RESTART_DURING_WAKE_MS);
 });
 useSpeechRecognitionEvent("error",e=>{
  setListening(false);
  if(e.error==="not-allowed"||e.error==="service-not-allowed"){permissionGranted=false;setSupported(false);return}
  if(active&&supported)restartTimer.current=setTimeout(()=>void start(),phaseRef.current==="capture"?RESTART_DURING_CAPTURE_MS:700);
 });

 return{supported,listening,awake};
}

import{useEffect,useRef,useState}from"react";
import{ExpoSpeechRecognitionModule,useSpeechRecognitionEvent}from"expo-speech-recognition";

// Tolerate common mis-hears of "Tauranto" from on-device speech recognizers
// (which have never seen the brand name) — "hey tauranto" is the target
// phrase, the rest are safety nets so standby doesn't stay silent forever.
const PHRASES=["hey tauranto","tauranto","hey toronto","hey tarantino","hey toranto"];

// How long to keep the SAME recognition session open after the wake phrase,
// waiting for the instruction that follows it, before giving up and telling
// the caller nothing was heard.
const WAKE_GRACE_MS=4200;
// Once the user has started speaking the instruction, how long a pause has
// to last before we treat the instruction as finished and hand it off.
const SPEECH_GAP_MS=1500;

function findWake(transcript:string):{end:number}|null{
 const t=transcript.toLowerCase();
 let best:number|null=null;
 for(const p of PHRASES){const i=t.indexOf(p);if(i>=0&&(best===null||i<best)){best=i+p.length}}
 return best===null?null:{end:best};
}

/**
 * Always-on wake-word listener for "Hey Tauranto".
 *
 * This uses `expo-speech-recognition` — the OS's built-in speech recognizer
 * (on-device where the platform supports it), already an installed
 * dependency and already declared in app.json's permission strings. No
 * separate wake-word vendor account or API key is required. It is not a
 * dedicated low-power wake chip (that would need native hardware access
 * this app doesn't have), but it is a real, continuous "listen for the
 * phrase" loop rather than the placeholder standby copy that used to say
 * a wake-word service was "being initialized" and never actually listened.
 *
 * Previously, hearing the wake phrase would abort this recognizer and hand
 * off to a brand-new, separate fixed-window recording — which threw away
 * anything said in the same breath as "Hey Tauranto" and left a real gap
 * where the microphone was being re-acquired. This version keeps the SAME
 * continuous recognition session running straight through the instruction:
 * it strips the wake phrase out of the transcript and keeps accumulating
 * whatever follows until the user pauses, then hands the caller the
 * captured text directly. Only if nothing at all was heard within a short
 * grace period does it report an empty capture, so the caller can fall
 * back to the manual tap-to-speak flow.
 *
 * Mobile speech recognizers stop after a few seconds of silence even in
 * `continuous` mode, so this restarts itself on every `end`/recoverable
 * `error` event for as long as `active` stays true.
 */
export function useWakeWord(active:boolean,onCommand:(text:string)=>void){
 const[supported,setSupported]=useState(true);
 const[listening,setListening]=useState(false);
 const[awake,setAwake]=useState(false);
 const restartTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const silenceTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const phaseRef=useRef<"wake"|"capture">("wake");
 const capturedRef=useRef("");
 const onCommandRef=useRef(onCommand);
 onCommandRef.current=onCommand;

 useEffect(()=>{try{setSupported(ExpoSpeechRecognitionModule.isRecognitionAvailable())}catch{setSupported(false)}},[]);

 const resetPhase=()=>{phaseRef.current="wake";capturedRef.current="";setAwake(false)};

 const start=async()=>{
  try{
   const perm=await ExpoSpeechRecognitionModule.getPermissionsAsync();
   if(!perm.granted){
    const req=await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if(!req.granted){setSupported(false);return}
   }
   ExpoSpeechRecognitionModule.start({lang:"en-US",interimResults:true,continuous:true,contextualStrings:["Hey Tauranto","Tauranto"]});
   setListening(true);
  }catch{setSupported(false);setListening(false)}
 };
 const stop=()=>{
  if(restartTimer.current){clearTimeout(restartTimer.current);restartTimer.current=null}
  if(silenceTimer.current){clearTimeout(silenceTimer.current);silenceTimer.current=null}
  try{ExpoSpeechRecognitionModule.abort()}catch{}
  setListening(false);resetPhase();
 };

 useEffect(()=>{
  if(active&&supported){resetPhase();void start()}else{stop()}
  return()=>stop();
 },[active,supported]);

 const finalizeCommand=()=>{
  if(silenceTimer.current){clearTimeout(silenceTimer.current);silenceTimer.current=null}
  const text=capturedRef.current.trim();
  resetPhase();
  onCommandRef.current(text);
 };
 const armSilenceTimer=()=>{
  if(silenceTimer.current)clearTimeout(silenceTimer.current);
  silenceTimer.current=setTimeout(finalizeCommand,capturedRef.current?SPEECH_GAP_MS:WAKE_GRACE_MS);
 };

 useSpeechRecognitionEvent("result",e=>{
  if(!active)return;
  const said=e.results?.[0]?.transcript||"";
  if(phaseRef.current==="wake"){
   const match=findWake(said);
   if(!match)return;
   phaseRef.current="capture";setAwake(true);
   const remainder=said.slice(match.end).trim();
   if(remainder)capturedRef.current=remainder;
   armSilenceTimer();
   return;
  }
  // Already past the wake phrase: continuous recognition reports the
  // growing transcript for the current speech segment, which may or may not
  // still include the wake phrase as a prefix depending on platform — strip
  // it if present, otherwise treat the whole segment as the instruction.
  const again=findWake(said);
  const text=(again?said.slice(again.end):said).trim();
  if(text)capturedRef.current=text;
  armSilenceTimer();
 });
 useSpeechRecognitionEvent("end",()=>{
  setListening(false);
  if(phaseRef.current==="capture"){finalizeCommand()}
  if(active&&supported)restartTimer.current=setTimeout(()=>void start(),350);
 });
 useSpeechRecognitionEvent("error",e=>{
  setListening(false);
  if(e.error==="not-allowed"||e.error==="service-not-allowed"){setSupported(false);return}
  if(phaseRef.current==="capture")finalizeCommand();
  if(active&&supported)restartTimer.current=setTimeout(()=>void start(),700);
 });

 return{supported,listening,awake};
}

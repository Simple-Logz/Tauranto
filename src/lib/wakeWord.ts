import{useEffect,useRef,useState}from"react";
import{ExpoSpeechRecognitionModule,useSpeechRecognitionEvent}from"expo-speech-recognition";
import{findWake}from"./wakeMatch";
let permissionGranted=false;
const WAKE_GRACE_MS=6000,SPEECH_GAP_MS=1800,MAX_CAPTURE_MS=18000,RESTART_CAPTURE_MS=100,RESTART_WAKE_MS=500;

/** Foreground hands-free listener. Native mobile OS policy may suspend speech
 * recognition after the app is backgrounded/locked, so the UI must never claim
 * background listening. Within an active app session this hook continuously
 * recovers from normal recognizer session endings without losing capture state. */
export function useWakeWord(active:boolean,onCommand:(text:string)=>void){
 const[supported,setSupported]=useState(true),[listening,setListening]=useState(false),[awake,setAwake]=useState(false),[error,setError]=useState("");
 const restartTimer=useRef<ReturnType<typeof setTimeout>|null>(null),silenceTimer=useRef<ReturnType<typeof setTimeout>|null>(null),capTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const phase=useRef<"wake"|"capture">("wake"),committed=useRef(""),session=useRef(""),starting=useRef(false),onCommandRef=useRef(onCommand);onCommandRef.current=onCommand;
 const clear=()=>{for(const r of[restartTimer,silenceTimer,capTimer])if(r.current){clearTimeout(r.current);r.current=null}};
 const reset=()=>{phase.current="wake";committed.current="";session.current="";setAwake(false)};
 const captured=()=>[committed.current,session.current].filter(Boolean).join(" ").replace(/\s+/g," ").trim();
 const start=async()=>{if(starting.current||!active)return;starting.current=true;try{if(!permissionGranted){const p=await ExpoSpeechRecognitionModule.getPermissionsAsync();if(!p.granted){const r=await ExpoSpeechRecognitionModule.requestPermissionsAsync();if(!r.granted)throw new Error("Microphone and speech permission are required for hands-free voice.")}permissionGranted=true}ExpoSpeechRecognitionModule.start({lang:"en-US",interimResults:true,continuous:true,contextualStrings:["Hey Tauranto","Okay Tauranto","Tauranto"]});setListening(true);setError("")}catch(e){setListening(false);setError(e instanceof Error?e.message:"Hands-free voice could not start.")}finally{starting.current=false}};
 const stop=()=>{clear();try{ExpoSpeechRecognitionModule.abort()}catch{}setListening(false);reset()};
 useEffect(()=>{try{setSupported(ExpoSpeechRecognitionModule.isRecognitionAvailable())}catch{setSupported(false)}},[]);
 useEffect(()=>{if(active&&supported){reset();void start()}else stop();return()=>stop()},[active,supported]);
 const finalize=()=>{clear();const text=captured();reset();if(text)onCommandRef.current(text);if(active&&supported)restartTimer.current=setTimeout(()=>void start(),RESTART_WAKE_MS)};
 const arm=()=>{if(silenceTimer.current)clearTimeout(silenceTimer.current);silenceTimer.current=setTimeout(finalize,captured()?SPEECH_GAP_MS:WAKE_GRACE_MS)};
 const begin=()=>{phase.current="capture";committed.current="";session.current="";setAwake(true);if(capTimer.current)clearTimeout(capTimer.current);capTimer.current=setTimeout(finalize,MAX_CAPTURE_MS)};
 useSpeechRecognitionEvent("start",()=>{setListening(true);setError("")});
 useSpeechRecognitionEvent("result",e=>{if(!active)return;const said=e.results?.[0]?.transcript?.trim()||"";if(!said)return;if(phase.current==="wake"){const m=findWake(said);if(!m)return;begin();session.current=said.slice(m.end).trim();arm();return}const m=findWake(said);session.current=(m?said.slice(m.end):said).trim();arm()});
 useSpeechRecognitionEvent("end",()=>{setListening(false);if(!active||!supported)return;if(phase.current==="capture"){const text=captured();if(text)committed.current=text;session.current="";restartTimer.current=setTimeout(()=>void start(),RESTART_CAPTURE_MS)}else restartTimer.current=setTimeout(()=>void start(),RESTART_WAKE_MS)});
 useSpeechRecognitionEvent("error",e=>{setListening(false);const denied=e.error==="not-allowed"||e.error==="service-not-allowed";if(denied){permissionGranted=false;setSupported(false);setError("Microphone or speech recognition permission is blocked.");return}setError(`Voice listener interrupted (${e.error||"unknown"}). Reconnecting…`);if(active&&supported)restartTimer.current=setTimeout(()=>void start(),phase.current==="capture"?RESTART_CAPTURE_MS:900)});
 return{supported,listening,awake,error};
}

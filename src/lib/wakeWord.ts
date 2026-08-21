import{useEffect,useRef,useState}from"react";
import{ExpoSpeechRecognitionModule,useSpeechRecognitionEvent}from"expo-speech-recognition";

// Tolerate common mis-hears of "Tauranto" from on-device speech recognizers
// (which have never seen the brand name) — "hey tauranto" is the target
// phrase, the rest are safety nets so standby doesn't stay silent forever.
const PHRASES=["hey tauranto","tauranto","hey toronto","hey tarantino","hey toranto"];
function heard(transcript:string){const t=transcript.toLowerCase();return PHRASES.some(p=>t.includes(p))}

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
 * Mobile speech recognizers stop after a few seconds of silence even in
 * `continuous` mode, so this restarts itself on every `end`/recoverable
 * `error` event for as long as `active` stays true.
 */
export function useWakeWord(active:boolean,onWake:()=>void){
 const[supported,setSupported]=useState(true);
 const[listening,setListening]=useState(false);
 const restartTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const wakingRef=useRef(false);
 const onWakeRef=useRef(onWake);
 onWakeRef.current=onWake;

 useEffect(()=>{try{setSupported(ExpoSpeechRecognitionModule.isRecognitionAvailable())}catch{setSupported(false)}},[]);

 const start=async()=>{
  if(wakingRef.current)return;
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
  try{ExpoSpeechRecognitionModule.abort()}catch{}
  setListening(false);
 };

 useEffect(()=>{
  if(active&&supported){wakingRef.current=false;void start()}else{stop()}
  return()=>stop();
 },[active,supported]);

 useSpeechRecognitionEvent("result",e=>{
  if(!active||wakingRef.current)return;
  const said=e.results?.[0]?.transcript||"";
  if(heard(said)){
   wakingRef.current=true;
   try{ExpoSpeechRecognitionModule.abort()}catch{}
   setListening(false);
   onWakeRef.current();
  }
 });
 useSpeechRecognitionEvent("end",()=>{
  setListening(false);
  if(active&&supported&&!wakingRef.current)restartTimer.current=setTimeout(()=>void start(),350);
 });
 useSpeechRecognitionEvent("error",e=>{
  setListening(false);
  if(e.error==="not-allowed"||e.error==="service-not-allowed"){setSupported(false);return}
  if(active&&supported&&!wakingRef.current)restartTimer.current=setTimeout(()=>void start(),700);
 });

 return{supported,listening};
}

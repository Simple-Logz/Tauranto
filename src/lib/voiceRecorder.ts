import{Platform}from'react-native';import{AudioModule,RecordingPresets,setAudioModeAsync,useAudioRecorder}from'expo-audio';import*as FileSystem from'expo-file-system/legacy';import{taurantoApi}from'./api';
export const TAURANTO_RECORDING_OPTIONS=RecordingPresets.HIGH_QUALITY;
// Mirrors the same fix applied to the wake-word listener: check the OS's
// current grant first (getRecordingPermissionsAsync) and only fall through
// to requestRecordingPermissionsAsync — which is what can surface a native
// prompt — when permission genuinely isn't decided yet, instead of asking
// on every single "Fill by voice" tap regardless of already being granted.
let micPermissionGranted=false;
async function ensureMicPermission(){
 if(micPermissionGranted)return;
 const current=await AudioModule.getRecordingPermissionsAsync();
 if(current.granted){micPermissionGranted=true;return}
 const requested=await AudioModule.requestRecordingPermissionsAsync();
 if(!requested.granted)throw new Error('Microphone permission is required. Enable it in device settings.');
 micPermissionGranted=true;
}
async function uriToBase64(uri:string){if(Platform.OS==='web'){const response=await fetch(uri);if(!response.ok)throw new Error('The browser recording could not be read.');const blob=await response.blob();return await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error('The browser recording could not be encoded.'));reader.onloadend=()=>{const value=String(reader.result||'');const comma=value.indexOf(',');resolve(comma>=0?value.slice(comma+1):value)};reader.readAsDataURL(blob)})}const info=await FileSystem.getInfoAsync(uri);if(!info.exists)throw new Error('The recorded audio file could not be found.');return FileSystem.readAsStringAsync(uri,{encoding:FileSystem.EncodingType.Base64})}
export function useTaurantoRecorder(){const recorder=useAudioRecorder(TAURANTO_RECORDING_OPTIONS);async function start(){await ensureMicPermission();await setAudioModeAsync({allowsRecording:true,playsInSilentMode:true,shouldPlayInBackground:false});await recorder.prepareToRecordAsync();recorder.record()}async function stopAndTranscribe(){try{await recorder.stop();const uri=recorder.uri;if(!uri)throw new Error('No audio recording was created.');const audioBase64=await uriToBase64(uri);if(!audioBase64)throw new Error('The audio recording was empty.');const mimeType=Platform.OS==='web'?'audio/webm':'audio/m4a';const result=await taurantoApi.transcribeAudio(audioBase64,mimeType);const transcript=String(result?.transcript||'').trim();if(!transcript)throw new Error('No speech was detected in the recording.');return transcript}finally{await setAudioModeAsync({allowsRecording:false,playsInSilentMode:true,shouldPlayInBackground:false}).catch(()=>{})}}async function cancel(){try{await recorder.stop()}catch{}finally{await setAudioModeAsync({allowsRecording:false,playsInSilentMode:true,shouldPlayInBackground:false}).catch(()=>{})}}return{recorder,start,stopAndTranscribe,cancel}}

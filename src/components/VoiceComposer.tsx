import React,{useCallback,useEffect,useRef,useState}from'react';
import{Pressable,StyleSheet,Switch,Text,TextInput,View}from'react-native';
import*as Speech from'expo-speech';
import{Ionicons}from'@expo/vector-icons';
import{ExpoSpeechRecognitionModule,useSpeechRecognitionEvent}from'expo-speech-recognition';
import{colors,radius,shadow}from'../theme/tokens';
import{VoiceCommand}from'../lib/models';

type Mode='off'|'standby'|'recording'|'transcribing'|'working'|'error';
type Phase='off'|'standby'|'command'|'processing';
export type VoiceStatus={mode:Mode;message:string;lastHeard:string};
const WAKE=/\b(?:hey\s+)?tauranto\b[\s,.:;!?-]*/i;
const draft=(transcript:string):VoiceCommand=>({id:`capture-${Date.now()}`,transcript,title:'Restaurant instruction',summary:transcript,type:'task',status:'pending',createdAt:new Date().toISOString(),targets:[],confidence:1});

export function VoiceComposer({onCommand,enabled,onEnabledChange,onStatusChange,visible=true,captureRequest=0}:{onCommand:(command:VoiceCommand)=>void|string|Promise<void|string>;enabled:boolean;onEnabledChange:(enabled:boolean)=>void;onStatusChange?:(status:VoiceStatus)=>void;visible?:boolean;captureRequest?:number}){
  const[mode,setMode]=useState<Mode>('off'),[message,setMessage]=useState('Voice is ready.'),[transcript,setTranscript]=useState(''),[lastHeard,setLastHeard]=useState(''),[manual,setManual]=useState(false);
  const phase=useRef<Phase>('off'),enabledRef=useRef(enabled),recognizing=useRef(false),submitting=useRef(false),restartTimer=useRef<ReturnType<typeof setTimeout>|null>(null),lastCaptureRequest=useRef(captureRequest);
  const setM=useCallback((m:Mode,msg:string)=>{setMode(m);setMessage(msg)},[]);
  const clearRestart=()=>{if(restartTimer.current){clearTimeout(restartTimer.current);restartTimer.current=null}};

  const startRecognition=useCallback(async(target:Phase='standby')=>{
    if(!enabledRef.current||submitting.current||recognizing.current)return;
    clearRestart();
    try{
      const permission=await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if(!permission.granted)throw new Error('Microphone and speech-recognition permission are required. Enable them in device settings.');
      phase.current=target;
      setM(target==='command'?'recording':'standby',target==='command'?'Listening now. Speak naturally; Tauranto will submit when you finish.':'Hands-free standby is active. Say “Hey Tauranto,” then your instruction.');
      ExpoSpeechRecognitionModule.start({lang:'en-US',interimResults:true,continuous:true,maxAlternatives:1,addsPunctuation:true,contextualStrings:['Hey Tauranto','Tauranto','menu unavailable','contact supplier','schedule closure','pause orders']});
    }catch(error){
      phase.current='off';recognizing.current=false;
      setM('error',error instanceof Error?error.message:'Could not start speech recognition.');
      console.error('[voice] recognition start failed',error);
    }
  },[setM]);

  const scheduleStandby=useCallback((delay=450)=>{
    clearRestart();
    if(!enabledRef.current||submitting.current)return;
    restartTimer.current=setTimeout(()=>void startRecognition('standby'),delay);
  },[startRecognition]);

  const finishCycle=useCallback(()=>{
    submitting.current=false;phase.current=enabledRef.current?'standby':'off';
    setM(enabledRef.current?'standby':'off',enabledRef.current?'Ready. Say “Hey Tauranto” for the next command.':'Voice is off.');
    if(enabledRef.current)scheduleStandby(600);
  },[scheduleStandby,setM]);

  const submitRecognized=useCallback(async(value:string)=>{
    const text=value.trim();if(!text||submitting.current)return;
    submitting.current=true;phase.current='processing';setTranscript(text);setLastHeard(text);
    setM('working','Tauranto heard you. Interpreting and executing the instruction…');
    try{ExpoSpeechRecognitionModule.abort()}catch{}
    try{
      const reply=await onCommand(draft(text));
      const spoken=typeof reply==='string'&&reply.trim()?reply.trim():'Done.';
      setM('working',spoken);Speech.stop();
      let completed=false;const done=()=>{if(completed)return;completed=true;finishCycle()};
      Speech.speak(spoken,{rate:.96,onDone:done,onStopped:done,onError:done});
      setTimeout(done,Math.max(5000,spoken.length*75));
    }catch(error){
      submitting.current=false;const detail=error instanceof Error?error.message:'Could not process that instruction.';
      setM('error',`Command failed: ${detail}`);console.error('[voice] command submission failed',error);
      Speech.speak(`I couldn't complete that instruction. ${detail}`,{rate:.96,onDone:finishCycle,onStopped:finishCycle,onError:finishCycle});
    }
  },[finishCycle,onCommand,setM]);

  const beginCommandCapture=useCallback(async()=>{
    if(submitting.current)return;
    Speech.stop();setTranscript('');setLastHeard('');phase.current='command';
    setM('recording','Listening now. Speak naturally; Tauranto will submit when you finish.');
    if(!recognizing.current)await startRecognition('command');
  },[setM,startRecognition]);

  useSpeechRecognitionEvent('start',()=>{recognizing.current=true;console.info('[voice] recognition started',{phase:phase.current})});
  useSpeechRecognitionEvent('end',()=>{recognizing.current=false;console.info('[voice] recognition ended',{phase:phase.current});if(enabledRef.current&&!submitting.current){const nextPhase=phase.current==='command'?'command':'standby';clearRestart();restartTimer.current=setTimeout(()=>void startRecognition(nextPhase),450)}});
  useSpeechRecognitionEvent('result',event=>{
    const heard=String(event.results?.[0]?.transcript||'').trim();if(!heard||submitting.current)return;
    if(phase.current==='standby'){
      const match=heard.match(WAKE);if(!match)return;
      phase.current='command';const command=heard.slice((match.index||0)+match[0].length).trim();
      setM('recording',command?'Command detected. Finish speaking…':'Yes? I’m listening.');
      if(command){setTranscript(command);setLastHeard(command)}
      if(event.isFinal&&command)void submitRecognized(command);return;
    }
    if(phase.current==='command'){
      const command=heard.replace(WAKE,'').trim();
      if(command){setTranscript(command);setLastHeard(command)}
      if(event.isFinal&&command)void submitRecognized(command);
    }
  });
  useSpeechRecognitionEvent('error',event=>{
    recognizing.current=false;
    if(event.error==='aborted'&&submitting.current)return;
    if(event.error==='no-speech'||event.error==='speech-timeout'||event.error==='aborted'||event.error==='busy'){
      console.warn('[voice] recoverable recognition event',event);
      if(enabledRef.current&&!submitting.current){const nextPhase=phase.current==='command'?'command':'standby';clearRestart();restartTimer.current=setTimeout(()=>void startRecognition(nextPhase),event.error==='busy'?900:450)}return;
    }
    phase.current='off';
    setM('error',event.error==='not-allowed'?'Microphone permission is blocked. Allow microphone and speech recognition in device settings.':`Voice recognition failed: ${event.message||event.error}`);
    console.error('[voice] recognition error',event);
  });

  useEffect(()=>{onStatusChange?.({mode,message,lastHeard})},[mode,message,lastHeard,onStatusChange]);
  useEffect(()=>{
    enabledRef.current=enabled;
    if(enabled)void startRecognition(phase.current==='command'?'command':'standby');
    else{clearRestart();phase.current='off';recognizing.current=false;try{ExpoSpeechRecognitionModule.abort()}catch{}setM('off','Voice is off.')}
  },[enabled,setM,startRecognition]);
  useEffect(()=>{
    if(captureRequest===lastCaptureRequest.current)return;
    lastCaptureRequest.current=captureRequest;
    if(!enabledRef.current)onEnabledChange(true);
    void beginCommandCapture();
  },[captureRequest,beginCommandCapture,onEnabledChange]);
  useEffect(()=>()=>{clearRestart();try{ExpoSpeechRecognitionModule.abort()}catch{}Speech.stop()},[]);

  async function submitTyped(){const text=transcript.trim();if(text)await submitRecognized(text)}
  if(!visible)return null;
  const active=mode==='recording',working=mode==='working'||mode==='transcribing',bad=mode==='error';
  return <View><View style={s.card}><View style={s.top}><View style={[s.dot,mode==='standby'&&s.ready,active&&s.live,bad&&s.bad]}/><View style={{flex:1}}><Text style={s.status}>{mode==='off'?'Voice off':mode==='standby'?'Hands-free standby':active?'Listening':mode==='working'?'Tauranto is working':'Voice needs attention'}</Text><Text style={s.statusCopy}>{message}</Text></View><Switch value={enabled} onValueChange={onEnabledChange}/></View>{!!lastHeard&&<View style={s.transcript}><Text style={s.label}>TAURANTO HEARD</Text><Text style={s.transcriptText}>“{lastHeard}”</Text></View>}<Pressable disabled={working} onPress={()=>void beginCommandCapture()} style={[s.speak,active&&s.stop,working&&{opacity:.6}]}><Ionicons name={active?'mic':'mic-outline'} size={27} color='white'/><View style={{flex:1}}><Text style={s.speakTitle}>{active?'Listening now':'Speak now'}</Text><Text style={s.speakCopy}>{active?'Stop speaking and Tauranto will submit automatically':'One tap starts capture; no Finish tap is required.'}</Text></View></Pressable><Pressable onPress={()=>setManual(value=>!value)} style={s.type}><Ionicons name='keypad-outline' size={22} color={colors.ink}/><Text style={s.typeText}>{manual?'Close typing':'Type instead'}</Text></Pressable></View>{manual&&<View style={s.inputBar}><TextInput value={transcript} onChangeText={setTranscript} multiline placeholder='Type a restaurant instruction' style={s.input}/><Pressable onPress={()=>void submitTyped()} style={s.send}><Ionicons name='arrow-up' size={22} color='white'/></Pressable></View>}</View>;
}

const s=StyleSheet.create({card:{backgroundColor:'#E8F0DB',borderRadius:26,padding:20,borderWidth:1,borderColor:'#D3DFC4',...shadow},top:{flexDirection:'row',alignItems:'center',gap:12},dot:{width:13,height:13,borderRadius:7,backgroundColor:colors.muted},ready:{backgroundColor:'#3D8B50'},live:{backgroundColor:colors.tomato},bad:{backgroundColor:'#B42318'},status:{fontFamily:'NunitoSans_900Black',fontSize:18,color:colors.ink},statusCopy:{fontFamily:'NunitoSans_600SemiBold',fontSize:13,lineHeight:19,color:colors.inkSoft,marginTop:3},transcript:{backgroundColor:'#FFFFFFD9',borderRadius:radius.md,padding:15,marginTop:15},label:{fontFamily:'NunitoSans_900Black',fontSize:11,letterSpacing:1,color:colors.leafDeep},transcriptText:{fontFamily:'NunitoSans_800ExtraBold',fontSize:17,lineHeight:24,color:colors.ink,marginTop:7},speak:{minHeight:72,borderRadius:18,backgroundColor:colors.leafDeep,flexDirection:'row',alignItems:'center',gap:13,paddingHorizontal:16,marginTop:17},stop:{backgroundColor:colors.tomato},speakTitle:{fontFamily:'NunitoSans_900Black',fontSize:16,color:'white'},speakCopy:{fontFamily:'NunitoSans_600SemiBold',fontSize:12.5,color:'#FFFFFFD0',marginTop:3},type:{height:54,borderRadius:16,backgroundColor:colors.paper,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9,borderWidth:1,borderColor:'#D4DDCA',marginTop:10},typeText:{fontFamily:'NunitoSans_900Black',fontSize:15,color:colors.ink},inputBar:{flexDirection:'row',alignItems:'flex-end',backgroundColor:colors.paper,borderRadius:radius.md,borderWidth:1,borderColor:colors.line,marginTop:10,padding:9,gap:8},input:{flex:1,minHeight:50,maxHeight:110,fontFamily:'NunitoSans_600SemiBold',fontSize:16,color:colors.ink,padding:10},send:{width:50,height:50,borderRadius:15,backgroundColor:colors.leafDeep,alignItems:'center',justifyContent:'center'}});

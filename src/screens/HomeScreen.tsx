import React,{useMemo,useState}from"react";
import{Modal,Pressable,ScrollView,StyleSheet,Text,TextInput,useWindowDimensions,View}from"react-native";
import{Ionicons}from"@expo/vector-icons";
import{useSafeAreaInsets}from"react-native-safe-area-context";
import{VoiceCommand}from"../lib/models";

type Props={commands:VoiceCommand[];onCommand:(c:VoiceCommand)=>void;onDecide:(id:string,approved:boolean)=>void;onOpenActivity:()=>void;voiceEnabled:boolean;onToggleVoice:()=>void;voiceMode:string;voiceMessage:string};
export function HomeScreen({commands,onOpenActivity,voiceEnabled,onToggleVoice,voiceMode,voiceMessage}:Props){
 const insets=useSafeAreaInsets(),{width}=useWindowDimensions(),wide=width>=768;
 const[searchOpen,setSearchOpen]=useState(false),[alertsOpen,setAlertsOpen]=useState(false),[query,setQuery]=useState("");
 const pending=commands.filter(x=>x.status==="pending"),completed=commands.filter(x=>x.status==="completed"||x.status==="approved");
 const filtered=useMemo(()=>commands.filter(c=>`${c.title} ${c.summary} ${c.transcript}`.toLowerCase().includes(query.toLowerCase())),[commands,query]);
 const live=voiceMode==="recording",working=voiceMode==="working";
 const state=live?"Listening now":working?"Working on it":voiceEnabled?"Hands-free ready":"Voice paused";
 return <>
 <ScrollView style={s.page} contentContainerStyle={[s.content,{maxWidth:wide?1180:720,alignSelf:"center",width:"100%"}]}>
  <View style={[s.header,{paddingTop:insets.top+12}]}><View><Text style={s.greeting}>Good morning</Text><Text style={s.brand}>Restaurant team <Text>👋</Text></Text></View><View style={s.headerActions}><CircleButton icon="search" onPress={()=>setSearchOpen(true)}/><CircleButton icon="notifications-outline" onPress={()=>setAlertsOpen(true)} badge={pending.length>0}/><View style={s.profile}><Ionicons name="person" size={18} color="#fff"/><View style={s.online}/></View></View></View>

  <View style={[s.commandDeck,wide&&s.commandDeckWide]}>
   <View style={s.glowA}/><View style={s.glowB}/><View style={s.glowC}/>
   <View style={s.deckCopy}><View style={s.livePill}><View style={[s.liveDot,voiceEnabled&&s.liveDotOn]}/><Text style={s.livePillText}>{state}</Text></View><Text style={s.kicker}>TAURANTO LIVE OPERATIONS</Text><Text style={s.heroTitle}>Your shift,{"\n
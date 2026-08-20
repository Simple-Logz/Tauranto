import React from "react";
import {Pressable,ScrollView,StyleSheet,Text,useWindowDimensions,View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {VoiceCommand} from "../lib/models";

type Props={commands:VoiceCommand[];onDecide:(id:string,approved:boolean)=>void;onOpenActivity:()=>void;onOpenVoice:()=>void};

export function HomeScreen({commands,onDecide,onOpenActivity,onOpenVoice}:Props){
  const insets=useSafeAreaInsets();
  const {width}=useWindowDimensions();
  const compact=width<700;
  const pending=commands.filter(x=>x.status==="pending").slice(0,2);
  return <ScrollView style={s.page} showsVerticalScrollIndicator={false} contentContainerStyle={[s.content,{paddingTop:insets.top+12,maxWidth:compact?520:760,alignSelf:"center",width:"100%"}]}>
    <View style={s.header}>
      <View style={s.menuCircle}><Ionicons name="menu" size={20} color="#17231F"/></View>
      <View style={s.headerCopy}><Text style={s.eyebrow}>TAURANTO</Text><Text style={s.greeting}>Good morning 👋</Text></View>
      <Pressable onPress={onOpenActivity} style={s.bell}><Ionicons name="notifications-outline" size={19} color="#17231F"/>{pending.length>0&&<View style={s.badge}><Text style={s.badgeText}>{pending.length}</Text></View>}</Pressable>
    </View>

    <View style={s.voiceCard}>
      <View style={s.voiceCopy}>
        <Text style={s.voiceKicker}>RESTAURANT OPERATIONS</Text>
        <Text style={s.voiceTitle}>What needs to happen?</Text>
        <Text style={s.voiceText}>Speak a command and Tauranto will organize the next step.</Text>
        <Pressable onPress={onOpenVoice} style={s.speakButton}><Ionicons name="mic" size={18} color="#fff"/><Text style={s.speakText}>Tap to speak</Text></Pressable>
      </View>
      <View style={s.voiceArt}><View style={s.waveSmall}/><View style={s.micOrb}><Ionicons name="mic" size={29} color="#fff"/></View><View style={s.waveTall}/></View>
    </View>

    <View style={s.sectionRow}><Text style={s.sectionTitle}>Quick actions</Text><Text style={s.sectionLink}>See all</Text></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickRow}>
      <Quick icon="restaurant-outline" title="Update menu" tint="#EAF6ED" onPress={onOpenVoice}/>
      <Quick icon="pause-circle-outline" title="Mark unavailable" tint="#FFF4D9" onPress={onOpenVoice}/>
      <Quick icon="calendar-outline" title="Schedule closure" tint="#EAF2F7" onPress={onOpenVoice}/>
      <Quick icon="call-outline" title="Contact supplier" tint="#EDF5EA" onPress={onOpenVoice}/>
    </ScrollView>

    <View style={s.sectionRow}><View><Text style={s.sectionTitle}>Needs your approval</Text><Text style={s.sectionSub}>{pending.length?`${pending.length} waiting for you`:"You're all caught up"}</Text></View><Pressable onPress={onOpenActivity}><Text style={s.sectionLink}>View all</Text></Pressable></View>
    {pending.length?pending.map(c=><View key={c.id} style={s.approvalCard}>
      <View style={s.approvalTop}><View style={s.actionIcon}><Ionicons name="sparkles-outline" size={19} color="#315B49"/></View><View style={{flex:1}}><Text numberOfLines={1} style={s.approvalTitle}>{c.title||"Restaurant action"}</Text><Text numberOfLines={2} style={s.approvalCopy}>{c.summary||c.transcript}</Text></View></View>
      <View style={s.decisionRow}><Pressable onPress={()=>onDecide(c.id,false)} style={s.secondaryButton}><Text style={s.secondaryText}>Not now</Text></Pressable><Pressable onPress={()=>onDecide(c.id,true)} style={s.primaryButton}><Ionicons name="checkmark" size={16} color="#fff"/><Text style={s.primaryText}>Approve</Text></Pressable></View>
    </View>):<View style={s.emptyCard}><View style={s.emptyIcon}><Ionicons name="checkmark" size={22} color="#315B49"/></View><View><Text style={s.emptyTitle}>Nothing waiting</Text><Text style={s.emptyText}>New approvals will show up here.</Text></View></View>}

    <View style={s.sectionRow}><Text style={s.sectionTitle}>Today at a glance</Text></View>
    <View style={s.statsRow}><Stat icon="receipt-outline" value={`${commands.length}`} label="Commands"/><Stat icon="time-outline" value={`${pending.length}`} label="Pending"/><Stat icon="checkmark-circle-outline" value={`${commands.filter(x=>x.status!=="pending").length}`} label="Handled"/></View>
  </ScrollView>
}

function Quick({icon,title,tint,onPress}:{icon:keyof typeof Ionicons.glyphMap;title:string;tint:string;onPress:()=>void}){return <Pressable onPress={onPress} style={[s.quick,{backgroundColor:tint}]}><View style={s.quickIcon}><Ionicons name={icon} size={22} color="#213C31"/></View><Text style={s.quickTitle}>{title}</Text><Ionicons name="arrow-forward" size={15} color="#65736D"/></Pressable>}
function Stat({icon,value,label}:{icon:keyof typeof Ionicons.glyphMap;value:string;label:string}){return <View style={s.stat}><Ionicons name={icon} size={18} color="#315B49"/><Text style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>}

const s=StyleSheet.create({
  page:{flex:1,backgroundColor:"#FBFCF9"},content:{paddingHorizontal:18,paddingBottom:130},
  header:{height:58,flexDirection:"row",alignItems:"center",marginBottom:18},menuCircle:{width:42,height:42,borderRadius:15,backgroundColor:"#F0F3EE",alignItems:"center",justifyContent:"center"},headerCopy:{flex:1,marginLeft:12},eyebrow:{fontFamily:"NunitoSans_900Black",fontSize:9,letterSpacing:1.5,color:"#77837D"},greeting:{fontFamily:"NunitoSans_900Black",fontSize:20,color:"#17231F",letterSpacing:-.5,marginTop:1},bell:{width:42,height:42,borderRadius:15,backgroundColor:"#F0F3EE",alignItems:"center",justifyContent:"center"},badge:{position:"absolute",right:3,top:2,minWidth:17,height:17,borderRadius:9,backgroundColor:"#E9823A",alignItems:"center",justifyContent:"center",paddingHorizontal:4},badgeText:{fontFamily:"NunitoSans_900Black",fontSize:9,color:"#fff"},
  voiceCard:{minHeight:210,borderRadius:28,backgroundColor:"#E8F2E3",padding:22,flexDirection:"row",overflow:"hidden"},voiceCopy:{flex:1,zIndex:2},voiceKicker:{fontFamily:"NunitoSans_900Black",fontSize:9,letterSpacing:1.4,color:"#56705F"},voiceTitle:{fontFamily:"NunitoSans_900Black",fontSize:29,lineHeight:32,color:"#17231F",letterSpacing:-1,marginTop:7,maxWidth:310},voiceText:{fontFamily:"NunitoSans_600SemiBold",fontSize:12.5,lineHeight:18,color:"#617069",maxWidth:300,marginTop:8},speakButton:{alignSelf:"flex-start",height:43,borderRadius:14,backgroundColor:"#213F33",paddingHorizontal:15,flexDirection:"row",alignItems:"center",gap:7,marginTop:17},speakText:{fontFamily:"NunitoSans_900Black",fontSize:12,color:"#fff"},voiceArt:{width:115,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:5,opacity:.96},micOrb:{width:76,height:76,borderRadius:38,backgroundColor:"#6EA85F",alignItems:"center",justifyContent:"center",shadowColor:"#456F3D",shadowOpacity:.18,shadowRadius:16,shadowOffset:{width:0,height:8}},waveSmall:{width:5,height:31,borderRadius:4,backgroundColor:"#A7CF9C"},waveTall:{width:5,height:52,borderRadius:4,backgroundColor:"#8FC27F"},
  sectionRow:{marginTop:25,marginBottom:11,flexDirection:"row",justifyContent:"space-between",alignItems:"flex-end"},sectionTitle:{fontFamily:"NunitoSans_900Black",fontSize:19,color:"#17231F",letterSpacing:-.5},sectionSub:{fontFamily:"NunitoSans_600SemiBold",fontSize:11,color:"#7B8781",marginTop:2},sectionLink:{fontFamily:"NunitoSans_700Bold",fontSize:11,color:"#66736D"},quickRow:{gap:10,paddingRight:18},quick:{width:145,height:128,borderRadius:24,padding:14,justifyContent:"space-between"},quickIcon:{width:38,height:38,borderRadius:13,backgroundColor:"rgba(255,255,255,.72)",alignItems:"center",justifyContent:"center"},quickTitle:{fontFamily:"NunitoSans_900Black",fontSize:13,lineHeight:16,color:"#17231F",maxWidth:100},
  approvalCard:{backgroundColor:"#fff",borderRadius:24,padding:16,marginBottom:10,shadowColor:"#15241E",shadowOpacity:.06,shadowRadius:18,shadowOffset:{width:0,height:7},elevation:2},approvalTop:{flexDirection:"row",gap:12,alignItems:"flex-start"},actionIcon:{width:42,height:42,borderRadius:14,backgroundColor:"#EDF5EA",alignItems:"center",justifyContent:"center"},approvalTitle:{fontFamily:"NunitoSans_900Black",fontSize:14,color:"#17231F"},approvalCopy:{fontFamily:"NunitoSans_600SemiBold",fontSize:11.5,lineHeight:16,color:"#748079",marginTop:3},decisionRow:{flexDirection:"row",gap:8,justifyContent:"flex-end",marginTop:15},secondaryButton:{height:38,borderRadius:13,paddingHorizontal:15,backgroundColor:"#F3F4F1",alignItems:"center",justifyContent:"center"},secondaryText:{fontFamily:"NunitoSans_800ExtraBold",fontSize:11,color:"#53615B"},primaryButton:{height:38,borderRadius:13,paddingHorizontal:15,backgroundColor:"#294D3D",flexDirection:"row",gap:5,alignItems:"center",justifyContent:"center"},primaryText:{fontFamily:"NunitoSans_900Black",fontSize:11,color:"#fff"},emptyCard:{backgroundColor:"#fff",borderRadius:22,padding:16,flexDirection:"row",alignItems:"center",gap:12},emptyIcon:{width:42,height:42,borderRadius:14,backgroundColor:"#EAF4E7",alignItems:"center",justifyContent:"center"},emptyTitle:{fontFamily:"NunitoSans_900Black",fontSize:13,color:"#17231F"},emptyText:{fontFamily:"NunitoSans_600SemiBold",fontSize:11,color:"#7B8781",marginTop:2},
  statsRow:{flexDirection:"row",gap:9},stat:{flex:1,minHeight:98,borderRadius:21,backgroundColor:"#F0F4EE",padding:13,justifyContent:"space-between"},statValue:{fontFamily:"NunitoSans_900Black",fontSize:22,color:"#17231F",letterSpacing:-.7},statLabel:{fontFamily:"NunitoSans_700Bold",fontSize:10,color:"#728078"}
});
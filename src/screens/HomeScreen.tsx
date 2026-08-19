import React,{useMemo,useState}from"react";
import{Modal,Pressable,ScrollView,StyleSheet,Text,TextInput,useWindowDimensions,View}from"react-native";
import{Ionicons}from"@expo/vector-icons";
import{useSafeAreaInsets}from"react-native-safe-area-context";
import{VoiceCommand}from"../lib/models";

type Props={commands:VoiceCommand[];onCommand:(c:VoiceCommand)=>void;onDecide:(id:string,approved:boolean)=>void;onOpenActivity:()=>void;voiceEnabled:boolean;onToggleVoice:()=>void;voiceMode:string;voiceMessage:string};

export function HomeScreen({commands,onOpenActivity,voiceEnabled,onToggleVoice,voiceMode,voiceMessage}:Props){
 const insets=useSafeAreaInsets();const{width}=useWindowDimensions();const wide=width>=768;
 const[searchOpen,setSearchOpen]=useState(false),[alertsOpen,setAlertsOpen]=useState(false),[query,setQuery]=useState("");
 const pending=commands.filter(x=>x.status==="pending"),completed=commands.filter(x=>x.status==="completed"||x.status==="approved");
 const filtered=useMemo(()=>commands.filter(c=>`${c.title} ${c.summary} ${c.transcript}`.toLowerCase().includes(query.toLowerCase())),[commands,query]);
 const live=voiceMode==="recording",working=voiceMode==="working";
 return <>
  <ScrollView style={s.page} contentContainerStyle={[s.content,{maxWidth:wide?1040:680,alignSelf:"center",width:"100%"}]}>
   <View style={[s.header,{paddingTop:insets.top+12}]}>
    <View><Text style={s.hello}>Good to see you.</Text><Text style={s.brand}>tauranto</Text></View>
    <View style={s.headerActions}><CircleButton icon="search" onPress={()=>setSearchOpen(true)}/><CircleButton icon="notifications-outline" onPress={()=>setAlertsOpen(true)} badge={pending.length>0}/></View>
   </View>

   <View style={s.hero}>
    <View style={s.heroCopy}>
     <Text style={s.kicker}>RESTAURANT COMMAND CENTER</Text>
     <Text style={s.heroTitle}>What needs to happen <Text style={s.accent}>next?</Text></Text>
     <Text style={s.heroText}>Speak naturally. Tauranto turns the instruction into organized restaurant work.</Text>
    </View>
    <Pressable onPress={onToggleVoice} style={({pressed})=>[s.voiceButton,voiceEnabled&&s.voiceButtonOn,pressed&&s.pressed]}>
     <Ionicons name={live?"mic":"mic-outline"} size={34} color={voiceEnabled?"#fff":"#193235"}/>
    </Pressable>
    <View style={s.voiceStatus}>
     <View style={[s.dot,voiceEnabled&&s.dotOn]}/><Text style={s.voiceStatusText}>{live?"Listening now":working?"Working on your request":voiceEnabled?(voiceMessage||"Ready — say “Hey Tauranto”"):"Tap to start talking"}</Text>
    </View>
   </View>

   <View style={s.snapshot}>
    <View style={s.snapshotHead}><Text style={s.snapshotTitle}>Today</Text><Text style={s.liveLabel}>LIVE</Text></View>
    <View style={s.statRow}>
     <Stat value={String(pending.length)} label="Needs you" icon="alert-circle-outline"/>
     <Stat value={String(completed.length)} label="Completed" icon="checkmark-circle-outline"/>
     <Stat value={String(commands.length)} label="Commands" icon="sparkles-outline" last/>
    </View>
   </View>

   <View style={s.sectionHeader}><View><Text style={s.kicker}>QUICK ACCESS</Text><Text style={s.sectionTitle}>Keep things moving</Text></View></View>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.actionRail}>
    <ActionCard icon="shield-checkmark-outline" title="Approvals" detail={pending.length?`${pending.length} waiting":"All clear"} onPress={onOpenActivity}/>
    <ActionCard icon="restaurant-outline" title="Operations" detail="Restaurant actions" onPress={onOpenActivity}/>
    <ActionCard icon="checkmark-done-outline" title="Completed" detail={`${completed.length} finished`} onPress={onOpenActivity}/>
   </ScrollView>

   <View style={s.activityHeader}><View><Text style={s.kicker}>LATEST</Text><Text style={s.sectionTitle}>What Tauranto has done</Text></View><Pressable style={s.seeAll} onPress={onOpenActivity}><Text style={s.seeAllText}>See all</Text><Ionicons name="arrow-forward" size={16} color="#193235"/></Pressable></View>
   <View style={s.activityPanel}>{commands.length===0?<Empty/>:commands.slice(0,5).map((c,i)=><CommandRow key={c.id} c={c} last={i===Math.min(commands.length,5)-1}/>)}</View>
  </ScrollView>

  <Modal visible={searchOpen} animationType="slide" onRequestClose={()=>setSearchOpen(false)}><View style={[s.modal,{paddingTop:insets.top+18}]}><ModalHead title="Search" close={()=>setSearchOpen(false)}/><View style={s.searchBox}><Ionicons name="search" size={20} color="#748184"/><TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Search commands or actions" style={s.searchInput}/></View><ScrollView>{query.length>0&&(filtered.length?filtered.map((c,i)=><CommandRow key={c.id} c={c} last={i===filtered.length-1}/>):<Text style={s.noResult}>No matching commands.</Text>)}</ScrollView></View></Modal>
  <Modal visible={alertsOpen} animationType="slide" onRequestClose={()=>setAlertsOpen(false)}><View style={[s.modal,{paddingTop:insets.top+18}]}><ModalHead title="Notifications" close={()=>setAlertsOpen(false)}/>{pending.length?<ScrollView>{pending.map((c,i)=><Pressable key={c.id} onPress={()=>{setAlertsOpen(false);onOpenActivity()}}><CommandRow c={c} last={i===pending.length-1}/></Pressable>)}</ScrollView>:<Empty done/>}</View></Modal>
 </>;
}

function CircleButton({icon,onPress,badge=false}:{icon:keyof typeof Ionicons.glyphMap;onPress:()=>void;badge?:boolean}){return <Pressable onPress={onPress} style={s.circleButton}><Ionicons name={icon} size={21} color="#193235"/>{badge&&<View style={s.badge}/>}</Pressable>}
function ModalHead({title,close}:{title:string;close:()=>void}){return <View style={s.modalHead}><Pressable onPress={close} style={s.back}><Ionicons name="arrow-back" size={22} color="#193235"/></Pressable><Text style={s.modalTitle}>{title}</Text></View>}
function Stat({value,label,icon,last=false}:{value:string;label:string;icon:keyof typeof Ionicons.glyphMap;last?:boolean}){return <View style={[s.stat,!last&&s.statBorder]}><Ionicons name={icon} size={18} color="#5B9FA8"/><Text style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>}
function ActionCard({icon,title,detail,onPress}:{icon:keyof typeof Ionicons.glyphMap;title:string;detail:string;onPress:()=>void}){return <Pressable onPress={onPress} style={({pressed})=>[s.actionCard,pressed&&s.pressed]}><View style={s.actionIcon}><Ionicons name={icon} size={23} color="#193235"/></View><Text style={s.actionTitle}>{title}</Text><Text style={s.actionDetail}>{detail}</Text><View style={s.actionArrow}><Ionicons name="arrow-forward" size={16} color="#193235"/></View></Pressable>}
function CommandRow({c,last=false}:{c:VoiceCommand;last?:boolean}){const pending=c.status==="pending";return <View style={[s.row,!last&&s.rowBorder]}><View style={[s.rowIcon,pending?s.rowIconPending:s.rowIconDone]}><Ionicons name={pending?"time-outline":"checkmark"} size={18} color={pending?"#A36A12":"#337D68"}/></View><View style={s.flex}><Text style={s.rowTitle}>{c.title}</Text><Text style={s.rowMeta}>{pending?"Waiting for approval":"Completed"} · {new Date(c.createdAt).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}</Text></View><Ionicons name="chevron-forward" size={18} color="#A1AAAC"/></View>}
function Empty({done=false}:{done?:boolean}){return <View style={s.empty}><View style={s.emptyArt}><Ionicons name={done?"checkmark-circle-outline":"mic-outline"} size={30} color="#315D62"/></View><Text style={s.emptyTitle}>{done?"You're all caught up":"Your shift starts here"}</Text><Text style={s.emptyText}>{done?"There are no approvals waiting right now.":"Speak a command and Tauranto will organize the action here."}</Text></View>}

const s=StyleSheet.create({
 page:{flex:1,backgroundColor:"#FBFCFA"},content:{paddingBottom:118},flex:{flex:1},pressed:{opacity:.88,transform:[{scale:.985}]},
 header:{paddingHorizontal:22,paddingBottom:18,flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between",backgroundColor:"#FBFCFA"},hello:{fontFamily:"NunitoSans_700Bold",fontSize:11,color:"#849092",marginBottom:1},brand:{fontFamily:"NunitoSans_900Black",fontSize:27,color:"#193235",letterSpacing:-1},headerActions:{flexDirection:"row",gap:8},circleButton:{width:42,height:42,borderRadius:21,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#E6EBE8",alignItems:"center",justifyContent:"center"},badge:{position:"absolute",right:6,top:5,width:8,height:8,borderRadius:4,backgroundColor:"#D88C48",borderWidth:1.5,borderColor:"#FFF"},
 hero:{marginHorizontal:16,borderRadius:32,backgroundColor:"#DDF3F1",paddingHorizontal:24,paddingTop:28,paddingBottom:24,minHeight:330,overflow:"hidden"},heroCopy:{maxWidth:470},kicker:{fontFamily:"NunitoSans_900Black",fontSize:9,letterSpacing:1.55,color:"#5B8F91",marginBottom:6},heroTitle:{fontFamily:"NunitoSans_900Black",fontSize:38,lineHeight:41,color:"#193235",letterSpacing:-1.5,maxWidth:500},accent:{color:"#4D9DA0"},heroText:{fontFamily:"NunitoSans_700Bold",fontSize:14,lineHeight:21,color:"#637578",marginTop:12,maxWidth:440},voiceButton:{width:82,height:82,borderRadius:41,backgroundColor:"#FFFFFF",alignItems:"center",justifyContent:"center",marginTop:28,borderWidth:1,borderColor:"#CDE3E1"},voiceButtonOn:{backgroundColor:"#315D62",borderColor:"#315D62"},voiceStatus:{position:"absolute",right:22,bottom:30,left:128,flexDirection:"row",alignItems:"center",gap:8},dot:{width:8,height:8,borderRadius:4,backgroundColor:"#9AA6A5"},dotOn:{backgroundColor:"#62B991"},voiceStatusText:{fontFamily:"NunitoSans_800ExtraBold",fontSize:11,color:"#506568",flex:1},
 snapshot:{marginHorizontal:16,marginTop:14,backgroundColor:"#193235",borderRadius:25,paddingTop:18,paddingHorizontal:18,paddingBottom:8},snapshotHead:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:13},snapshotTitle:{fontFamily:"NunitoSans_900Black",fontSize:18,color:"#FFFFFF"},liveLabel:{fontFamily:"NunitoSans_900Black",fontSize:8,letterSpacing:1.2,color:"#B8E6D1"},statRow:{flexDirection:"row"},stat:{flex:1,paddingVertical:10,paddingHorizontal:10,alignItems:"flex-start"},statBorder:{borderRightWidth:1,borderRightColor:"#FFFFFF1F"},statValue:{fontFamily:"NunitoSans_900Black",fontSize:25,color:"#FFFFFF",marginTop:5},statLabel:{fontFamily:"NunitoSans_700Bold",fontSize:10,color:"#C4D0D0",marginTop:1},
 sectionHeader:{paddingHorizontal:22,marginTop:34,marginBottom:13},sectionTitle:{fontFamily:"NunitoSans_900Black",fontSize:24,color:"#193235",letterSpacing:-.6},actionRail:{paddingHorizontal:16,paddingRight:30,gap:11},actionCard:{width:168,height:164,borderRadius:25,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#E5EAE7",padding:17},actionIcon:{width:43,height:43,borderRadius:15,backgroundColor:"#EEF6E7",alignItems:"center",justifyContent:"center"},actionTitle:{fontFamily:"NunitoSans_900Black",fontSize:16,color:"#193235",marginTop:17},actionDetail:{fontFamily:"NunitoSans_700Bold",fontSize:11,color:"#7A8789",marginTop:2},actionArrow:{position:"absolute",right:15,bottom:15,width:30,height:30,borderRadius:15,backgroundColor:"#F0F3EF",alignItems:"center",justifyContent:"center"},
 activityHeader:{paddingHorizontal:22,marginTop:36,marginBottom:12,flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between"},seeAll:{flexDirection:"row",alignItems:"center",gap:5,paddingBottom:2},seeAllText:{fontFamily:"NunitoSans_900Black",fontSize:11,color:"#193235"},activityPanel:{marginHorizontal:16,backgroundColor:"#FFFFFF",borderRadius:25,borderWidth:1,borderColor:"#E6EBE8",paddingHorizontal:16,overflow:"hidden"},row:{minHeight:76,flexDirection:"row",alignItems:"center",gap:12,paddingVertical:11},rowBorder:{borderBottomWidth:1,borderBottomColor:"#EDF0EE"},rowIcon:{width:40,height:40,borderRadius:14,alignItems:"center",justifyContent:"center"},rowIconPending:{backgroundColor:"#FFF1D8"},rowIconDone:{backgroundColor:"#E7F4EC"},rowTitle:{fontFamily:"NunitoSans_900Black",fontSize:14,color:"#193235"},rowMeta:{fontFamily:"NunitoSans_700Bold",fontSize:10.5,color:"#879294",marginTop:3},
 empty:{minHeight:205,alignItems:"center",justifyContent:"center",padding:28},emptyArt:{width:62,height:62,borderRadius:22,backgroundColor:"#EAF5F1",alignItems:"center",justifyContent:"center",marginBottom:13},emptyTitle:{fontFamily:"NunitoSans_900Black",fontSize:18,color:"#193235"},emptyText:{fontFamily:"NunitoSans_700Bold",fontSize:12,lineHeight:18,color:"#7C898B",textAlign:"center",maxWidth:310,marginTop:4},
 modal:{flex:1,backgroundColor:"#FBFCFA",paddingHorizontal:20},modalHead:{height:62,flexDirection:"row",alignItems:"center",gap:13},back:{width:38,height:38,borderRadius:19,backgroundColor:"#FFF",alignItems:"center",justifyContent:"center"},modalTitle:{fontFamily:"NunitoSans_900Black",fontSize:23,color:"#193235"},searchBox:{height:54,borderRadius:18,backgroundColor:"#FFF",borderWidth:1,borderColor:"#E3E9E6",flexDirection:"row",alignItems:"center",gap:9,paddingHorizontal:15,marginVertical:15},searchInput:{flex:1,fontFamily:"NunitoSans_700Bold",fontSize:14},noResult:{fontFamily:"NunitoSans_700Bold",color:"#7A8586",paddingTop:28,textAlign:"center"}
});
import React from"react";
import{Pressable,StyleSheet,Text,View}from"react-native";
import{Ionicons}from"@expo/vector-icons";
import{colors}from"../theme/tokens";
import{useTheme}from"../theme/ThemeContext";

// This card used to be a purely decorative "stack of cards fans open, tap
// one for a swipeable caption" infographic — six generic captions with no
// connection to what was actually happening in the restaurant. It looked
// nice once, then had nothing left to say the second time you saw it.
// This version keeps the same six-step story (Speak → Understand → Approve
// → Execute → Verify → Audit) but turns every tile into a real, live status
// pulled from this restaurant's own data, and tapping a tile jumps straight
// to the screen that handles that step — so the card is either telling you
// something true right now, or getting you somewhere useful, always both.
type Props={pending:number;completed:number;connectedCount:number;onOpenVoice:()=>void;onOpenApprovals:()=>void;onOpenActivity:()=>void;onOpenIntegrations:()=>void};
export function TaurantoServiceFan({pending,completed,connectedCount,onOpenVoice,onOpenApprovals,onOpenActivity,onOpenIntegrations}:Props){
 const{dark}=useTheme();
 const STEPS=[
  {step:"01",title:"Speak",icon:"mic-outline"as const,stat:"Say “Hey Tauranto”",onPress:onOpenVoice},
  {step:"02",title:"Understand",icon:"sparkles-outline"as const,stat:"AI-interpreted instantly",onPress:onOpenVoice},
  {step:"03",title:"Approve",icon:"shield-checkmark-outline"as const,stat:pending>0?`${pending} waiting on you`:"Nothing waiting",alert:pending>0,onPress:onOpenApprovals},
  {step:"04",title:"Execute",icon:"git-network-outline"as const,stat:connectedCount>0?`${connectedCount} system${connectedCount===1?"":"s"} connected`:"Connect a system",alert:connectedCount===0,onPress:onOpenIntegrations},
  {step:"05",title:"Verify",icon:"checkmark-done-circle-outline"as const,stat:`${completed} completed today`,onPress:onOpenActivity},
  {step:"06",title:"Audit",icon:"document-text-outline"as const,stat:"Full activity trail",onPress:onOpenActivity},
 ];
 return <View style={s.wrap}>
  <View style={s.head}><View><Text style={[s.kicker,dark&&s.kickerDark]}>TAURANTO AT WORK</Text><Text style={[s.heading,dark&&s.headingDark]}>Your operations pipeline</Text></View></View>
  <Text style={[s.sub,dark&&s.subDark]}>Live status for every step — tap a stage to jump in.</Text>
  <View style={s.grid}>{STEPS.map(item=><Pressable key={item.step} onPress={item.onPress} style={({pressed})=>[s.tile,dark&&s.tileDark,pressed&&s.tilePressed]}>
   <View style={s.tileTop}><View style={[s.tileIcon,dark&&s.tileIconDark]}><Ionicons name={item.icon} size={19} color={dark?colors.leaf:colors.leafDeep}/></View><Text style={[s.tileStep,dark&&s.tileStepDark]}>{item.step}</Text></View>
   <Text style={[s.tileTitle,dark&&s.tileTitleDark]}>{item.title}</Text>
   <Text numberOfLines={1} style={[s.tileStat,dark&&s.tileStatDark,item.alert&&s.tileStatAlert]}>{item.stat}</Text>
  </Pressable>)}</View>
 </View>;
}
const s=StyleSheet.create({
 wrap:{marginTop:27,paddingHorizontal:14},
 head:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-end"},
 kicker:{fontFamily:"NunitoSans_900Black",fontSize:8.5,letterSpacing:1.5,color:"#315F50"},kickerDark:{color:colors.leaf},
 heading:{fontFamily:"NunitoSans_900Black",fontSize:21,color:"#102A24",letterSpacing:-.6,marginTop:2},headingDark:{color:"#F4F8F5"},
 sub:{fontFamily:"NunitoSans_600SemiBold",fontSize:12.5,lineHeight:18,color:"#5B6B63",marginTop:5},subDark:{color:"#8FA49A"},
 grid:{flexDirection:"row",flexWrap:"wrap",gap:9,marginTop:14},
 tile:{width:"31.7%",minHeight:104,borderRadius:18,backgroundColor:"#F7FAF8",borderWidth:1,borderColor:"#DCE7E0",padding:11,shadowColor:"#173F34",shadowOpacity:.05,shadowRadius:8,shadowOffset:{width:0,height:3},elevation:1},
 tileDark:{backgroundColor:"#161C18",borderColor:"#2B342F"},
 tilePressed:{transform:[{scale:.97}],opacity:.9},
 tileTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
 tileIcon:{width:30,height:30,borderRadius:10,backgroundColor:colors.leafPale,alignItems:"center",justifyContent:"center"},tileIconDark:{backgroundColor:"#1B2320"},
 tileStep:{fontFamily:"NunitoSans_900Black",fontSize:8,color:"#8FA49A",letterSpacing:1},tileStepDark:{color:"#5C6B63"},
 tileTitle:{fontFamily:"NunitoSans_900Black",fontSize:12.5,color:"#102A24",marginTop:8},tileTitleDark:{color:"#F4F8F5"},
 tileStat:{fontFamily:"NunitoSans_700Bold",fontSize:9.5,lineHeight:13,color:"#5B6B63",marginTop:4},tileStatDark:{color:"#8FA49A"},
 tileStatAlert:{color:colors.tomatoDeep,fontFamily:"NunitoSans_800ExtraBold"},
});

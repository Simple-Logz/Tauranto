import React from "react";
import {Pressable,ScrollView,StyleSheet,Text,useWindowDimensions,View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {VoiceCommand} from "../lib/models";

type Props={commands:VoiceCommand[];onDecide:(id:string,approved:boolean)=>void;onOpenActivity:()=>void;onOpenVoice:()=>void};

export function HomeScreen({commands,onDecide,onOpenActivity,onOpenVoice}:Props){
 const insets=useSafeAreaInsets(),{width}=useWindowDimensions(),pending=commands.filter(x=>x.status==="pending").slice(0,3),wide=width>720;
 return <ScrollView style={s.page} showsVerticalScrollIndicator={false} contentContainerStyle={[s.content,{paddingTop:insets.top+18,maxWidth:wide?900:560,alignSelf:"center",width:"100%"}]}>
  <View style={s.top}><View><Text style={s.brand}>Tauranto</Text><Text style={s.place}>Restaurant Operations</Text></View><Pressable onPress={onOpenActivity} style={s.activity}><Ionicons name="notifications-outline" size={21} color="#201D1A"/>{pending.length>0&&<View style={s.dot}/>}</Pressable></View>

  <View style={s.welcome}><Text style={s.hello}>Good morning</Text><Text style={s.question}>What do you need{wide?" ":"\n"}Tauranto to do?</Text></View>

  <Pressable onPress={onOpenVoice} style={s.commandBox}>
   <View style={s.mic}><Ionicons name="mic" size={28} color="#fff"/></View>
   <View style={{flex:1}}><Text style={s.commandTitle}>Speak to Tauranto</Text><Text style={s.commandHint}>Tap the microphone and give a restaurant command</Text></View>
   <Ionicons name="chevron-forward" size={19} color="#9B8D82"/>
  </Pressable>

  <View style={s.chips}><Action icon="restaurant-outline" label="Menu" onPress={onOpenVoice}/><Action icon="ban-outline" label="Unavailable" onPress={onOpenVoice}/><Action icon="calendar-outline" label="Closure" onPress={onOpenVoice}/><Action icon="call-outline" label="Supplier" onPress={onOpenVoice}/></View>

  <View style={s.rule}/>
  <View style={s.heading}><View><Text style={s.headingTitle}>Waiting on you</Text><Text style={s.headingSub}>{pending.length?`${pending.length} ${pending.length===1?"decision":"decisions"} to make`:"No approvals waiting"}</Text></View><Pressable onPress={onOpenActivity}><Text style={s.view}>Activity</Text></Pressable></View>

  {pending.length?pending.map((c,i)=><View key={c.id} style={s.item}>
   <View style={s.number}><Text style={s.numberText}>{i+1}</Text></View>
   <View style={s.itemBody}><Text style={s.itemTitle}>{c.title||"Restaurant action"}</Text><Text numberOfLines={2} style={s.itemCopy}>{c.summary||c.transcript}</Text><View style={s.buttons}><Pressable onPress={()=>onDecide(c.id,false)} style={s.no}><Text style={s.noText}>Decline</Text></Pressable><Pressable onPress={()=>onDecide(c.id,true)} style={s.yes}><Text style={s.yesText}>Approve</Text><Ionicons name="arrow-forward" size={14} color="#fff"/></Pressable></View></View>
  </View>):<View style={s.clear}><Ionicons name="checkmark-circle" size={28} color="#47745D"/><View><Text style={s.clearTitle}>You're clear</Text><Text style={s.clearCopy}>Nothing needs your approval right now.</Text></View></View>}

  <View style={s.rule}/><Text style={s.headingTitle}>Recent operations</Text>
  <View style={s.summary}><View><Text style={s.big}>{commands.length}</Text><Text style={s.label}>commands</Text></View><View style={s.vertical}/><View><Text style={s.big}>{commands.filter(x=>x.status!=="pending").length}</Text><Text style={s.label}>completed</Text></View><View style={s.vertical}/><View><Text style={s.big}>{pending.length}</Text><Text style={s.label}>pending</Text></View></View>
 </ScrollView>
}

function Action({icon,label,onPress}:{icon:keyof typeof Ionicons.glyphMap;label:string;onPress:()=>void}){return <Pressable onPress={onPress} style={s.chip}><Ionicons name={icon} size={17} color="#55483F"/><Text style={s.chipText}>{label}</Text></Pressable>}

const s=StyleSheet.create({
 page:{flex:1,backgroundColor:"#FCFAF7"},content:{paddingHorizontal:22,paddingBottom:130},top:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},brand:{fontFamily:"NunitoSans_900Black",fontSize:20,color:"#201D1A",letterSpacing:-.5},place:{fontFamily:"NunitoSans_700Bold",fontSize:9,color:"#A06A43",letterSpacing:1.2,textTransform:"uppercase",marginTop:1},activity:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:"#E8E0D9",alignItems:"center",justifyContent:"center",backgroundColor:"#fff"},dot:{position:"absolute",right:7,top:7,width:7,height:7,borderRadius:4,backgroundColor:"#D76C2F"},
 welcome:{marginTop:46,marginBottom:26},hello:{fontFamily:"NunitoSans_700Bold",fontSize:14,color:"#8A7C72"},question:{fontFamily:"NunitoSans_900Black",fontSize:38,lineHeight:42,color:"#201D1A",letterSpacing:-1.6,marginTop:5},
 commandBox:{backgroundColor:"#2C2926",borderRadius:24,minHeight:94,padding:15,flexDirection:"row",alignItems:"center",gap:14},mic:{width:58,height:58,borderRadius:29,backgroundColor:"#E37A38",alignItems:"center",justifyContent:"center"},commandTitle:{fontFamily:"NunitoSans_900Black",fontSize:15,color:"#fff"},commandHint:{fontFamily:"NunitoSans_600SemiBold",fontSize:11,lineHeight:15,color:"#C8BFB8",marginTop:3,maxWidth:310},chips:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:12},chip:{height:39,borderRadius:20,borderWidth:1,borderColor:"#E5DDD5",backgroundColor:"#fff",paddingHorizontal:13,flexDirection:"row",alignItems:"center",gap:6},chipText:{fontFamily:"NunitoSans_800ExtraBold",fontSize:11,color:"#55483F"},
 rule:{height:1,backgroundColor:"#EAE3DC",marginVertical:31},heading:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-end",marginBottom:14},headingTitle:{fontFamily:"NunitoSans_900Black",fontSize:20,color:"#201D1A",letterSpacing:-.5},headingSub:{fontFamily:"NunitoSans_600SemiBold",fontSize:11,color:"#95877D",marginTop:2},view:{fontFamily:"NunitoSans_800ExtraBold",fontSize:11,color:"#B25D2D"},
 item:{flexDirection:"row",gap:13,paddingVertical:17,borderBottomWidth:1,borderBottomColor:"#ECE5DE"},number:{width:31,height:31,borderRadius:16,backgroundColor:"#F2E7DC",alignItems:"center",justifyContent:"center"},numberText:{fontFamily:"NunitoSans_900Black",fontSize:11,color:"#A65C31"},itemBody:{flex:1},itemTitle:{fontFamily:"NunitoSans_900Black",fontSize:14,color:"#29231F"},itemCopy:{fontFamily:"NunitoSans_600SemiBold",fontSize:11.5,lineHeight:17,color:"#83776E",marginTop:3},buttons:{flexDirection:"row",gap:7,marginTop:12},no:{height:35,borderRadius:18,borderWidth:1,borderColor:"#DDD3CB",paddingHorizontal:14,alignItems:"center",justifyContent:"center"},noText:{fontFamily:"NunitoSans_800ExtraBold",fontSize:10.5,color:"#685D55"},yes:{height:35,borderRadius:18,backgroundColor:"#3C624F",paddingHorizontal:15,flexDirection:"row",gap:6,alignItems:"center",justifyContent:"center"},yesText:{fontFamily:"NunitoSans_900Black",fontSize:10.5,color:"#fff"},clear:{flexDirection:"row",alignItems:"center",gap:11,paddingVertical:12},clearTitle:{fontFamily:"NunitoSans_900Black",fontSize:13,color:"#29231F"},clearCopy:{fontFamily:"NunitoSans_600SemiBold",fontSize:11,color:"#8C8178",marginTop:1},
 summary:{marginTop:14,backgroundColor:"#F3EEE8",borderRadius:20,padding:18,flexDirection:"row",alignItems:"center",justifyContent:"space-around"},big:{fontFamily:"NunitoSans_900Black",fontSize:25,color:"#2A2521",textAlign:"center"},label:{fontFamily:"NunitoSans_700Bold",fontSize:9.5,color:"#8A7C72",textAlign:"center",marginTop:1},vertical:{width:1,height:35,backgroundColor:"#DDD3CA"}
});
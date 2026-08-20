import React from "react";
import {ImageBackground,Pressable,ScrollView,StyleSheet,Text,useWindowDimensions,View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {VoiceCommand} from "../lib/models";

type Props={commands:VoiceCommand[];onDecide:(id:string,approved:boolean)=>void;onOpenActivity:()=>void;onOpenVoice:()=>void};

const C={ink:"#171A18",paper:"#F4F1EA",card:"#FFFFFF",green:"#244E39",greenDeep:"#183B2B",orange:"#E77436",muted:"#555B56",line:"#D5D1C8"};
const hero="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=90";

export function HomeScreen({commands,onOpenActivity,onOpenVoice}:Props){
 const insets=useSafeAreaInsets();
 const {width}=useWindowDimensions();
 const pending=commands.filter(x=>x.status==="pending").length;
 const wide=width>720;
 return <ScrollView style={s.page} showsVerticalScrollIndicator={false} contentContainerStyle={[s.content,{paddingTop:insets.top+14,maxWidth:wide?900:620,alignSelf:"center",width:"100%"}]}>
   <View style={s.greeting}>
     <View style={{flex:1}}><Text style={s.hello}>Good morning, team</Text><Text style={s.sub}>Tauranto is listening and ready.</Text></View>
     <Pressable onPress={onOpenActivity} style={s.bell}><Ionicons name="notifications-outline" size={23} color="#fff"/>{pending>0&&<View style={s.badge}><Text style={s.badgeText}>{pending}</Text></View>}</Pressable>
   </View>

   <ImageBackground source={{uri:hero}} style={s.hero} imageStyle={s.heroImage}>
     <View style={s.heroShade}/>
     <View style={s.heroContent}>
       <Text style={s.heroKicker}>TAURANTO · HANDS-FREE OPERATIONS</Text>
       <Text style={s.heroTitle}>Your restaurant,{"\n"}always within earshot.</Text>
       <Text style={s.heroCopy}>Speak naturally. Tauranto captures the request and keeps the shift moving.</Text>
       <Pressable onPress={onOpenActivity} style={s.heroButton}><Text style={s.heroButtonText}>View activity</Text><Ionicons name="arrow-forward" size={21} color="#fff"/></Pressable>
     </View>
   </ImageBackground>

   <Pressable onPress={onOpenVoice} style={s.voiceCard}>
     <View style={s.voiceTop}>
       <View style={s.mic}><Ionicons name="mic" size={30} color="#fff"/></View>
       <View style={{flex:1}}><Text style={s.kicker}>VOICE OPERATIONS</Text><Text style={s.voiceTitle}>Hey Tauranto</Text></View>
     </View>
     <Text style={s.voiceSub}>Tell Tauranto what needs to happen next.</Text>
     <View style={s.voicePills}><Pill icon="mic-outline" text="Speak"/><Pill icon="keypad-outline" text="Type"/><Pill icon="time-outline" text="Recent"/></View>
   </Pressable>

   <View style={s.sectionHead}><Text style={s.sectionTitle}>Shift overview</Text><Pressable onPress={onOpenActivity}><Text style={s.link}>View all</Text></Pressable></View>
   <View style={s.statCard}>
     <View><Text style={s.statLabel}>Needs your approval</Text><Text style={s.statValue}>{pending}</Text></View>
     <View style={[s.statusPill,pending>0&&s.statusPillHot]}><Text style={[s.statusText,pending>0&&s.statusTextHot]}>{pending>0?"Action needed":"All clear"}</Text></View>
   </View>
   <View style={s.statCard}>
     <View><Text style={s.statLabel}>Voice command</Text><Text style={s.statValueSmall}>Ready</Text></View>
     <Pressable onPress={onOpenVoice} style={s.roundArrow}><Ionicons name="arrow-forward" size={21} color={C.green}/></Pressable>
   </View>
 </ScrollView>
}

function Pill({icon,text}:{icon:keyof typeof Ionicons.glyphMap;text:string}){return <View style={s.pill}><Ionicons name={icon} size={17} color={C.green}/><Text style={s.pillText}>{text}</Text></View>}

const s=StyleSheet.create({
 page:{flex:1,backgroundColor:C.paper},
 content:{paddingHorizontal:20,paddingBottom:125},
 greeting:{minHeight:88,paddingVertical:13,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
 hello:{fontFamily:"NunitoSans_900Black",fontSize:28,lineHeight:32,color:C.ink,letterSpacing:-1},
 sub:{fontFamily:"NunitoSans_600SemiBold",fontSize:14.5,color:C.muted,marginTop:4},
 bell:{width:52,height:52,borderRadius:15,backgroundColor:C.ink,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:C.ink},
 badge:{position:"absolute",right:-4,top:-7,minWidth:23,height:23,borderRadius:12,backgroundColor:C.orange,alignItems:"center",justifyContent:"center",paddingHorizontal:5},
 badgeText:{fontFamily:"NunitoSans_900Black",fontSize:11,color:"#fff"},
 hero:{height:300,marginTop:6,borderRadius:22,overflow:"hidden",justifyContent:"flex-end"},
 heroImage:{borderRadius:22},
 heroShade:{...StyleSheet.absoluteFillObject,backgroundColor:"rgba(7,14,11,.67)"},
 heroContent:{padding:26,paddingBottom:25},
 heroKicker:{fontFamily:"NunitoSans_900Black",fontSize:10,letterSpacing:1.8,color:"#F4CDB7",marginBottom:10},
 heroTitle:{fontFamily:"NunitoSans_900Black",fontSize:39,lineHeight:41,color:"#fff",letterSpacing:-1.6},
 heroCopy:{fontFamily:"NunitoSans_700Bold",fontSize:16,lineHeight:22,color:"rgba(255,255,255,.9)",maxWidth:470,marginTop:12},
 heroButton:{marginTop:20,height:48,alignSelf:"flex-start",borderRadius:14,borderWidth:1,borderColor:"rgba(255,255,255,.7)",paddingHorizontal:18,flexDirection:"row",alignItems:"center",gap:12,backgroundColor:"rgba(0,0,0,.34)"},
 heroButtonText:{fontFamily:"NunitoSans_900Black",fontSize:14,color:"#fff"},
 voiceCard:{minHeight:190,borderRadius:18,backgroundColor:"#E5EBE1",borderWidth:1.5,borderColor:"#C7D1C2",marginTop:18,padding:22},
 voiceTop:{flexDirection:"row",alignItems:"center",gap:16},
 mic:{width:70,height:70,borderRadius:20,backgroundColor:C.greenDeep,alignItems:"center",justifyContent:"center"},
 kicker:{fontFamily:"NunitoSans_900Black",fontSize:10,letterSpacing:1.8,color:C.orange},
 voiceTitle:{fontFamily:"NunitoSans_900Black",fontSize:32,lineHeight:37,color:C.greenDeep,letterSpacing:-1.2,marginTop:3},
 voiceSub:{fontFamily:"NunitoSans_700Bold",fontSize:15,lineHeight:20,color:C.muted,marginTop:15},
 voicePills:{flexDirection:"row",gap:8,marginTop:15,flexWrap:"wrap"},
 pill:{height:40,borderRadius:12,borderWidth:1,borderColor:C.line,backgroundColor:"#FFFFFF",paddingHorizontal:13,flexDirection:"row",alignItems:"center",gap:7},
 pillText:{fontFamily:"NunitoSans_900Black",fontSize:12,color:C.ink},
 sectionHead:{marginTop:30,marginBottom:13,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
 sectionTitle:{fontFamily:"NunitoSans_900Black",fontSize:31,lineHeight:36,color:C.ink,letterSpacing:-1.1},
 link:{fontFamily:"NunitoSans_900Black",fontSize:13,color:C.green},
 statCard:{minHeight:128,borderRadius:16,borderWidth:1.5,borderColor:C.line,backgroundColor:C.card,marginBottom:14,paddingHorizontal:22,paddingVertical:20,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
 statLabel:{fontFamily:"NunitoSans_800ExtraBold",fontSize:16,color:C.ink},
 statValue:{fontFamily:"NunitoSans_900Black",fontSize:44,lineHeight:49,color:C.ink,letterSpacing:-1.5,marginTop:5},
 statValueSmall:{fontFamily:"NunitoSans_900Black",fontSize:31,lineHeight:38,color:C.ink,letterSpacing:-1,marginTop:5},
 statusPill:{paddingHorizontal:15,height:38,borderRadius:19,backgroundColor:"#E7EFE5",alignItems:"center",justifyContent:"center"},
 statusPillHot:{backgroundColor:"#F5D7C5"},
 statusText:{fontFamily:"NunitoSans_900Black",fontSize:12,color:C.green},
 statusTextHot:{color:"#9B4F2D"},
 roundArrow:{width:48,height:48,borderRadius:24,backgroundColor:"#DDE8DC",alignItems:"center",justifyContent:"center"}
});
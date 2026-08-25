import React from "react";
import {ScrollView,StyleSheet,Text,View,Pressable} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {colors,darkColors,type} from "../theme/tokens";
import {useTheme} from "../theme/ThemeContext";

// Genuine, authored how-to copy for Tauranto's real features — not a CMS-
// backed article library (Tauranto doesn't have one yet), so this is a
// single scrollable reference instead of the mocked-up "browse categories /
// search articles" documentation hub. Anything a guide here doesn't answer
// routes to the real Help & Support ticket system rather than a fabricated
// FAQ list.
const TOPICS:{icon:keyof typeof Ionicons.glyphMap;title:string;body:string}[]=[
 {icon:"mic-outline",title:"Voice commands",body:"Say “Hey Tauranto” (or tap the voice card on Home) and speak naturally — things like “mark table 4 as served” or “pause online orders for an hour.” Tauranto transcribes it, works out the action, and either runs it or sends it for approval based on your role."},
 {icon:"checkmark-circle-outline",title:"Approvals",body:"Actions above a role's risk threshold wait for a manager or owner to approve before they run. You'll see a pending count on Home whenever something needs a decision — open it from the menu below to approve, reject, or add a note."},
 {icon:"reader-outline",title:"Tables",body:"The Tables screen mirrors your real dining room: every table from your floor plan, whether it's open or has a live guest session, and how long that session has been running. Tap a table to open, update, or close a session."},
 {icon:"stats-chart-outline",title:"Analytics",body:"Real activity trends pulled from your command and approval history — no projected or estimated figures, only what's actually happened in your restaurant."},
 {icon:"people-outline",title:"Team & roles",body:"Invite managers, group staff into departments, and set how much authority each role has — what risk level they can trigger on their own before Tauranto escalates, and any spend limit tied to that role."},
 {icon:"git-network-outline",title:"Integrations",body:"Connect the tools you already use — email, calendar, POS, and more — so voice commands can act on them directly. Connected count and status always reflect what's actually linked."},
 {icon:"card-outline",title:"Plans & billing",body:"See your current plan, switch plans, and manage your real payment method and invoice history through Stripe's secure billing portal, linked from the Plans & billing screen."},
];

export function DocumentationScreen({onBack,onOpenHelp}:{onBack:()=>void;onOpenHelp:()=>void}){
 const inset=useSafeAreaInsets();
 const{dark}=useTheme();
 return <ScrollView style={[s.page,dark&&s.pageDark]} contentContainerStyle={{paddingTop:inset.top+14,paddingHorizontal:20,paddingBottom:110}}>
  <View style={s.top}><Pressable onPress={onBack} style={[s.back,dark&&s.backDark]}><Ionicons name="arrow-back" size={22} color={dark?darkColors.text:"#000"}/></Pressable><View><Text style={s.kicker}>TAURANTO WORKSPACE</Text><Text style={[s.title,dark&&s.titleDark]}>Documentation</Text></View></View>
  <Text style={[s.intro,dark&&s.introDark]}>A quick reference for how Tauranto's features actually work — written from the real app, not marketing copy.</Text>
  {TOPICS.map(t=><View key={t.title} style={[s.card,dark&&s.cardDark]}><View style={s.cardHead}><View style={[s.icon,dark&&s.iconDark]}><Ionicons name={t.icon} size={18} color={colors.leafDeep}/></View><Text style={[s.cardTitle,dark&&s.cardTitleDark]}>{t.title}</Text></View><Text style={[s.cardBody,dark&&s.cardBodyDark]}>{t.body}</Text></View>)}
  <Pressable onPress={onOpenHelp} style={[s.helpCard,dark&&s.helpCardDark]}><Ionicons name="help-buoy-outline" size={22} color={colors.leafDeep}/><View style={{flex:1}}><Text style={[s.helpTitle,dark&&s.helpTitleDark]}>Didn't find what you need?</Text><Text style={[s.helpCopy,dark&&s.helpCopyDark]}>Send a real request to Tauranto support.</Text></View><Ionicons name="chevron-forward" size={19} color={colors.leafDeep}/></Pressable>
 </ScrollView>
}

const s=StyleSheet.create({
 page:{flex:1,backgroundColor:"#FAFBF9"},pageDark:{backgroundColor:darkColors.bg},
 top:{flexDirection:"row",alignItems:"center",gap:12,marginBottom:16},back:{width:44,height:44,borderRadius:14,backgroundColor:"white",borderWidth:1,borderColor:colors.line,alignItems:"center",justifyContent:"center"},backDark:{backgroundColor:darkColors.circle,borderColor:darkColors.circleBorder},
 kicker:{...type.eyebrow,color:colors.leafInk},title:{...type.title,color:"#1E2420",marginTop:2},titleDark:{color:darkColors.text},
 intro:{fontFamily:"NunitoSans_700Bold",fontSize:14,lineHeight:20,color:"#6F786F",marginBottom:16},introDark:{color:darkColors.textMuted},
 card:{backgroundColor:"white",borderWidth:1,borderColor:colors.line,borderRadius:18,padding:15,marginBottom:10},cardDark:{backgroundColor:darkColors.card,borderColor:darkColors.border},
 cardHead:{flexDirection:"row",alignItems:"center",gap:10,marginBottom:8},icon:{width:34,height:34,borderRadius:12,backgroundColor:colors.leafPale,alignItems:"center",justifyContent:"center"},iconDark:{backgroundColor:darkColors.cardAlt},
 cardTitle:{fontFamily:"NunitoSans_900Black",fontSize:14.5,color:"#1E2420"},cardTitleDark:{color:darkColors.text},
 cardBody:{fontFamily:"NunitoSans_600SemiBold",fontSize:12.5,lineHeight:18,color:"#5B655E"},cardBodyDark:{color:darkColors.textSoft},
 helpCard:{flexDirection:"row",alignItems:"center",gap:12,backgroundColor:colors.leafMist,borderWidth:1,borderColor:colors.leafTint,borderRadius:18,padding:15,marginTop:8},helpCardDark:{backgroundColor:darkColors.cardAlt,borderColor:darkColors.border},
 helpTitle:{fontFamily:"NunitoSans_900Black",fontSize:13.5,color:"#1E2420"},helpTitleDark:{color:darkColors.text},helpCopy:{fontFamily:"NunitoSans_600SemiBold",fontSize:11.5,color:"#5B655E",marginTop:2},helpCopyDark:{color:darkColors.textMuted},
});

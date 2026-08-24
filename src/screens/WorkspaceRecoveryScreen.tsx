import React from "react";
import {ActivityIndicator,Pressable,StyleSheet,Text,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {supabase} from "../lib/api";
import {colors} from "../theme/tokens";

export function WorkspaceRecoveryScreen({message,onRetry}:{message?:string;onRetry:()=>void}){
  const [busy,setBusy]=React.useState(false);
  const signOut=async()=>{setBusy(true);try{await supabase.auth.signOut()}finally{setBusy(false)}};
  return <SafeAreaView style={s.page}><View style={s.card}><View style={s.icon}><Ionicons name="restaurant-outline" size={28} color={colors.leafDeep}/></View><Text style={s.title}>We couldn't open your restaurant workspace.</Text><Text style={s.copy}>{message||"Your account is signed in, but Tauranto could not find an active restaurant workspace for it. This screen will no longer keep you stuck loading."}</Text><Pressable disabled={busy} onPress={onRetry} style={s.primary}><Text style={s.primaryText}>Try again</Text></Pressable><Pressable disabled={busy} onPress={signOut} style={s.secondary}>{busy?<ActivityIndicator color={colors.leafDeep}/>:<Text style={s.secondaryText}>Sign out and use another account</Text>}</Pressable></View></SafeAreaView>;
}
const s=StyleSheet.create({page:{flex:1,alignItems:"center",justifyContent:"center",padding:22,backgroundColor:colors.cream},card:{width:"100%",maxWidth:460,padding:24,borderRadius:24,backgroundColor:"#fff",borderWidth:1,borderColor:colors.line},icon:{width:54,height:54,borderRadius:17,alignItems:"center",justifyContent:"center",backgroundColor:colors.leafPale,marginBottom:18},title:{fontFamily:"NunitoSans_900Black",fontSize:24,lineHeight:30,color:colors.ink,marginBottom:10},copy:{fontFamily:"NunitoSans_600SemiBold",fontSize:14,lineHeight:21,color:colors.muted,marginBottom:22},primary:{height:54,borderRadius:15,alignItems:"center",justifyContent:"center",backgroundColor:colors.leafInk,marginBottom:10},primaryText:{fontFamily:"NunitoSans_900Black",fontSize:14,color:"#fff"},secondary:{height:54,borderRadius:15,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:colors.line},secondaryText:{fontFamily:"NunitoSans_900Black",fontSize:13,color:colors.leafDeep}});
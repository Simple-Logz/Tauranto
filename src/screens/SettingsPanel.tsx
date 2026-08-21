import React from "react";
import {ActivityIndicator,Pressable,StyleSheet,Switch,Text,TextInput,View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {colors,darkColors} from "../theme/tokens";
import {useTheme} from "../theme/ThemeContext";

type Props={
 preferences:any;
 onPreference:(group:string,key:string,value:any)=>void;
 onSave:()=>void;
 saving:boolean;
};

export function SettingsPanel({preferences,onPreference,onSave,saving}:Props){
 const notifications=preferences?.notifications||{},voice=preferences?.voice||{},privacy=preferences?.privacy||{},appearance=preferences?.appearance||"light";
 const{dark}=useTheme();
 return <View>
  <View style={{padding:14,borderRadius:16,borderWidth:1,borderColor:dark?darkColors.border:colors.leafTint,backgroundColor:dark?darkColors.cardAlt:colors.leafMist,flexDirection:'row',gap:10,alignItems:'center',marginBottom:20}}><Ionicons name="cloud-done-outline" size={22} color={dark?colors.leaf:colors.leafInk}/><View style={{flex:1}}><Text style={{fontFamily:'NunitoSans_900Black',fontSize:14,color:dark?darkColors.text:colors.leafInk}}>Restaurant database settings</Text><Text style={{fontFamily:'NunitoSans_600SemiBold',fontSize:11,color:dark?darkColors.textMuted:'#587267',marginTop:3}}>Controls below are loaded from and saved to this workspace.</Text></View></View>
  <Section title="Account">
   <SettingRow icon="notifications-outline" title="Approval notifications" value={!!notifications.approval_email} onChange={(v:boolean)=>onPreference("notifications","approval_email",v)}/>
  </Section>
  <Section title="Restaurant preferences">
   <SettingRow icon="mic-outline" title="Voice standby by default" value={!!voice.standby} onChange={(v:boolean)=>onPreference("voice","standby",v)}/>
   <SettingRow icon="volume-high-outline" title="Spoken acknowledgements" value={!!voice.spoken_confirmations} onChange={(v:boolean)=>onPreference("voice","spoken_confirmations",v)}/>
   <SettingRow icon="warning-outline" title="Command failure alerts" value={!!notifications.command_failures} onChange={(v:boolean)=>onPreference("notifications","command_failures",v)}/>
   <SettingRow icon="calendar-outline" title="Weekly operations summary" value={!!notifications.weekly_summary} onChange={(v:boolean)=>onPreference("notifications","weekly_summary",v)}/>
   <Field icon="language-outline" title="Voice language" value={voice.language||"en-US"} onChange={(v:string)=>onPreference("voice","language",v)}/>
  </Section>
  <Section title="Appearance & access">
   <ChoiceRow icon="sunny-outline" title="Theme" value={appearance==="dark"?"Dark":"Light"} onPress={()=>onPreference("root","appearance",appearance==="dark"?"light":"dark")}/>
  </Section>
  <Section title="Security & privacy">
   <SettingRow icon="recording-outline" title="Retain command audio" value={!!privacy.retain_audio} onChange={(v:boolean)=>onPreference("privacy","retain_audio",v)}/>
   <Field icon="time-outline" title="Activity retention (days)" value={String(privacy.activity_retention_days||90)} keyboard="number-pad" onChange={(v:string)=>onPreference("privacy","activity_retention_days",Math.max(1,Number(v)||90))}/>
  </Section>
  <Pressable disabled={saving} onPress={onSave} style={s.save}>{saving?<ActivityIndicator color="#fff"/>:<Text style={s.saveText}>Save settings</Text>}</Pressable>
 </View>
}

function Section({title,children}:{title:string;children:React.ReactNode}){const{dark}=useTheme();return <View style={s.section}><Text style={[s.sectionTitle,dark&&s.sectionTitleDark]}>{title}</Text><View style={[s.group,dark&&s.groupDark]}>{children}</View></View>}
function Base({icon,title,children}:{icon:any;title:string;children:React.ReactNode}){const{dark}=useTheme();return <View style={[s.row,dark&&s.rowDark]}><View style={[s.icon,dark&&s.iconDark]}><Ionicons name={icon} size={21} color={colors.leafDeep}/></View><Text style={[s.rowTitle,dark&&s.rowTitleDark]}>{title}</Text>{children}</View>}
function SettingRow({icon,title,value,onChange}:any){return <Base icon={icon} title={title}><Switch value={value} onValueChange={onChange} trackColor={{false:"#D5DBD7",true:colors.leafTint}} thumbColor={value?colors.leafDeep:"#fff"}/></Base>}
function InfoRow({icon,title,copy}:any){const{dark}=useTheme();return <Base icon={icon} title={title}><Text numberOfLines={2} style={[s.copy,dark&&s.copyDark]}>{copy}</Text></Base>}
function ChoiceRow({icon,title,value,onPress}:any){const{dark}=useTheme();return <Pressable onPress={onPress}><Base icon={icon} title={title}><Text style={s.value}>{value}</Text><Ionicons name="chevron-forward" size={17} color={dark?darkColors.textMuted:"#8A938D"}/></Base></Pressable>}
function Field({icon,title,value,onChange,keyboard}:any){const{dark}=useTheme();return <View style={[s.field,dark&&s.fieldDark]}><View style={s.fieldHead}><Ionicons name={icon} size={20} color={colors.leafDeep}/><Text style={[s.rowTitle,dark&&s.rowTitleDark]}>{title}</Text></View><TextInput value={value} onChangeText={onChange} keyboardType={keyboard} style={[s.input,dark&&s.inputDark]} placeholderTextColor={dark?darkColors.textMuted:undefined}/></View>}
const s=StyleSheet.create({section:{marginBottom:24},sectionTitle:{fontFamily:"NunitoSans_900Black",fontSize:19,color:"#111613",marginBottom:10},sectionTitleDark:{color:darkColors.text},group:{borderRadius:18,backgroundColor:"#fff",borderWidth:1,borderColor:"#E4E9E6",overflow:"hidden"},groupDark:{backgroundColor:darkColors.card,borderColor:darkColors.border},row:{minHeight:70,paddingHorizontal:14,flexDirection:"row",alignItems:"center",gap:11,borderBottomWidth:1,borderBottomColor:"#EDF0EE"},rowDark:{borderBottomColor:darkColors.border},icon:{width:38,height:38,borderRadius:12,backgroundColor:colors.leafPale,alignItems:"center",justifyContent:"center"},iconDark:{backgroundColor:darkColors.cardAlt},rowTitle:{flex:1,fontFamily:"NunitoSans_800ExtraBold",fontSize:14,color:"#171C19"},rowTitleDark:{color:darkColors.text},copy:{maxWidth:"43%",fontFamily:"NunitoSans_600SemiBold",fontSize:10.5,lineHeight:14,color:"#727B75",textAlign:"right"},copyDark:{color:darkColors.textMuted},value:{fontFamily:"NunitoSans_800ExtraBold",fontSize:12,color:colors.leafInk,marginRight:3},field:{padding:14,borderBottomWidth:1,borderBottomColor:"#EDF0EE"},fieldDark:{borderBottomColor:darkColors.border},fieldHead:{flexDirection:"row",alignItems:"center",gap:10,marginBottom:9},input:{height:43,borderRadius:12,borderWidth:1,borderColor:"#DDE5E0",paddingHorizontal:12,fontFamily:"NunitoSans_700Bold",fontSize:13,color:"#171C19",backgroundColor:"#FCFDFC"},inputDark:{backgroundColor:darkColors.cardAlt,borderColor:darkColors.border,color:darkColors.text},save:{height:52,borderRadius:15,backgroundColor:colors.leaf,alignItems:"center",justifyContent:"center",marginBottom:20},saveText:{fontFamily:"NunitoSans_900Black",fontSize:15,color:"#fff"}});

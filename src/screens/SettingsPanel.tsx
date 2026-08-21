import React from "react";
import {ActivityIndicator,Pressable,StyleSheet,Switch,Text,TextInput,View} from "react-native";
import {Ionicons} from "@expo/vector-icons";

type Props={
 preferences:any;
 onPreference:(group:string,key:string,value:any)=>void;
 onSave:()=>void;
 saving:boolean;
};

export function SettingsPanel({preferences,onPreference,onSave,saving}:Props){
 const notifications=preferences?.notifications||{},privacy=preferences?.privacy||{};
 return <View>
  <View style={{padding:14,borderRadius:16,borderWidth:1,borderColor:'#BFEAD5',backgroundColor:'#EDFFF6',flexDirection:'row',gap:10,alignItems:'center',marginBottom:20}}><Ionicons name="cloud-done-outline" size={22} color="#168760"/><View style={{flex:1}}><Text style={{fontFamily:'NunitoSans_900Black',fontSize:14,color:'#176B4D'}}>Restaurant database settings</Text><Text style={{fontFamily:'NunitoSans_600SemiBold',fontSize:11,color:'#587267',marginTop:3}}>Controls below are loaded from and saved to this workspace.</Text></View></View>
  <Section title="Account">
   <SettingRow icon="notifications-outline" title="Approval notifications" value={!!notifications.approval_email} onChange={(v:boolean)=>onPreference("notifications","approval_email",v)}/>
  </Section>
  <Section title="Restaurant preferences">
   <InfoRow icon="mic-outline" title="Voice capture" copy="Five-second capture with automatic stop"/>
  </Section>
  <Section title="Security & privacy">
   <Field icon="time-outline" title="Activity retention (days)" value={String(privacy.activity_retention_days||90)} keyboard="number-pad" onChange={(v:string)=>onPreference("privacy","activity_retention_days",Math.max(1,Number(v)||90))}/>
  </Section>
  <Pressable disabled={saving} onPress={onSave} style={s.save}>{saving?<ActivityIndicator color="#fff"/>:<Text style={s.saveText}>Save settings</Text>}</Pressable>
 </View>
}

function Section({title,children}:{title:string;children:React.ReactNode}){return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text><View style={s.group}>{children}</View></View>}
function Base({icon,title,children}:{icon:any;title:string;children:React.ReactNode}){return <View style={s.row}><View style={s.icon}><Ionicons name={icon} size={21} color="#00B873"/></View><Text style={s.rowTitle}>{title}</Text>{children}</View>}
function SettingRow({icon,title,value,onChange}:any){return <Base icon={icon} title={title}><Switch value={value} onValueChange={onChange} trackColor={{false:"#D5DBD7",true:"#8EE4BE"}} thumbColor={value?"#00B873":"#fff"}/></Base>}
function InfoRow({icon,title,copy}:any){return <Base icon={icon} title={title}><Text numberOfLines={2} style={s.copy}>{copy}</Text></Base>}
function ChoiceRow({icon,title,value,onPress}:any){return <Pressable onPress={onPress}><Base icon={icon} title={title}><Text style={s.value}>{value}</Text><Ionicons name="chevron-forward" size={17} color="#8A938D"/></Base></Pressable>}
function Field({icon,title,value,onChange,keyboard}:any){return <View style={s.field}><View style={s.fieldHead}><Ionicons name={icon} size={20} color="#00B873"/><Text style={s.rowTitle}>{title}</Text></View><TextInput value={value} onChangeText={onChange} keyboardType={keyboard} style={s.input}/></View>}
const s=StyleSheet.create({section:{marginBottom:24},sectionTitle:{fontFamily:"NunitoSans_900Black",fontSize:19,color:"#111613",marginBottom:10},group:{borderRadius:18,backgroundColor:"#fff",borderWidth:1,borderColor:"#E4E9E6",overflow:"hidden"},row:{minHeight:70,paddingHorizontal:14,flexDirection:"row",alignItems:"center",gap:11,borderBottomWidth:1,borderBottomColor:"#EDF0EE"},icon:{width:38,height:38,borderRadius:12,backgroundColor:"#E9FFF5",alignItems:"center",justifyContent:"center"},rowTitle:{flex:1,fontFamily:"NunitoSans_800ExtraBold",fontSize:14,color:"#171C19"},copy:{maxWidth:"43%",fontFamily:"NunitoSans_600SemiBold",fontSize:10.5,lineHeight:14,color:"#727B75",textAlign:"right"},value:{fontFamily:"NunitoSans_800ExtraBold",fontSize:12,color:"#168760",marginRight:3},field:{padding:14,borderBottomWidth:1,borderBottomColor:"#EDF0EE"},fieldHead:{flexDirection:"row",alignItems:"center",gap:10,marginBottom:9},input:{height:43,borderRadius:12,borderWidth:1,borderColor:"#DDE5E0",paddingHorizontal:12,fontFamily:"NunitoSans_700Bold",fontSize:13,color:"#171C19",backgroundColor:"#FCFDFC"},save:{height:52,borderRadius:15,backgroundColor:"#00D084",alignItems:"center",justifyContent:"center",marginBottom:20},saveText:{fontFamily:"NunitoSans_900Black",fontSize:15,color:"#fff"}});

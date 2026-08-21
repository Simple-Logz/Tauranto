import React,{useEffect,useState} from "react";
import {ActivityIndicator,Alert,Pressable,StyleSheet,Switch,Text,TextInput,View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {colors,darkColors} from "../theme/tokens";
import {useTheme} from "../theme/ThemeContext";
import {taurantoApi} from "../lib/api";
import {SkeletonCard} from "../components/Skeleton";
import {ACTION_INTENTS,ACTION_LABELS,DEFAULT_ROLE_MAX_RISK,MEMBER_ROLES,RISK_LEVELS,ROLE_LABELS,type ActionIntent,type MemberRole,type RiskLevel} from "../lib/governance";

type Props={
 restaurantId:string;
 preferences:any;
 onPreference:(group:string,key:string,value:any)=>void;
 onSave:()=>void;
 saving:boolean;
};

export function SettingsPanel({restaurantId,preferences,onPreference,onSave,saving}:Props){
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
  <GovernanceSection restaurantId={restaurantId}/>
 </View>
}

type Policy={auto_execute_low_risk:boolean;medium_approvals:number;high_approvals:number;critical_approvals:number;allowed_intents:ActionIntent[];role_max_risk:Partial<Record<MemberRole,RiskLevel>>;role_spend_limits:Partial<Record<MemberRole,number|null>>};
function defaultPolicy():Policy{return{auto_execute_low_risk:false,medium_approvals:1,high_approvals:1,critical_approvals:2,allowed_intents:[...ACTION_INTENTS],role_max_risk:{...DEFAULT_ROLE_MAX_RISK},role_spend_limits:{}}}

function GovernanceSection({restaurantId}:{restaurantId:string}){
 const[policy,setPolicy]=useState<Policy|null>(null);
 const[loading,setLoading]=useState(true);
 const[saving,setSaving]=useState(false);
 const load=async()=>{setLoading(true);try{const r=await taurantoApi.getPolicy(restaurantId);const p=r.policy;setPolicy(p?{auto_execute_low_risk:!!p.auto_execute_low_risk,medium_approvals:Number(p.medium_approvals??1),high_approvals:Number(p.high_approvals??1),critical_approvals:Number(p.critical_approvals??2),allowed_intents:p.allowed_intents?.length?p.allowed_intents:[...ACTION_INTENTS],role_max_risk:{...DEFAULT_ROLE_MAX_RISK,...(p.role_max_risk||{})},role_spend_limits:p.role_spend_limits||{}}:defaultPolicy())}catch{setPolicy(defaultPolicy())}finally{setLoading(false)}};
 useEffect(()=>{void load()},[restaurantId]);
 const save=async()=>{if(!policy)return;setSaving(true);try{await taurantoApi.updatePolicy(restaurantId,{autoExecuteLowRisk:policy.auto_execute_low_risk,mediumApprovals:policy.medium_approvals,highApprovals:policy.high_approvals,criticalApprovals:policy.critical_approvals,allowedIntents:policy.allowed_intents,roleMaxRisk:policy.role_max_risk,roleSpendLimits:policy.role_spend_limits});Alert.alert("Governance saved","These rules now apply to every voice and typed command.")}catch(e){Alert.alert("Could not save",e instanceof Error?e.message:"Please retry.")}finally{setSaving(false)}};
 if(loading||!policy)return <View style={{marginBottom:20}}><SkeletonCard lines={3}/></View>;
 const setRoleRisk=(role:MemberRole,risk:RiskLevel)=>setPolicy(p=>p&&({...p,role_max_risk:{...p.role_max_risk,[role]:risk}}));
 const setRoleLimit=(role:MemberRole,text:string)=>setPolicy(p=>p&&({...p,role_spend_limits:{...p.role_spend_limits,[role]:text.trim()===""?null:Math.max(0,Number(text)||0)}}));
 const toggleIntent=(intent:ActionIntent)=>setPolicy(p=>p&&({...p,allowed_intents:p.allowed_intents.includes(intent)?p.allowed_intents.filter(x=>x!==intent):[...p.allowed_intents,intent]}));
 return <View>
  <Section title="Automation & approvals">
   <SettingRow icon="flash-outline" title="Auto-execute low-risk actions" value={policy.auto_execute_low_risk} onChange={(v:boolean)=>setPolicy(p=>p&&({...p,auto_execute_low_risk:v}))}/>
   <Field icon="people-outline" title="Medium-risk approvals required" value={String(policy.medium_approvals)} keyboard="number-pad" onChange={(v:string)=>setPolicy(p=>p&&({...p,medium_approvals:Math.max(0,Number(v)||0)}))}/>
   <Field icon="people-outline" title="High-risk approvals required" value={String(policy.high_approvals)} keyboard="number-pad" onChange={(v:string)=>setPolicy(p=>p&&({...p,high_approvals:Math.max(0,Number(v)||0)}))}/>
   <Field icon="people-outline" title="Critical-risk approvals required" value={String(policy.critical_approvals)} keyboard="number-pad" onChange={(v:string)=>setPolicy(p=>p&&({...p,critical_approvals:Math.max(0,Number(v)||0)}))}/>
  </Section>
  <Section title="Role authority">
   <InfoRow icon="shield-outline" title="How this works" copy="The highest risk level each role may trigger before Tauranto escalates to a manager, regardless of automation settings."/>
   {MEMBER_ROLES.map(role=><RoleRiskRow key={role} role={role} value={policy.role_max_risk[role]||DEFAULT_ROLE_MAX_RISK[role]} onChange={(risk:RiskLevel)=>setRoleRisk(role,risk)}/>)}
  </Section>
  <Section title="Spending limits by role">
   <InfoRow icon="cash-outline" title="How this works" copy="Purchase-type commands above a role's limit are automatically routed for approval. Leave blank for no limit."/>
   {MEMBER_ROLES.map(role=><Field key={role} icon="cash-outline" title={ROLE_LABELS[role]} value={policy.role_spend_limits[role]==null?"":String(policy.role_spend_limits[role])} keyboard="number-pad" onChange={(v:string)=>setRoleLimit(role,v)}/>)}
  </Section>
  <Section title="Enabled voice & typed actions">
   {ACTION_INTENTS.map(intent=><SettingRow key={intent} icon="checkmark-circle-outline" title={ACTION_LABELS[intent]} value={policy.allowed_intents.includes(intent)} onChange={()=>toggleIntent(intent)}/>)}
  </Section>
  <Pressable disabled={saving} onPress={save} style={s.save}>{saving?<ActivityIndicator color="#fff"/>:<Text style={s.saveText}>Save governance settings</Text>}</Pressable>
 </View>
}

function RoleRiskRow({role,value,onChange}:{role:MemberRole;value:RiskLevel;onChange:(risk:RiskLevel)=>void}){
 const{dark}=useTheme();
 return <View style={[s.row,dark&&s.rowDark]}>
  <View style={[s.icon,dark&&s.iconDark]}><Ionicons name="shield-outline" size={21} color={colors.leafDeep}/></View>
  <Text style={[s.rowTitle,dark&&s.rowTitleDark]}>{ROLE_LABELS[role]}</Text>
  <View style={{flexDirection:"row",gap:6}}>{RISK_LEVELS.map(r=><Pressable key={r} onPress={()=>onChange(r)} style={[s.riskChip,dark&&s.riskChipDark,value===r&&s.riskChipOn,value===r&&dark&&s.riskChipOnDark]}><Text style={[s.riskChipText,dark&&s.riskChipTextDark,value===r&&s.riskChipTextOn]}>{r.slice(0,1).toUpperCase()}</Text></Pressable>)}</View>
 </View>
}

function Section({title,children}:{title:string;children:React.ReactNode}){const{dark}=useTheme();return <View style={s.section}><Text style={[s.sectionTitle,dark&&s.sectionTitleDark]}>{title}</Text><View style={[s.group,dark&&s.groupDark]}>{children}</View></View>}
function Base({icon,title,children}:{icon:any;title:string;children:React.ReactNode}){const{dark}=useTheme();return <View style={[s.row,dark&&s.rowDark]}><View style={[s.icon,dark&&s.iconDark]}><Ionicons name={icon} size={21} color={colors.leafDeep}/></View><Text style={[s.rowTitle,dark&&s.rowTitleDark]}>{title}</Text>{children}</View>}
function SettingRow({icon,title,value,onChange}:any){return <Base icon={icon} title={title}><Switch value={value} onValueChange={onChange} trackColor={{false:"#D5DBD7",true:colors.leafTint}} thumbColor={value?colors.leafDeep:"#fff"}/></Base>}
function InfoRow({icon,title,copy}:any){const{dark}=useTheme();return <Base icon={icon} title={title}><Text numberOfLines={2} style={[s.copy,dark&&s.copyDark]}>{copy}</Text></Base>}
function ChoiceRow({icon,title,value,onPress}:any){const{dark}=useTheme();return <Pressable onPress={onPress}><Base icon={icon} title={title}><Text style={s.value}>{value}</Text><Ionicons name="chevron-forward" size={17} color={dark?darkColors.textMuted:"#8A938D"}/></Base></Pressable>}
function Field({icon,title,value,onChange,keyboard}:any){const{dark}=useTheme();return <View style={[s.field,dark&&s.fieldDark]}><View style={s.fieldHead}><Ionicons name={icon} size={20} color={colors.leafDeep}/><Text style={[s.rowTitle,dark&&s.rowTitleDark]}>{title}</Text></View><TextInput value={value} onChangeText={onChange} keyboardType={keyboard} style={[s.input,dark&&s.inputDark]} placeholderTextColor={dark?darkColors.textMuted:undefined}/></View>}
const s=StyleSheet.create({section:{marginBottom:24},sectionTitle:{fontFamily:"NunitoSans_900Black",fontSize:19,color:"#111613",marginBottom:10},sectionTitleDark:{color:darkColors.text},group:{borderRadius:18,backgroundColor:"#fff",borderWidth:1,borderColor:"#E4E9E6",overflow:"hidden"},groupDark:{backgroundColor:darkColors.card,borderColor:darkColors.border},row:{minHeight:70,paddingHorizontal:14,flexDirection:"row",alignItems:"center",gap:11,borderBottomWidth:1,borderBottomColor:"#EDF0EE"},rowDark:{borderBottomColor:darkColors.border},icon:{width:38,height:38,borderRadius:12,backgroundColor:colors.leafPale,alignItems:"center",justifyContent:"center"},iconDark:{backgroundColor:darkColors.cardAlt},rowTitle:{flex:1,fontFamily:"NunitoSans_800ExtraBold",fontSize:14,color:"#171C19"},rowTitleDark:{color:darkColors.text},copy:{maxWidth:"43%",fontFamily:"NunitoSans_600SemiBold",fontSize:10.5,lineHeight:14,color:"#727B75",textAlign:"right"},copyDark:{color:darkColors.textMuted},value:{fontFamily:"NunitoSans_800ExtraBold",fontSize:12,color:colors.leafInk,marginRight:3},field:{padding:14,borderBottomWidth:1,borderBottomColor:"#EDF0EE"},fieldDark:{borderBottomColor:darkColors.border},fieldHead:{flexDirection:"row",alignItems:"center",gap:10,marginBottom:9},input:{height:43,borderRadius:12,borderWidth:1,borderColor:"#DDE5E0",paddingHorizontal:12,fontFamily:"NunitoSans_700Bold",fontSize:13,color:"#171C19",backgroundColor:"#FCFDFC"},inputDark:{backgroundColor:darkColors.cardAlt,borderColor:darkColors.border,color:darkColors.text},save:{height:52,borderRadius:15,backgroundColor:colors.leaf,alignItems:"center",justifyContent:"center",marginBottom:20},saveText:{fontFamily:"NunitoSans_900Black",fontSize:15,color:"#fff"},riskChip:{width:30,height:30,borderRadius:9,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:"#DDE5E0",backgroundColor:"#FCFDFC"},riskChipDark:{backgroundColor:darkColors.cardAlt,borderColor:darkColors.border},riskChipOn:{backgroundColor:colors.leaf,borderColor:colors.leaf},riskChipOnDark:{backgroundColor:colors.leaf,borderColor:colors.leaf},riskChipText:{fontFamily:"NunitoSans_900Black",fontSize:12,color:"#69716C"},riskChipTextDark:{color:darkColors.textMuted},riskChipTextOn:{color:"#fff"}});

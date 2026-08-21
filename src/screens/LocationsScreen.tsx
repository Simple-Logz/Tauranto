import React,{useCallback,useEffect,useState}from'react';
import{ActivityIndicator,Modal,Pressable,ScrollView,StyleSheet,Text,TextInput,View}from'react-native';
import{appAlert}from'../components/AppAlert';
import{Ionicons}from'@expo/vector-icons';
import{taurantoApi}from'../lib/api';
import{colors,darkColors,type}from'../theme/tokens';
import{useTheme}from'../theme/ThemeContext';
import{SkeletonCard}from'../components/Skeleton';

// A restaurant chain's home base: every location the caller has access to,
// a one-tap switcher, an owner/admin's ability to spin up a new location
// without developer help, and a combined approvals+activity feed so running
// several locations doesn't mean bouncing the active-location switch back
// and forth just to see what needs attention.
export function LocationsScreen({restaurantId,onSwitchLocation}:{restaurantId:string;onSwitchLocation:(restaurantId:string)=>void|Promise<void>}){
 const{dark}=useTheme();
 const[loading,setLoading]=useState(true),[error,setError]=useState(''),[organization,setOrganization]=useState<any>(null),[locations,setLocations]=useState<any[]>([]),[canAdd,setCanAdd]=useState(false);
 const[feed,setFeed]=useState<any[]>([]),[feedLoading,setFeedLoading]=useState(true);
 const[addOpen,setAddOpen]=useState(false),[name,setName]=useState(''),[busy,setBusy]=useState(false),[switching,setSwitching]=useState('');

 const load=useCallback(async()=>{setLoading(true);setError('');try{const r=await taurantoApi.locations(restaurantId);setOrganization(r.organization);setLocations(r.locations||[]);setCanAdd(!!r.canAddLocation)}catch(e){setError(e instanceof Error?e.message:'Could not load your locations.')}finally{setLoading(false)}},[restaurantId]);
 const loadFeed=useCallback(async()=>{setFeedLoading(true);try{const r=await taurantoApi.locationsFeed(restaurantId);setFeed(r.commands||[])}catch{ /* the location list above is the primary view; a feed failure shouldn't block it */ }finally{setFeedLoading(false)}},[restaurantId]);
 useEffect(()=>{void load();void loadFeed()},[load,loadFeed]);

 const switchTo=async(id:string)=>{if(id===restaurantId)return;setSwitching(id);try{await onSwitchLocation(id)}catch(e){appAlert('Could not switch locations',e instanceof Error?e.message:'Please retry.')}finally{setSwitching('')}};
 const addLocation=async()=>{if(!name.trim())return appAlert('Name required','Give the new location a name.');setBusy(true);try{await taurantoApi.addLocation(restaurantId,name.trim());setAddOpen(false);setName('');await load();appAlert('Location added',`${name.trim()} is now part of ${organization?.name||'your chain'}. Switch to it to connect its own POS, set its hours, and invite its team.`)}catch(e){appAlert('Could not add location',e instanceof Error?e.message:'Please retry.')}finally{setBusy(false)}};
 const decide=async(approvalId:string,approved:boolean)=>{try{await taurantoApi.decide(approvalId,approved?'approved':'rejected');await loadFeed()}catch(e){appAlert('Could not record decision',e instanceof Error?e.message:'Please retry.')}};

 if(loading)return <ScrollView style={[s.page,dark&&s.pageDark]} contentContainerStyle={{padding:20,paddingTop:24}}><SkeletonCard lines={2}/><SkeletonCard lines={2}/></ScrollView>;
 return <ScrollView style={[s.page,dark&&s.pageDark]} contentContainerStyle={{padding:20,paddingTop:24,paddingBottom:120}}>
  <Text style={[s.kicker,dark&&s.kickerDark]}>YOUR CHAIN</Text>
  <Text style={[s.title,dark&&s.titleDark]}>{organization?.name||'Locations'}</Text>
  <Text style={[s.copy,dark&&s.copyDark]}>{locations.length} location{locations.length===1?'':'s'} you have access to. Switch your active location, or add another under this same chain.</Text>
  {!!error&&<Text style={s.error}>{error}</Text>}
  {locations.map(l=><View key={l.id} style={[s.card,dark&&s.cardDark,l.isCurrent&&s.cardCurrent]}>
   <View style={s.cardTop}><View style={{flex:1}}><Text style={[s.cardTitle,dark&&s.cardTitleDark]}>{l.name}</Text><Text style={[s.cardMeta,dark&&s.cardMetaDark]}>{roleLabel(l.role)} · {l.memberCount} team member{l.memberCount===1?'':'s'}</Text></View>{l.isCurrent?<View style={s.currentBadge}><Text style={s.currentBadgeText}>CURRENT</Text></View>:<Pressable disabled={switching===l.id} onPress={()=>void switchTo(l.id)} style={s.switchBtn}>{switching===l.id?<ActivityIndicator color={colors.leafDeep}/>:<Text style={s.switchText}>Switch</Text>}</Pressable>}</View>
   <View style={s.statsRow}><Stat n={l.pending} label="PENDING"/><Stat n={l.completedToday} label="DONE TODAY"/><Stat n={l.connected} label="CONNECTED"/></View>
  </View>)}
  {canAdd&&<Pressable onPress={()=>setAddOpen(true)} style={[s.addCard,dark&&s.addCardDark]}><Ionicons name="add-circle-outline" size={22} color={colors.leafDeep}/><Text style={[s.addText,dark&&s.addTextDark]}>Add another location</Text></Pressable>}

  <Text style={[s.sectionTitle,dark&&s.sectionTitleDark]}>COMBINED ACTIVITY</Text>
  <Text style={[s.copy,dark&&s.copyDark]}>Recent commands and approvals from every location above, newest first.</Text>
  {feedLoading?<SkeletonCard lines={2}/>:feed.length===0?<Text style={[s.copy,dark&&s.copyDark]}>No activity yet across your locations.</Text>:feed.map((c:any)=><View key={c.id} style={[s.feedRow,dark&&s.feedRowDark]}>
   <View style={s.feedTop}><Text style={[s.feedLocation,dark&&s.feedLocationDark]}>{c.locationName}</Text><Text style={[s.feedTime,dark&&s.feedTimeDark]}>{new Date(c.created_at).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</Text></View>
   <Text style={[s.feedTitle,dark&&s.feedTitleDark]}>{c.title||c.transcript}</Text>
   <Text style={[s.feedSummary,dark&&s.feedSummaryDark]} numberOfLines={2}>{c.summary}</Text>
   <View style={s.feedBottom}><Text style={[s.feedStatus,statusColor(c.status)]}>{c.status.replace('_',' ').toUpperCase()}</Text>{c.myApprovalId&&<View style={s.feedActions}><Pressable onPress={()=>void decide(c.myApprovalId,false)} style={s.rejectBtn}><Text style={s.rejectText}>Reject</Text></Pressable><Pressable onPress={()=>void decide(c.myApprovalId,true)} style={s.approveBtn}><Text style={s.approveText}>Approve</Text></Pressable></View>}</View>
  </View>)}

  <Modal visible={addOpen} transparent animationType="fade" onRequestClose={()=>setAddOpen(false)}>
   <Pressable style={s.backdrop} onPress={()=>setAddOpen(false)}><Pressable style={[s.sheet,dark&&s.sheetDark]} onPress={e=>e.stopPropagation()}>
    <Text style={[s.sheetTitle,dark&&s.sheetTitleDark]}>Add a location</Text>
    <Text style={[s.copy,dark&&s.copyDark]}>This creates a new restaurant workspace under {organization?.name||'your chain'} with its own team, integrations and settings. You'll be its owner and can invite staff once it's created.</Text>
    <TextInput style={[s.input,dark&&s.inputDark]} value={name} onChangeText={setName} placeholder="e.g. Downtown, Airport Terminal 2" placeholderTextColor={dark?darkColors.textMuted:'#9AA19B'}/>
    <Pressable onPress={addLocation} style={s.primary}>{busy?<ActivityIndicator color="white"/>:<Text style={s.primaryText}>Create location</Text>}</Pressable>
    <Pressable onPress={()=>setAddOpen(false)} style={s.cancel}><Text style={dark&&{color:darkColors.text}}>Cancel</Text></Pressable>
   </Pressable></Pressable>
  </Modal>
 </ScrollView>;
}
function Stat({n,label}:{n:number;label:string}){return <View style={s.stat}><Text style={s.statValue}>{n}</Text><Text style={s.statLabel}>{label}</Text></View>}
function roleLabel(role:string){return{owner:'Owner',admin:'Admin',manager:'Manager',operator:'Operator',server:'Server',viewer:'Viewer'}[role]||role}
function statusColor(status:string){if(status==='completed')return{color:colors.leafDeep};if(status==='pending_approval')return{color:'#B4740A'};if(status==='rejected')return{color:colors.tomatoDeep};return{color:'#6B746E'}}
const s=StyleSheet.create({
 page:{flex:1,backgroundColor:'#FAFBF9'},pageDark:{backgroundColor:darkColors.bg},
 kicker:{...type.eyebrow,color:colors.leafDeep},kickerDark:{color:colors.leaf},
 title:{...type.title,color:'#1E2420',marginTop:4},titleDark:{color:darkColors.text},
 copy:{fontFamily:'NunitoSans_700Bold',fontSize:13,lineHeight:19,color:'#6F786F',marginTop:8,marginBottom:14},copyDark:{color:darkColors.textMuted},
 error:{fontFamily:'NunitoSans_700Bold',fontSize:13,color:colors.tomatoDeep,marginBottom:10},
 card:{borderWidth:1,borderColor:'#E5EAE5',borderRadius:18,backgroundColor:'#fff',padding:15,marginBottom:10},cardDark:{backgroundColor:darkColors.card,borderColor:darkColors.border},cardCurrent:{borderColor:colors.leafTint,borderWidth:1.5},
 cardTop:{flexDirection:'row',alignItems:'flex-start',gap:10},
 cardTitle:{fontFamily:'NunitoSans_900Black',fontSize:16,color:'#1E2420'},cardTitleDark:{color:darkColors.text},
 cardMeta:{fontFamily:'NunitoSans_600SemiBold',fontSize:11.5,color:'#737C74',marginTop:3},cardMetaDark:{color:darkColors.textMuted},
 currentBadge:{backgroundColor:colors.leafPale,paddingHorizontal:10,paddingVertical:6,borderRadius:999},currentBadgeText:{fontFamily:'NunitoSans_900Black',fontSize:9,color:colors.leafDeep},
 switchBtn:{backgroundColor:colors.leaf,paddingHorizontal:14,paddingVertical:8,borderRadius:999,minWidth:64,alignItems:'center'},switchText:{fontFamily:'NunitoSans_900Black',fontSize:11,color:'#fff'},
 statsRow:{flexDirection:'row',gap:8,marginTop:12},stat:{flex:1,backgroundColor:'#F5F7F5',borderRadius:12,paddingVertical:9,alignItems:'center'},statValue:{fontFamily:'NunitoSans_900Black',fontSize:16,color:'#1E2420'},statLabel:{fontFamily:'NunitoSans_900Black',fontSize:7.5,letterSpacing:.6,color:'#7B837B',marginTop:2},
 addCard:{flexDirection:'row',alignItems:'center',gap:9,borderWidth:1,borderStyle:'dashed',borderColor:colors.leafTint,borderRadius:16,padding:14,marginTop:2,marginBottom:6},addCardDark:{borderColor:darkColors.border},addText:{fontFamily:'NunitoSans_900Black',fontSize:13,color:colors.leafDeep},addTextDark:{color:colors.leaf},
 sectionTitle:{fontFamily:'NunitoSans_900Black',fontSize:12,letterSpacing:1,color:'#3A423B',marginTop:26},sectionTitleDark:{color:darkColors.text},
 feedRow:{borderWidth:1,borderColor:'#E5EAE5',borderRadius:16,backgroundColor:'#fff',padding:13,marginBottom:9},feedRowDark:{backgroundColor:darkColors.card,borderColor:darkColors.border},
 feedTop:{flexDirection:'row',justifyContent:'space-between'},feedLocation:{fontFamily:'NunitoSans_900Black',fontSize:9.5,letterSpacing:.6,color:colors.leafDeep},feedLocationDark:{color:colors.leaf},feedTime:{fontFamily:'NunitoSans_700Bold',fontSize:10,color:'#8A928A'},feedTimeDark:{color:darkColors.textMuted},
 feedTitle:{fontFamily:'NunitoSans_900Black',fontSize:14,color:'#1E2420',marginTop:5},feedTitleDark:{color:darkColors.text},feedSummary:{fontFamily:'NunitoSans_600SemiBold',fontSize:12,lineHeight:17,color:'#6F786F',marginTop:3},feedSummaryDark:{color:darkColors.textMuted},
 feedBottom:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:9},feedStatus:{fontFamily:'NunitoSans_900Black',fontSize:9.5,letterSpacing:.5},
 feedActions:{flexDirection:'row',gap:7},rejectBtn:{paddingHorizontal:11,paddingVertical:7,borderRadius:999,backgroundColor:'#FFF0ED'},rejectText:{fontFamily:'NunitoSans_900Black',fontSize:10,color:'#A84D38'},approveBtn:{paddingHorizontal:11,paddingVertical:7,borderRadius:999,backgroundColor:colors.leaf},approveText:{fontFamily:'NunitoSans_900Black',fontSize:10,color:'#fff'},
 backdrop:{flex:1,backgroundColor:'#10251F99',justifyContent:'center',padding:20},sheet:{backgroundColor:'#fff',borderRadius:26,padding:22,gap:10},sheetDark:{backgroundColor:darkColors.card},sheetTitle:{fontFamily:'NunitoSans_900Black',fontSize:22,color:'#1E2420'},sheetTitleDark:{color:darkColors.text},
 input:{height:52,borderWidth:1,borderColor:'#DEE5DF',borderRadius:14,backgroundColor:'#fff',paddingHorizontal:14,fontSize:14},inputDark:{backgroundColor:darkColors.cardAlt,borderColor:darkColors.border,color:darkColors.text},
 primary:{height:52,borderRadius:14,backgroundColor:colors.leafDeep,alignItems:'center',justifyContent:'center'},primaryText:{fontFamily:'NunitoSans_900Black',fontSize:14,color:'#fff'},cancel:{height:40,alignItems:'center',justifyContent:'center'},
});

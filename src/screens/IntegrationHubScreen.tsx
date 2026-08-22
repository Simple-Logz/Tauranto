import React,{useCallback,useEffect,useRef,useState}from'react';import{ActivityIndicator,Linking,Pressable,ScrollView,StyleSheet,Text,TextInput,View}from'react-native';import{Ionicons}from'@expo/vector-icons';import{colors,darkColors,radius,shadow,type}from'../theme/tokens';import{useTheme}from'../theme/ThemeContext';import{taurantoApi}from'../lib/api';import{SkeletonRow}from'../components/Skeleton';import{appAlert}from'../components/AppAlert';

type ConnectMode='live'|'request';
type CatalogItem={key:string;name:string;category:string;description:string;connect_mode:ConnectMode;connected:boolean;requested:boolean};

// Live entries that need a details form only the Connected Tools screen has
// (Toast needs API credentials, Website needs a webhook URL) — every other
// 'live' entry goes straight through api/integrations/oauth-start.ts.
const NEEDS_FORM=new Set(['toast','website']);

const CATEGORY_META:Record<string,{label:string;icon:any;tint:string}>={
 pos:{label:'POINT OF SALE',icon:'card-outline',tint:'#2563EB'},
 delivery:{label:'DELIVERY & ONLINE ORDERING',icon:'bicycle-outline',tint:'#EA580C'},
 reservations:{label:'RESERVATIONS',icon:'restaurant-outline',tint:'#7C3AED'},
 scheduling:{label:'STAFF SCHEDULING',icon:'time-outline',tint:'#0EA5E9'},
 payroll:{label:'PAYROLL & HR',icon:'cash-outline',tint:'#16A34A'},
 accounting:{label:'ACCOUNTING',icon:'calculator-outline',tint:'#2CA01C'},
 inventory:{label:'INVENTORY',icon:'cube-outline',tint:'#B45309'},
 suppliers:{label:'SUPPLIERS',icon:'file-tray-stacked-outline',tint:'#6D28D9'},
 communication:{label:'EMAIL & MESSAGING',icon:'chatbubbles-outline',tint:'#4A154B'},
 calendar:{label:'CALENDAR & VIDEO',icon:'calendar-outline',tint:'#2563EB'},
 meetings:{label:'MEETINGS',icon:'videocam-outline',tint:'#2D8CFF'},
 marketing:{label:'CRM & MARKETING',icon:'megaphone-outline',tint:'#FF7A59'},
 presence:{label:'REVIEWS & PRESENCE',icon:'star-outline',tint:'#EA580C'},
 files:{label:'FILES & DOCUMENTS',icon:'folder-outline',tint:'#0891B2'},
 maintenance:{label:'MAINTENANCE',icon:'construct-outline',tint:'#B91C1C'},
 website:{label:'WEBSITE',icon:'globe-outline',tint:'#2563EB'},
};
const CATEGORY_ORDER=['pos','delivery','reservations','scheduling','payroll','accounting','inventory','suppliers','communication','calendar','meetings','marketing','presence','files','maintenance','website'];

/**
 * The Integration Hub: a real, searchable catalog of every platform worth
 * connecting Tauranto to — held in public.integration_catalog (migration
 * 021), not a hardcoded list in the app bundle. Search runs as an actual
 * Postgres query against name/description/category (api/integrations/
 * catalog.ts), so it's tied to the database, not filtering an in-memory array.
 *
 * A handful of entries already have a real, working connection (they mirror
 * providers api/integrations/oauth-start.ts can authorize today). The rest
 * are marked honestly as not-yet-built — tapping "Request" writes a genuine,
 * unique row per restaurant into integration_requests, a real trackable
 * demand signal rather than a fake "Connected" state that does nothing.
 */
export function IntegrationHubScreen({restaurantId,onBack,onGoToConnectedTools}:{restaurantId:string;onBack:()=>void;onGoToConnectedTools:()=>void}){
 const{dark}=useTheme();
 const[items,setItems]=useState<CatalogItem[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[query,setQuery]=useState(''),[busy,setBusy]=useState(''),[ent,setEnt]=useState<any>({});
 const debounceRef=useRef<ReturnType<typeof setTimeout>|null>(null),mountedRef=useRef(false);

 const load=useCallback(async(q:string)=>{setLoading(true);setError('');try{const r=await taurantoApi.integrationCatalog(restaurantId,q||undefined);setItems(r.items||[])}catch(e){setError(e instanceof Error?e.message:'Could not load the integration hub.')}finally{setLoading(false)}},[restaurantId]);
 useEffect(()=>{void load('');taurantoApi.subscription(restaurantId).then(sub=>setEnt(sub.subscription?.plans?.entitlements||{})).catch(()=>{})},[restaurantId]);
 // Debounced search — skips the very first render, since the effect above
 // already loads the unfiltered catalog on mount.
 useEffect(()=>{if(!mountedRef.current){mountedRef.current=true;return}if(debounceRef.current)clearTimeout(debounceRef.current);debounceRef.current=setTimeout(()=>void load(query.trim()),320);return()=>{if(debounceRef.current)clearTimeout(debounceRef.current)}},[query,load]);

 const allowedFor=(key:string)=>key==='website'?true:key==='zoom'?Boolean(ent?.zoom??ent?.google_calendar??ent?.integrations):key==='toast'?Boolean(ent?.toast??ent?.integrations):Boolean(ent?.[key]);

 const connectLive=async(item:CatalogItem)=>{
  if(NEEDS_FORM.has(item.key)){appAlert('Finish this from Connected Tools',`${item.name} needs a couple of details — open it from your Connected Tools list to finish connecting.`,[{text:'Not now',style:'cancel'},{text:'Take me there',onPress:onGoToConnectedTools}]);return}
  if(!allowedFor(item.key)){appAlert('Plan required',`${item.name} is not included in your current plan.`);return}
  setBusy(item.key);
  try{const r=await taurantoApi.startOAuth(restaurantId,item.key as any);if(!r.authorizationUrl)throw new Error('Authorization URL was not returned.');await Linking.openURL(r.authorizationUrl)}
  catch(e){appAlert(`Could not connect ${item.name}`,e instanceof Error?e.message:'Authorization failed.')}
  finally{setBusy('')}
 };
 const requestIt=async(item:CatalogItem)=>{
  setBusy(item.key);
  try{await taurantoApi.requestIntegration(restaurantId,item.key);setItems(prev=>prev.map(x=>x.key===item.key?{...x,requested:true}:x))}
  catch(e){appAlert('Could not save your request',e instanceof Error?e.message:'Please retry.')}
  finally{setBusy('')}
 };

 const grouped=CATEGORY_ORDER.filter(c=>items.some(i=>i.category===c)).map(c=>({key:c,meta:CATEGORY_META[c]||{label:c.toUpperCase(),icon:'apps-outline',tint:colors.leafDeep},rows:items.filter(i=>i.category===c)}));
 const leftoverCats=[...new Set(items.map(i=>i.category))].filter(c=>!CATEGORY_ORDER.includes(c));

 return <View style={[s.page,dark&&s.pageDark]}>
  <View style={[s.top,dark&&s.topDark]}>
   <Pressable accessibilityLabel="Go back" onPress={onBack} style={[s.back,dark&&s.backDark]}><Ionicons name="arrow-back" size={21} color={dark?darkColors.text:colors.ink}/></Pressable>
   <View style={{flex:1}}><Text style={s.kicker}>INTEGRATION HUB</Text><Text style={[s.title,dark&&s.titleDark]}>Every tool worth connecting</Text></View>
  </View>
  <ScrollView contentContainerStyle={{padding:20,paddingBottom:140}}>
   <Text style={[s.subtitle,dark&&s.subtitleDark]}>Search the full catalog Tauranto tracks — POS, delivery, reservations, payroll, accounting and more. Don't see what you use? Request it — every request is saved against your account so we know exactly what to build next.</Text>
   <View style={[s.searchBar,dark&&s.searchBarDark]}>
    <Ionicons name="search" size={18} color={dark?darkColors.textMuted:'#8A938D'}/>
    <TextInput value={query} onChangeText={setQuery} autoCapitalize="none" placeholder="Search 40+ platforms — DoorDash, ADP, Sysco…" placeholderTextColor={dark?darkColors.textMuted:'#9AA19B'} style={[s.searchInput,dark&&s.searchInputDark]}/>
    {!!query&&<Pressable accessibilityLabel="Clear search" onPress={()=>setQuery('')}><Ionicons name="close-circle" size={18} color={dark?darkColors.textMuted:'#9AA19B'}/></Pressable>}
   </View>
   {!!error&&<Text style={s.error}>{error}</Text>}
   {loading?<><SkeletonRow/><SkeletonRow/><SkeletonRow/></>:items.length===0?<View style={[s.empty,dark&&s.emptyDark]}><Text style={[s.emptyTitle,dark&&s.emptyTitleDark]}>No matches for "{query}"</Text><Text style={[s.detail,dark&&s.detailDark]}>Try a different name, or clear the search to browse everything.</Text></View>:<>
    {grouped.map(g=><View key={g.key}>
     <View style={s.sectionRow}><View style={[s.catIcon,{backgroundColor:g.meta.tint+'1A'}]}><Ionicons name={g.meta.icon} size={16} color={g.meta.tint}/></View><Text style={[s.section,dark&&s.sectionDark]}>{g.meta.label}</Text></View>
     {g.rows.map(item=><View key={item.key} style={[s.card,dark&&s.cardDark]}>
      <View style={[s.logo,{backgroundColor:(CATEGORY_META[item.category]?.tint||colors.leafDeep)+'14'}]}><Ionicons name={CATEGORY_META[item.category]?.icon||'apps-outline'} size={22} color={CATEGORY_META[item.category]?.tint||colors.leafDeep}/></View>
      <View style={{flex:1}}><Text style={[s.name,dark&&s.nameDark]}>{item.name}</Text><Text style={[s.detail,dark&&s.detailDark]} numberOfLines={2}>{item.description}</Text></View>
      {busy===item.key?<ActivityIndicator color={colors.leafDeep}/>:item.connected?<View style={[s.pill,s.pillConnected,dark&&s.pillConnectedDark]}><Text style={[s.pillText,s.pillConnectedText,dark&&s.pillConnectedTextDark]}>CONNECTED</Text></View>:item.connect_mode==='live'?<Pressable onPress={()=>void connectLive(item)} style={[s.pill,s.pillLive,dark&&s.pillLiveDark]}><Text style={[s.pillText,s.pillLiveText,dark&&s.pillLiveTextDark]}>CONNECT</Text></Pressable>:item.requested?<View style={[s.pill,s.pillRequested,dark&&s.pillRequestedDark]}><Ionicons name="checkmark" size={11} color={dark?colors.leaf:colors.leafDeep}/><Text style={[s.pillText,s.pillRequestedText,dark&&s.pillRequestedTextDark]}>REQUESTED</Text></View>:<Pressable onPress={()=>void requestIt(item)} style={[s.pill,s.pillRequest,dark&&s.pillRequestDark]}><Text style={[s.pillText,s.pillRequestText,dark&&s.pillRequestTextDark]}>REQUEST</Text></Pressable>}
     </View>)}
    </View>)}
    {leftoverCats.map(c=><View key={c}>
     <Text style={[s.section,dark&&s.sectionDark]}>{c.toUpperCase()}</Text>
     {items.filter(i=>i.category===c).map(item=><View key={item.key} style={[s.card,dark&&s.cardDark]}><View style={{flex:1}}><Text style={[s.name,dark&&s.nameDark]}>{item.name}</Text><Text style={[s.detail,dark&&s.detailDark]}>{item.description}</Text></View></View>)}
    </View>)}
   </>}
  </ScrollView>
 </View>;
}

const s=StyleSheet.create({
 page:{flex:1,backgroundColor:colors.cream},pageDark:{backgroundColor:darkColors.bg},
 top:{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:16,height:58,borderBottomWidth:1,borderBottomColor:colors.line,backgroundColor:colors.paper},topDark:{backgroundColor:darkColors.surface,borderBottomColor:darkColors.border},
 back:{width:38,height:38,borderRadius:19,borderWidth:1,borderColor:colors.line,alignItems:'center',justifyContent:'center'},backDark:{backgroundColor:darkColors.circle,borderColor:darkColors.circleBorder},
 kicker:{...type.eyebrow,color:colors.leafDeep},title:{fontFamily:'NunitoSans_900Black',fontSize:16,color:colors.ink,marginTop:2},titleDark:{color:darkColors.text},
 subtitle:{fontFamily:'NunitoSans_600SemiBold',fontSize:14,lineHeight:20,color:colors.muted,marginBottom:16},subtitleDark:{color:darkColors.textMuted},
 searchBar:{height:50,borderRadius:15,borderWidth:1,borderColor:colors.line,backgroundColor:colors.paper,flexDirection:'row',alignItems:'center',gap:9,paddingHorizontal:15,marginBottom:8},searchBarDark:{backgroundColor:darkColors.cardAlt,borderColor:darkColors.border},
 searchInput:{flex:1,fontFamily:'NunitoSans_700Bold',fontSize:14,color:colors.ink},searchInputDark:{color:darkColors.text},
 error:{fontFamily:'NunitoSans_700Bold',fontSize:13,color:colors.tomato,marginTop:10},
 sectionRow:{flexDirection:'row',alignItems:'center',gap:8,marginTop:22,marginBottom:10},
 catIcon:{width:26,height:26,borderRadius:9,alignItems:'center',justifyContent:'center'},
 section:{fontFamily:'NunitoSans_900Black',fontSize:11,letterSpacing:1.1,color:colors.muted},sectionDark:{color:darkColors.textMuted},
 card:{minHeight:76,flexDirection:'row',alignItems:'center',gap:13,backgroundColor:colors.paper,borderRadius:radius.md,borderWidth:1,borderColor:colors.line,padding:14,marginBottom:9,...shadow},cardDark:{backgroundColor:darkColors.card,borderColor:darkColors.border},
 logo:{width:46,height:46,borderRadius:13,alignItems:'center',justifyContent:'center'},
 name:{fontFamily:'NunitoSans_900Black',fontSize:15,color:colors.ink},nameDark:{color:darkColors.text},
 detail:{fontFamily:'NunitoSans_600SemiBold',fontSize:12.5,lineHeight:17,color:colors.muted,marginTop:3},detailDark:{color:darkColors.textMuted},
 pill:{flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:10,paddingVertical:7,borderRadius:999,borderWidth:1},
 pillText:{fontFamily:'NunitoSans_900Black',fontSize:9},
 pillLive:{backgroundColor:colors.saffronPale,borderColor:colors.saffron},pillLiveDark:{backgroundColor:darkColors.cardAlt,borderColor:darkColors.border},
 pillLiveText:{color:'#8A6A12'},pillLiveTextDark:{color:colors.saffron},
 pillConnected:{backgroundColor:'#EAF5EC',borderColor:'#EAF5EC'},pillConnectedDark:{backgroundColor:darkColors.cardAlt,borderColor:darkColors.border},
 pillConnectedText:{color:colors.leafDeep},pillConnectedTextDark:{color:colors.leaf},
 pillRequest:{backgroundColor:'transparent',borderColor:colors.line},pillRequestDark:{borderColor:darkColors.border},
 pillRequestText:{color:colors.muted},pillRequestTextDark:{color:darkColors.textMuted},
 pillRequested:{backgroundColor:colors.leafPale,borderColor:colors.leafTint},pillRequestedDark:{backgroundColor:darkColors.cardAlt,borderColor:darkColors.border},
 pillRequestedText:{color:colors.leafDeep},pillRequestedTextDark:{color:colors.leaf},
 empty:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.line,borderRadius:radius.lg,padding:20},emptyDark:{backgroundColor:darkColors.card,borderColor:darkColors.border},
 emptyTitle:{fontFamily:'NunitoSans_900Black',fontSize:16,color:colors.ink},emptyTitleDark:{color:darkColors.text},
});

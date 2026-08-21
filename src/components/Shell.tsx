import React,{useEffect}from"react";
import{View,Text,Pressable,StyleSheet,useWindowDimensions,Platform}from"react-native";
import{useSafeAreaInsets}from"react-native-safe-area-context";
import{Ionicons}from"@expo/vector-icons";
import{TabName}from"../../App";
import{colors}from"../theme/tokens";

const nav:{name:TabName;label:string;icon:keyof typeof Ionicons.glyphMap;color:string}[]=[
 {name:"Today",label:"Home",icon:"home-outline",color:colors.leaf},
 {name:"Tables",label:"Tables",icon:"reader-outline",color:"#776A91"},
 {name:"Activity",label:"Activity",icon:"time-outline",color:"#4E7F9D"},
 {name:"More",label:"Profile",icon:"person-outline",color:"#A36D78"},
];

export function Shell({children,tab,onTabChange,pending,onVoice}:{children:React.ReactNode;tab:TabName;onTabChange:(t:TabName)=>void;pending:number;onVoice:()=>void}){
 const insets=useSafeAreaInsets(),{width}=useWindowDimensions(),tablet=width>=768;
 useEffect(()=>{if(Platform.OS!=="web"||typeof document==="undefined")return;document.body.style.margin="0";document.body.style.overflow="hidden"},[]);
 const change=(next:TabName)=>next!==tab&&onTabChange(next);
 return <View style={s.shell}>
  {tablet&&<View style={[s.side,{paddingTop:insets.top+24}]}><View style={s.brand}><View style={s.logo}><Text style={s.logoText}>T</Text></View><View><Text style={s.brandText}>Tauranto</Text><Text style={s.brandSub}>RESTAURANT OPERATIONS</Text></View></View><View style={s.navGroup}>{nav.map(x=><Pressable key={x.name} onPress={()=>change(x.name)} style={[s.sideRow,tab===x.name&&s.sideActive]}><Ionicons name={x.icon} size={21} color={tab===x.name?x.color:colors.muted}/><Text style={[s.sideText,tab===x.name&&s.sideTextActive]}>{x.label}</Text>{x.name==="Activity"&&pending>0&&<View style={s.count}><Text style={s.countText}>{pending}</Text></View>}</Pressable>)}</View></View>}
  <View style={s.content}>{children}</View>
  {!tablet&&<View style={[s.bottomWrap,{paddingBottom:Math.max(insets.bottom,8)}]}><View style={s.bottom}>{nav.map(x=><Nav key={x.name} x={x} tab={tab} pending={pending} change={change}/>)}</View></View>}
 </View>
}

function Nav({x,tab,pending,change}:any){return <Pressable accessibilityLabel={x.label} onPress={()=>change(x.name)} style={s.navItem}><View style={s.iconBox}><Ionicons name={x.icon} size={30} color={x.color}/>{x.name==="Activity"&&pending>0&&<View style={s.badge}/>}</View></Pressable>}

const s=StyleSheet.create({
 shell:{flex:1,flexDirection:"row",backgroundColor:"#FFFFFF",overflow:"hidden"},content:{flex:1,overflow:"hidden"},
 side:{width:240,backgroundColor:"#FFFFFF",paddingHorizontal:18,borderRightWidth:1,borderRightColor:colors.line},brand:{flexDirection:"row",alignItems:"center",gap:11,marginBottom:42},logo:{width:43,height:43,borderRadius:15,backgroundColor:colors.leaf,alignItems:"center",justifyContent:"center"},logoText:{fontFamily:"NunitoSans_900Black",fontSize:20,color:"#fff"},brandText:{fontFamily:"NunitoSans_900Black",fontSize:20,color:colors.ink,letterSpacing:-.7},brandSub:{fontFamily:"NunitoSans_900Black",fontSize:7,color:colors.muted,letterSpacing:1.35},navGroup:{gap:7},sideRow:{height:52,borderRadius:17,flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:15},sideActive:{backgroundColor:colors.leafPale},sideText:{flex:1,fontFamily:"NunitoSans_800ExtraBold",fontSize:12,color:colors.muted},sideTextActive:{color:colors.ink},count:{minWidth:20,height:20,borderRadius:10,backgroundColor:"#FFF0D7",alignItems:"center",justifyContent:"center"},countText:{fontFamily:"NunitoSans_900Black",fontSize:9,color:"#A86500"},
 bottomWrap:{position:"absolute",left:14,right:14,bottom:10,backgroundColor:"#FFFFFF",paddingHorizontal:18,paddingTop:7,borderRadius:43,borderWidth:1.2,borderColor:"#DDE2E5",shadowColor:"#1B2520",shadowOpacity:.14,shadowRadius:22,shadowOffset:{width:0,height:10},elevation:18},bottom:{height:72,flexDirection:"row",alignItems:"center",justifyContent:"space-around"},navItem:{flex:1,height:64,alignItems:"center",justifyContent:"center"},iconBox:{width:52,height:52,borderRadius:26,alignItems:"center",justifyContent:"center"},badge:{position:"absolute",right:6,top:5,width:7,height:7,borderRadius:4,backgroundColor:"#F07852",borderWidth:1.5,borderColor:"#fff"},
});

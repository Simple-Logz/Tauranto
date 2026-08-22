import React,{useEffect}from"react";
import{View,Text,Pressable,StyleSheet,Platform}from"react-native";
import{useSafeAreaInsets}from"react-native-safe-area-context";
import{Ionicons}from"@expo/vector-icons";
import{TabName}from"../../App";
import{colors}from"../theme/tokens";
import{useTheme}from"../theme/ThemeContext";

// Day-to-day operations live here. Configuration remains in the hamburger menu.
const nav:{id:string;name:TabName;label:string;icon:keyof typeof Ionicons.glyphMap;active:keyof typeof Ionicons.glyphMap}[]=[
 {id:"home",name:"Today",label:"Home",icon:"home-outline",active:"home"},
 {id:"tables",name:"Tables",label:"Tables",icon:"restaurant-outline",active:"restaurant"},
 {id:"inventory",name:"Approvals",label:"Inventory",icon:"cube-outline",active:"cube"},
 {id:"insights",name:"Analytics",label:"Insights",icon:"stats-chart-outline",active:"stats-chart"},
 {id:"activity",name:"Activity",label:"Activity",icon:"person-outline",active:"person"},
];

export function Shell({children,tab,onTabChange,pending}:{children:React.ReactNode;tab:TabName;onTabChange:(t:TabName)=>void;pending:number;onVoice:()=>void}){
 const insets=useSafeAreaInsets(),{dark}=useTheme();
 useEffect(()=>{if(Platform.OS!=="web"||typeof document==="undefined")return;document.body.style.margin="0";document.body.style.overflow="hidden"},[]);
 return <View style={[s.shell,dark&&s.shellDark]}>
  <View style={s.content}>{children}</View>
  <View style={[s.bottomWrap,dark&&s.bottomWrapDark,{paddingBottom:Math.max(insets.bottom,5)}]}>
   <View style={s.bottom}>{nav.map(x=><Nav key={x.id} x={x} tab={tab} pending={pending} change={onTabChange} dark={dark}/>)}</View>
  </View>
 </View>
}

function Nav({x,tab,pending,change,dark}:any){const selected=tab===x.name;return <Pressable accessibilityLabel={x.label} onPress={()=>change(x.name)} style={({pressed})=>[s.navItem,pressed&&s.navItemPressed]}>
 <View style={s.iconBox}><Ionicons name={selected?x.active:x.icon} size={20} color={selected?colors.leafDeep:dark?"#9AA8A0":"#707972"}/>{x.id==="activity"&&pending>0&&<View style={s.badge}><Text style={s.badgeText}>{pending>9?"9+":pending}</Text></View>}</View>
 <Text style={[s.navLabel,dark&&s.navLabelDark,selected&&s.navLabelActive]}>{x.label}</Text>
 {selected&&<View style={s.activeLine}/>} 
 </Pressable>}

const s=StyleSheet.create({
 shell:{flex:1,backgroundColor:colors.cream,overflow:"hidden"},shellDark:{backgroundColor:"#101512"},content:{flex:1,overflow:"hidden"},
 bottomWrap:{position:"absolute",left:0,right:0,bottom:0,backgroundColor:"rgba(255,255,255,.98)",paddingHorizontal:7,paddingTop:6,borderTopWidth:1,borderTopColor:colors.line,shadowColor:"#173426",shadowOpacity:.04,shadowRadius:8,shadowOffset:{width:0,height:-2},elevation:8},bottomWrapDark:{backgroundColor:"rgba(23,29,25,.98)",borderTopColor:"#2B342F"},bottom:{height:58,flexDirection:"row",alignItems:"center",justifyContent:"space-around"},
 navItem:{flex:1,height:54,alignItems:"center",justifyContent:"center",position:"relative"},navItemPressed:{opacity:.55},iconBox:{width:31,height:25,alignItems:"center",justifyContent:"center"},navLabel:{fontFamily:"NunitoSans_700Bold",fontSize:9,lineHeight:12,color:"#727B75",marginTop:2},navLabelDark:{color:"#98A69F"},navLabelActive:{fontFamily:"NunitoSans_900Black",color:colors.leafDeep},activeLine:{position:"absolute",bottom:0,width:24,height:2.5,borderRadius:2,backgroundColor:colors.leafDeep},badge:{position:"absolute",right:-5,top:-5,minWidth:16,height:16,paddingHorizontal:4,borderRadius:8,backgroundColor:colors.leafDeep,alignItems:"center",justifyContent:"center",borderWidth:2,borderColor:"#fff"},badgeText:{fontFamily:"NunitoSans_900Black",fontSize:7,color:"#fff"}
});

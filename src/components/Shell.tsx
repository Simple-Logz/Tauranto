import React,{useEffect}from"react";
import{View,Text,Pressable,StyleSheet,Platform}from"react-native";
import{useSafeAreaInsets}from"react-native-safe-area-context";
import{Ionicons}from"@expo/vector-icons";
import{TabName}from"../../App";
import{colors}from"../theme/tokens";
import{useTheme}from"../theme/ThemeContext";

const nav:{id:string;name:TabName;label:string;icon:keyof typeof Ionicons.glyphMap}[]=[
 {id:"home",name:"Today",label:"Home",icon:"grid-outline"},
 {id:"tables",name:"Tables",label:"Tables",icon:"server-outline"},
 {id:"analytics",name:"Analytics",label:"Analytics",icon:"stats-chart-outline"},
 {id:"activity",name:"Activity",label:"Activity",icon:"clipboard-outline"},
 {id:"menu",name:"More",label:"More",icon:"menu-outline"},
];

export function Shell({children,tab,onTabChange,pending}:{children:React.ReactNode;tab:TabName;onTabChange:(t:TabName)=>void;pending:number;onVoice:()=>void}){
 const insets=useSafeAreaInsets(),{dark}=useTheme();
 useEffect(()=>{if(Platform.OS!=="web"||typeof document==="undefined")return;document.body.style.margin="0";document.body.style.overflow="hidden"},[]);
 const change=(next:TabName)=>(next==="More"||next!==tab)&&onTabChange(next);
 return <View style={[s.shell,dark&&s.shellDark]}>
  <View style={s.content}>{children}</View>
  <View style={[s.bottomWrap,dark&&s.bottomWrapDark,{paddingBottom:Math.max(insets.bottom,5)}]}>
   <View style={s.bottom}>{nav.map(x=><Nav key={x.id} x={x} tab={tab} pending={pending} change={change} dark={dark}/>)}</View>
  </View>
 </View>
}

function Nav({x,tab,pending,change,dark}:any){const selected=tab===x.name;return <Pressable accessibilityLabel={x.label} onPress={()=>change(x.name)} style={({pressed})=>[s.navItem,selected&&s.navItemActive,pressed&&s.navItemPressed]}>
 <View style={[s.iconBox,selected&&s.iconBoxActive]}><Ionicons name={x.icon} size={20} color={selected?colors.leafInk:dark?"#98A69F":"#6F756F"}/>{x.id==="activity"&&pending>0&&<View style={s.badge}><Text style={s.badgeText}>{pending>9?"9+":pending}</Text></View>}</View>
 <Text style={[s.navLabel,dark&&s.navLabelDark,selected&&s.navLabelActive]}>{x.label}</Text>
 </Pressable>}

const s=StyleSheet.create({
 shell:{flex:1,backgroundColor:colors.cream,overflow:"hidden"},shellDark:{backgroundColor:"#101512"},content:{flex:1,overflow:"hidden"},
 bottomWrap:{position:"absolute",left:0,right:0,bottom:0,backgroundColor:"rgba(250,249,246,.98)",paddingHorizontal:10,paddingTop:7,borderTopWidth:1,borderTopColor:"#DEDCD6"},bottomWrapDark:{backgroundColor:"rgba(23,29,25,.98)",borderTopColor:"#2B342F"},bottom:{height:58,flexDirection:"row",alignItems:"center",justifyContent:"space-around"},
 navItem:{flex:1,height:52,alignItems:"center",justifyContent:"center",borderRadius:10},navItemActive:{backgroundColor:"#E9E8E3"},navItemPressed:{opacity:.62},iconBox:{width:31,height:26,alignItems:"center",justifyContent:"center"},iconBoxActive:{},navLabel:{fontFamily:"NunitoSans_700Bold",fontSize:9,lineHeight:12,color:"#70766F",marginTop:1},navLabelDark:{color:"#98A69F"},navLabelActive:{color:colors.ink},badge:{position:"absolute",right:-5,top:-4,minWidth:16,height:16,paddingHorizontal:4,borderRadius:8,backgroundColor:colors.leafInk,alignItems:"center",justifyContent:"center",borderWidth:2,borderColor:colors.cream},badgeText:{fontFamily:"NunitoSans_900Black",fontSize:7,color:"#fff"}
});

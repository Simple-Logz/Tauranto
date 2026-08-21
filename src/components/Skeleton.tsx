import React,{useEffect,useRef}from"react";
import{Animated,Easing,StyleSheet,View,ViewStyle}from"react-native";
import{darkColors}from"../theme/tokens";
import{useTheme}from"../theme/ThemeContext";

// A single shimmering placeholder block. Every screen used to show one bare
// centered spinner for its entire first load — this instead sketches the
// real shape of what's coming (a card, a row, a stat tile), which reads as
// "this is loading" rather than "something might be broken."
export function Skeleton({width,height=14,radius=8,style}:{width:number|string;height?:number;radius?:number;style?:ViewStyle}){
 const{dark}=useTheme();
 const pulse=useRef(new Animated.Value(0.4)).current;
 useEffect(()=>{
  const loop=Animated.loop(Animated.sequence([
   Animated.timing(pulse,{toValue:1,duration:700,easing:Easing.inOut(Easing.ease),useNativeDriver:true}),
   Animated.timing(pulse,{toValue:0.4,duration:700,easing:Easing.inOut(Easing.ease),useNativeDriver:true}),
  ]));
  loop.start();
  return()=>loop.stop();
 },[pulse]);
 return <Animated.View style={[{width:width as any,height,borderRadius:radius,backgroundColor:dark?darkColors.cardAlt:"#E7ECE8",opacity:pulse},style]}/>;
}

// A card-shaped skeleton: a title-width bar plus N body lines, matching the
// bordered-card look used across Activity/Analytics/Billing/etc.
export function SkeletonCard({lines=2,style}:{lines?:number;style?:ViewStyle}){
 const{dark}=useTheme();
 return <View style={[s.card,dark&&s.cardDark,style]}>
  <Skeleton width="55%" height={14} style={{marginBottom:12}}/>
  {Array.from({length:lines}).map((_,i)=><Skeleton key={i} width={i===lines-1?"62%":"92%"} height={11} style={{marginBottom:i===lines-1?0:8}}/>)}
 </View>;
}

// A row-shaped skeleton: a leading icon/avatar circle plus two lines,
// matching list rows (activity items, directory contacts, table sessions).
export function SkeletonRow({style}:{style?:ViewStyle}){
 const{dark}=useTheme();
 return <View style={[s.row,dark&&s.rowDark,style]}>
  <Skeleton width={40} height={40} radius={13}/>
  <View style={{flex:1,marginLeft:11}}>
   <Skeleton width="68%" height={12} style={{marginBottom:7}}/>
   <Skeleton width="42%" height={10}/>
  </View>
 </View>;
}

// A compact stat-tile skeleton, for KPI grids (Analytics, Home stats).
export function SkeletonTile({style}:{style?:ViewStyle}){
 const{dark}=useTheme();
 return <View style={[s.tile,dark&&s.tileDark,style]}>
  <Skeleton width={38} height={38} radius={13} style={{marginBottom:10}}/>
  <Skeleton width="70%" height={22} style={{marginBottom:6}}/>
  <Skeleton width="50%" height={10}/>
 </View>;
}

const s=StyleSheet.create({
 card:{borderWidth:1,borderColor:"#E4E9E6",borderRadius:20,padding:15,backgroundColor:"#fff",marginBottom:11},
 cardDark:{borderColor:darkColors.border,backgroundColor:darkColors.card},
 row:{flexDirection:"row",alignItems:"center",borderWidth:1,borderColor:"#E4E9E6",borderRadius:16,padding:12,backgroundColor:"#fff",marginBottom:10},
 rowDark:{borderColor:darkColors.border,backgroundColor:darkColors.card},
 tile:{flex:1,minWidth:"46%",minHeight:120,borderWidth:1,borderColor:"#E3E7E4",borderRadius:22,padding:15,backgroundColor:"#fff"},
 tileDark:{borderColor:darkColors.border,backgroundColor:darkColors.card},
});

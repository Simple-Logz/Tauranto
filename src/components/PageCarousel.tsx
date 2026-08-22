import React from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {darkColors} from '../theme/tokens';
import {useTheme} from '../theme/ThemeContext';

export function PageCarousel<T extends string>({items,active,onChange}:{items:readonly T[];active:T;onChange:(item:T)=>void}){
  const {dark}=useTheme();
  return <View style={[s.shell,dark&&s.shellDark]}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.content} decelerationRate="fast" snapToAlignment="start">{items.map(item=>{const selected=item===active;return <Pressable key={item} onPress={()=>onChange(item)} style={({pressed})=>[s.pill,dark&&s.pillDark,selected&&s.selected,pressed&&s.pressed]}><Text style={[s.text,dark&&s.textDark,selected&&s.selectedText]}>{item}</Text></Pressable>})}</ScrollView></View>
}
const s=StyleSheet.create({shell:{marginBottom:14,borderWidth:1,borderColor:'#E7E9E7',borderRadius:18,backgroundColor:'rgba(255,255,255,.92)',padding:6,shadowColor:'#14251C',shadowOpacity:.06,shadowRadius:12,shadowOffset:{width:0,height:5},elevation:2},shellDark:{backgroundColor:darkColors.card,borderColor:darkColors.border},content:{gap:8,paddingRight:18},pill:{height:38,paddingHorizontal:17,borderRadius:15,borderWidth:1,borderColor:'#E1E5E2',backgroundColor:'#FFF',alignItems:'center',justifyContent:'center'},pillDark:{backgroundColor:darkColors.cardAlt,borderColor:darkColors.border},selected:{backgroundColor:'#F0E9FF',borderColor:'#DED0FF'},pressed:{transform:[{scale:.98}],opacity:.88},text:{fontFamily:'NunitoSans_700Bold',fontSize:11,color:'#525B55'},textDark:{color:darkColors.textMuted},selectedText:{fontFamily:'NunitoSans_800ExtraBold',color:'#5D3FA3'}});
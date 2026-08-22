import React,{useEffect,useRef} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {darkColors} from '../theme/tokens';
import {useTheme} from '../theme/ThemeContext';

/** Shared navigation carousel. The active destination is kept visible and receives
 * Tauranto's light-purple selection tint. Screens own their content so every
 * destination remains an independent view rather than content stacked in one page. */
export function PageCarousel<T extends string>({items,active,onChange}:{items:readonly T[];active:T;onChange:(item:T)=>void}){
  const {dark}=useTheme();
  const ref=useRef<ScrollView>(null);
  const layouts=useRef<Record<string,{x:number;width:number}>>({});
  useEffect(()=>{
    const l=layouts.current[active];
    if(l) ref.current?.scrollTo({x:Math.max(0,l.x-18),animated:true});
  },[active]);
  return <View style={[s.shell,dark&&s.shellDark]}>
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.content} decelerationRate="fast" directionalLockEnabled>
      {items.map(item=>{const selected=item===active;return <Pressable key={item} onLayout={e=>{layouts.current[item]=e.nativeEvent.layout}} onPress={()=>onChange(item)} style={({pressed})=>[s.pill,dark&&s.pillDark,selected&&s.selected,pressed&&s.pressed]} accessibilityRole="tab" accessibilityState={{selected}}>
        <Text style={[s.text,dark&&s.textDark,selected&&s.selectedText]}>{item}</Text>
      </Pressable>})}
    </ScrollView>
  </View>
}
const s=StyleSheet.create({shell:{marginBottom:14,borderWidth:1,borderColor:'#E7E9E7',borderRadius:18,backgroundColor:'rgba(255,255,255,.96)',padding:6,shadowColor:'#14251C',shadowOpacity:.06,shadowRadius:12,shadowOffset:{width:0,height:5},elevation:2,overflow:'hidden'},shellDark:{backgroundColor:darkColors.card,borderColor:darkColors.border},content:{gap:8,paddingRight:28},pill:{height:42,minWidth:92,paddingHorizontal:20,borderRadius:16,borderWidth:1,borderColor:'#E1E5E2',backgroundColor:'#FFF',alignItems:'center',justifyContent:'center'},pillDark:{backgroundColor:darkColors.cardAlt,borderColor:darkColors.border},selected:{backgroundColor:'#F0E9FF',borderColor:'#D8C7FF'},pressed:{transform:[{scale:.985}],opacity:.9},text:{fontFamily:'NunitoSans_700Bold',fontSize:12,color:'#525B55'},textDark:{color:darkColors.textMuted},selectedText:{fontFamily:'NunitoSans_800ExtraBold',color:'#5D3FA3'}});
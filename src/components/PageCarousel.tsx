import React,{useEffect,useMemo,useRef} from 'react';
import {NativeScrollEvent,NativeSyntheticEvent,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {darkColors} from '../theme/tokens';
import {useTheme} from '../theme/ThemeContext';

/** Shared Tauranto section carousel. It behaves like a real horizontal rail:
 * drag/swipe the rail or tap a destination. The active destination is brought
 * smoothly into view and gets the requested soft-purple tint. */
export function PageCarousel<T extends string>({items,active,onChange}:{items:readonly T[];active:T;onChange:(item:T)=>void}){
  const {dark}=useTheme();
  const ref=useRef<ScrollView>(null);
  const layouts=useRef<Record<string,{x:number;width:number}>>({});
  const activeIndex=useMemo(()=>Math.max(0,items.indexOf(active)),[items,active]);
  useEffect(()=>{
    const l=layouts.current[active];
    if(l) ref.current?.scrollTo({x:Math.max(0,l.x-14),animated:true});
  },[active]);
  const settle=(e:NativeSyntheticEvent<NativeScrollEvent>)=>{
    const center=e.nativeEvent.contentOffset.x+e.nativeEvent.layoutMeasurement.width/2;
    let nearest=activeIndex,best=Number.POSITIVE_INFINITY;
    items.forEach((item,index)=>{const l=layouts.current[item];if(!l)return;const d=Math.abs(l.x+l.width/2-center);if(d<best){best=d;nearest=index}});
    const next=items[nearest];if(next&&next!==active)onChange(next);
  };
  return <View style={[s.shell,dark&&s.shellDark]}>
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.content} decelerationRate="fast" directionalLockEnabled snapToAlignment="start" onMomentumScrollEnd={settle}>
      {items.map(item=>{const selected=item===active;return <Pressable key={item} onLayout={e=>{layouts.current[item]=e.nativeEvent.layout}} onPress={()=>onChange(item)} style={({pressed})=>[s.pill,dark&&s.pillDark,selected&&s.selected,dark&&selected&&s.selectedDark,pressed&&s.pressed]} accessibilityRole="tab" accessibilityState={{selected}}>
        <Text style={[s.text,dark&&s.textDark,selected&&s.selectedText,dark&&selected&&s.selectedTextDark]}>{item}</Text>
      </Pressable>})}
    </ScrollView>
  </View>
}
const s=StyleSheet.create({shell:{marginBottom:16,borderWidth:1,borderColor:'#E4E7E4',borderRadius:22,backgroundColor:'rgba(255,255,255,.88)',padding:7,shadowColor:'#14251C',shadowOpacity:.07,shadowRadius:14,shadowOffset:{width:0,height:6},elevation:3,overflow:'hidden'},shellDark:{backgroundColor:'rgba(29,36,31,.92)',borderColor:darkColors.border},content:{gap:10,paddingRight:42},pill:{height:44,minWidth:104,paddingHorizontal:22,borderRadius:18,borderWidth:1,borderColor:'#DEE3DF',backgroundColor:'rgba(255,255,255,.82)',alignItems:'center',justifyContent:'center'},pillDark:{backgroundColor:darkColors.cardAlt,borderColor:darkColors.border},selected:{backgroundColor:'#EEE7FF',borderColor:'#CDBBFF',shadowColor:'#7657B5',shadowOpacity:.08,shadowRadius:7,shadowOffset:{width:0,height:2}},selectedDark:{backgroundColor:'#332A49',borderColor:'#6E5B99'},pressed:{transform:[{scale:.975}],opacity:.9},text:{fontFamily:'NunitoSans_700Bold',fontSize:12,color:'#505A53'},textDark:{color:darkColors.textMuted},selectedText:{fontFamily:'NunitoSans_800ExtraBold',color:'#6043A4'},selectedTextDark:{color:'#D8C9FF'}});
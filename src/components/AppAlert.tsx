import React,{useEffect,useState}from"react";
import{Modal,Pressable,StyleSheet,Text,View}from"react-native";
import{colors,darkColors,radius,shadow}from"../theme/tokens";
import{useTheme}from"../theme/ThemeContext";

// Tauranto's own confirmation/error dialog — a drop-in replacement for
// RN's `Alert.alert`. The native OS alert (plain gray box, system font,
// no branding) is one of the biggest reasons a carefully designed app can
// still feel like an unfinished prototype: every confirmation and error
// suddenly looks like it belongs to a different, generic app. This renders
// in Tauranto's own type and color system instead, while keeping the same
// call shape (title, message, buttons) so it's a mechanical swap everywhere
// `Alert.alert` used to be called.
export type AppAlertButton={text?:string;onPress?:()=>void;style?:"default"|"cancel"|"destructive"};
type AppAlertState={visible:boolean;title:string;message?:string;buttons:AppAlertButton[]};

let showRef:((title:string,message?:string,buttons?:AppAlertButton[])=>void)|null=null;

/** Drop-in replacement for `Alert.alert(title, message, buttons)`. */
export function appAlert(title:string,message?:string,buttons?:AppAlertButton[]){
 if(showRef)showRef(title,message,buttons);
}

export function AppAlertHost(){
 const{dark}=useTheme();
 const[state,setState]=useState<AppAlertState>({visible:false,title:"",buttons:[]});
 useEffect(()=>{
  showRef=(title,message,buttons)=>setState({visible:true,title,message,buttons:buttons&&buttons.length?buttons:[{text:"OK"}]});
  return()=>{showRef=null};
 },[]);
 const dismiss=(btn:AppAlertButton)=>{setState(s=>({...s,visible:false}));if(btn.onPress)setTimeout(btn.onPress,0)};
 const stacked=state.buttons.length>2;
 return <Modal visible={state.visible} transparent animationType="fade" onRequestClose={()=>dismiss(state.buttons[state.buttons.length-1]||{})}>
  <Pressable style={s.backdrop} onPress={()=>{}}>
   <View style={[s.sheet,dark&&s.sheetDark]}>
    <Text style={[s.title,dark&&s.titleDark]}>{state.title}</Text>
    {!!state.message&&<Text style={[s.message,dark&&s.messageDark]}>{state.message}</Text>}
    <View style={[s.buttonRow,stacked&&s.buttonColumn]}>
     {state.buttons.map((b,i)=><Pressable key={i} onPress={()=>dismiss(b)} style={[s.button,dark&&s.buttonDark,b.style==="cancel"&&s.buttonCancel,b.style==="cancel"&&dark&&s.buttonCancelDark,b.style==="destructive"&&s.buttonDestructive,b.style==="destructive"&&dark&&s.buttonDestructiveDark,stacked&&s.buttonStacked]}>
      <Text style={[s.buttonText,dark&&s.buttonTextDark,b.style==="cancel"&&s.buttonTextCancel,b.style==="cancel"&&dark&&s.buttonTextCancelDark,b.style==="destructive"&&s.buttonTextDestructive]}>{b.text||"OK"}</Text>
     </Pressable>)}
    </View>
   </View>
  </Pressable>
 </Modal>;
}

const s=StyleSheet.create({
 backdrop:{flex:1,backgroundColor:"#10251F99",alignItems:"center",justifyContent:"center",padding:28},
 sheet:{width:"100%",maxWidth:360,backgroundColor:colors.cream,borderRadius:radius.lg,padding:22,...shadow},
 sheetDark:{backgroundColor:darkColors.card,borderWidth:1,borderColor:darkColors.border},
 title:{fontFamily:"NunitoSans_900Black",fontSize:19,color:colors.ink,textAlign:"center"},
 titleDark:{color:darkColors.text},
 message:{fontFamily:"NunitoSans_600SemiBold",fontSize:14,lineHeight:20,color:colors.muted,textAlign:"center",marginTop:10},
 messageDark:{color:darkColors.textMuted},
 buttonRow:{flexDirection:"row",gap:10,marginTop:20},
 buttonColumn:{flexDirection:"column"},
 button:{flex:1,height:48,borderRadius:14,backgroundColor:colors.leafDeep,alignItems:"center",justifyContent:"center"},
 buttonDark:{backgroundColor:colors.leaf},
 buttonStacked:{flex:0,width:"100%"},
 buttonCancel:{backgroundColor:colors.paper,borderWidth:1,borderColor:colors.line},
 buttonCancelDark:{backgroundColor:darkColors.cardAlt,borderColor:darkColors.border},
 buttonDestructive:{backgroundColor:colors.tomatoPale},
 buttonDestructiveDark:{backgroundColor:darkColors.cardAlt},
 buttonText:{fontFamily:"NunitoSans_900Black",fontSize:14,color:"white"},
 buttonTextDark:{color:colors.leafInk},
 buttonTextCancel:{color:colors.muted},
 buttonTextCancelDark:{color:darkColors.textMuted},
 buttonTextDestructive:{color:colors.tomatoDeep},
});

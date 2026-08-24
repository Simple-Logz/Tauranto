import React from 'react';
import {Platform,StyleSheet,Text,View} from 'react-native';
export function TablesScreen(_props:any){
 if(Platform.OS==='web') return React.createElement('iframe' as any,{src:'/stitch-preview/tables_view_2.html',title:'Tauranto Stitch Tables',style:{width:'100%',height:'100%',border:'0',display:'block',background:'#FAFBF9'}});
 return <View style={s.native}><Text style={s.title}>Tables</Text><Text style={s.copy}>Stitch UI preview is enabled on the web integration branch.</Text></View>;
}
const s=StyleSheet.create({native:{flex:1,alignItems:'center',justifyContent:'center',padding:24,backgroundColor:'#FAFBF9'},title:{fontSize:30,fontWeight:'900',color:'#173526'},copy:{marginTop:10,textAlign:'center',fontSize:16,color:'#53675B'}});

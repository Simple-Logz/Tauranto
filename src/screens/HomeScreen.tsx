import React from 'react';
import {Platform,StyleSheet,Text,View} from 'react-native';
import type {VoiceCommand} from '../lib/models';
import type {WorkspacePage} from './WorkspaceScreen';
type Props={restaurantId:string;commands:VoiceCommand[];onDecide:(id:string,approved:boolean)=>void;onOpenApprovals:()=>void;onOpenActivity:()=>void;onOpenVoice:()=>void;onOpenProfile:()=>void;onOpenIntegrations:()=>void;onOpenWorkspace:(page:WorkspacePage)=>void;onOpenBilling:()=>void;menuRequest?:number;wakeSupported?:boolean};
export function HomeScreen(_props:Props){
 if(Platform.OS==='web') return React.createElement('iframe' as any,{src:'/stitch-preview/home_dashboard_3.html',title:'Tauranto Stitch Home',style:{width:'100%',height:'100%',border:'0',display:'block',background:'#FAFBF9'}});
 return <View style={s.native}><Text style={s.title}>Tauranto</Text><Text style={s.copy}>Stitch UI preview is currently enabled on the web integration branch.</Text></View>;
}
const s=StyleSheet.create({native:{flex:1,alignItems:'center',justifyContent:'center',padding:24,backgroundColor:'#FAFBF9'},title:{fontSize:30,fontWeight:'900',color:'#173526'},copy:{marginTop:10,textAlign:'center',fontSize:16,color:'#53675B'}});

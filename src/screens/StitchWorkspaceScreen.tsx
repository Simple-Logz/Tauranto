import React from 'react';
import {Platform,StyleSheet,Text,View} from 'react-native';
export type StitchWorkspacePage='integrations'|'team'|'roles'|'billing'|'documentation'|'notifications'|'help'|'security';
const files:Record<StitchWorkspacePage,string>={integrations:'integrations_2',team:'team_departments_2',roles:'roles_authority_2',billing:'plans_billing_2',documentation:'documentation_2',notifications:'notification_settings_2',help:'help_support_2',security:'account_security_2'};
export function StitchWorkspaceScreen({page}:{page:StitchWorkspacePage}){if(Platform.OS==='web')return React.createElement('iframe' as any,{src:`/stitch-preview/${files[page]}.html`,title:`Tauranto ${page}`,style:{width:'100%',height:'100%',border:'0',display:'block',background:'#FAFBF9'}});return <View style={s.native}><Text style={s.title}>Tauranto</Text><Text>Stitch workspace UI is enabled on the web integration branch.</Text></View>}
const s=StyleSheet.create({native:{flex:1,alignItems:'center',justifyContent:'center',padding:24,backgroundColor:'#FAFBF9'},title:{fontSize:30,fontWeight:'900',color:'#173526',marginBottom:10}});

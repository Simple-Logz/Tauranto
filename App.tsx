import React, { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts as useDMSans, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from "@expo-google-fonts/dm-sans";
import { View, ActivityIndicator } from "react-native";
import { Shell } from "./src/components/Shell";
import { HomeScreen } from "./src/screens/HomeScreen";
import { ActivityScreen } from "./src/screens/ActivityScreen";
import { IntegrationsScreen } from "./src/screens/IntegrationsScreen";
import { MoreScreen } from "./src/screens/MoreScreen";
import { colors } from "./src/theme/tokens";
import { VoiceCommand } from "./src/lib/models";
import { taurantoApi, supabase } from "./src/lib/api";
import { AuthScreen } from "./src/screens/AuthScreen";

export type TabName = "Today" | "Activity" | "Integrations" | "More";

export default function App() {
  const [dmLoaded] = useDMSans({ DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold });
  const [tab, setTab] = useState<TabName>("Today");
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => { supabase.auth.getSession().then(({data}) => { setSession(data.session); setAuthReady(true); }); const {data}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next)); return()=>data.subscription.unsubscribe(); },[]);

  if (!dmLoaded || !authReady) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream }}><ActivityIndicator color={colors.leafDeep} /></View>;
  }
  if (!session) return <SafeAreaProvider><StatusBar style="dark"/><AuthScreen/></SafeAreaProvider>;

  const addCommand = async (draft: VoiceCommand) => { const restaurantId=process.env.EXPO_PUBLIC_RESTAURANT_ID; if(!restaurantId){ setCommands(current=>[draft,...current]); return; } const {command}=await taurantoApi.interpret(restaurantId,draft.transcript,"voice"); const mapped:VoiceCommand={id:command.id,transcript:command.transcript,title:command.title,summary:command.summary,type:mapType(command.action_type),status:command.status==="rejected"?"rejected":command.status==="approved"?"approved":command.status==="completed"?"completed":"pending",createdAt:command.created_at,targets:targets(command.action_type),confidence:Number(command.confidence),approvalId:command.approvalId}; setCommands(current=>[mapped,...current]); };
  const decide = async (id: string, approved: boolean) => { const item=commands.find(x=>x.id===id); if(item?.approvalId) await taurantoApi.decide(item.approvalId,approved?"approved":"rejected"); setCommands((current) => current.map((entry) => entry.id === id ? { ...entry, status: approved ? "approved" : "rejected" } : entry)); };

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Shell tab={tab} onTabChange={setTab} pending={commands.filter((item) => item.status === "pending").length}>
        {tab === "Today" && <HomeScreen commands={commands} onCommand={addCommand} onDecide={decide} onOpenActivity={() => setTab("Activity")} />}
        {tab === "Activity" && <ActivityScreen commands={commands} onDecide={decide} />}
        {tab === "Integrations" && <IntegrationsScreen />}
        {tab === "More" && <MoreScreen />}
      </Shell>
    </SafeAreaProvider>
  );
}
const mapType=(value:string):VoiceCommand["type"]=>value==="menu_availability"?"availability":value==="business_hours"?"hours":value==="pause_orders"?"pause":value.includes("supplier")||value==="purchase_request"?"supplier":value==="announcement"?"announcement":value==="calendar_reminder"?"reminder":"task";
const targets=(value:string)=>value==="menu_availability"?["Website","Ordering"]:value==="business_hours"?["Website","Calendar","Ordering"]:value.includes("supplier")||value==="purchase_request"?["Vendor","Email"]:["Operations"];

import React from "react";
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { VoiceComposer } from "../components/VoiceComposer";
import { colors, radius, shadow } from "../theme/tokens";
import { VoiceCommand } from "../lib/models";

export function HomeScreen({ commands, onCommand, onDecide, onOpenActivity }: { commands: VoiceCommand[]; onCommand: (command: VoiceCommand) => void; onDecide: (id: string, approved: boolean) => void; onOpenActivity: () => void }) {
  const insets = useSafeAreaInsets();
  const pending = commands.filter((item) => item.status === "pending");
  return <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>HARBOR &amp; HEARTH · PROVIDENCE</Text><Text style={styles.heading}>Good afternoon, Maya.</Text></View><Pressable style={styles.avatar}><Text style={styles.avatarText}>MB</Text><View style={styles.online}/></Pressable></View>

    <View style={styles.statusCard}>
      <View style={styles.statusMain}><View style={styles.openIcon}><Ionicons name="restaurant-outline" size={18} color={colors.leafDeep}/></View><View><Text style={styles.statusLabel}>RESTAURANT STATUS</Text><Text style={styles.statusTitle}>Open · kitchen steady</Text></View></View>
      <View style={styles.statusDivider}/><View><Text style={styles.statusLabel}>ORDER LOAD</Text><Text style={styles.statusTitle}>18 min</Text></View>
    </View>

    <VoiceComposer onCommand={onCommand} />

    <View style={styles.sectionHead}><View><Text style={styles.sectionKicker}>NEEDS YOUR EYES</Text><Text style={styles.sectionTitle}>Approval queue</Text></View>{pending.length > 0 && <Pressable onPress={onOpenActivity}><Text style={styles.viewAll}>View all</Text></Pressable>}</View>
    {pending.length === 0 ? <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="checkmark" size={21} color={colors.leafDeep}/></View><View><Text style={styles.emptyTitle}>You’re all caught up</Text><Text style={styles.emptyCopy}>Voice instructions will wait here before anything changes.</Text></View></View> : pending.slice(0, 2).map((command) => <CommandCard key={command.id} command={command} onDecide={onDecide}/>) }

    <View style={styles.sectionHead}><View><Text style={styles.sectionKicker}>AT A GLANCE</Text><Text style={styles.sectionTitle}>Today’s pulse</Text></View></View>
    <View style={styles.metrics}>
      <Metric icon="receipt-outline" value="84" label="Orders" tint={colors.leafPale}/><Metric icon="cash-outline" value="$2.4k" label="Sales" tint="#F6ECCE"/><Metric icon="alert-circle-outline" value="3" label="Low stock" tint={colors.tomatoPale}/>
    </View>

    <View style={styles.briefing}>
      <View style={styles.briefTop}><View style={styles.spark}><Ionicons name="sparkles" size={17} color={colors.lavender}/></View><Text style={styles.briefTitle}>Tauranto’s shift briefing</Text><Text style={styles.briefTime}>2:14 PM</Text></View>
      <Text style={styles.briefCopy}>Dinner reservations are 18% above a typical Thursday. Salmon is projected to run low around 7:30 PM. Consider checking seafood stock before the rush.</Text>
      <Pressable style={styles.briefAction}><Text style={styles.briefActionText}>Turn into tasks</Text><Ionicons name="arrow-forward" size={14} color={colors.lavender}/></Pressable>
    </View>
  </ScrollView>;
}

function CommandCard({ command, onDecide }: { command: VoiceCommand; onDecide: (id: string, approved: boolean) => void }) {
  return <View style={styles.commandCard}><View style={styles.commandTop}><View style={styles.commandIcon}><Ionicons name={command.type === "availability" ? "fast-food-outline" : command.type === "supplier" ? "cube-outline" : "calendar-outline"} size={19} color={colors.tomato}/></View><View style={{ flex: 1 }}><Text style={styles.confidence}>{Math.round(command.confidence * 100)}% CONFIDENT</Text><Text style={styles.commandTitle}>{command.title}</Text></View><Text style={styles.commandTime}>Now</Text></View><Text style={styles.commandSummary}>{command.summary}</Text><View style={styles.targets}>{command.targets.map((target) => <Text key={target} style={styles.target}>{target}</Text>)}</View><View style={styles.decisions}><Pressable onPress={() => onDecide(command.id, false)} style={styles.dismiss}><Text style={styles.dismissText}>Not now</Text></Pressable><Pressable onPress={() => onDecide(command.id, true)} style={styles.approve}><Ionicons name="checkmark" size={15} color="white"/><Text style={styles.approveText}>Approve action</Text></Pressable></View></View>;
}

function Metric({ icon, value, label, tint }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string; tint: string }) { return <View style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: tint }]}><Ionicons name={icon} size={17} color={colors.ink}/></View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.cream},content:{paddingHorizontal:17,paddingBottom:28},header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:14},eyebrow:{fontFamily:"DMSans_700Bold",fontSize:9.5,letterSpacing:1.15,color:colors.leafDeep,marginBottom:4},heading:{fontFamily:"DMSans_700Bold",fontSize:28,lineHeight:33,color:colors.ink},avatar:{width:45,height:45,borderRadius:15,backgroundColor:"#F2D6BF",alignItems:"center",justifyContent:"center",borderWidth:2,borderColor:colors.paper,...shadow},avatarText:{fontFamily:"DMSans_700Bold",fontSize:12,color:colors.ink},online:{position:"absolute",right:-2,bottom:-1,width:12,height:12,borderRadius:6,backgroundColor:colors.leaf,borderWidth:2,borderColor:colors.paper},
  statusCard:{flexDirection:"row",alignItems:"center",backgroundColor:colors.paper,borderRadius:radius.md,borderWidth:1,borderColor:colors.line,padding:14,marginBottom:11,...shadow},statusMain:{flex:1,flexDirection:"row",gap:11,alignItems:"center"},openIcon:{width:39,height:39,borderRadius:12,backgroundColor:colors.leafPale,alignItems:"center",justifyContent:"center"},statusLabel:{fontFamily:"DMSans_700Bold",fontSize:8.5,letterSpacing:.75,color:colors.muted},statusTitle:{fontFamily:"DMSans_700Bold",fontSize:13,color:colors.ink,marginTop:3},statusDivider:{width:1,height:36,backgroundColor:colors.line,marginHorizontal:13},
  sectionHead:{flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between",marginTop:20,marginBottom:9},sectionKicker:{fontFamily:"DMSans_700Bold",fontSize:9.5,letterSpacing:1.05,color:colors.leafDeep,marginBottom:3},sectionTitle:{fontFamily:"DMSans_700Bold",fontSize:23,lineHeight:27,color:colors.ink},viewAll:{fontFamily:"DMSans_700Bold",fontSize:11,color:colors.leafDeep,padding:6},empty:{flexDirection:"row",gap:12,alignItems:"center",backgroundColor:colors.paper,borderWidth:1,borderColor:colors.line,borderRadius:radius.md,padding:15},emptyIcon:{width:42,height:42,borderRadius:13,alignItems:"center",justifyContent:"center",backgroundColor:colors.leafPale},emptyTitle:{fontFamily:"DMSans_700Bold",fontSize:14,color:colors.ink},emptyCopy:{fontFamily:"DMSans_400Regular",fontSize:11,lineHeight:15,color:colors.muted,marginTop:3,maxWidth:270},
  commandCard:{backgroundColor:colors.paper,borderRadius:radius.lg,borderWidth:1,borderColor:colors.line,padding:15,marginBottom:10,...shadow},commandTop:{flexDirection:"row",alignItems:"center",gap:10},commandIcon:{width:39,height:39,borderRadius:13,backgroundColor:colors.tomatoPale,alignItems:"center",justifyContent:"center"},confidence:{fontFamily:"DMSans_700Bold",fontSize:7,letterSpacing:.8,color:colors.leafDeep},commandTitle:{fontFamily:"DMSans_700Bold",fontSize:13,color:colors.ink,marginTop:3},commandTime:{fontFamily:"DMSans_500Medium",fontSize:8,color:colors.muted},commandSummary:{fontFamily:"DMSans_400Regular",fontSize:11,lineHeight:17,color:colors.inkSoft,marginTop:11},targets:{flexDirection:"row",gap:5,marginTop:10,flexWrap:"wrap"},target:{fontFamily:"DMSans_600SemiBold",fontSize:7,color:colors.inkSoft,backgroundColor:colors.leafMist,paddingHorizontal:8,paddingVertical:5,borderRadius:7},decisions:{flexDirection:"row",gap:8,marginTop:14},dismiss:{flex:1,height:40,borderRadius:12,borderWidth:1,borderColor:colors.line,alignItems:"center",justifyContent:"center"},dismissText:{fontFamily:"DMSans_700Bold",fontSize:10,color:colors.inkSoft},approve:{flex:1.45,height:40,borderRadius:12,backgroundColor:colors.leafDeep,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:5},approveText:{fontFamily:"DMSans_700Bold",fontSize:10,color:"white"},
  metrics:{flexDirection:"row",gap:8},metric:{flex:1,backgroundColor:colors.paper,borderRadius:radius.md,padding:13,borderWidth:1,borderColor:colors.line},metricIcon:{width:35,height:35,borderRadius:11,alignItems:"center",justifyContent:"center"},metricValue:{fontFamily:"DMSans_700Bold",fontSize:22,color:colors.ink,marginTop:9},metricLabel:{fontFamily:"DMSans_500Medium",fontSize:10,color:colors.muted,marginTop:2},
  briefing:{backgroundColor:"#F1EDF5",borderRadius:radius.lg,padding:16,marginTop:11,borderWidth:1,borderColor:"#E3DDE8"},briefTop:{flexDirection:"row",alignItems:"center",gap:10},spark:{width:36,height:36,borderRadius:12,backgroundColor:"#E4DCEA",alignItems:"center",justifyContent:"center"},briefTitle:{fontFamily:"DMSans_700Bold",fontSize:13,color:colors.ink},briefTime:{marginLeft:"auto",fontFamily:"DMSans_500Medium",fontSize:9.5,color:colors.muted},briefCopy:{fontFamily:"DMSans_400Regular",fontSize:12,lineHeight:18,color:colors.inkSoft,marginTop:10},briefAction:{flexDirection:"row",gap:5,alignSelf:"flex-start",alignItems:"center",marginTop:10},briefActionText:{fontFamily:"DMSans_700Bold",fontSize:10.5,color:colors.lavender},
});

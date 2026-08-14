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

  </ScrollView>;
}

function CommandCard({ command, onDecide }: { command: VoiceCommand; onDecide: (id: string, approved: boolean) => void }) {
  return <View style={styles.commandCard}><View style={styles.commandTop}><View style={styles.commandIcon}><Ionicons name={command.type === "availability" ? "fast-food-outline" : command.type === "supplier" ? "cube-outline" : "calendar-outline"} size={19} color={colors.tomato}/></View><View style={{ flex: 1 }}><Text style={styles.confidence}>{Math.round(command.confidence * 100)}% CONFIDENT</Text><Text style={styles.commandTitle}>{command.title}</Text></View><Text style={styles.commandTime}>Now</Text></View><Text style={styles.commandSummary}>{command.summary}</Text><View style={styles.targets}>{command.targets.map((target) => <Text key={target} style={styles.target}>{target}</Text>)}</View><View style={styles.decisions}><Pressable onPress={() => onDecide(command.id, false)} style={styles.dismiss}><Text style={styles.dismissText}>Not now</Text></Pressable><Pressable onPress={() => onDecide(command.id, true)} style={styles.approve}><Ionicons name="checkmark" size={15} color="white"/><Text style={styles.approveText}>Approve action</Text></Pressable></View></View>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.cream},content:{paddingHorizontal:18,paddingBottom:30},header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:15},eyebrow:{fontFamily:"DMSans_700Bold",fontSize:10.5,letterSpacing:1,color:colors.leafDeep,marginBottom:5},heading:{fontFamily:"DMSans_700Bold",fontSize:30,lineHeight:35,color:colors.ink},avatar:{width:48,height:48,borderRadius:16,backgroundColor:"#F2D6BF",alignItems:"center",justifyContent:"center",borderWidth:2,borderColor:colors.paper,...shadow},avatarText:{fontFamily:"DMSans_700Bold",fontSize:13,color:colors.ink},online:{position:"absolute",right:-2,bottom:-1,width:13,height:13,borderRadius:7,backgroundColor:colors.leaf,borderWidth:2,borderColor:colors.paper},
  statusCard:{flexDirection:"row",alignItems:"center",backgroundColor:colors.paper,borderRadius:18,borderWidth:1,borderColor:colors.line,padding:15,marginBottom:12,...shadow},statusMain:{flex:1,flexDirection:"row",gap:12,alignItems:"center"},openIcon:{width:42,height:42,borderRadius:13,backgroundColor:colors.leafPale,alignItems:"center",justifyContent:"center"},statusLabel:{fontFamily:"DMSans_700Bold",fontSize:9.5,letterSpacing:.7,color:colors.muted},statusTitle:{fontFamily:"DMSans_700Bold",fontSize:14,color:colors.ink,marginTop:4},statusDivider:{width:1,height:39,backgroundColor:colors.line,marginHorizontal:13},
  sectionHead:{flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between",marginTop:22,marginBottom:10},sectionKicker:{fontFamily:"DMSans_700Bold",fontSize:10.5,letterSpacing:1,color:colors.leafDeep,marginBottom:4},sectionTitle:{fontFamily:"DMSans_700Bold",fontSize:25,lineHeight:29,color:colors.ink},viewAll:{fontFamily:"DMSans_700Bold",fontSize:13,color:colors.leafDeep,padding:7},empty:{flexDirection:"row",gap:13,alignItems:"center",backgroundColor:colors.paper,borderWidth:1,borderColor:colors.line,borderRadius:18,padding:16},emptyIcon:{width:46,height:46,borderRadius:14,alignItems:"center",justifyContent:"center",backgroundColor:colors.leafPale},emptyTitle:{fontFamily:"DMSans_700Bold",fontSize:16,color:colors.ink},emptyCopy:{fontFamily:"DMSans_400Regular",fontSize:12.5,lineHeight:18,color:colors.muted,marginTop:4,maxWidth:270},
  commandCard:{backgroundColor:colors.paper,borderRadius:radius.lg,borderWidth:1,borderColor:colors.line,padding:16,marginBottom:10,...shadow},commandTop:{flexDirection:"row",alignItems:"center",gap:11},commandIcon:{width:43,height:43,borderRadius:14,backgroundColor:colors.tomatoPale,alignItems:"center",justifyContent:"center"},confidence:{fontFamily:"DMSans_700Bold",fontSize:9.5,letterSpacing:.7,color:colors.leafDeep},commandTitle:{fontFamily:"DMSans_700Bold",fontSize:15,color:colors.ink,marginTop:3},commandTime:{fontFamily:"DMSans_500Medium",fontSize:10.5,color:colors.muted},commandSummary:{fontFamily:"DMSans_400Regular",fontSize:13,lineHeight:19,color:colors.inkSoft,marginTop:12},targets:{flexDirection:"row",gap:6,marginTop:11,flexWrap:"wrap"},target:{fontFamily:"DMSans_600SemiBold",fontSize:10,color:colors.inkSoft,backgroundColor:colors.leafMist,paddingHorizontal:9,paddingVertical:6,borderRadius:8},decisions:{flexDirection:"row",gap:9,marginTop:15},dismiss:{flex:1,height:48,borderRadius:13,borderWidth:1,borderColor:colors.line,alignItems:"center",justifyContent:"center"},dismissText:{fontFamily:"DMSans_700Bold",fontSize:12,color:colors.inkSoft},approve:{flex:1.45,height:48,borderRadius:13,backgroundColor:colors.leafDeep,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:6},approveText:{fontFamily:"DMSans_700Bold",fontSize:12,color:"white"},
});

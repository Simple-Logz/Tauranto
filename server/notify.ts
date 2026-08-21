import { Resend } from "resend";
import { admin } from "./http";
export async function notifyApprovers(approvers: Array<{
    email: string | null;
    full_name: string;
}>, command: {
    id: string;
    title: string;
    summary: string;
    risk: string;
    restaurant_id?: string;
}) {
    if (!process.env.RESEND_API_KEY || !process.env.NOTIFICATION_FROM)
        return;
    if (command.restaurant_id) {
        const { data } = await admin().from('restaurant_preferences').select('notifications').eq('restaurant_id', command.restaurant_id).maybeSingle();
        if (data?.notifications?.approval_email === false)
            return;
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    const base = process.env.APP_URL || "http://localhost:8081";
    await Promise.all(approvers.filter(a => a.email).map(a => resend.emails.send({
        from: process.env.NOTIFICATION_FROM!, to: a.email!, subject: `Approval required: ${command.title}`,
        html: `<h2>Tauranto needs your approval</h2><p>${escape(command.summary)}</p><p>Risk: <strong>${command.risk}</strong></p><p><a href="${base}/?command=${command.id}">Review securely in Tauranto</a></p><p>No action has been executed.</p>`
    })));
}
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]!));

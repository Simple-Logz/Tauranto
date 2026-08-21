import type {VercelRequest,VercelResponse} from "@vercel/node";
import OpenAI,{toFile} from "openai";
import {z} from "zod";
import {fail,requireUser} from "../../server/http";
import {withinRateLimit} from "../../server/ratelimit";

const bodySchema=z.object({
  audioBase64:z.string().min(100).max(12_000_000),
  mimeType:z.enum(["audio/m4a","audio/mp4","audio/x-m4a","audio/webm","audio/wav","audio/mpeg","audio/mp3"])
});
const extension:Record<string,string>={"audio/m4a":"m4a","audio/mp4":"m4a","audio/x-m4a":"m4a","audio/webm":"webm","audio/wav":"wav","audio/mpeg":"mp3","audio/mp3":"mp3"};

export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=="POST")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
 try{
  const user=await requireUser(req);
  // 20 recordings per 10 minutes per user: generous for real use (a busy
  // shift is nowhere near this), but bounds how much OpenAI transcription
  // cost one compromised or misbehaving session can run up.
  if(!(await withinRateLimit(`transcribe:${user.id}`,20,600))){
   return res.status(429).json({error:"Too many voice commands in a short time. Please wait a few minutes and try again."});
  }
  const body=bodySchema.parse(req.body);
  const bytes=Buffer.from(body.audioBase64,"base64");
  if(bytes.length>8_000_000)throw new Error("AUDIO_TOO_LARGE");
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  const result=await client.audio.transcriptions.create({
   file:await toFile(bytes,`tauranto-command.${extension[body.mimeType]||"m4a"}`,{type:body.mimeType}),
   model:process.env.OPENAI_TRANSCRIBE_MODEL||"gpt-4o-transcribe",
   language:"en",
   prompt:"Restaurant operations command. The wake name is Tauranto. Preserve menu items, supplier names, quantities, units, prices, dates, times, phone numbers, and email addresses exactly."
  });
  const transcript=result.text.trim().replace(/\b(?:that's all|that is all|end command|send for approval)\.?$/i,"").trim();
  if(transcript.length<2)throw new Error("NO_SPEECH_DETECTED");
  return res.json({transcript});
 }catch(error){return fail(res,error)}
}

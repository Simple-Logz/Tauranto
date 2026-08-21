// Pure, dependency-free wake-phrase matching for "Hey Tauranto" — kept in
// its own module (no React/expo imports) specifically so it can be unit
// tested directly, without pulling in native modules or a component harness.
//
// Tolerate common mis-hears of "Tauranto" from on-device speech recognizers
// (which have never seen the brand name) — "hey tauranto" is the target
// phrase, the rest are safety nets so standby doesn't stay silent forever.
export const PHRASES=["hey tauranto","tauranto","hey toronto","hey tarantino","hey toranto","hey turanto","hey tauranno","hey tirano"];

// The fixed list above only catches mis-hears we've already seen; a
// recognizer that has never heard the brand name can render it dozens of
// other ways. As a fallback, fuzzy-match individual words against the brand
// name by edit distance — free, no model, no vendor account, just tolerant
// string comparison — so an unseen mis-hearing still wakes the app instead
// of requiring the fixed list to be extended every time someone reports one.
export const TARGET="tauranto";

export function levenshtein(a:string,b:string):number{
 const m=a.length,n=b.length;
 if(m===0)return n;
 if(n===0)return m;
 const dp=new Array(n+1);
 for(let j=0;j<=n;j++)dp[j]=j;
 for(let i=1;i<=m;i++){
  let prev=dp[0];dp[0]=i;
  for(let j=1;j<=n;j++){
   const tmp=dp[j];
   dp[j]=Math.min(dp[j]+1,dp[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));
   prev=tmp;
  }
 }
 return dp[n];
}

export function wordMatchesTarget(w:string):boolean{
 // Guard the length band around "tauranto" (8 letters) so short unrelated
 // words ("to", "auto") can't slip in just because 2 edits is a low bar.
 if(w.length<5||w.length>12)return false;
 return levenshtein(w,TARGET)<=2;
}

export function findWake(transcript:string):{end:number}|null{
 const t=transcript.toLowerCase();
 let best:number|null=null;
 for(const p of PHRASES){const i=t.indexOf(p);if(i>=0&&(best===null||i<best)){best=i+p.length}}
 if(best!==null)return{end:best};
 // Fuzzy fallback — only reached if none of the known-good phrases hit.
 const re=/[a-z']+/g;let m:RegExpExecArray|null;
 while((m=re.exec(t))){
  if(wordMatchesTarget(m[0])){best=m.index+m[0].length;break}
 }
 return best===null?null:{end:best};
}

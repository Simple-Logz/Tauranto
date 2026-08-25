// Pure wake-phrase matching for "Hey Tauranto".
// Keep this dependency-free so it can be tested independently of native voice APIs.
export const PHRASES=["hey tauranto","hey toronto","hey toranto","hey turanto","hey tauranno","hey tirano","okay tauranto","ok tauranto"];
export const TARGET="tauranto";

export function levenshtein(a:string,b:string):number{const m=a.length,n=b.length;if(!m)return n;if(!n)return m;const dp=new Array(n+1);for(let j=0;j<=n;j++)dp[j]=j;for(let i=1;i<=m;i++){let prev=dp[0];dp[0]=i;for(let j=1;j<=n;j++){const tmp=dp[j];dp[j]=Math.min(dp[j]+1,dp[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=tmp}}return dp[n]}
export function wordMatchesTarget(w:string):boolean{if(w.length<6||w.length>11)return false;return levenshtein(w,TARGET)<=2}

/**
 * Wake only on an explicit wake phrase. The previous matcher accepted the bare
 * brand name and fuzzy-matched any Tauranto-like word anywhere in continuous
 * restaurant speech. In an always-listening product that creates false wakes.
 * We now require hey/ok/okay immediately before the brand while still tolerating
 * common speech-recognizer spellings of Tauranto.
 */
export function findWake(transcript:string):{end:number}|null{
 const t=transcript.toLowerCase();let best:number|null=null;
 for(const p of PHRASES){const i=t.indexOf(p);if(i>=0&&(best===null||i<best))best=i+p.length}
 if(best!==null)return{end:best};
 const re=/\b(hey|ok|okay)\s+([a-z']+)\b/g;let m:RegExpExecArray|null;
 while((m=re.exec(t))){if(wordMatchesTarget(m[2]))return{end:m.index+m[0].length}}
 return null;
}

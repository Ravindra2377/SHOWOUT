import "server-only";
type Vote={voterId:string;entryId:string;originality:number;execution:number;entertainment:number;lockedAt:string};
type Message={id:string;conversationId:string;senderId:string;body?:string;type:string;referenceId?:string;clientKey:string;createdAt:string};
type MemoryStore={votes:Map<string,Vote>;submissions:Map<string,unknown>;messages:Map<string,Message>;analytics:Array<{name:string;userId?:string;metadata:Record<string,unknown>;at:string}>;blocks:Set<string>};
const globalStore=globalThis as typeof globalThis&{__showoutStore?:MemoryStore};
export const store:MemoryStore=globalStore.__showoutStore??{votes:new Map(),submissions:new Map(),messages:new Map(),analytics:[],blocks:new Set()};
if(process.env.NODE_ENV!=="production")globalStore.__showoutStore=store;

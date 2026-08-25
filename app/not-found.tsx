import Link from "next/link";
export default function NotFound(){return <div className="page-narrow"><div className="empty-state" style={{marginTop:50}}><span className="stamp">404</span><h1 className="display-sm">NOT ON<br/>THE BILL.</h1><p>This page may have closed, moved, or never entered the Arcade.</p><Link className="button primary" href="/arcade">Return to Arcade</Link></div></div>}

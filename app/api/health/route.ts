import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

export const dynamic = "force-dynamic";

// Liveness + Sanity reachability.
export async function GET() {
  try {
    const products = await client.fetch<number>(`count(*[_type=="product"])`);
    return NextResponse.json({ status: "ok", sanity: "reachable", products });
  } catch {
    return NextResponse.json({ status: "degraded", sanity: "unreachable" }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

// Sanity webhook target. Configure a GROQ webhook (sanity hooks create) to POST here with a
// shared secret header `x-webhook-secret` equal to SANITY_REVALIDATE_SECRET.
// Body should project the changed document's _type (e.g. `{ "_type": _type }`).
export async function POST(req: Request) {
  const secret = req.headers.get("x-webhook-secret");
  if (!process.env.SANITY_REVALIDATE_SECRET || secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { _type?: string };
  const type = body?._type;

  if (type === "homepage") revalidateTag("homepage", "max");
  else if (type === "siteSettings") revalidateTag("settings", "max");
  else if (type === "product" || type === "category" || type === "colour") revalidateTag("product", "max");
  else {
    revalidateTag("product", "max");
    revalidateTag("homepage", "max");
    revalidateTag("settings", "max");
  }

  return NextResponse.json({ ok: true, revalidated: type ?? "all" });
}

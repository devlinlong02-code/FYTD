import { NextResponse } from "next/server";
import { getOutfitById } from "@/app/actions/outfits";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const outfit = await getOutfitById(id);
  if (!outfit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(outfit);
}

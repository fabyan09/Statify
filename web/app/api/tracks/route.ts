import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/tracks`, {
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 });
  }
}

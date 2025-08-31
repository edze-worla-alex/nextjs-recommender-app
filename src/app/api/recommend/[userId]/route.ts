// src/app/api/recommend/[userId]
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { recommendHybrid } from "@/lib/recommend-hybrid";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  const {userId} = await params;

  const users = await prisma.user.findMany();
  const items = await prisma.item.findMany();
  const ratings = await prisma.rating.findMany();

  const recs = recommendHybrid(userId, users, items, ratings, 10);

  return NextResponse.json({ recommendations: recs });
}

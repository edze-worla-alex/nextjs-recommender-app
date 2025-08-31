// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
) {
  const users = await prisma.user.findMany();

  return NextResponse.json({ users: users });
}
import { NextResponse } from "next/server";
import { db as realDb } from "@/db/client";
import { DrizzleObjectRepository } from "@/repositories/drizzle-object-repository";
import { AddObjectUseCase } from "@/use-cases/add-object";

export async function handlePost(request: Request, db = realDb) {
  try {
    const body = await request.json();

    const repository = new DrizzleObjectRepository(db);

    const addObjectUseCase = new AddObjectUseCase(repository);

    const newObject = await addObjectUseCase.execute({
      name: body.name,
      price: body.price,
      reviewDays: body.reviewDays,
    });

    return NextResponse.json(newObject, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  return handlePost(request, realDb);
}

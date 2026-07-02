import { NextResponse } from "next/server";
import { db as realDb } from "@/db/client";
import { DrizzleObjectRepository } from "@/repositories/drizzle-object-repository";
import { AddObjectUseCase } from "@/use-cases/add-object";
import { SelectObjectUseCase } from "@/use-cases/select-object";
import { DeleteObjectUseCase } from "@/use-cases/delete-object";

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

export async function handleSelect(request: Request, db = realDb) {
  try {
    const repository = new DrizzleObjectRepository(db);

    const selectObjectUseCase = new SelectObjectUseCase(repository);

    const dbRows = await selectObjectUseCase.execute();
    return NextResponse.json(dbRows, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return handleSelect(request, realDb);
}

export async function handleDelete(request: Request, db = realDb) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing object ID" }, { status: 400 });
    }

    const repository = new DrizzleObjectRepository(db);

    const deleteObjectUseCase = new DeleteObjectUseCase(repository);

    await deleteObjectUseCase.execute(id);
    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  return handleDelete(request, realDb);
}

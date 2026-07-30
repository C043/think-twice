import { NextResponse } from "next/server";
import { toErrorResponse } from "@/errors/AppError";
import { db as realDb } from "@/db/client";
import type { AppDatabase } from "@/db/types";
import { DrizzleObjectRepository } from "@/repositories/drizzle-object-repository";
import { AddObjectUseCase } from "@/use-cases/add-object";
import { SelectObjectUseCase } from "@/use-cases/select-object";
import { DeleteObjectUseCase } from "@/use-cases/delete-object";
import { PutObjectUseCase } from "@/use-cases/put-object";
import { AppError } from "@/errors/AppError";

export async function handlePost(request: Request, db: AppDatabase = realDb) {
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
  } catch (err) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  return handlePost(request, realDb);
}

export async function handlePut(request: Request, db: AppDatabase = realDb) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      throw new AppError("Missing object ID", 400);
    }

    const body = await request.json();

    const repository = new DrizzleObjectRepository(db);

    const putObjectUseCase = new PutObjectUseCase(repository);

    const updatedObject = await putObjectUseCase.execute(id, {
      name: body.name,
      price: body.price,
      reviewDays: body.reviewDays,
    });

    return NextResponse.json({
      message: "Updated",
      updatedObject,
      status: 200,
    });
  } catch (err) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request) {
  return handlePut(request, realDb);
}

export async function handleSelect(request: Request, db: AppDatabase = realDb) {
  try {
    const repository = new DrizzleObjectRepository(db);

    const selectObjectUseCase = new SelectObjectUseCase(repository);

    const dbRows = await selectObjectUseCase.execute();
    return NextResponse.json(dbRows, { status: 200 });
  } catch (err) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: Request) {
  return handleSelect(request, realDb);
}

export async function handleDelete(request: Request, db: AppDatabase = realDb) {
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
  } catch (err) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  return handleDelete(request, realDb);
}

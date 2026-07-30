import { NextResponse } from "next/server";
import { toErrorResponse } from "@/errors/AppError";
import { db as realDb } from "@/db/client";
import type { AppDatabase } from "@/db/types";
import { DrizzleSettingsRepository } from "@/repositories/drizzle-settings-repository";
import { SelectSettingsUseCase } from "@/use-cases/select-settings";
import { PutSettingsUseCase } from "@/use-cases/put-settings";

export async function handleSelect(request: Request, db: AppDatabase = realDb) {
  try {
    const repository = new DrizzleSettingsRepository(db);

    const selectSettingsUseCase = new SelectSettingsUseCase(repository);

    const settings = await selectSettingsUseCase.execute();

    return NextResponse.json(settings, { status: 200 });
  } catch (err) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: Request) {
  return handleSelect(request, realDb);
}

export async function handlePut(request: Request, db: AppDatabase = realDb) {
  try {
    const body = await request.json();

    const repository = new DrizzleSettingsRepository(db);

    const putSettingsUseCase = new PutSettingsUseCase(repository);

    const settings = await putSettingsUseCase.execute({
      locale: body.locale,
      currency: body.currency,
    });

    return NextResponse.json(settings, { status: 200 });
  } catch (err) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request) {
  return handlePut(request, realDb);
}

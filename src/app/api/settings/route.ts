import { NextResponse } from "next/server";
import { db as realDb } from "@/db/client";
import { DrizzleSettingsRepository } from "@/repositories/drizzle-settings-repository";
import { SelectSettingsUseCase } from "@/use-cases/select-settings";
import { PutSettingsUseCase } from "@/use-cases/put-settings";

export async function handleSelect(request: Request, db = realDb) {
  try {
    const repository = new DrizzleSettingsRepository(db);

    const selectSettingsUseCase = new SelectSettingsUseCase(repository);

    const settings = await selectSettingsUseCase.execute();

    return NextResponse.json(settings, { status: 200 });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function GET(request: Request) {
  return handleSelect(request, realDb);
}

export async function handlePut(request: Request, db = realDb) {
  try {
    const body = await request.json();

    const repository = new DrizzleSettingsRepository(db);

    const putSettingsUseCase = new PutSettingsUseCase(repository);

    const settings = await putSettingsUseCase.execute({
      locale: body.locale,
      currency: body.currency,
    });

    return NextResponse.json(settings, { status: 200 });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function PUT(request: Request) {
  return handlePut(request, realDb);
}

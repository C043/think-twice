import { NextResponse } from "next/server";
import { toErrorResponse } from "@/errors/AppError";
import { db as realDb } from "@/db/client";
import type { AppDatabase } from "@/db/types";
import { DrizzlePushSubscriptionRepository } from "@/repositories/drizzle-push-subscription-repository";
import { SavePushSubscriptionUseCase } from "@/use-cases/save-push-subscription";
import { DeletePushSubscriptionUseCase } from "@/use-cases/delete-push-subscription";
import { SelectPushSubscriptionsUseCase } from "@/use-cases/select-push-subscriptions";

export async function handlePost(request: Request, db: AppDatabase = realDb) {
  try {
    const body = await request.json();

    const repository = new DrizzlePushSubscriptionRepository(db);

    const savePushSubscriptionUseCase = new SavePushSubscriptionUseCase(
      repository,
    );

    await savePushSubscriptionUseCase.execute({
      endpoint: body.endpoint,
      keys: body.keys,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ message: "Subscribed" }, { status: 201 });
  } catch (err) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  return handlePost(request, realDb);
}

export async function handleDelete(request: Request, db: AppDatabase = realDb) {
  try {
    const body = await request.json();

    const repository = new DrizzlePushSubscriptionRepository(db);

    const deletePushSubscriptionUseCase = new DeletePushSubscriptionUseCase(
      repository,
    );

    await deletePushSubscriptionUseCase.execute(body.endpoint);

    return NextResponse.json({ message: "Unsubscribed" }, { status: 200 });
  } catch (err) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  return handleDelete(request, realDb);
}

export async function handleSelect(request: Request, db: AppDatabase = realDb) {
  try {
    const repository = new DrizzlePushSubscriptionRepository(db);

    const selectPushSubscriptionsUseCase = new SelectPushSubscriptionsUseCase(
      repository,
    );

    const subscriptions = await selectPushSubscriptionsUseCase.execute();

    // Endpoints are bearer-like credentials: never send them back to a client.
    return NextResponse.json({ count: subscriptions.length }, { status: 200 });
  } catch (err) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: Request) {
  return handleSelect(request, realDb);
}

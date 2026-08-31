// src/app/api/item/[item_id]/route.js

import { getClientPromise } from "@/lib/mongodb";
import { errorResponse, printExceptionLog, successResponse } from "@/lib/utils";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  const { item_id } = await params;
  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);
    const item = await db.collection("item").findOne({
      _id: new ObjectId(item_id),
      status: { $ne: "DELETED" }, // exclude soft-deleted items
    });
    if (item) {
      return successResponse(
        {
          item,
        },
        201,
      );
    } else return errorResponse("Item not found", 404);
  } catch (error) {
    printExceptionLog("GET Item Exception", error);
    return errorResponse("GET Item Internal Error", 500);
  }
}

export async function DELETE(request, { params }) {
  const { item_id } = await params;
  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    // Soft delete: update status instead of removing the document
    const storedItem = await db.collection("item").findOne({
      _id: new ObjectId(item_id),
      status: { $ne: "DELETED" },
    });

    if (!storedItem) {
      return errorResponse("Item not found", 404);
    }

    const deleteResult = await db.collection("item").updateOne(
      { _id: new ObjectId(item_id) },
      {
        $set: {
          status: "DELETED",
          deletedAt: new Date(), // optional: track when it was deleted
        },
      },
    );

    const deleteOk = Number(deleteResult.modifiedCount) > 0;
    if (deleteOk) {
      return successResponse({ message: "Delete Success" }, 201);
    } else {
      return errorResponse("Delete failed", 400);
    }
  } catch (error) {
    printExceptionLog("DELETE Item Exception", error);
    return errorResponse("DELETE Item Internal Error", 500);
  }
}

export async function PUT(request, { params }) {
  const { item_id } = await params;
  console.log("==>itemd id: ", item_id);
  try {
    const data = await request.json();
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);
    const storedItem = await db.collection("item").findOne({
      _id: new ObjectId(item_id),
      status: { $ne: "DELETED" }, // prevent editing soft-deleted items
    });
    if (storedItem) {
      storedItem.name = data.name;
      storedItem.price = data.price;
      storedItem.amount = data.amount;
      storedItem.category = data.category;
      const updatedResult = await db
        .collection("item")
        .updateOne({ _id: new ObjectId(item_id) }, { $set: storedItem });
      console.log("==>update result: ", updatedResult);
      const updateOk = Number(updatedResult.modifiedCount) > 0;
      if (updateOk)
        return successResponse({ message: "Item update success" }, 201);
      else return errorResponse({ message: "Item update failed" }, 400);
    } else {
      return errorResponse({ message: "Item not found" }, 400);
    }
  } catch (error) {
    printExceptionLog("PUT Item Exception", error);
    return errorResponse("PUT Item Internal Error", 500);
  }
}
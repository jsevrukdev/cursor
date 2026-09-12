import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

const taskObject = v.object({
  _id: v.id("tasks"),
  _creationTime: v.number(),
  title: v.string(),
  completed: v.boolean(),
  createdAt: v.number(),
});

export const list = query({
  args: {},
  returns: v.array(taskObject),
  handler: async (ctx): Promise<Doc<"tasks">[]> => {
    return await ctx.db.query("tasks").withIndex("by_created").order("desc").collect();
  },
});

export const create = mutation({
  args: { title: v.string() },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    const title = args.title.trim();
    if (title.length === 0) {
      throw new Error("Task title cannot be empty");
    }
    return await ctx.db.insert("tasks", {
      title,
      completed: false,
      createdAt: Date.now(),
    });
  },
});

export const toggle = mutation({
  args: { taskId: v.id("tasks"), completed: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    await ctx.db.patch(args.taskId, { completed: args.completed });
    return null;
  },
});

export const remove = mutation({
  args: { taskId: v.id("tasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    await ctx.db.delete(args.taskId);
    return null;
  },
});

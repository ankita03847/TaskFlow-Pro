const mongoose = require("mongoose");

const todoSchema = mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const TaskSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "active", "done", "in-progress", "completed"],
      default: "pending",
    },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    attachments: [{ type: String }],
    todoChecklist: [todoSchema],
    progress: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", TaskSchema);
module.exports = Task;




    


